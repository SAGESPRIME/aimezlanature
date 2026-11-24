/**
 * Offre revendeur (B2B) — source unique de vérité.
 *
 * Tout ce qui s'affiche sur /revendeurs/ vient d'ici : la page ne contient
 * aucune donnée en dur. Même règle que pour SITE dans products.ts — une valeur
 * dupliquée dans un composant finit toujours par diverger de la source
 * (cf. tasks/lessons.md, l'affaire des « 192 avis »).
 *
 * Conditions VALIDÉES par le marchand le 2026-11-24 : −30 % sur les prix
 * publics TTC, minimum 300 € de produits (après remise, hors livraison),
 * livraison Colissimo selon le poids. Elles viennent de commande-pro.mjs
 * (qui calcule le paiement) : jamais recopiées en dur ici.
 * ⚠️ Ne jamais afficher un chiffre non validé par le marchand (L121-2 code
 * de la consommation).
 */

import { prixDEntree, products } from './products';
import { MINIMUM_PRO, REMISE_PRO, prixPro } from './commande-pro.mjs';

const euros = (n: number) => `${n.toFixed(2).replace('.', ',')} €`;
const remiseTexte = `−${Math.round(REMISE_PRO * 100)} %`;
const pack100 = products.find((p) => p.slug === 'pack-100-perles');

/** Conditions revendeur affichées sur /revendeurs/ (et rappelées sur /pro/). */
export const conditionsPro = [
  {
    titre: `${remiseTexte} sur nos prix publics`,
    texte: pack100
      ? `Exemple : ${pack100.shortName} à ${euros(prixPro(pack100.priceCurrent))} au lieu de ${euros(pack100.priceCurrent)} TTC.`
      : 'Sur tous les produits du catalogue.',
  },
  {
    titre: `Minimum ${MINIMUM_PRO} € par commande`,
    texte: 'De produits, après remise et hors livraison. Panachage libre entre les formats.',
  },
  {
    titre: 'Livraison Colissimo au poids',
    texte: 'En France, au tarif Colissimo à domicile selon le poids total du colis, indiqué avant le paiement.',
  },
];

export interface PalierRemise {
  /** Nom du palier, ex. « Boutique ». */
  nom: string;
  /** Condition d'accès, ex. « 30 packs par commande ». */
  condition: string;
  /** Remise affichée, ex. « −40 % ». */
  remise: string;
}

/**
 * Ancienne grille par paliers : remplacée par la remise unique de
 * conditionsPro. Laissée vide (la page affiche conditionsPro).
 */
export const paliersRemise: PalierRemise[] = [];

/** Arguments de vente en rayon. Chaque affirmation est déjà prouvée ailleurs sur le site. */
export const argumentsRevente = [
  {
    titre: 'Un produit déjà validé par ses utilisateurs',
    texte:
      "Les avis publiés sur nos fiches et sur Amazon convergent : le produit tient sa promesse sur le goût de l'eau et le tartre. Vos clients ne découvrent pas un inconnu.",
  },
  {
    titre: 'Un prix d’entrée accessible',
    texte:
      `Le premier format est vendu ${prixDEntree()} au public. C'est un achat de test facile à conseiller en caisse, qui ne demande pas de réflexion au client.`,
  },
  {
    titre: 'Un produit qui se raconte en deux phrases',
    texte:
      "De l'argile japonaise, un sachet dans la carafe, plus de goût de chlore. Pas de filtre à changer, pas d'électricité, pas de plastique jeté. Votre équipe l'explique sans formation.",
  },
  {
    titre: 'Une origine vérifiable',
    texte:
      "Perles authentiques fabriquées au Japon selon le procédé EM® du Professeur Higa, importées avec traçabilité. Nous sommes revendeur agréé EM.",
  },
];

/** Les 4 étapes du parcours revendeur. */
export const etapes = [
  {
    titre: 'Vous posez votre candidature',
    texte: 'Le formulaire ci-dessous prend deux minutes. Aucun engagement.',
  },
  {
    titre: 'Nous vérifions votre activité',
    texte: "L'offre est réservée aux professionnels enregistrés (SIRET). Réponse sous 24 h ouvrées.",
  },
  {
    titre: 'Vous recevez votre accès revendeur',
    texte: 'Un lien de connexion par email, sans mot de passe, vers votre espace de commande.',
  },
  {
    titre: 'Vous commandez en ligne',
    texte: `Tarif ${remiseTexte}, minimum ${MINIMUM_PRO} €, paiement sécurisé, expédition Colissimo.`,
  },
];

