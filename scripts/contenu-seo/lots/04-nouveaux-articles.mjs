/**
 * Lot 4 (25/11/2026) — nouveaux articles (brouillons), priorités 1 et 2 du plan SEO.
 * Volumes : docs/seo/strategie-seo.md (DataForSEO, Google France, juillet 2026).
 *   gourde-filtrante                     gourde filtrante 12 100/mois
 *   alternative-carafe-filtrante         carafe filtrante 14 800 (traîne), alternative 110
 *   perles-de-ceramique-ou-charbon-binchotan   binchotan 1 000, charbon actif eau 1 300
 *   anti-calcaire-naturel-bouilloire     billes anti calcaire 390, anti calcaire naturel 320
 *   gout-de-chlore-eau-du-robinet        goût / odeur de chlore (sujet n°1 des clients)
 *   entretenir-perles-de-ceramique       nettoyer, entretenir, faire bouillir, durée de vie
 * Rien n'est chiffré sans source ; les effets des perles sont attribués au fabricant.
 */
import { brouillonArticle, tempsDeLecture } from '../redaction.mjs';
import { S, P, LIMITE, ENTRETIEN } from '../sources.mjs';

const DATE = '2026-11-25';
const article = (a) => ({ datePublication: DATE, ...a, tempsLecture: tempsDeLecture(a) });

