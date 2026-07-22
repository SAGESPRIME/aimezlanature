// JS minimal du site — fichier externe pour rester compatible CSP (script-src 'self').
// 1) Menu mobile ; 2) apparitions au défilement ; 3) barre d'achat collante.
//
// Chaque bloc est isolé dans son propre try/catch : une erreur dans l'un ne doit
// jamais empêcher les autres de s'exécuter (avant, une exception levée pendant
// l'initialisation du menu aurait laissé les blocs [data-reveal] invisibles).
(function () {
  'use strict';

  function bloc(nom, fn) {
    try {
      fn();
    } catch (e) {
      if (window.console && console.warn) console.warn('[site.js] ' + nom + ' :', e);
    }
  }

  // — 1. Menu mobile —
  bloc('menu', function () {
    var toggle = document.getElementById('menu-toggle');
    var panel = document.getElementById('menu-mobile');
    if (!toggle || !panel) return;

    toggle.addEventListener('click', function () {
      var open = panel.classList.toggle('hidden') === false;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      var iconeOuvrir = toggle.querySelector('.menu-icon-open');
      var iconeFermer = toggle.querySelector('.menu-icon-close');
      if (iconeOuvrir) iconeOuvrir.classList.toggle('hidden', open);
      if (iconeFermer) iconeFermer.classList.toggle('hidden', !open);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.classList.contains('hidden')) {
        toggle.click();
        toggle.focus();
      }
    });
  });

  // — 2. Apparition au défilement —
  // Le CSS ne masque les blocs que si JS est actif (@media scripting: enabled).
  // Les cartes produits de l'accueil n'utilisent volontairement PAS [data-reveal] :
  // elles ne doivent jamais dépendre de ce script pour être visibles.
  bloc('reveal', function () {
    var revealed = document.querySelectorAll('[data-reveal]');
    if (!revealed.length) return;

    if (!('IntersectionObserver' in window)) {
      revealed.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    revealed.forEach(function (el) { io.observe(el); });
  });

  // — 3. Barre d'achat collante (fiche produit) —
  // Apparaît dès que le bloc d'achat principal est sorti par le haut de l'écran :
  // sur mobile la fiche fait ~7 000 px, l'acheteur ne doit jamais avoir à remonter.
  bloc('barre-achat', function () {
    var barre = document.getElementById('barre-achat');
    var repere = document.getElementById('repere-achat');
    if (!barre || !repere) return;

    // Le total affiché est recopié depuis le palier coché du BuyBox : aucune
    // logique de prix n'est réécrite ici, donc aucun risque de divergence.
    var cible = barre.querySelector('[data-barre-total]');
    function synchroniserTotal() {
      if (!cible) return;
      var palier = document.querySelector('[data-palier][aria-checked="true"]');
      var source = palier && palier.querySelector('[data-palier-total]');
      if (source) cible.textContent = source.textContent.trim();
    }
    synchroniserTotal();
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-palier]')) setTimeout(synchroniserTotal, 0);
    });

    // On lit directement la position du repère au défilement plutôt que via un
    // IntersectionObserver : le repère fait 0 px de haut, et un observer sur une
    // cible sans surface ne délivre pas ses callbacks de façon fiable (barre qui
    // ne montait jamais, vérifié au navigateur). Un handler de scroll throttlé
    // en requestAnimationFrame est déterministe et ne coûte quasi rien.
    var enAttente = false;
    function evaluer() {
      enAttente = false;
      // Visible dès que le repère (placé juste sous le BuyBox) est sorti par le
      // haut de l'écran.
      var passe = repere.getBoundingClientRect().top < 0;
      barre.classList.toggle('barre-achat-visible', passe);
    }
    function planifier() {
      if (enAttente) return;
      enAttente = true;
      window.requestAnimationFrame(evaluer);
    }
    window.addEventListener('scroll', planifier, { passive: true });
    window.addEventListener('resize', planifier);
    evaluer();
  });
})();
