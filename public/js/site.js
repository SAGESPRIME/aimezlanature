// JS minimal du site — fichier externe pour rester compatible CSP (script-src 'self').
// 1) Menu mobile ; 2) apparitions au défilement (le CSS ne masque les blocs
// que si JS est actif, via @media (scripting: enabled)).
(function () {
  'use strict';

  // — Menu mobile —
  var toggle = document.getElementById('menu-toggle');
  var panel = document.getElementById('menu-mobile');
  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      var open = panel.classList.toggle('hidden') === false;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      toggle.querySelector('.menu-icon-open').classList.toggle('hidden', open);
      toggle.querySelector('.menu-icon-close').classList.toggle('hidden', !open);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.classList.contains('hidden')) {
        toggle.click();
        toggle.focus();
      }
    });
  }

  // — Apparition au défilement —
  var revealed = document.querySelectorAll('[data-reveal]');
  if (revealed.length && 'IntersectionObserver' in window) {
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
  } else {
    revealed.forEach(function (el) { el.classList.add('is-visible'); });
  }
})();
