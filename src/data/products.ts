export interface Product {
  slug: string;
  name: string;
  shortName: string;
  sku: string;
  priceCurrent: number;
  /**
   * Prix barré. ⚠️ Directive Omnibus (L112-1-1 Code conso) : un prix barré doit
   * être le prix le plus bas pratiqué dans les 30 jours précédant la remise.
   * Valeurs relevées sur aimezlanature.fr le 2026-07-20 (mêmes remises -18/-23/-30 %
   * affichées en ligne) — à faire confirmer par le marchand avant toute mise en prod.
   */
  priceOriginal: number;
  discountPercent: number;
  inStock: boolean;
  /** Nombre de perles fournies. Absent quand le produit n'est pas vendu au nombre de perles. */
  quantity?: number;
  includesBottle: boolean;
  /**
   * Note et nombre d'avis vérifiés. Absents tant qu'un produit n'a reçu aucun avis :
   * on n'affiche alors pas d'étoiles et le schema omet `aggregateRating`, plutôt
   * que d'afficher une note inventée (interdit par Google et trompeur pour l'acheteur).
   */
  rating?: number;
  reviewCount?: number;
  description: string;
  usages: string[];
  qa: { question: string; answer: string }[];
  metaTitle: string;
  metaDescription: string;
}

export const products: Product[] = [
  {
    slug: "pack-55-perles",
    name: "Perles de Céramique EM® Pack 55",
    shortName: "Pack 55 Perles",
    sku: "ALN-EM-055",
    priceCurrent: 19.9,
    priceOriginal: 25.9,
    discountPercent: 23,
    inStock: true,
    quantity: 55,
    includesBottle: false,
    rating: 4.91,
    reviewCount: 45,
    description: `Le Pack 55 Perles de Céramique EM® est notre bestseller, conçu pour une carafe de 1,5 à 2 litres, une bouilloire, une machine à café ou à thé. C'est le format idéal pour une famille de 2 à 3 personnes ou pour un usage quotidien intensif.

Fabriquées au Japon selon le procédé EM® original (Effective Microorganisms), ces perles d'argile naturelle agissent sans produit chimique pour améliorer le goût de l'eau du robinet, réduire la sensation de chlore et limiter les dépôts calcaires sur vos appareils. Utilisées comme billes anti calcaire dans la bouilloire, elles réduisent visiblement le tartre sur la résistance.

Conditionnées dans un emballage biodégradable avec sachet coton BIO, les 55 perles se glissent dans votre carafe ou directement dans le réservoir d'eau de votre cafetière ou machine à thé.

Entretien simple : ébullition 10 à 15 minutes tous les 3 à 6 mois.`,
    usages: ["Carafe 1,5-2 L", "Bouilloire", "Machine à café", "Machine à thé", "Gourde XL"],
    qa: [
      {
        question: "Pourquoi le Pack 55 est-il le plus populaire ?",
        answer: "Parce qu'il couvre exactement les deux usages quotidiens les plus fréquents : 30 perles pour une carafe de 2 L et 25 pour la bouilloire ou la cafetière, soit les 55 perles du pack.",
      },
      {
        question: "Puis-je utiliser les 55 perles dans ma cafetière ?",
        answer: "Oui, placez les perles dans le réservoir d'eau de votre cafetière ou machine à thé. Elles réduiront le calcaire et amélioreront le goût de vos boissons.",
      },
      {
        question: "Combien de temps durent les perles du Pack 55 ?",
        answer: "Avec un entretien régulier (ébullition tous les 3 à 6 mois), les perles conservent leurs propriétés sur le long terme. La fréquence de régénération dépend de la dureté de votre eau et de votre usage quotidien.",
      },
      {
        question: "La note de 4,91/5 est-elle vérifiée ?",
        answer: "Oui, cette note est calculée sur 45 avis clients vérifiés. Tous les avis sont collectés après achat et vérifiés avant publication.",
      },
      {
        question: "Peut-on utiliser le Pack 55 dans le lave-vaisselle ?",
        answer: "Le lave-vaisselle demande à lui seul 40 perles, en permanence dans le panier à couverts. Le Pack 55 y suffirait tout juste sans rien laisser pour votre carafe : pour cumuler les deux, prenez plutôt le Pack 100.",
      },
    ],
    metaTitle: "Perles de Céramique EM® Pack 55 — 19,90 € | Aimez la Nature",
    metaDescription: "55 Perles de Céramique EM® japonaises : note 4,91/5. Idéal carafe 2L, bouilloire, cafetière. Purifie l'eau naturellement. Livraison offerte dès 50€.",
  },
  {
    slug: "pack-100-perles",
    name: "Perles de Céramique EM® Pack 100",
    shortName: "Pack 100 Perles",
    sku: "ALN-EM-100",
    priceCurrent: 29.9,
    priceOriginal: 42.9,
    discountPercent: 30,
    inStock: true,
    quantity: 100,
    includesBottle: false,
    rating: 4.94,
    reviewCount: 51,
    description: `Le Pack 100 Perles de Céramique EM® est notre offre la plus complète pour un usage maison intensif : bonbonne, lave-vaisselle, machine à laver, vase ou bassine. C'est aussi le choix économique par excellence — le coût par perle est le plus bas de notre gamme.

100 perles d'argile japonaise enrichies en EM® (Micro-organismes Efficaces) pour traiter de grands volumes d'eau. Véritable anti-calcaire naturel pour le lave-vaisselle et la machine à laver, elles réduisent aussi le chlore et améliorent le goût — testées et plébiscitées avec une note de 4,94/5 sur 51 avis clients vérifiés.

Idéal pour les foyers de 3 personnes et plus, les adeptes du zéro déchet souhaitant supprimer totalement les bouteilles plastique, ou pour équiper plusieurs usages simultanément.

Emballage : tube biodégradable + sachet coton BIO. Régénération : ébullition 10-15 min tous les 3-6 mois.`,
    usages: ["Bonbonne jusqu'à 6 L", "Lave-vaisselle", "Machine à laver", "Vase", "Bassine"],
    qa: [
      {
        question: "Combien de perles faut-il pour un lave-vaisselle ?",
        answer: "Comptez 40 perles, placées dans un filet en permanence dans le panier à couverts. Le Pack 100 permet d'équiper le lave-vaisselle tout en gardant de quoi traiter une carafe et une bouilloire.",
      },
      {
        question: "Peut-on utiliser les perles dans la machine à laver ?",
        answer: "Oui : 50 perles dans un filet de lavage, directement dans le tambour. Elles améliorent la qualité de l'eau de lavage et permettent de réduire les quantités de lessive et d'adoucissant.",
      },
      {
        question: "Pourquoi le Pack 100 a-t-il la meilleure note (4,94/5) ?",
        answer: "Les clients qui choisissent le Pack 100 sont généralement ceux qui ont déjà testé un pack plus petit et reviennent pour équiper tous leurs usages. Leur satisfaction est donc naturellement plus élevée.",
      },
      {
        question: "Peut-on diviser le Pack 100 entre plusieurs usages ?",
        answer: "Absolument, c'est même l'intérêt du format. Une répartition typique : 30 perles dans une carafe de 2 L, 25 dans la bouilloire et 40 dans le lave-vaisselle — soit 95 des 100 perles.",
      },
      {
        question: "Le Pack 100 convient-il pour une bonbonne de 10 litres ?",
        answer: "À raison de 15 perles par litre, 100 perles traitent environ 6,5 litres d'eau de boisson. Pour une bonbonne de 10 litres remplie à ras bord, comptez plutôt 150 perles, soit un pack et demi.",
      },
    ],
    metaTitle: "Perles Céramique EM® Pack 100 — 29,90€ | Aimez la Nature",
    metaDescription: "100 Perles de Céramique EM® japonaises, note 4,94/5. Lave-vaisselle, machine à laver, bonbonne. Meilleur rapport qualité/prix. Livraison offerte dès 50€.",
  },
  {
    slug: "pack-gourde-ceramique-em",
    name: "Pack Gourde + 100 Perles de Céramique EM®",
    shortName: "Pack Gourde",
    sku: "ALN-EM-GOURDE",
    priceCurrent: 59.9,
    priceOriginal: 72.8,
    discountPercent: 18,
    inStock: true,
    quantity: 100,
    includesBottle: true,
    // Aucun avis client à ce jour (vérifié sur aimezlanature.fr le 2026-07-20) :
    // pas de note affichée ni d'aggregateRating dans le schema.
    description: `Le Pack Gourde regroupe notre Pack 100 Perles de Céramique EM® et la Gourde Écologique en verre double paroi conçue pour accueillir les perles. Le duo parfait pour boire une eau purifiée, sans plastique, à la maison comme en déplacement.

La gourde de 500 ml est en verre borosilicate double paroi, sans plastique au contact de l'eau, avec un compartiment intégré qui reçoit directement les perles. Plus besoin de cartouche à remplacer : les perles se régénèrent par simple ébullition.

Avec 100 perles, vous équipez la gourde et gardez de quoi traiter une carafe, une bouilloire ou un lave-vaisselle en parallèle. C'est la formule la plus complète de la gamme.

Emballage biodégradable, sans plastique.`,
    usages: ["Gourde sport", "Usage quotidien", "Voyage", "Bureau"],
    qa: [
      {
        question: "La gourde est-elle compatible avec d'autres marques de perles ?",
        answer: "La gourde est conçue pour accueillir des perles de 6 à 10 mm de diamètre. Elle est optimisée pour nos Perles de Céramique EM® mais peut techniquement accueillir des perles de taille similaire.",
      },
      {
        question: "Quelle différence avec la Gourde Écologique vendue seule ?",
        answer: "C'est la même gourde 500 ml. Le Pack Gourde y ajoute 100 perles de céramique EM®, de quoi équiper la gourde et traiter en plus une carafe ou une bouilloire. Si vous avez déjà des perles, la gourde seule à 29,90 € suffit.",
      },
      {
        question: "Combien de perles mettre dans la gourde ?",
        answer: "Comptez 8 à 10 perles pour une gourde de 500 ml, à raison de 15 perles par litre. Les perles restantes du pack équipent une carafe, une bouilloire ou votre lave-vaisselle.",
      },
    ],
    metaTitle: "Pack Gourde + 100 Perles EM® — 59,90 € | Aimez la Nature",
    metaDescription: "Gourde écologique 500 ml en verre + 100 Perles de Céramique EM® japonaises. Eau pure en déplacement, zéro plastique. Livraison offerte dès 50 €.",
  },
  {
    slug: "gourde-ecologique",
    name: "Gourde Écologique avec Perles de Céramique EM®",
    shortName: "Gourde Écologique",
    sku: "ALN-EM-GOURDE-500",
    priceCurrent: 29.9,
    priceOriginal: 39.9,
    discountPercent: 25,
    inStock: true,
    includesBottle: true,
    description: `La Gourde Écologique de 500 ml est pensée pour emporter votre eau purifiée partout : au bureau, en voyage, au sport. Elle est livrée avec des Perles de Céramique EM® logées dans son compartiment intégré.

Le corps est en verre borosilicate double paroi : aucun plastique au contact de l'eau, pas de goût parasite, et une paroi isolante qui garde la boisson à température plus longtemps. Le bouchon et la base sont protégés par un revêtement antidérapant.

Le compartiment inférieur reçoit les perles et les maintient en place quand vous buvez. Comme pour tous nos formats, les perles se régénèrent par ébullition de 10 à 15 minutes tous les 3 à 6 mois — rien à racheter.

Vous avez déjà des perles ? Cette gourde seule vous suffit. Sinon, le Pack Gourde ajoute 100 perles pour équiper aussi votre carafe ou votre bouilloire.`,
    usages: ["Gourde 500 ml", "Bureau", "Voyage", "Sport"],
    qa: [
      {
        question: "Combien de perles sont fournies avec la gourde ?",
        answer: "La gourde est livrée avec des perles de céramique EM® pour son compartiment. Si vous souhaitez en équiper d'autres contenants (carafe, bouilloire, lave-vaisselle), choisissez plutôt le Pack Gourde qui inclut 100 perles.",
      },
      {
        question: "Quelle est la contenance de la gourde ?",
        answer: "500 ml, un format qui tient dans un sac et dans la plupart des porte-gobelets. À 15 perles par litre, comptez 8 à 10 perles pour ce volume.",
      },
      {
        question: "La gourde est-elle en plastique ?",
        answer: "Non. Le corps est en verre borosilicate double paroi : aucun plastique n'est en contact avec votre eau. C'est cohérent avec notre objectif — remplacer les bouteilles plastique, pas les déplacer.",
      },
      {
        question: "Peut-on mettre une boisson chaude dedans ?",
        answer: "Le verre borosilicate double paroi supporte les liquides chauds et isole la main. Évitez cependant les chocs thermiques brutaux (eau bouillante dans une gourde sortie du réfrigérateur).",
      },
      {
        question: "Comment nettoyer la gourde ?",
        answer: "À la main, à l'eau tiède savonneuse, en retirant les perles au préalable. Les perles, elles, se régénèrent séparément par ébullition 10 à 15 minutes tous les 3 à 6 mois.",
      },
    ],
    metaTitle: "Gourde Écologique 500 ml avec Perles de Céramique EM® — 29,90€",
    metaDescription: "Gourde filtrante 500 ml en verre double paroi avec Perles de Céramique EM®. Zéro plastique au contact de l'eau, perles régénérables. Livraison offerte dès 50 €.",
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export const SITE = {
  name: "Aimez la Nature",
  url: "https://www.aimezlanature.fr",
  description: "Perles de Céramique EM® japonaises pour purifier l'eau du robinet naturellement.",
  /**
   * Avis clients — chiffres vérifiés sur aimezlanature.fr le 2026-07-20.
   * Pack 55 : 4,91/5 sur 45 avis · Pack 100 : 4,94/5 sur 51 avis.
   * Le Pack Gourde et la Gourde Écologique n'ont encore aucun avis.
   * Total = 45 + 51 = 96 ; moyenne pondérée = (4,91×45 + 4,94×51) / 96 = 4,93.
   * Ne pas modifier ces valeurs sans les recompter sur la source : elles sont
   * affichées publiquement et envoyées à Google dans le schema Organization.
   */
  totalReviews: 96,
  globalRating: 4.93,
  // ⚠️ Ne PAS réintroduire de « don 2,5 % / puits » : cet engagement n'existe
  // nulle part sur le site marchand (vérifié le 2026-07-20 et confirmé par le
  // marchand). Il avait été inventé lors d'une session précédente et a été
  // retiré de tout le site le 2026-07-20.
  freeShippingThreshold: 50,
};