const gourde = article({
  slug: 'gourde-filtrante',
  titre: 'Gourde filtrante : laquelle choisir selon l’eau que vous buvez ?',
  titreCarte: 'Gourde filtrante : laquelle choisir ?',
  libelleCourt: 'Gourde filtrante',
  categorie: 'Comparatifs',
  extrait: 'Filtre à charbon, microfiltration, perles de céramique : quelle gourde filtrante pour l’eau du robinet, la randonnée ou le voyage, et ce qu’elles retiennent vraiment.',
  chapo: 'Une gourde filtrante pour la ville et une gourde de randonnée ne retiennent pas la même chose. Le bon choix dépend de l’eau que vous y mettrez. Voici les types de gourdes, ce qu’elles filtrent et ce qu’elles coûtent à l’usage.',
  reponseCourte: 'Pour l’eau du robinet, une gourde à charbon actif ou à perles de céramique suffit : elle agit sur le goût de chlore. Pour l’eau de rivière ou de source en randonnée, il faut une gourde à microfiltration ou un purificateur, seuls capables de retenir les bactéries. Les perles, elles, ne demandent aucune cartouche.',
  metaTitle: 'Gourde filtrante : laquelle choisir selon votre eau ?',
  metaDescription: 'Gourde filtrante à charbon, à microfiltration ou à perles de céramique : laquelle choisir pour l’eau du robinet, la randonnée ou le voyage, et à quel coût.',
  sections: [
    {
      titre: 'Quelle eau allez-vous filtrer ?',
      blocs: [
        '- Eau du robinet (bureau, école, sport en ville) : elle est déjà potable. Le seul souci est le goût de chlore. Une gourde qui l’atténue suffit.',
        '- Eau de rivière, de lac ou de source (randonnée, bivouac) : elle peut contenir des bactéries et des parasites. Il faut une gourde capable de les retenir.',
        '- Eau d’un pays où le réseau n’est pas fiable (voyage) : suivez les recommandations sanitaires du pays ; une gourde « purificatrice » certifiée, ou de l’eau traitée, sont alors nécessaires.',
        'Se tromper de catégorie est l’erreur la plus fréquente : aucune gourde « pour le goût » ne rend potable une eau de rivière.',
      ],
    },
    {
      titre: 'Les 4 types de gourdes filtrantes',
      blocs: [
        '### 1. La gourde à cartouche de charbon actif',
        'La plus courante en ville. Le charbon retient le chlore et améliore le goût. La cartouche se remplace régulièrement, selon les indications de chaque fabricant : c’est un coût et un déchet récurrents.',
        '### 2. La gourde à microfiltration',
        'Conçue pour la randonnée : une membrane aux pores très fins retient les bactéries et les parasites de l’eau naturelle. Elle ne retient pas forcément les virus ni les produits chimiques ; vérifiez ce que le fabricant annonce et la certification.',
        '### 3. La gourde purificatrice (UV ou membrane avancée)',
        'Pour le voyage lointain ou l’eau douteuse : elle vise aussi les virus. Plus chère, elle demande des recharges ou une batterie.',
        '### 4. La gourde à perles de céramique ou à binchotan',
        'Pour l’eau du robinet, sans cartouche : les [perles de céramique EM](' + P.purifier + ') atténuent le goût de chlore en une trentaine de minutes et se régénèrent par ébullition ; le [charbon binchotan](' + P.binchotan + ') agit aussi sur le chlore et se remplace tous les 3 à 6 mois. ' + LIMITE,
      ],
    },
    {
      titre: 'Comparer le vrai coût sur 3 ans',
      blocs: [
        'Pour comparer, additionnez le prix de la gourde et celui des cartouches ou recharges sur trois ans, en vous fiant à la fréquence de remplacement indiquée par chaque fabricant.',
        '- Gourde à cartouche : prix de la gourde + nombre de cartouches par an × prix de la cartouche × 3.',
        '- Gourde à perles : prix de la gourde et des perles, une seule fois. Selon le guide du fabricant, les perles s’utilisent plus de 10 ans avec une régénération régulière.',
        'Le même raisonnement vaut à la maison pour la [carafe filtrante et ses alternatives](' + P.carafe + ').',
      ],
    },
    {
      titre: 'Verre, inox ou plastique ?',
      blocs: [
        '- Verre : aucun goût parasite, se lave facilement ; plus lourd, il faut le protéger des chocs. Le verre borosilicate supporte mieux les écarts de température.',
        '- Inox : léger, incassable, souvent isotherme ; vérifiez la qualité de l’acier et du revêtement intérieur.',
        '- Plastique (même sans BPA) : le plus léger, mais c’est justement le plastique que beaucoup cherchent à quitter.',
        'Pour conserver l’eau du robinet, l’Anses recommande le verre ou l’inox plutôt que le plastique.',
      ],
    },
    {
      titre: 'Notre gourde en verre',
      blocs: [
        'Nous avons conçu la [Gourde Écologique](' + P.gourde + ') pour l’eau du robinet : 500 ml, verre borosilicate double paroi (aucun plastique au contact de l’eau), et un compartiment intégré qui maintient les perles quand vous buvez. On la remplit au robinet et on attend une trentaine de minutes avant de boire.',
        'Le [Pack Gourde](' + P.packGourde + ') y ajoute 100 perles, pour équiper aussi la carafe et la bouilloire à la maison. Elle n’est pas faite pour l’eau de rivière : en randonnée, emportez une gourde à microfiltration.',
      ],
    },
  ],
  faq: [
    { question: 'Une gourde filtrante rend-elle l’eau de rivière potable ?', reponse: 'Seules les gourdes à microfiltration ou purificatrices, conçues et certifiées pour cela, retiennent bactéries et parasites. Une gourde à charbon ou à perles de céramique est faite pour l’eau du robinet, déjà potable.' },
    { question: 'Combien de perles mettre dans une gourde de 500 ml ?', reponse: 'Comptez 8 à 10 perles, à raison de 15 perles par litre. Remplissez la gourde au robinet et attendez une trentaine de minutes.' },
    { question: 'Gourde en verre ou en inox ?', reponse: 'Le verre ne donne aucun goût et se nettoie facilement, mais il est plus lourd et craint les chocs. L’inox est léger et incassable. Les deux sont préférables au plastique pour conserver l’eau.' },
  ],
  sources: [S.ansesBouteille, S.santeControle, S.guide],
});

