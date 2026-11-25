/**
 * Lot 1 (24/11/2026) — cohérence des FAQ du site.
 *   - Une question = une seule page : la durée de vie n'est plus traitée que
 *     sur la collection (formulation unique, attribuée au fabricant) ;
 *     l'accueil et « Comment ça marche » prennent des questions nouvelles.
 *   - Réponse « sans danger » complétée (risque d'étouffement : petits objets).
 *   - « Adoucissent l'eau » et « équilibre de l'eau » : effets non démontrés,
 *     attribués au fabricant ou reformulés.
 * Publié directement (corrections de cohérence, pas de nouveau texte éditorial).
 */
const DUREE = 'Selon le guide du fabricant, plus de 10 ans, à condition de les régénérer : faites-les bouillir 10 à 15 minutes dans de l’eau claire tous les 3 à 6 mois, sans savon ni vinaigre. Il n’y a rien à racheter entre-temps, contrairement aux cartouches des carafes filtrantes, à changer chaque mois.';

export const patches = [
  {
    id: 'faq-accueil-01',
    avant: {
      reponse: "Ce sont des perles d'argile naturelle fabriquées au Japon et enrichies en Micro-organismes Efficaces (EM®). Plongées dans l'eau du robinet, elles réduisent le goût et l'odeur de chlore, adoucissent l'eau et limitent les dépôts de tartre, sans aucun produit chimique.",
    },
    set: {
      reponse: 'Ce sont des perles d’argile naturelle fabriquées au Japon et enrichies en Micro-organismes Efficaces (EM®). Plongées dans l’eau du robinet, elles réduisent le goût et l’odeur de chlore, adoucissent le goût de l’eau et limitent les dépôts de tartre, sans aucun produit chimique.',
    },
  },
  {
    id: 'faq-accueil-03',
    avant: {
      question: 'Combien de temps durent les perles de céramique ?',
      reponse: "Les perles ne s'usent pas. Il suffit de les régénérer par ébullition 10 à 15 minutes tous les 3 à 6 mois, selon la dureté de votre eau et votre usage. Elles se conservent ainsi sur de nombreuses années.",
    },
    set: {
      question: 'Pourquoi l’eau du robinet a-t-elle un goût de chlore ?',
      reponse: 'Le chlore est ajouté en petite quantité pour que l’eau reste saine tout au long du réseau, jusqu’à votre robinet. Son goût ne signifie pas que l’eau est impropre à la consommation. Pour l’atténuer, déposez 15 perles par litre dans une carafe et attendez 30 minutes ; garder la carafe au frais aide aussi.',
    },
  },
  {
    id: 'faq-accueil-04',
    avant: {
      reponse: "Oui : fabriquées à partir d'argile naturelle selon le procédé EM® japonais, elles ne libèrent aucun produit chimique dans l'eau. Elles améliorent une eau déjà potable (goût, chlore, tartre) et ne remplacent pas un filtre certifié contre les bactéries ou les métaux lourds.",
    },
    set: {
      reponse: 'Oui : fabriquées à partir d’argile naturelle selon le procédé EM® japonais, elles ne libèrent aucun produit chimique dans l’eau. Seule précaution : ce sont de petits objets, à garder hors de portée des jeunes enfants et des animaux (risque d’étouffement). Elles améliorent une eau déjà potable (goût, chlore, tartre) et ne remplacent pas un filtre certifié contre les bactéries ou les métaux lourds.',
    },
  },
  {
    id: 'faq-accueil-05',
    avant: {
      question: 'Comment entretenir et régénérer les perles ?',
      reponse: "Rincez-les à l'eau claire, puis faites-les bouillir 10 à 15 minutes tous les 3 à 6 mois, sans savon ni vinaigre. Laissez-les sécher et replacez-les dans votre carafe, votre bouilloire ou votre gourde.",
    },
    set: {
      question: 'Quel pack choisir pour commencer ?',
      reponse: 'Le Pack 55 équipe une carafe de 2 litres et une bouilloire. Le Pack 100 couvre toute la maison : carafe, bouilloire et lave-vaisselle. Le Pack Gourde réunit une gourde en verre et 100 perles, pour boire la même eau en déplacement.',
    },
  },
  {
    id: 'faq-collection-02',
    avant: {
      reponse: 'Avec une régénération régulière (ébullition 10 à 15 minutes tous les 3 à 6 mois), les perles conservent leurs propriétés pendant plusieurs années. C\'est leur grand avantage face aux carafes filtrantes dont la cartouche doit être remplacée chaque mois.',
    },
    set: { reponse: DUREE },
  },
  {
    id: 'faq-comment-ca-marche-05',
    avant: {
      question: 'Combien de temps durent les perles de céramique ?',
      reponse: "Plusieurs années avec une régénération régulière. Contrairement aux cartouches de carafe filtrante, il n'y a rien à racheter chaque mois : c'est un achat unique.",
    },
    set: {
      question: 'L’eau garde un léger goût de chlore : que faire ?',
      reponse: 'Vérifiez d’abord le dosage (15 perles par litre) et laissez agir au moins 30 minutes, davantage si votre eau est très chlorée. Gardez la carafe au frais et renouvelez l’eau chaque jour. Si les perles servent depuis plus de 3 à 6 mois, régénérez-les par ébullition.',
    },
  },
  {
    id: 'faq-utilisations-01',
    avant: {
      reponse: "Oui. Placez 50 perles dans un filet de lavage, directement dans le tambour. Elles adoucissent l'eau de lavage et permettent de réduire les quantités de lessive et d'adoucissant, tout en protégeant l'appareil du tartre.",
    },
    set: {
      reponse: 'Oui. Placez 50 perles dans un filet de lavage, directement dans le tambour, où elles restent en permanence. Selon le fabricant, elles limitent les dépôts de tartre et permettent de réduire les doses de lessive et d’adoucissant.',
    },
  },
  {
    id: 'faq-utilisations-02',
    avant: {
      reponse: "Oui, comptez 40 à 80 perles au fond de l'aquarium selon sa taille. Elles participent à l'équilibre de l'eau sans produit chimique.",
    },
    set: {
      reponse: 'Oui : le fabricant conseille 40 à 80 perles au fond de l’aquarium selon sa taille. Elles ne remplacent ni la filtration ni l’entretien habituel de l’aquarium.',
    },
  },
];
