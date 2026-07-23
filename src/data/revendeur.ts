/**
 * Offre revendeur (B2B) — source unique de vérité.
 *
 * Tout ce qui s'affiche sur /revendeurs/ vient d'ici : la page ne contient
 * aucune donnée en dur. Même règle que pour SITE dans products.ts — une valeur
 * dupliquée dans un composant finit toujours par diverger de la source
 * (cf. tasks/lessons.md, l'affaire des « 192 avis »).
 *
 * ⚠️ RÈGLE ABSOLUE SUR LES CHIFFRES
 * Aucun pourcentage de remise, aucun minimum de commande, aucun franco de port
 * n'a été validé par le marchand à ce jour (23/07/2026). Tant que ce n'est pas
 * le cas, `paliersRemise` reste VIDE et la page affiche le principe sans
 * chiffre. Ne jamais y écrire une valeur « en attendant » : un tarif inventé
 * sur un site marchand est une pratique commerciale trompeuse (L121-2 code de
 * la consommation), et c'est exactement l'erreur déjà commise sur ce projet.
 */

export interface PalierRemise {
  /** Nom du palier, ex. « Boutique ». */
  nom: string;
  /** Condition d'accès, ex. « 30 packs par commande ». */
  condition: string;
  /** Remise affichée, ex. « −40 % ». */
  remise: string;
}

/**
 * Grille de remise. VIDE tant que le marchand n'a pas validé ses chiffres.
 * Dès qu'ils le sont : remplir ce tableau, la page affiche automatiquement
 * le tableau à la place du texte « grille communiquée sous 24 h ». Aucun autre
 * fichier n'est à modifier.
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
      "Le premier format est vendu 19,90 € au public. C'est un achat de test facile à conseiller en caisse, qui ne demande pas de réflexion au client.",
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
    titre: 'Vous décrivez votre activité',
    texte: 'Le formulaire ci-dessous prend deux minutes. Aucun engagement.',
  },
  {
    titre: 'Nous vérifions votre SIRET',
    texte: "L'offre est réservée aux professionnels enregistrés.",
  },
  {
    titre: 'Vous recevez votre devis',
    texte:
      'Grille de remise adaptée à votre volume, conditions professionnelles et délais, sous 24 h ouvrées.',
  },
  {
    titre: 'Nous expédions votre commande',
    texte: 'Réassort à la demande, sans engagement de volume annuel.',
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
    answer:
      "Le minimum et la grille de remise dépendent de votre activité et du volume envisagé. Ils vous sont communiqués avec votre devis, sous 24 h ouvrées après votre demande.",
  },
  {
    question: 'Quels documents dois-je fournir pour ouvrir un compte revendeur ?',
    answer:
      "Votre numéro SIRET suffit pour démarrer l'étude de votre demande. Votre numéro de TVA intracommunautaire vous sera demandé pour la facturation si vous êtes établi hors de France.",
  },
  {
    question: 'Puis-je revendre les perles sur ma propre boutique en ligne ?',
    answer:
      "C'est étudié au cas par cas. Les conditions de revente en ligne sont précisées dans les conditions professionnelles transmises avec votre devis.",
  },
  {
    question: 'Quelles conditions de vente s’appliquent à une commande professionnelle ?',
    answer:
      "Les CGV publiées sur ce site encadrent les ventes aux particuliers et ne s'appliquent pas à une commande professionnelle. Des conditions dédiées vous sont transmises avec votre devis, avant toute commande.",
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
 * Sert à la fois d'destinataire côté serveur et de contact de secours affiché
 * sur la page si l'envoi échoue — une demande ne doit jamais se perdre.
 */
export const EMAIL_REVENDEUR = 'contact@aimezlanature.fr';

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
 * Champ piège anti-robot (« honeypot ») : invisible et vide pour un humain.
 * Un robot qui remplit automatiquement tous les champs le remplit aussi, ce qui
 * permet de rejeter l'envoi sans imposer de captcha — un captcha tiers
 * obligerait à relâcher la CSP `script-src 'self'` du site.
 */
export const CHAMP_PIEGE = 'site_web';

/** Horodatage d'ouverture du formulaire, utilisé pour rejeter les envois instantanés. */
export const CHAMP_HORODATAGE = 'ouvert_a';
