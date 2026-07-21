/**
 * Articles de blog SEO — source unique de vérité.
 *
 * Affichés sur le hub /blog/ (section « Articles ») et dans son schema ItemList.
 * Chaque article vise une requête NON couverte par les pages piliers, pour
 * compléter le maillage sans cannibaliser (stratégie docs/seo/strategie-seo.md,
 * données DataForSEO du 2026-07-20) :
 * - alternative carafe filtrante : 110/mois, SERP faible → opportunité n°1
 * - charbon binchotan : 1 000/mois, capté en longue traîne par le face-à-face
 * - perles de céramique em : ~210/mois + E-E-A-T (authenticité)
 * - gourde filtrante : 12 100/mois, visé en longue traîne avec un angle honnête
 */

export interface Article {
  title: string;
  description: string;
  href: string;
  category: string;
  /** Intention de recherche visée, affichée en petit sur la carte. */
  intent: string;
  datePublished: string;
}

export const articles: Article[] = [
  {
    title: 'Quelle alternative à la carafe filtrante ?',
    description:
      'Cartouches à racheter chaque mois, entretien strict, plastique jeté : trois solutions durables pour remplacer la carafe filtrante — dont votre carafe actuelle.',
    href: '/blog/alternative-carafe-filtrante/',
    category: 'Alternatives',
    intent: 'Arrêter les cartouches sans sacrifier le goût',
    datePublished: '2026-07-20',
  },
  {
    title: 'Perles de céramique ou charbon binchotan ?',
    description:
      'Les deux améliorent le goût de l\'eau du robinet, mais pas de la même façon. Le face-à-face honnête : action, durée de vie, entretien, coût sur 5 ans.',
    href: '/blog/perles-de-ceramique-ou-charbon-binchotan/',
    category: 'Comparatif',
    intent: 'Choisir entre les deux solutions naturelles',
    datePublished: '2026-07-20',
  },
  {
    title: 'Perles de céramique EM authentiques : comment les reconnaître',
    description:
      'Ce que veut dire EM®, comment les perles sont fabriquées, et les signes qui distinguent les perles authentiques des copies génériques.',
    href: '/blog/perles-de-ceramique-em-authentiques/',
    category: 'Authenticité',
    intent: 'Vérifier ce qu\'on achète avant d\'acheter',
    datePublished: '2026-07-20',
  },
  {
    title: 'Gourde filtrante : comment bien choisir',
    description:
      'Paille filtrante, charbon actif ou perles de céramique ? Chaque technologie répond à un besoin différent — voici lequel, sans survendre aucune solution.',
    href: '/blog/gourde-filtrante/',
    category: 'Équipement',
    intent: 'Choisir une gourde selon son usage réel',
    datePublished: '2026-07-20',
  },
];