const carafe = article({
  slug: 'alternative-carafe-filtrante',
  titre: 'Carafe filtrante : avantages, limites et alternatives sans cartouche',
  titreCarte: 'Carafe filtrante : les alternatives sans cartouche',
  libelleCourt: 'Alternatives à la carafe filtrante',
  categorie: 'Comparatifs',
  extrait: 'Cartouches, coût à l’année, hygiène : ce que fait vraiment une carafe filtrante, ses limites, et 4 alternatives sans cartouche pour l’eau du robinet.',
  chapo: 'La carafe filtrante est la solution la plus répandue pour améliorer l’eau du robinet. Elle a ses qualités, mais aussi un coût à l’année, des déchets et des règles d’hygiène que l’on oublie. Voici ce qu’elle fait vraiment, et les alternatives sans cartouche.',
  reponseCourte: 'Une carafe filtrante améliore le goût et réduit le calcaire, mais sa cartouche se change environ chaque mois : un coût et un déchet récurrents, et un risque d’hygiène si on l’oublie. Sans cartouche : perles de céramique, bâton de charbon binchotan, ou simplement une carafe ouverte au réfrigérateur.',
  metaTitle: 'Carafe filtrante : limites et alternatives sans cartouche',
  metaDescription: 'Carafe filtrante : ce qu’elle filtre, son coût à l’année, ses règles d’hygiène, et 4 alternatives sans cartouche pour une eau du robinet agréable.',
  sections: [
    {
      titre: 'Ce que fait une carafe filtrante',
      blocs: [
        'La cartouche associe en général du charbon actif, qui retient le chlore et améliore le goût, et une résine échangeuse d’ions, qui réduit le calcaire et certains métaux selon le modèle. Les performances varient d’une marque à l’autre : fiez-vous à ce que chaque fabricant annonce, et aux certifications.',
        'Elle n’est pas faite pour rendre potable une eau qui ne l’est pas : comme toutes les solutions de ce guide, elle s’utilise avec l’eau du robinet.',
      ],
    },
    {
      titre: 'Les limites qu’on oublie',
      blocs: [
        '### Un coût à l’année',
        'Les fabricants recommandent de changer la cartouche environ toutes les quatre semaines. À quelques euros la cartouche, la carafe devient un abonnement : notre [comparatif](' + P.comparatif + ') l’estime à 60 à 100 € par an.',
        '### Des déchets',
        'Une douzaine de cartouches par an et par carafe, en plastique, charbon et résine. Certaines marques proposent leur collecte : renseignez-vous avant de les jeter.',
        '### L’hygiène',
        'Une cartouche usée ou une carafe laissée à température ambiante peuvent favoriser le développement de bactéries dans le filtre. Les fabricants recommandent de garder la carafe au réfrigérateur, de la laver régulièrement et de respecter la date de changement.',
      ],
    },
    {
      titre: '4 alternatives sans cartouche',
      blocs: [
        '### 1. Les perles de céramique EM',
        'Déposées au fond d’une carafe (15 perles par litre), elles atténuent le goût de chlore en une trentaine de minutes et, selon le fabricant, limitent les dépôts de calcaire. Un achat unique : on les régénère par ébullition tous les 3 à 6 mois. Voir [ce qu’elles font, et ne font pas](' + P.purifier + ').',
        '### 2. Le bâton de charbon binchotan',
        'Un charbon de bois japonais qui retient le chlore. Naturel, mais à remplacer tous les 3 à 6 mois et sans effet sur le tartre. Le duel détaillé : [perles ou binchotan](' + P.binchotan + ').',
        '### 3. La carafe ouverte au réfrigérateur',
        'Le chlore est volatil : une carafe ouverte, laissée quelques heures au frais, perd une bonne partie de son goût de chlore. Gratuit, mais il faut anticiper et renouveler l’eau chaque jour. Plus d’astuces : [goût de chlore, que faire](' + P.chlore + ').',
        '### 4. Le filtre sous évier ou l’osmoseur',
        'Pour qui veut retenir davantage de substances. Plus coûteux, à faire installer, avec des cartouches ou une membrane à changer ; l’osmoseur retire aussi les minéraux et rejette une partie de l’eau.',
      ],
    },
    {
      titre: 'Quelle solution pour vous ?',
      blocs: [
        '- Le goût de chlore vous gêne : perles, binchotan ou carafe ouverte au frais.',
        '- Le calcaire vous gêne surtout dans les appareils : perles dans la bouilloire et la cafetière, voir notre guide [anti-calcaire naturel](' + P.calcaire + ').',
        '- Vous voulez retirer pesticides, nitrates ou plomb : un filtre certifié pour ces substances, ou un osmoseur.',
        '- Vous ne voulez plus rien racheter : les [perles de céramique](' + P.collection + '), régénérées par ébullition.',
      ],
    },
  ],
  faq: [
    { question: 'Tous les combien changer la cartouche d’une carafe filtrante ?', reponse: 'Les fabricants recommandent en général environ toutes les quatre semaines, ou après un certain volume filtré. Une cartouche gardée trop longtemps perd son efficacité et peut favoriser le développement de bactéries.' },
    { question: 'La carafe filtrante enlève-t-elle le calcaire ?', reponse: 'Les cartouches à résine échangeuse d’ions réduisent une partie du calcaire, selon le modèle et tant que la cartouche n’est pas saturée. Vérifiez ce que le fabricant annonce.' },
    { question: 'Peut-on combiner perles de céramique et carafe filtrante ?', reponse: 'C’est possible, mais peu utile : les deux agissent sur le goût de chlore. Les perles servent surtout à se passer de cartouches.' },
  ],
  sources: [S.ansesChlore, S.santeControle, S.guide],
});

