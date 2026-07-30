/**
 * Mesure Google Ads et consentement — source unique de vérité.
 *
 * Ces valeurs sont lues par le bandeau (`public/js/consentement.js`) et par le
 * suivi d'achat (`public/js/commande.js`). Les centraliser ici évite la
 * divergence qui a déjà coûté cher sur ce projet (les « 192 avis » affichés à
 * sept endroits alors que le vrai total était 96).
 *
 * Rappel de la règle du site : aucun script Google n'est chargé avant que le
 * visiteur ait explicitement accepté. Le bandeau n'est pas décoratif, c'est lui
 * qui autorise le chargement.
 */

/**
 * Identifiant Google Ads, relevé le 2026-07-30 dans le HTML du WordPress encore
 * en ligne (`googletagmanager.com/gtag/js?id=AW-17799798810`). Sur WordPress le
 * tag était posé par le plugin WooCommerce Google Listings & Ads ; ici il est
 * posé à la main, ce plugin n'existant pas sous Astro.
 */
export const ID_ADS = 'AW-17799798810';

/**
 * Étiquette de l'action de conversion « Achat ».
 *
 * ⚠️ VIDE POUR L'INSTANT, et c'est volontaire : elle se récupère dans Google Ads
 * → Objectifs → Conversions → l'action « Achat » → « Configurer avec une balise ».
 * Elle ressemble à `AbC-D_efGhIjK`.
 *
 * Tant qu'elle est vide, le tag de base fonctionne (audiences de remarketing,
 * pages vues) et l'événement d'achat n'est simplement pas envoyé — rien ne
 * casse. Même parti pris que la grille de remises revendeur : la page est
 * livrable sans la donnée, et le jour où le marchand la fournit il n'y a qu'une
 * ligne à changer ici.
 */
export const ETIQUETTE_ACHAT = '';

/** Vrai quand le suivi d'achat est réellement configuré. */
export const suiviAchatActif = (): boolean => ETIQUETTE_ACHAT.trim().length > 0;

/** Cible complète de l'événement de conversion, ex. « AW-123/AbC-D_efGhIjK ». */
export const cibleConversion = (): string => `${ID_ADS}/${ETIQUETTE_ACHAT}`;

/**
 * Clés de stockage navigateur.
 *
 * Le choix de consentement va dans `localStorage` et non dans un cookie : le
 * site n'en pose aucun de son fait (le panier utilise déjà localStorage), et
 * mémoriser une préférence de consentement est de toute façon exempt de
 * consentement. Les cookies Google (`_gcl_*`) ne sont posés qu'après acceptation
 * — c'est justement l'objet du bandeau.
 */
export const CLE_CONSENTEMENT = 'aln_consentement_v1';

/** Montant de la commande, transmis de la page panier à la page de confirmation. */
export const CLE_DERNIERE_COMMANDE = 'aln_derniere_commande_v1';

/**
 * Durée de validité d'un choix, en jours.
 *
 * 6 mois pour l'acceptation ET pour le refus. La CNIL demande de ne pas
 * redemander avant un délai raisonnable après un refus (six mois est la durée
 * qu'elle cite), et plafonne la validité d'un consentement à treize mois. Une
 * seule durée pour les deux évite d'avoir l'air de harceler celui qui refuse
 * tout en oubliant vite celui qui accepte.
 */
export const VALIDITE_JOURS = 183;

/** Les deux décisions possibles. */
export type Decision = 'accepte' | 'refuse';