/**
 * FAQ professionnelle.
 *
 * Chaque réponse est soit un fait déjà publié sur le site, soit un renvoi
 * explicite au devis. Aucune question dont la réponse n'est pas connue n'a été
 * inventée : c'est pour cela qu'on n'y trouve ni délai de livraison chiffré,
 * ni minimum de commande, ni règle d'exclusivité territoriale.
 */
export const faqPro = [
  {
    question: 'Quel est le minimum de commande pour un revendeur ?',
    answer: `${MINIMUM_PRO} € de produits par commande, après la remise de ${Math.round(REMISE_PRO * 100)} % et hors livraison. Vous panachez librement les formats.`,
  },
  {
    question: 'Combien coûte la livraison d’une commande professionnelle ?',
    answer:
      'Le tarif Colissimo à domicile selon le poids total du colis, en France. Le montant exact s’affiche dans votre espace revendeur avant le paiement.',
  },
  {
    question: 'Quels documents dois-je fournir pour ouvrir un compte revendeur ?',
    answer:
      "Votre numéro SIRET suffit pour démarrer l'étude de votre demande. Votre numéro de TVA intracommunautaire vous sera demandé pour la facturation si vous êtes établi hors de France.",
  },
  {
    question: 'Puis-je revendre les perles sur ma propre boutique en ligne ?',
    answer:
      "C'est étudié au cas par cas : précisez-le dans votre candidature.",
  },
  {
    question: 'Quelles conditions de vente s’appliquent à une commande professionnelle ?',
    answer:
      "Les CGV publiées sur ce site encadrent les ventes aux particuliers. Vos conditions professionnelles (remise, minimum, livraison) sont celles affichées sur cette page et dans votre espace revendeur ; elles vous sont confirmées avec votre accès.",
  },
  {
    question: 'Comment être sûr que les perles sont authentiques ?',
    answer:
      "Nous sommes revendeur agréé EM et importons les perles directement du Japon, avec une traçabilité complète. C'est le même produit que celui vendu aux particuliers sur ce site, dans le même conditionnement.",
  },
];

/** Types d'activité proposés dans le formulaire. */
export const typesActivite = [
  'Boutique bio / magasin spécialisé',
  'Épicerie vrac / zéro déchet',
  'Boutique en ligne',
  'Praticien (naturopathe, spa, bien-être)',
  'Hébergement / restauration',
  'Comité d’entreprise / collectivité',
  'Autre',
];

/** Fourchettes de volume proposées dans le formulaire. */
export const volumesEnvisages = [
  'Je découvre, je ne sais pas encore',
  'Moins de 20 packs',
  '20 à 50 packs',
  '50 à 100 packs',
  'Plus de 100 packs',
];

/**
 * Adresse qui reçoit les demandes revendeur.
 * Sert à la fois de destinataire côté serveur et de contact de secours affiché
 * sur la page si l'envoi échoue — une demande ne doit jamais se perdre.
 * Boîte unique du marchand, définie dans lib/email.ts.
 */
export { EMAIL_MARCHAND as EMAIL_REVENDEUR } from '../lib/email';

/** Champs attendus par /api/revendeur — partagés entre le formulaire et le serveur. */
export const CHAMPS = {
  boutique: { name: 'boutique', label: 'Nom de la boutique ou de la société', requis: true },
  contact: { name: 'contact', label: 'Votre nom', requis: true },
  email: { name: 'email', label: 'Email professionnel', requis: true },
  telephone: { name: 'telephone', label: 'Téléphone', requis: false },
  siret: { name: 'siret', label: 'SIRET', requis: true },
  activite: { name: 'activite', label: 'Type d’activité', requis: true },
  volume: { name: 'volume', label: 'Volume envisagé', requis: false },
  message: { name: 'message', label: 'Votre projet en quelques mots', requis: false },
} as const;

/**
 * Filtres anti-robot : définis une seule fois dans src/lib/antispam.ts et
 * partagés avec le formulaire de dépôt d'avis. Ré-exportés ici pour que les
 * fichiers du formulaire revendeur continuent d'importer depuis un seul
 * endroit — les valeurs sont inchangées.
 */
export { CHAMP_PIEGE, CHAMP_HORODATAGE } from '../lib/antispam';
