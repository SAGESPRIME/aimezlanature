/**
 * Page de confirmation de commande : vide le panier, et envoie la conversion
 * d'achat à Google Ads si — et seulement si — le visiteur a accepté la mesure.
 *
 * Fichier séparé plutôt qu'un <script> en ligne : la CSP du site autorise
 * uniquement les scripts servis depuis notre domaine (script-src 'self').
 */
(function () {
  'use strict';

  /* ── 1. Vider le panier ──────────────────────────────────────────────────── */

  try {
    localStorage.removeItem('aln_panier_v1');
  } catch (e) {
    /* stockage indisponible : rien à nettoyer */
  }
  document.querySelectorAll('[data-panier-compteur]').forEach(function (el) {
    el.textContent = '0';
    el.hidden = true;
  });

  /* ── 2. Conversion Google Ads ────────────────────────────────────────────── */

  var repere = document.querySelector('[data-suivi-achat]');
  // Attribut vide = étiquette de conversion pas encore renseignée dans
  // src/data/tracking.ts. On ne fabrique pas une cible au hasard : sans
  // étiquette, on n'envoie rien.
  var cible = repere ? repere.getAttribute('data-cible') || '' : '';

  function lireCommande() {
    try {
      var brut = localStorage.getItem('aln_derniere_commande_v1');
      if (!brut) return null;
      var o = JSON.parse(brut);
      var m = Number(o && o.montant);
      return {
        montant: isFinite(m) && m > 0 ? m : null,
        devise: (o && o.devise) || 'EUR',
      };
    } catch (e) {
      return null;
    }
  }

  function oublierCommande() {
    try {
      localStorage.removeItem('aln_derniere_commande_v1');
    } catch (e) {
      /* rien à faire */
    }
  }

  /** Identifiant de session Stripe présent dans l'URL de retour. */
  function sessionStripe() {
    try {
      return new URLSearchParams(window.location.search).get('session_id') || '';
    } catch (e) {
      return '';
    }
  }

  function envoyerConversion() {
    if (!cible || typeof window.gtag !== 'function') return;

    var commande = lireCommande();
    var session = sessionStripe();

    var charge = { send_to: cible };
    // `transaction_id` = la session Stripe : si le client recharge cette page,
    // Google reconnaît la même transaction et ne compte pas deux ventes.
    if (session) charge.transaction_id = session;
    // Montant calculé par le serveur au moment du paiement (frais de port
    // compris). Absent en navigation privée : on envoie la conversion sans
    // valeur plutôt que d'en inventer une.
    if (commande && commande.montant !== null) {
      charge.value = commande.montant;
      charge.currency = commande.devise;
    }

    window.gtag('event', 'conversion', charge);
    oublierCommande();
  }

  // Le consentement peut être accordé avant ou après l'exécution de ce fichier :
  // on lit le drapeau, et à défaut on attend l'événement.
  if (window.alnMesureAutorisee) {
    envoyerConversion();
  } else {
    document.addEventListener('aln:mesure-autorisee', envoyerConversion, { once: true });
  }
})();
