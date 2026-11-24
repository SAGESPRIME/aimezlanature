/**
 * Espace revendeurs (/pro/) : totaux en direct et paiement.
 *
 * Mêmes règles que le serveur (src/data/commande-pro.mjs) : prix revendeur
 * déjà calculés par le serveur dans le catalogue JSON, minimum, livraison
 * Colissimo au poids via window.alnFraisLivraison (public/js/livraison.js).
 * Le montant débité est de toute façon recalculé par /api/pro/checkout.
 * Démarre à DOMContentLoaded : livraison.js (chargé plus bas) est alors prêt.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var bloc = document.getElementById('catalogue-pro');
    if (!bloc || typeof window.alnFraisLivraison !== 'function') return;
    var cat = JSON.parse(bloc.textContent);
    var r2 = function (n) { return Math.round(n * 100) / 100; };
    var euros = function (n) { return n.toFixed(2).replace('.', ',') + ' €'; };
    var champ = function (nom) { return document.querySelector('[data-pro="' + nom + '"]'); };
    var entrees = Array.prototype.slice.call(document.querySelectorAll('[data-qte-pro]'));
    var payer = champ('payer');

    function lignes() {
      return entrees
        .map(function (e) {
          var p = cat.produits.filter(function (x) { return x.slug === e.getAttribute('data-qte-pro'); })[0];
          var qty = Math.max(0, Math.min(cat.qteMax, Math.floor(Number(e.value) || 0)));
          return p && p.enStock && qty > 0 ? { slug: p.slug, qty: qty, prix: p.prix, poids: p.poids } : null;
        })
        .filter(Boolean);
    }

    function calculer() {
      var l = lignes();
      var sousTotal = r2(l.reduce(function (s, x) { return s + r2(x.prix * x.qty); }, 0));
      var liv = window.alnFraisLivraison(
        l.map(function (x) { return { poids: x.poids, qty: x.qty, offerte: false }; }),
        cat.livraison
      );
      champ('sous-total').textContent = euros(sousTotal);
      champ('poids').textContent = liv.poids >= 1000 ? (liv.poids / 1000).toFixed(2).replace('.', ',') + ' kg' : liv.poids + ' g';
      champ('livraison').textContent = l.length === 0 ? '—' : liv.frais === null ? 'Sur demande' : euros(liv.frais);
      champ('total').textContent = euros(r2(sousTotal + (liv.frais || 0)));

      var msg = '';
      var ok = false;
      if (l.length === 0) msg = 'Minimum ' + cat.minimum + ' € de produits.';
      else if (liv.frais === null) msg = 'Colis de plus de 30 kg : contactez-nous pour cette commande.';
      else if (sousTotal < cat.minimum) msg = 'Encore ' + euros(r2(cat.minimum - sousTotal)) + ' pour atteindre le minimum de ' + cat.minimum + ' €.';
      else { msg = 'Minimum atteint.'; ok = true; }
      champ('message').textContent = msg;
      payer.disabled = !ok;
      return l;
    }

    entrees.forEach(function (e) { e.addEventListener('input', calculer); });
    calculer();

    payer.addEventListener('click', function () {
      var l = calculer();
      var erreur = champ('erreur');
      erreur.hidden = true;
      payer.disabled = true;
      payer.textContent = 'Redirection vers le paiement…';
      fetch('/api/pro/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: l.map(function (x) { return { slug: x.slug, qty: x.qty }; }) }),
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (res.ok && res.d.url) { window.location.href = res.d.url; return; }
          if (res.d && /session/.test(res.d.error || '')) { window.location.href = '/pro/connexion/'; return; }
          throw new Error((res.d && res.d.error) || 'Le paiement est momentanément indisponible.');
        })
        .catch(function (e) {
          erreur.textContent = e.message;
          erreur.hidden = false;
          payer.textContent = 'Payer ma commande';
          calculer();
        });
    });
  });
})();