const binchotan = article({
  slug: 'perles-de-ceramique-ou-charbon-binchotan',
  titre: 'Perles de céramique ou charbon binchotan : lequel choisir pour l’eau du robinet ?',
  titreCarte: 'Perles de céramique ou charbon binchotan ?',
  libelleCourt: 'Perles ou binchotan',
  categorie: 'Comparatifs',
  extrait: 'Charbon binchotan ou perles de céramique EM : comment ils agissent, durée de vie, entretien, prix à l’année et usages. Le comparatif pour choisir, ou les associer.',
  chapo: 'Ce sont les deux solutions naturelles les plus populaires pour améliorer l’eau du robinet sans cartouche plastique. Elles se ressemblent dans la carafe, mais ne fonctionnent pas de la même façon et ne durent pas le même temps.',
  reponseCourte: 'Le charbon binchotan retient le chlore par adsorption, mais se remplace tous les 3 à 6 mois et n’agit pas sur le tartre. Les perles de céramique EM atténuent le goût de chlore et, selon le fabricant, limitent le calcaire ; elles durent plus de 10 ans avec une ébullition régulière. On peut aussi les associer.',
  metaTitle: 'Perles de céramique ou charbon binchotan : que choisir ?',
  metaDescription: 'Charbon binchotan ou perles de céramique EM : fonctionnement, durée de vie, entretien, coût et usages. Le comparatif pour choisir, ou les associer.',
  sections: [
    {
      titre: 'Deux solutions naturelles, deux principes',
      blocs: [
        'Le binchotan est un charbon de bois japonais, traditionnellement fabriqué à partir de chêne ubame, cuit à très haute température. Sa structure très poreuse retient le chlore et certaines molécules responsables des mauvais goûts : c’est l’adsorption, le même principe que le charbon actif des cartouches.',
        'Les perles de céramique EM sont des billes d’argile fermentée avec des micro-organismes EM, puis cuites. Elles atténuent le goût de chlore ; le fabricant attribue leur action à ces micro-organismes, et annonce aussi un effet sur la cristallisation du calcaire. Voir [comment elles sont fabriquées](' + P.purifier + ').',
      ],
    },
    {
      titre: 'La comparaison, critère par critère',
      blocs: [
        '- Goût de chlore : les deux l’atténuent.',
        '- Calcaire : le binchotan n’agit pas dessus ; les perles le limitent selon le fabricant, d’où leur usage dans la bouilloire.',
        '- Durée de vie : 3 à 6 mois pour un bâton de binchotan ; plus de 10 ans pour les perles selon le guide du fabricant.',
        '- Entretien : le binchotan se fait bouillir avant la première utilisation, puis de temps en temps ; les perles, par ébullition tous les 3 à 6 mois.',
        '- Usages : le binchotan sert surtout en carafe ; les perles vont aussi dans la bouilloire, la cafetière, le lave-vaisselle et le lave-linge (voir [les 16 utilisations](' + P.usages + ')).',
        '- Fragilité : le binchotan peut casser s’il tombe ; les perles sont de petits objets à garder hors de portée des jeunes enfants.',
        '- Fin de vie : le binchotan se composte ou se recycle au jardin ; les perles en argile s’enfouissent au jardin.',
      ],
    },
    {
      titre: 'Le coût à l’année',
      blocs: [
        'Un bâton de binchotan coûte peu, mais il en faut 2 à 4 par an et par carafe. Les perles sont un achat unique : sur plusieurs années, elles reviennent moins cher, d’autant qu’un même pack équipe plusieurs appareils.',
        'Le tableau complet avec la carafe filtrante et l’osmoseur : [notre comparatif des solutions](' + P.comparatif + ').',
      ],
    },
    {
      titre: 'Et si on les associait ?',
      blocs: [
        'Rien ne l’empêche : un bâton de binchotan et 15 perles par litre dans la même carafe. Le binchotan travaille le goût, les perles aussi, et ce sont elles qui restent quand le bâton doit être remplacé. Pour la bouilloire et les machines, les perles seules suffisent.',
        LIMITE,
      ],
    },
    {
      titre: 'Notre conseil',
      blocs: [
        '- Vous cherchez la solution la moins chère pour essayer : un bâton de binchotan.',
        '- Vous voulez traiter aussi le calcaire de la bouilloire et ne plus rien racheter : les perles, par exemple le [Pack 55](' + P.pack55 + ') pour une carafe et une bouilloire.',
        '- Vous voulez équiper toute la maison : le [Pack 100](' + P.pack100 + ').',
      ],
    },
  ],
  faq: [
    { question: 'Combien de temps dure un bâton de charbon binchotan ?', reponse: 'Comptez 3 à 6 mois en carafe, selon l’usage. Il sature peu à peu et doit être remplacé ; en fin de vie, il peut être composté ou enfoui au jardin.' },
    { question: 'Le binchotan agit-il sur le calcaire ?', reponse: 'Non : il retient le chlore et certaines molécules responsables des mauvais goûts, mais n’empêche pas le tartre. Pour la bouilloire et la cafetière, on utilise plutôt les perles de céramique.' },
    { question: 'Peut-on mettre binchotan et perles dans la même carafe ?', reponse: 'Oui, les deux cohabitent sans problème. Gardez 15 perles par litre et un bâton par carafe, et renouvelez l’eau chaque jour.' },
  ],
  sources: [S.ansesChlore, S.guide],
});

