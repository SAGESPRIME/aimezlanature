/**
 * Bandeau de consentement et chargement conditionnel de Google Ads.
 *
 * Fichier externe et non `<script>` en ligne : la CSP du site impose
 * `script-src 'self'` (plus les domaines Google), l'inline est interdit.
 *
 * ── LA RÈGLE QUE CE FICHIER FAIT RESPECTER ───────────────────────────────────
 * Aucune requête vers Google, aucun cookie Google, AVANT un clic explicite sur
 * « Accepter ». Pas de « consentement par défilement », pas de case
 * pré-cochée : la CNIL les refuse tous les deux. Le refus est aussi accessible
 * que l'acceptation — deux boutons de même niveau, même taille, même écran.
 *
 * Le visiteur peut revenir sur son choix à tout moment par « Gérer les
 * cookies » en pied de page : le retrait doit être aussi simple que l'octroi.
 *
 * ── POURQUOI CONSENT MODE V2 QUAND MÊME ──────────────────────────────────────
 * Les valeurs par défaut `denied` sont posées AVANT le chargement de gtag.js.
 * Cela paraît redondant puisqu'on ne charge rien sans accord, mais c'est ce que
 * Google attend pour traiter les conversions européennes : sans consent mode v2,
 * les données Ads du visiteur qui ACCEPTE sont elles aussi dégradées. Le
 * WordPress actuel le fait déjà, on ne régresse pas.
 */
(function () {
  'use strict';

  var CLE = 'aln_consentement_v1';
  var VALIDITE_MS = 183 * 24 * 60 * 60 * 1000; // 6 mois, cf. src/data/tracking.ts

  // Renseignés par le bandeau via des attributs de données : le HTML est généré
  // par Astro depuis src/data/tracking.ts, ce fichier ne duplique aucune valeur.
  var idAds = null;

  /* ── Stockage du choix ───────────────────────────────────────────────────── */

  /** @returns {'accepte'|'refuse'|null} */
  function lireChoix() {
    try {
      var brut = localStorage.getItem(CLE);
      if (!brut) return null;
      var o = JSON.parse(brut);
      if (!o || (o.d !== 'accepte' && o.d !== 'refuse')) return null;
      // Choix périmé : on redemandera. Un choix sans date est traité comme
      // périmé plutôt que comme éternel — on ne présume jamais l'accord.
      if (!o.t || Date.now() - o.t > VALIDITE_MS) return null;
      return o.d;
    } catch (e) {
      // Mode privé ou stockage refusé : on ne peut pas mémoriser, donc on ne
      // peut pas prouver l'accord. On considère qu'il n'y en a pas.
      return null;
    }
  }

  function ecrireChoix(decision) {
    try {
      localStorage.setItem(CLE, JSON.stringify({ d: decision, t: Date.now() }));
    } catch (e) {
      /* stockage indisponible : le choix vaut pour la session en cours */
    }
  }

  /* ── Consent Mode v2 ─────────────────────────────────────────────────────── */

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  // Exposé pour public/js/commande.js (événement d'achat). Assignation
  // inconditionnelle : commande.js doit pouvoir compter dessus.
  window.gtag = gtag;

  /** Pose les défauts `denied`. Doit tourner avant tout chargement de gtag.js. */
  function defautsRefuses() {
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      wait_for_update: 500,
    });
  }

  function accorder() {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
    });
  }

  /* ── Chargement de gtag.js, uniquement sur accord ────────────────────────── */

  var chargementLance = false;

  function chargerGoogle() {
    if (chargementLance || !idAds) return;
    chargementLance = true;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(idAds);
    document.head.appendChild(s);

    gtag('js', new Date());
    gtag('config', idAds);

    // Signale aux autres scripts (commande.js) que la mesure est autorisée.
    // Drapeau ET événement : commande.js peut s'exécuter avant ce moment (il
    // écoutera l'événement) comme après (il lira le drapeau). Sans les deux,
    // l'ordre de chargement des fichiers deviendrait un piège silencieux.
    window.alnMesureAutorisee = true;
    document.dispatchEvent(new CustomEvent('aln:mesure-autorisee'));
  }

  /* ── Bandeau ─────────────────────────────────────────────────────────────── */

  var bandeau = null;
  var dernierFocus = null;

  function afficherBandeau() {
    if (!bandeau) return;
    dernierFocus = document.activeElement;
    bandeau.hidden = false;
    var premier = bandeau.querySelector('[data-consent-accepter]');
    if (premier) premier.focus();
  }

  function masquerBandeau() {
    if (!bandeau) return;
    bandeau.hidden = true;
    // Rend le focus à l'élément d'où l'on venait, sinon l'utilisateur au clavier
    // repart du début du document après avoir cliqué.
    if (dernierFocus && typeof dernierFocus.focus === 'function') {
      dernierFocus.focus();
    }
    dernierFocus = null;
  }

  function decider(decision) {
    ecrireChoix(decision);
    if (decision === 'accepte') {
      accorder();
      chargerGoogle();
    }
    masquerBandeau();
  }

  /* ── Démarrage ───────────────────────────────────────────────────────────── */

  function demarrer() {
    bandeau = document.querySelector('[data-bandeau-cookies]');
    if (bandeau) idAds = bandeau.getAttribute('data-id-ads') || null;

    // Les défauts sont posés dans tous les cas : ils doivent précéder gtag.js,
    // y compris pour un visiteur qui avait déjà accepté lors d'une visite passée.
    defautsRefuses();

    var choix = lireChoix();
    if (choix === 'accepte') {
      accorder();
      chargerGoogle();
    } else if (choix === null) {
      afficherBandeau();
    }
    // choix === 'refuse' : on ne charge rien et on n'affiche rien.

    if (!bandeau) return;

    var accepter = bandeau.querySelector('[data-consent-accepter]');
    var refuser = bandeau.querySelector('[data-consent-refuser]');
    if (accepter) accepter.addEventListener('click', function () { decider('accepte'); });
    if (refuser) refuser.addEventListener('click', function () { decider('refuse'); });

    // « Gérer les cookies » du pied de page : rouvre le bandeau pour changer
    // d'avis. Le retrait doit être aussi simple que l'octroi.
    document.querySelectorAll('[data-rouvrir-consentement]').forEach(function (el) {
      el.addEventListener('click', function (ev) {
        ev.preventDefault();
        afficherBandeau();
      });
    });

    // Échap ferme le bandeau SANS rien accepter : fermer n'est pas consentir.
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && !bandeau.hidden) masquerBandeau();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrer);
  } else {
    demarrer();
  }
})();
