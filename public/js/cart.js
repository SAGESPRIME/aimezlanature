/**
 * Panier client — stocké dans localStorage, aucun compte requis.
 *
 * Les prix ne sont JAMAIS recalculés à partir de règles recopiées ici : le
 * catalogue et les paliers viennent du bloc <script type="application/json"
 * id="catalogue"> injecté par Astro (non exécutable, donc compatible avec la
 * CSP stricte). Le montant réellement débité est de toute façon recalculé
 * côté serveur dans /api/checkout : un panier bidouillé dans le navigateur ne
 * peut pas changer le prix payé.
 *
 * Le tiroir s'ouvre dès l'ajout : l'acheteur voit sa remise et peut payer
 * sans quitter la fiche produit.
 */
(function () {
  'use strict';

  var KEY = 'aln_panier_v1';
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n) { return n.toFixed(2).replace('.', ',') + ' €'; };
  var round2 = function (n) { return Math.round(n * 100) / 100; };

  function catalogue() {
    var el = $('catalogue');
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  }

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(v) ? v.filter(function (i) { return i && i.slug && i.qty > 0; }) : [];
    } catch (e) { return []; }
  }

  function write(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* mode privé */ }
    document.dispatchEvent(new CustomEvent('panier:maj'));
  }

  function add(slug, qty) {
    var items = read();
    var found = items.filter(function (i) { return i.slug === slug; })[0];
    if (found) found.qty += qty; else items.push({ slug: slug, qty: qty });
    write(items);
  }

  function setQty(slug, qty) {
    write(read()
      .map(function (i) { return i.slug === slug ? { slug: slug, qty: qty } : i; })
      .filter(function (i) { return i.qty > 0; }));
  }

  /* ── Calculs (miroir de src/lib/pricing.ts) ──────────────── */

  function bestDiscount(tiers, qty) {
    var best = 0;
    tiers.forEach(function (t) { if (qty >= t.qty && t.discountPercent > best) best = t.discountPercent; });
    return best;
  }

  function nextTier(tiers, qty) {
    var next = tiers.filter(function (t) { return t.qty > qty; })
      .sort(function (a, b) { return a.qty - b.qty; })[0];
    return next ? { missing: next.qty - qty, discountPercent: next.discountPercent } : null;
  }

  /**
   * Sous-total au prix fort + remise isolée : afficher l'économie sur une
   * ligne distincte est nettement plus parlant qu'un prix déjà remisé.
   */
  function totals(items, cat) {
    var lines = [], brut = 0, net = 0, maxRemise = 0, qtyTotale = 0;

    items.forEach(function (i) {
      var p = cat.products.filter(function (x) { return x.slug === i.slug; })[0];
      if (!p) return;
      var d = bestDiscount(cat.tiers, i.qty);
      if (d > maxRemise) maxRemise = d;
      var unit = round2(p.priceCurrent * (1 - d / 100));
      var plein = round2(p.priceCurrent * i.qty);
      var remise = round2(unit * i.qty);
      brut = round2(brut + plein);
      net = round2(net + remise);
      qtyTotale += i.qty;
      lines.push({ product: p, qty: i.qty, unit: unit, plein: plein, total: remise, discount: d });
    });

    var port = net === 0 || net >= cat.freeShippingThreshold ? 0 : cat.shippingFee;
    return {
      lines: lines,
      brut: brut,
      remise: round2(brut - net),
      maxRemise: maxRemise,
      net: net,
      port: port,
      total: round2(net + port),
      qtyTotale: qtyTotale,
    };
  }

  /* ── Tiroir ──────────────────────────────────────────────── */

  var dernierDeclencheur = null;

  // Durée du glissement, alignée sur la transition CSS de global.css.
  var DUREE_TIROIR = 300;
  var minuteurFermeture = null;

  function ouvrirTiroir(declencheur) {
    var t = $('tiroir-panier'), f = $('tiroir-fond');
    if (!t || !f) return;
    dernierDeclencheur = declencheur || null;

    if (minuteurFermeture) { clearTimeout(minuteurFermeture); minuteurFermeture = null; }

    f.hidden = false;
    t.hidden = false;
    // On retire `hidden` d'abord, puis on ajoute la classe à la frame suivante :
    // sans ce délai le navigateur n'a pas d'état de départ et n'anime pas.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        t.classList.add('tiroir-ouvert');
        f.classList.add('tiroir-ouvert');
      });
    });

    document.body.style.overflow = 'hidden';
    var fermer = $('tiroir-fermer');
    if (fermer) fermer.focus();
  }

  function fermerTiroir() {
    var t = $('tiroir-panier'), f = $('tiroir-fond');
    if (!t || !f || t.hidden) return;

    t.classList.remove('tiroir-ouvert');
    f.classList.remove('tiroir-ouvert');
    document.body.style.overflow = '';

    // Le focus repart tout de suite (ne pas attendre la fin de l'animation),
    // mais `hidden` n'est posé qu'une fois le glissement terminé.
    if (dernierDeclencheur && document.contains(dernierDeclencheur)) dernierDeclencheur.focus();
    dernierDeclencheur = null;

    if (minuteurFermeture) clearTimeout(minuteurFermeture);
    minuteurFermeture = setTimeout(function () {
      t.hidden = true;
      f.hidden = true;
      minuteurFermeture = null;
    }, DUREE_TIROIR);
  }

  // Échap ferme, Tab reste piégé dans le tiroir tant qu'il est ouvert.
  document.addEventListener('keydown', function (e) {
    var t = $('tiroir-panier');
    if (!t || t.hidden) return;
    if (e.key === 'Escape') { fermerTiroir(); return; }
    if (e.key !== 'Tab') return;
    var f = t.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])');
    var visibles = [].slice.call(f).filter(function (el) { return el.offsetParent !== null; });
    if (visibles.length === 0) return;
    var premier = visibles[0], dernier = visibles[visibles.length - 1];
    if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
    else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
  });

  /* ── Rendu ───────────────────────────────────────────────── */

  function ligneHTML(l) {
    return '<li class="flex gap-3 py-4 border-b border-[#EDE8E0]">' +
      '<div class="flex-1">' +
        '<p class="font-semibold text-[#1A1A16]">' + l.product.shortName + '</p>' +
        (l.discount > 0
          ? '<p class="text-xs text-[#166534] font-semibold">Remise −' + l.discount + ' % appliquée</p>'
          : '') +
        '<div class="mt-2 inline-flex items-center border border-[#D4C9B8] rounded-full overflow-hidden bg-white">' +
          '<button type="button" class="px-3 py-1 hover:bg-[#F5F0E8]" data-slug="' + l.product.slug + '" data-qty="' + (l.qty - 1) + '" aria-label="Retirer un ' + l.product.shortName + '">−</button>' +
          '<span class="px-3 text-sm font-semibold">' + l.qty + '</span>' +
          '<button type="button" class="px-3 py-1 hover:bg-[#F5F0E8]" data-slug="' + l.product.slug + '" data-qty="' + (l.qty + 1) + '" aria-label="Ajouter un ' + l.product.shortName + '">+</button>' +
        '</div>' +
      '</div>' +
      '<div class="text-right">' +
        (l.discount > 0
          ? '<p class="text-xs text-[#6E5330]"><s>' + fmt(l.plein) + '</s></p>'
          : '') +
        '<p class="font-bold text-[#1A1A16]">' + fmt(l.total) + '</p>' +
        '<button type="button" class="mt-1 text-xs text-[#6E5330] underline" data-slug="' + l.product.slug + '" data-qty="0">Retirer</button>' +
      '</div>' +
    '</li>';
  }

  function render() {
    var cat = catalogue();
    if (!cat) return;
    var items = read();
    var t = totals(items, cat);

    // Compteur d'en-tête
    document.querySelectorAll('[data-panier-compteur]').forEach(function (el) {
      el.textContent = t.qtyTotale;
      el.hidden = t.qtyTotale === 0;
    });

    var set = function (id, v) { var el = $(id); if (el) el.textContent = v; };
    var show = function (id, on) { var el = $(id); if (el) el.hidden = !on; };

    // ── Tiroir
    if ($('tiroir-panier')) {
      set('tiroir-compteur', t.qtyTotale > 0 ? '(' + t.qtyTotale + ')' : '');
      var lignes = $('tiroir-lignes');
      if (lignes) lignes.innerHTML = t.lines.map(ligneHTML).join('');
      show('tiroir-vide', items.length === 0);
      show('tiroir-resume', items.length > 0);

      set('tiroir-sous-total', fmt(t.brut));
      show('tiroir-ligne-remise', t.remise > 0);
      set('tiroir-remise-label', 'Remise −' + t.maxRemise + ' %');
      set('tiroir-remise', '−' + fmt(t.remise));
      set('tiroir-port', t.port === 0 ? 'Offerte' : fmt(t.port));
      set('tiroir-total', fmt(t.total));

      // Relance : d'abord vers le palier suivant, sinon vers le port offert.
      var relance = $('tiroir-relance');
      if (relance) {
        var msg = '';
        var plusGrosse = t.lines.slice().sort(function (a, b) { return b.qty - a.qty; })[0];
        var suivant = plusGrosse ? nextTier(cat.tiers, plusGrosse.qty) : null;
        if (suivant) {
          msg = 'Ajoutez encore ' + suivant.missing + ' produit' + (suivant.missing > 1 ? 's' : '') +
                ' pour passer à −' + suivant.discountPercent + ' %.';
        } else if (t.port > 0) {
          msg = 'Plus que ' + fmt(round2(cat.freeShippingThreshold - t.net)) + ' pour la livraison offerte.';
        }
        relance.textContent = msg;
        relance.hidden = msg === '' || items.length === 0;
      }
    }

    // ── Page panier complète
    var root = $('panier-contenu');
    if (root) {
      root.innerHTML = t.lines.map(ligneHTML).join('');
      show('panier-vide', items.length === 0);
      show('panier-resume', items.length > 0);
      set('resume-sous-total', fmt(t.brut));
      show('resume-ligne-remise', t.remise > 0);
      set('resume-remise', '−' + fmt(t.remise));
      set('resume-port', t.port === 0 ? 'Offerte' : fmt(t.port));
      set('resume-total', fmt(t.total));
    }
  }

  /* ── Interactions ────────────────────────────────────────── */

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-ajouter-panier]');
    if (btn) {
      e.preventDefault();
      var sel = document.querySelector('[data-palier][aria-checked="true"]');
      var qty = sel ? parseInt(sel.getAttribute('data-palier'), 10) : 1;
      add(btn.getAttribute('data-ajouter-panier'), qty || 1);
      var live = $('panier-annonce');
      if (live) live.textContent = qty + ' article' + (qty > 1 ? 's' : '') + ' ajouté' + (qty > 1 ? 's' : '') + ' au panier.';
      ouvrirTiroir(btn);
      return;
    }

    if (e.target.closest('[data-ouvrir-panier]')) {
      e.preventDefault();
      ouvrirTiroir(e.target.closest('[data-ouvrir-panier]'));
      return;
    }

    if (e.target.closest('#tiroir-fermer') || e.target.closest('#tiroir-fond')) {
      fermerTiroir();
      return;
    }

    var tier = e.target.closest('[data-palier]');
    if (tier) {
      document.querySelectorAll('[data-palier]').forEach(function (el) {
        el.setAttribute('aria-checked', el === tier ? 'true' : 'false');
      });
      return;
    }

    var q = e.target.closest('[data-qty]');
    if (q) {
      e.preventDefault();
      setQty(q.getAttribute('data-slug'), parseInt(q.getAttribute('data-qty'), 10));
    }
  });

  /* ── Paiement ────────────────────────────────────────────── */

  document.addEventListener('click', function (e) {
    var payer = e.target.closest('[data-payer]');
    if (!payer) return;
    var items = read();
    if (items.length === 0) return;

    payer.disabled = true;
    payer.textContent = 'Redirection…';
    var bloc = payer.closest('footer, aside') || document;
    var err = bloc.querySelector('[data-paiement-erreur]');
    if (err) err.hidden = true;

    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items }),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (res.ok && res.d.url) { window.location.href = res.d.url; return; }
        throw new Error(res.d && res.d.error ? res.d.error : 'Paiement indisponible');
      })
      .catch(function (ex) {
        payer.disabled = false;
        payer.textContent = 'Commander';
        if (err) {
          err.hidden = false;
          err.textContent = ex.message + ' Vous pouvez aussi commander par email : commande@aimezlanature.fr';
        }
      });
  });

  document.addEventListener('panier:maj', render);
  render();
})();
