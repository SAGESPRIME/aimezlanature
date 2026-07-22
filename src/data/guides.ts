/**
 * Guides SEO Aimez la Nature — source unique de vérité.
 *
 * Liste des pages piliers affichée sur le hub /blog/ et sur la section
 * « Guides » de la page d'accueil. Ajouter un guide ici le fait apparaître
 * aux deux endroits (et dans le schema ItemList du hub).
 */

export interface Guide {
  title: string;
  description: string;
  href: string;
  category: string;
  /** Intention de recherche visée, affichée en petit sur la carte. */
  intent: string;
}

export const guides: Guide[] = [
  {
    title: 'Combien de perles de céramique par litre d’eau ?',
    description:
      'Le guide pratique pour doser vos perles dans une carafe, une gourde, une bouilloire, un lave-vaisselle ou un lave-linge.',
    href: '/comment-ca-marche/',
    category: 'Dosage',
    intent: 'Utiliser correctement les perles au quotidien',
  },
  {
    title: 'Les 16 utilisations des perles de céramique EM',
    description:
      'Carafe, réfrigérateur, baignoire, arrosage, aquarium : le dosage recommandé pour chaque usage domestique.',
    href: '/utilisations/',
    category: 'Usages',
    intent: 'Trouver quoi faire avec un pack de perles',
  },
  {
    title: 'Perles, charbon, carafe filtrante ou osmoseur ?',
    description:
      'Comparatif clair des solutions pour améliorer l’eau du robinet selon le besoin, le budget et les déchets produits.',
    href: '/purifier-eau-robinet-comparatif/',
    category: 'Comparatif',
    intent: 'Choisir la bonne solution pour son eau',
  },
  {
    title: 'Nos packs de perles de céramique EM',
    description:
      'Pack 55, Pack 100, gourde écologique : choisissez le format adapté à votre carafe, vos appareils et vos usages.',
    href: '/perles-ceramique-em/',
    category: 'Achat',
    intent: 'Passer du guide au bon pack',
  },
];