const calcaire = article({
  slug: 'anti-calcaire-naturel-bouilloire',
  titre: 'Anti-calcaire naturel : bouilloire, cafetière et machines sans détartrant',
  titreCarte: 'Anti-calcaire naturel pour la bouilloire et les machines',
  libelleCourt: 'Anti-calcaire naturel',
  categorie: 'Guides',
  extrait: 'Calcaire dans la bouilloire, la cafetière ou le lave-linge : d’où il vient, ce qu’il change, et les solutions naturelles, du vinaigre blanc aux billes anti-calcaire.',
  chapo: 'Le calcaire n’est pas dangereux pour la santé, mais il entartre tout ce qui chauffe l’eau. Avant d’acheter un détartrant, voici d’où il vient, comment connaître la dureté de votre eau, et les solutions naturelles, appareil par appareil.',
  reponseCourte: 'Contre le calcaire, deux gestes se complètent : détartrer de temps en temps au vinaigre blanc ou à l’acide citrique, et limiter les dépôts au quotidien. Selon le fabricant, des billes de céramique EM laissées dans la bouilloire (25 perles) ou le lave-vaisselle (40) limitent la formation du tartre.',
  metaTitle: 'Anti-calcaire naturel : bouilloire, cafetière, machines',
  metaDescription: 'Calcaire dans la bouilloire, la cafetière ou les machines : dureté de l’eau, détartrage naturel et billes anti-calcaire, appareil par appareil.',
  sections: [
    {
      titre: 'D’où vient le calcaire ?',
      blocs: [
        'L’eau se charge en calcium et en magnésium en traversant les sols. Plus elle en contient, plus elle est « dure ». Quand on la chauffe, une partie de ces minéraux se dépose : c’est le tartre, sur la résistance de la bouilloire, dans la cafetière, sur les verres.',
        'Selon le ministère de la Santé, la dureté de l’eau est sans conséquence sur la santé : le calcium et le magnésium sont même des minéraux utiles. Le problème est domestique : appareils entartrés, traces blanches, consommation d’énergie.',
      ],
    },
    {
      titre: 'Connaître la dureté de votre eau',
      blocs: [
        'La dureté s’exprime par le titre hydrotimétrique (TH), en degrés français (°f). Elle figure dans les résultats d’analyse de l’eau de votre commune, consultables en ligne ou affichés en mairie. Des bandelettes vendues en magasin de bricolage ou d’aquariophilie permettent aussi de la mesurer.',
        'Les régions à eau dure (bassin parisien, nord, est) voient le tartre se former en quelques jours ; dans les régions granitiques, l’eau est souvent douce.',
      ],
    },
    {
      titre: 'Les solutions naturelles, appareil par appareil',
      blocs: [
        '### Bouilloire',
        'Pour détartrer : la remplir à moitié d’eau et de vinaigre blanc à parts égales, porter à ébullition, laisser agir une heure, rincer plusieurs fois. Pour limiter les dépôts : 25 [perles de céramique](' + P.pack55 + ') laissées en permanence au fond.',
        '### Cafetière et machine à thé',
        'Suivez le programme de détartrage du fabricant (souvent à l’acide citrique). Au quotidien, les perles peuvent être placées dans le réservoir d’eau (25 perles).',
        '### Lave-vaisselle',
        'Le sel régénérant et le liquide de rinçage restent les premiers remèdes aux traces blanches. En complément, 40 perles dans un filet, en permanence dans le panier à couverts.',
        '### Lave-linge',
        'Un cycle à vide avec du vinaigre blanc ou de l’acide citrique de temps en temps. En complément, 50 perles dans un filet de lavage, dans le tambour ; selon le fabricant, elles permettent de réduire les doses de lessive et d’adoucissant.',
        'Tous les dosages sont réunis dans [les 16 utilisations des perles](' + P.usages + ').',
      ],
    },
    {
      titre: 'Billes anti-calcaire : ce qu’elles font, et pas',
      blocs: [
        'Les billes de céramique EM ne sont pas un adoucisseur : elles ne retirent pas le calcium et le magnésium de l’eau, contrairement aux résines échangeuses d’ions des adoucisseurs. Selon le fabricant, elles modifient la façon dont le calcaire cristallise, pour qu’il se dépose moins sur les parois.',
        'Le plus simple est de juger chez vous, sur quelques semaines : bouilloire avec perles, détartrages plus ou moins espacés. Et si le tartre est déjà installé, détartrez d’abord, puis placez les perles.',
        'Ce que les perles font d’autre, et leurs limites : [avis, dangers et science](' + P.avis + ').',
      ],
    },
  ],
  faq: [
    { question: 'Le calcaire de l’eau est-il mauvais pour la santé ?', reponse: 'Non. Selon le ministère de la Santé, la dureté de l’eau est sans conséquence sur la santé : le calcium et le magnésium sont des minéraux utiles. Le calcaire pose surtout problème aux appareils.' },
    { question: 'Comment détartrer une bouilloire naturellement ?', reponse: 'Remplissez-la à moitié d’un mélange d’eau et de vinaigre blanc à parts égales, portez à ébullition, laissez agir une heure, puis rincez plusieurs fois à l’eau claire.' },
    { question: 'Les billes anti-calcaire remplacent-elles un adoucisseur ?', reponse: 'Non. Un adoucisseur retire une partie du calcium et du magnésium grâce à une résine ; les billes de céramique ne changent pas la composition de l’eau et visent, selon le fabricant, à limiter les dépôts.' },
  ],
  sources: [S.calcaire, S.servicePublic, S.guide],
});

