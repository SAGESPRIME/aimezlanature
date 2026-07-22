/**
 * Vide le panier après un paiement confirmé.
 *
 * Fichier séparé plutôt qu'un <script> en ligne : la CSP du site autorise
 * uniquement les scripts servis depuis notre domaine (script-src 'self').
 */
(function () {
  'use strict';
  try {
    localStorage.removeItem('aln_panier_v1');
  } catch (e) {
    /* stockage indisponible : rien à nettoyer */
  }
  document.querySelectorAll('[data-panier-compteur]').forEach(function (el) {
    el.textContent = '0';
    el.hidden = true;
  });
})();
