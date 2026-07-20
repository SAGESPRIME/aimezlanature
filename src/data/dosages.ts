/**
 * Dosages officiels des Perles de Céramique EM® — source unique de vérité.
 *
 * Source : guide d'utilisation officiel d'Aimez la Nature (page /ebook/ du site
 * historique), relevé le 2026-07-20. La règle de base est **15 perles par litre**
 * pour l'eau de boisson ; les appareils ont un dosage forfaitaire propre.
 *
 * ⚠️ Ne pas modifier ces valeurs sans les confronter à la source : elles sont
 * affichées publiquement, servent de base au schema FAQPage envoyé à Google et
 * répondent à la requête la plus recherchée du marché (« combien de perles de
 * céramique par litre d'eau »). Un chiffre inventé ici se propage partout.
 */

/** Nombre de perles par litre d'eau de boisson (carafe, fontaine, gourde, bonbonne). */
export const PERLES_PAR_LITRE = 15;

export type CategorieUsage = 'boisson' | 'electromenager' | 'maison' | 'jardin';

export interface Dosage {
  /** Contenant ou appareil concerné. */
  usage: string;
  /** Dosage recommandé, formulé tel qu'affiché. */
  nb: string;
  /** Précision de mise en œuvre (durée, emplacement…). */
  detail?: string;
  categorie: CategorieUsage;
  /** Pack conseillé — slug produit, pour lier vers la fiche. */
  packSlug?: string;
  packLabel?: string;
}

export const categoriesLabels: Record<CategorieUsage, string> = {
  boisson: 'Pour boire',
  electromenager: 'Électroménager',
  maison: 'Dans la maison',
  jardin: 'Jardin, fleurs et animaux',
};

export const dosages: Dosage[] = [
  // — Eau de boisson : règle des 15 perles par litre —
  {
    usage: 'Gourde 500 ml',
    nb: '8 à 10 perles',
    detail: 'Soit 15 perles par litre. Laissez agir 30 minutes lors du premier remplissage.',
    categorie: 'boisson',
    packSlug: 'gourde-ecologique',
    packLabel: 'Gourde Écologique',
  },
  {
    usage: 'Carafe ou fontaine 1 L',
    nb: '15 perles',
    detail: 'Remplissez d\'eau du robinet, laissez agir 30 minutes à 1 heure avant de consommer.',
    categorie: 'boisson',
    packSlug: 'pack-55-perles',
    packLabel: 'Pack 55',
  },
  {
    usage: 'Carafe ou fontaine 2 L',
    nb: '30 perles',
    detail: 'Même règle de 15 perles par litre. Les perles restent ensuite en permanence au fond.',
    categorie: 'boisson',
    packSlug: 'pack-55-perles',
    packLabel: 'Pack 55',
  },
  {
    usage: 'Bonbonne 5 L',
    nb: '75 perles',
    detail: 'Comptez 15 perles par litre. Au-delà de 6 à 7 litres, prévoyez un second pack.',
    categorie: 'boisson',
    packSlug: 'pack-100-perles',
    packLabel: 'Pack 100',
  },
  {
    usage: 'Bouilloire',
    nb: '25 perles',
    detail: 'À laisser en permanence dans le réservoir. Limite le tartre sur la résistance.',
    categorie: 'electromenager',
    packSlug: 'pack-55-perles',
    packLabel: 'Pack 55',
  },
  {
    usage: 'Cafetière ou machine à thé',
    nb: '25 perles',
    detail: 'Dans le réservoir d\'eau, en permanence.',
    categorie: 'electromenager',
    packSlug: 'pack-55-perles',
    packLabel: 'Pack 55',
  },
  {
    usage: 'Lave-vaisselle',
    nb: '40 perles',
    detail: 'Dans un filet, en permanence dans le panier à couverts. Réduit la dose de détergent et fait briller la vaisselle.',
    categorie: 'electromenager',
    packSlug: 'pack-100-perles',
    packLabel: 'Pack 100',
  },
  {
    usage: 'Lave-linge',
    nb: '50 perles',
    detail: 'Dans un filet de lavage, directement dans le tambour. Permet de diminuer lessive et adoucissant.',
    categorie: 'electromenager',
    packSlug: 'pack-100-perles',
    packLabel: 'Pack 100',
  },
  {
    usage: 'Réfrigérateur ou corbeille à fruits',
    nb: '15 à 30 perles',
    detail: 'Favorise la conservation et la fraîcheur des aliments.',
    categorie: 'maison',
    packSlug: 'pack-55-perles',
    packLabel: 'Pack 55',
  },
  {
    usage: 'Lavage des fruits et légumes',
    nb: '15 perles',
    detail: 'Dans l\'eau de lavage, pour assainir les aliments.',
    categorie: 'maison',
  },
  {
    usage: 'Baignoire',
    nb: '40 perles',
    detail: 'Directement dans le bain ou dans un gant de toilette, 10 minutes. Réduit les effets du calcaire sur la peau.',
    categorie: 'maison',
    packSlug: 'pack-100-perles',
    packLabel: 'Pack 100',
  },
  {
    usage: 'Toilettes (chasse d\'eau)',
    nb: '20 perles',
    detail: 'En permanence dans le réservoir. Évite la formation de tartre et réduit le détergent nécessaire.',
    categorie: 'maison',
  },
  {
    usage: 'Arrosage des plantes et du potager',
    nb: '20 à 40 perles pour 10 L',
    detail: 'Dans l\'arrosoir : ajoutez l\'eau, laissez agir quelques heures, puis arrosez.',
    categorie: 'jardin',
    packSlug: 'pack-100-perles',
    packLabel: 'Pack 100',
  },
  {
    usage: 'Vase et fleurs coupées',
    nb: '10 à 15 perles',
    detail: 'Dans l\'eau du vase, pour prolonger la tenue des fleurs.',
    categorie: 'jardin',
  },
  {
    usage: 'Aquarium',
    nb: '40 à 80 perles',
    detail: 'Au fond de l\'aquarium, selon sa taille.',
    categorie: 'jardin',
    packSlug: 'pack-100-perles',
    packLabel: 'Pack 100',
  },
  {
    usage: 'Piscine ou récupérateur d\'eau',
    nb: '1 kg pour 1 m³',
    detail: 'Les perles fonctionnent aussi sur de grands volumes d\'eau.',
    categorie: 'jardin',
  },
];

/** Dosages d'un groupe donné, pour l'affichage par catégorie. */
export function dosagesParCategorie(categorie: CategorieUsage): Dosage[] {
  return dosages.filter((d) => d.categorie === categorie);
}