const chlore = article({
  slug: 'gout-de-chlore-eau-du-robinet',
  titre: 'Goût de chlore dans l’eau du robinet : pourquoi, et comment l’enlever',
  titreCarte: 'Goût de chlore de l’eau du robinet : que faire ?',
  libelleCourt: 'Goût de chlore',
  categorie: 'Guides',
  extrait: 'Pourquoi l’eau du robinet sent le chlore, quand ce goût change, et 5 façons simples de l’atténuer, de la carafe au frais aux perles de céramique.',
  chapo: 'C’est la première raison pour laquelle on boude l’eau du robinet. Le goût de chlore n’est pourtant pas un signe de mauvaise qualité, au contraire. Voici d’où il vient et comment l’atténuer simplement.',
  reponseCourte: 'Le chlore est ajouté pour que l’eau reste saine tout au long du réseau, jusqu’à votre robinet ; son goût ne signifie pas que l’eau est impropre. Pour l’atténuer : carafe ouverte au réfrigérateur quelques heures, perles de céramique (15 par litre, 30 minutes), ou charbon binchotan.',
  metaTitle: 'Goût de chlore dans l’eau du robinet : pourquoi et que faire',
  metaDescription: 'Pourquoi l’eau du robinet a un goût de chlore, pourquoi il varie, et 5 façons simples de l’atténuer : carafe au frais, perles de céramique, binchotan.',
  sections: [
    {
      titre: 'Pourquoi y a-t-il du chlore dans l’eau ?',
      blocs: [
        'L’eau est désinfectée à l’usine de traitement, puis parcourt des kilomètres de canalisations avant d’arriver chez vous. Pour éviter que des microbes ne s’y développent en chemin, les exploitants maintiennent une faible quantité de chlore jusqu’au robinet. Elle peut être renforcée lors des périodes de vigilance sanitaire.',
        'Ce chlore résiduel est un gage de sécurité. Son goût ne signifie pas que l’eau est impropre : l’eau du robinet est contrôlée en permanence par les Agences régionales de santé.',
      ],
    },
    {
      titre: 'Pourquoi le goût varie',
      blocs: [
        '- Selon l’endroit : plus on est proche de l’usine de traitement, plus le goût est marqué.',
        '- Selon la saison : il peut changer avec la température ou les ajustements du traitement.',
        '- Selon la température : l’eau froide laisse moins percevoir le chlore ; c’est pourquoi l’eau fraîche « passe mieux ».',
        'Un goût inhabituel et persistant (métallique, terreux, de moisi) ou une eau trouble ne relèvent pas du chlore : signalez-les à votre mairie ou au service des eaux.',
      ],
    },
    {
      titre: '5 façons d’atténuer le goût de chlore',
      blocs: [
        '1. La carafe ouverte au réfrigérateur : le chlore est volatil. Une carafe ouverte, laissée quelques heures au frais, en perd une bonne partie. Gratuit ; renouvelez l’eau chaque jour.',
        '2. Les perles de céramique EM : 15 perles par litre dans la carafe, une trentaine de minutes d’attente. Elles restent en permanence et se régénèrent par ébullition tous les 3 à 6 mois. Voir [le Pack 55](' + P.pack55 + ').',
        '3. Le charbon binchotan : un bâton par carafe, à remplacer tous les 3 à 6 mois. Voir [perles ou binchotan](' + P.binchotan + ').',
        '4. La carafe filtrante : efficace, mais avec une cartouche à changer chaque mois. Voir [ses alternatives sans cartouche](' + P.carafe + ').',
        '5. Un peu de fraîcheur et de citron : une rondelle de citron ou quelques feuilles de menthe masquent le goût, le temps de s’habituer.',
        'Pour boire et cuisiner, utilisez toujours l’eau froide du robinet, jamais l’eau chaude, qui a séjourné dans le ballon et les canalisations d’eau chaude.',
      ],
    },
    {
      titre: 'Faites le test à l’aveugle',
      blocs: [
        'Remplissez deux carafes d’eau du robinet à la même heure, mettez 15 perles par litre dans l’une seulement, laissez-les côte à côte 30 minutes, puis faites goûter à l’aveugle. Le protocole complet, avec un troisième verre d’eau en bouteille : [purifier l’eau du robinet avec les perles](' + P.purifier + ').',
        LIMITE,
      ],
    },
  ],
  faq: [
    { question: 'Le goût de chlore signifie-t-il que l’eau est de mauvaise qualité ?', reponse: 'Non. Le chlore est maintenu en faible quantité pour que l’eau reste saine jusqu’au robinet. L’eau du robinet est contrôlée en permanence par les Agences régionales de santé, avec des résultats publics.' },
    { question: 'Faire bouillir l’eau enlève-t-il le chlore ?', reponse: 'L’ébullition fait partir une partie du chlore, qui est volatil. Pour l’eau de boisson, une carafe ouverte au réfrigérateur ou des perles de céramique sont plus pratiques au quotidien.' },
    { question: 'Pourquoi l’eau a-t-elle parfois plus le goût de chlore ?', reponse: 'Le dosage peut être renforcé ponctuellement, par exemple lors de travaux sur le réseau ou de périodes de vigilance. Le goût dépend aussi de votre distance à l’usine de traitement.' },
  ],
  sources: [S.ansesChlore, S.santeControle, S.servicePublic, S.guide],
});

