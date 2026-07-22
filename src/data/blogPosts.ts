/**
 * Articles du blog, repris à l'identique de la version aimezlanature.vercel.app
 * (relevé le 2026-07-22) : catégories, temps de lecture, titres, extraits et
 * dates de publication d'origine.
 *
 * ⚠️ Les `href` pointent vers les anciennes URLs /blog/<slug>. Ces pages
 * n'existent pas dans ce projet : elles sont actuellement redirigées en 301
 * vers les pages piliers correspondantes (voir public/_redirects). Pour que
 * ces articles existent vraiment, il faudra les créer ET retirer les 8 règles
 * de redirection correspondantes, sinon la redirection gagne et la page reste
 * inaccessible.
 *
 * `date` est au format ISO pour alimenter <time datetime> — l'ancien site
 * affichait la date mais laissait l'attribut vide, donc illisible par les
 * moteurs.
 */

export interface BlogPost {
  title: string;
  excerpt: string;
  href: string;
  category: string;
  /** Temps de lecture affiché, ex. « 7 min ». */
  readingTime: string;
  /** Date ISO, ex. « 2025-04-18 ». */
  date: string;
}

export const blogPosts: BlogPost[] = [
  {
    title: 'Perles EM : Solution Ecologique et Eco',
    excerpt:
      "Les perles de céramique EM sont écologiques et économiques. Fini les bouteilles en plastique, économisez dès aujourd'hui sur votre eau de boisson.",
    href: '/blog/perles-de-ceramique-une-solution-ecologique-et-economique',
    category: 'Comparatifs',
    readingTime: '7 min',
    date: '2025-04-18',
  },
  {
    title: 'Perles EM : Alternative Bio Purification',
    excerpt:
      "Les perles de céramique EM constituent une alternative 100% bio pour purifier l'eau du robinet. Découvrez le procédé et les actions purifiantes.",
    href: '/blog/les-perles-de-ceramique-une-alternative-bio-pour-la-purification-deau-de-robinet',
    category: 'Comparatifs',
    readingTime: '6 min',
    date: '2025-04-05',
  },
  {
    title: "L'Eau, Source de Vie : Bien S'Hydrater",
    excerpt:
      "L'eau est essentielle à la vie. Découvrez pourquoi une bonne hydratation est cruciale et comment les perles EM améliorent la qualité de votre eau.",
    href: '/blog/leau-est-une-source-de-vie',
    category: 'Général',
    readingTime: '7 min',
    date: '2025-03-22',
  },
  {
    title: "Purifier l'Eau du Robinet avec les EM",
    excerpt:
      "Comment purifier l'eau du robinet avec les perles de céramique EM ? Découvrez les actions purifiante, probiotique et antioxydante de ces perles.",
    href: '/blog/perles-de-ceramique-purifier-votre-eau-du-robinet',
    category: 'Utilisation',
    readingTime: '6 min',
    date: '2025-03-08',
  },
  {
    title: 'Les Usages des Perles de Céramique EM',
    excerpt:
      'Découvrez tous les usages des perles de céramique EM : carafe, bouilloire, lave-linge, réfrigérateur, piscine et bien plus. Guide pratique complet.',
    href: '/blog/les-differents-usages-des-perles-de-ceramique',
    category: 'Usages',
    readingTime: '7 min',
    date: '2025-02-25',
  },
  {
    title: 'Authenticité et Efficacité des Perles EM',
    excerpt:
      "Comment vérifier l'authenticité des perles de céramique EM ? Découvrez les tests d'efficacité, l'origine japonaise et les critères de choix.",
    href: '/blog/authenticite-des-perles-de-ceramique-em-et-leur-efficacite',
    category: 'Comparatifs',
    readingTime: '6 min',
    date: '2025-02-10',
  },
  {
    title: 'Bienfaits des Perles de Céramique EM',
    excerpt:
      'Découvrez tous les bienfaits des perles de céramique EM : eau plus douce, économies, écologie, protection des appareils et conservation des aliments.',
    href: '/blog/les-bienfaits-des-perles-de-ceramique',
    category: 'Utilisation',
    readingTime: '6 min',
    date: '2025-01-28',
  },
  {
    title: 'Perles EM : Source de Vie au Quotidien',
    excerpt:
      'Les perles de céramique EM améliorent la qualité de votre eau du robinet. Découvrez comment ces perles japonaises transforment votre hydratation.',
    href: '/blog/perles-de-ceramique-em-une-vraie-source-de-vie-au-quotidien',
    category: 'Usages',
    readingTime: '6 min',
    date: '2025-01-15',
  },
];