const entretien = article({
  slug: 'entretenir-perles-de-ceramique',
  titre: 'Entretenir ses perles de céramique : nettoyage, ébullition, durée de vie et 7 erreurs à éviter',
  titreCarte: 'Entretenir ses perles de céramique',
  libelleCourt: 'Entretenir ses perles',
  categorie: 'Guides',
  extrait: 'Quand et comment faire bouillir les perles de céramique, que faire d’un dépôt blanc, combien de temps elles durent, et les 7 erreurs qui les rendent moins efficaces.',
  chapo: 'Les perles de céramique demandent peu d’entretien : une ébullition tous les quelques mois et quelques habitudes. Voici le calendrier, la méthode d’ébullition, que faire d’un dépôt blanc, et les erreurs qui les rendent moins efficaces.',
  reponseCourte: 'Tous les 3 à 6 mois, faites bouillir les perles 10 à 15 minutes dans de l’eau claire, sans savon ni vinaigre, puis laissez-les sécher. Plus souvent si votre eau est très calcaire. Ainsi entretenues, elles s’utilisent plus de 10 ans selon le guide du fabricant.',
  metaTitle: 'Entretenir ses perles de céramique : méthode et erreurs',
  metaDescription: 'Faire bouillir ses perles de céramique : quand, combien de temps, dépôt blanc, durée de vie, et les 7 erreurs qui les rendent moins efficaces.',
  sections: [
    {
      titre: 'Le calendrier d’entretien',
      blocs: [
        '- Avant la première utilisation : ébullition 10 minutes dans de l’eau claire.',
        '- Chaque jour : renouvelez l’eau de la carafe ou de la gourde ; les perles restent dedans.',
        '- Chaque semaine : lavez la carafe, en retirant les perles.',
        '- Tous les 3 à 6 mois : régénérez les perles par ébullition. Plus souvent si l’eau est très calcaire ou si les perles servent dans la bouilloire.',
      ],
    },
    {
      titre: 'La méthode d’ébullition, pas à pas',
      blocs: [
        '1. Rincez les perles à l’eau claire.',
        '2. Placez-les dans une casserole d’eau claire, sans savon, sans vinaigre, sans produit.',
        '3. Portez à ébullition et laissez bouillir 10 à 15 minutes.',
        '4. Égouttez, laissez sécher à l’air libre, puis remettez-les en place.',
        'Pour les perles du lave-vaisselle ou du lave-linge, même méthode, dans une casserole réservée à cet usage : ne mélangez pas ces perles avec celles de l’eau de boisson.',
      ],
    },
    {
      titre: 'Un dépôt blanc sur les perles ?',
      blocs: [
        'C’est du calcaire, signe que votre eau est dure. Il ne présente pas de danger. Une ébullition plus longue, en frottant légèrement les perles entre les mains, suffit en général. Si le dépôt revient vite, raccourcissez l’intervalle entre deux régénérations.',
        'Une perle fendue ou qui s’effrite se retire. Pour tout savoir sur la sécurité des perles : [avis, dangers et science](' + P.avis + ').',
      ],
    },
    {
      titre: 'Combien de temps durent les perles ?',
      blocs: [
        'Selon le guide du fabricant, plus de 10 ans avec une régénération régulière. Elles ne s’usent pas comme une cartouche : il n’y a rien à racheter entre-temps.',
        'En fin de vie, ce sont des billes d’argile cuite : elles peuvent être enfouies au jardin. Pour remplacer ou compléter votre équipement : [nos packs de perles](' + P.collection + ').',
      ],
    },
    {
      titre: '7 erreurs qui rendent les perles moins efficaces',
      blocs: [
        '1. Ne pas les faire bouillir avant la première utilisation.',
        '2. Se tromper de dosage : 15 perles par litre pour l’eau de boisson ; voir [les dosages par usage](' + P.ccm + ').',
        '3. Ne pas attendre : comptez une trentaine de minutes après chaque remplissage.',
        '4. Les laver au savon ou au vinaigre : de l’eau claire bouillante suffit.',
        '5. Oublier la régénération pendant des mois.',
        '6. Mélanger les perles de la carafe avec celles du lave-linge ou des toilettes.',
        '7. Les mettre dans autre chose que de l’eau : jus, lait ou boissons sucrées ne leur conviennent pas.',
        'Enfin, pour la sécurité, gardez-les hors de portée des jeunes enfants et des animaux.',
      ],
    },
  ],
  faq: [
    { question: 'Peut-on laver les perles de céramique au vinaigre ?', reponse: 'Non : de l’eau claire bouillante suffit. Le vinaigre et le savon ne sont pas recommandés par le fabricant. Pour un dépôt de calcaire, prolongez simplement l’ébullition.' },
    { question: 'Faut-il sécher les perles après l’ébullition ?', reponse: 'C’est préférable : égouttez-les et laissez-les sécher à l’air libre avant de les remettre dans la carafe, la gourde ou la bouilloire.' },
    { question: 'Les perles de la bouilloire doivent-elles être régénérées plus souvent ?', reponse: 'Elles bouillent déjà à chaque usage, mais accumulent davantage de calcaire : rincez-les et régénérez-les dès qu’un dépôt blanc apparaît, et au moins tous les 3 à 6 mois.' },
  ],
  sources: [S.guide, S.calcaire],
});

export const brouillons = [gourde, carafe, binchotan, calcaire, chlore, entretien].map(brouillonArticle);
