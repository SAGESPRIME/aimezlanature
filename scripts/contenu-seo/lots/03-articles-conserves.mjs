/**
 * Lot 3 (25/11/2026) — les articles conservés, remis à niveau (brouillons).
 *   - leau-est-une-source-de-vie : plus d'allégations (toxines, digestion) ;
 *     article d'hydratation sourcé EFSA, lien vers les perles sans promesse.
 *   - solution-ecologique-et-economique : doublons de consignes supprimés,
 *     liens internes, angle « remplacer les bouteilles ».
 *   - authenticite : tests présentés comme des résultats certains (fleurs,
 *     fruits) ramenés à ce qui se vérifie ; section « où acheter ».
 */
import { brouillonArticle, tempsDeLecture } from '../redaction.mjs';
import { S, P, LIMITE, ENTRETIEN } from '../sources.mjs';

const MAJ = '2026-11-25';
const avecLecture = (a) => ({ ...a, tempsLecture: tempsDeLecture(a) });

const hydratation = avecLecture({
  slug: 'leau-est-une-source-de-vie',
  titre: 'Combien d’eau boire par jour ? Les repères pour bien s’hydrater',
  titreCarte: 'Combien d’eau boire par jour ?',
  libelleCourt: 'Combien d’eau boire',
  categorie: 'Général',
  datePublication: '2025-03-22',
  dateMiseAJour: MAJ,
  extrait: 'Combien d’eau boire par jour selon l’EFSA, les signes qui doivent alerter, les erreurs courantes, et pourquoi le goût de l’eau compte.',
  chapo: 'Les besoins en eau varient avec la chaleur, l’effort et l’âge, mais l’EFSA donne des repères simples. Et on boit moins quand l’eau a un goût de chlore, ce qui explique bien des verres laissés à moitié pleins.',
  reponseCourte: 'L’Autorité européenne de sécurité des aliments (EFSA) considère comme adéquat un apport total en eau de 2 litres par jour pour une femme et de 2,5 litres pour un homme, eau des aliments comprise. Par forte chaleur ou en cas d’effort, les besoins augmentent.',
  metaTitle: 'Combien d’eau boire par jour ? Les repères de l’EFSA',
  metaDescription: 'Combien d’eau boire par jour selon l’EFSA, signes de manque d’eau, erreurs courantes et astuces pour boire plus, notamment l’eau du robinet.',
  sections: [
    {
      titre: 'Les repères officiels',
      blocs: [
        'L’EFSA considère comme adéquat un apport total en eau de 2 litres par jour pour une femme et de 2,5 litres pour un homme. Ce total comprend l’eau des aliments, qui en apportent environ un cinquième : fruits, légumes, soupes. Il reste donc à boire de l’ordre de 1,6 à 2 litres.',
        'Ces repères valent pour une température et une activité modérées. Par temps chaud, en cas d’effort physique ou de fièvre, les besoins augmentent. Les femmes enceintes ou qui allaitent ont aussi des besoins plus élevés ; en cas de problème de santé, demandez conseil à votre médecin.',
      ],
    },
    {
      titre: 'À quoi sert l’eau dans le corps',
      blocs: [
        'L’eau représente environ 60 % du poids d’un adulte. Elle intervient partout :',
        '- elle transporte les nutriments vers les cellules ;',
        '- elle permet aux reins d’évacuer les déchets dans l’urine ;',
        '- elle régule la température du corps par la transpiration ;',
        '- elle entre dans la composition du sang, de la salive et des fluides qui protègent les organes.',
        'Le corps ne la stocke pas : il faut la renouveler chaque jour.',
      ],
    },
    {
      titre: 'Les signes d’un manque d’eau',
      blocs: [
        'Une urine foncée, la bouche sèche, la fatigue, des maux de tête ou des difficultés de concentration peuvent signaler un manque d’eau. Chez les personnes âgées, la sensation de soif diminue : il est utile de proposer à boire régulièrement, sans attendre la demande.',
        'Ces signes ont d’autres causes possibles : s’ils persistent malgré une hydratation suffisante, parlez-en à un médecin.',
      ],
    },
    {
      titre: 'Les erreurs courantes',
      blocs: [
        '- Attendre d’avoir soif : mieux vaut boire régulièrement, par petites quantités, tout au long de la journée.',
        '- Boire beaucoup d’un coup : le corps n’en tire pas davantage ; répartir est plus efficace.',
        '- Compter sur les boissons sucrées : l’eau reste la seule boisson indispensable, sans calories.',
        '- Oublier les journées chaudes : par forte chaleur, buvez avant d’avoir soif et augmentez les quantités.',
      ],
    },
    {
      titre: 'Le goût de l’eau compte autant que la quantité',
      blocs: [
        'On boit plus volontiers une eau qu’on trouve bonne. Or le premier reproche fait à l’eau du robinet, c’est son goût de chlore, ajouté pour qu’elle reste saine jusqu’au robinet. Nous expliquons d’où il vient et comment l’atténuer dans [goût de chlore de l’eau du robinet : pourquoi et que faire](' + P.chlore + ').',
        'Les [perles de céramique EM](' + P.collection + ') servent à cela : déposées dans une carafe (15 perles par litre), elles atténuent le goût de chlore en une trentaine de minutes, sans cartouche. ' + LIMITE,
        'Quelques astuces pour boire plus sans y penser :',
        '- une carafe en verre sur la table ou le bureau, remplie chaque matin ;',
        '- une gourde dans le sac, que l’on remplit au robinet ([notre gourde en verre](' + P.gourde + ')) ;',
        '- un verre d’eau à chaque repas et au réveil.',
      ],
    },
  ],
  faq: [
    { question: 'Combien d’eau faut-il boire par jour ?', reponse: 'L’EFSA retient un apport total de 2 litres par jour pour une femme et de 2,5 litres pour un homme, aliments compris, soit environ 1,6 à 2 litres à boire. Augmentez par forte chaleur ou en cas d’effort physique.' },
    { question: 'Le thé et le café comptent-ils dans l’hydratation ?', reponse: 'Oui, ils apportent de l’eau. Mais l’eau reste la boisson de référence, sans sucre ni caféine : privilégiez-la pour l’essentiel de vos apports.' },
    { question: 'Peut-on trop boire d’eau ?', reponse: 'Chez une personne en bonne santé, les reins éliminent l’excès d’eau. Les intoxications par l’eau existent mais sont rares, liées à de très grandes quantités bues en peu de temps. Buvez régulièrement, selon votre soif, sans vous forcer.' },
  ],
  sources: [S.efsa, S.santeControle, S.ansesChlore],
});

const ecologique = avecLecture({
  slug: 'perles-de-ceramique-une-solution-ecologique-et-economique',
  titre: 'Remplacer l’eau en bouteille par l’eau du robinet : l’alternative des perles de céramique',
  titreCarte: 'Remplacer l’eau en bouteille par l’eau du robinet',
  libelleCourt: 'Remplacer l’eau en bouteille',
  categorie: 'Comparatifs',
  datePublication: '2025-04-18',
  dateMiseAJour: MAJ,
  extrait: 'Plastique, budget, packs à porter : pourquoi et comment remplacer l’eau en bouteille par l’eau du robinet, chiffres sourcés et calcul à faire chez soi.',
  chapo: 'Passer de l’eau en bouteille à l’eau du robinet réduit le plastique et les packs à porter, et la dépense devient presque nulle. Le principal frein reste le goût de chlore. Voici comment le lever, et comment calculer ce que vous économisez.',
  reponseCourte: 'Oui, on peut remplacer l’eau en bouteille par l’eau du robinet : elle est contrôlée en permanence et coûte environ 120 fois moins cher selon le guide du fabricant des perles EM. Les perles de céramique atténuent le goût de chlore, principal frein, sans cartouche ni consommable.',
  metaTitle: 'Remplacer l’eau en bouteille par l’eau du robinet',
  metaDescription: 'Pourquoi et comment remplacer l’eau en bouteille par l’eau du robinet : plastique, coût, goût de chlore. Chiffres sourcés et calcul à faire chez soi.',
  sections: [
    {
      titre: 'Le paradoxe de l’eau en bouteille',
      blocs: [
        'Boire de l’eau en bouteille, c’est acheter, transporter puis jeter des centaines de bouteilles chaque année : à 1,5 litre par jour, une seule personne en consomme environ 365 bouteilles de 1,5 litre par an.',
        'Pendant ce temps, l’eau du robinet est contrôlée en permanence par l’exploitant du réseau et par les Agences régionales de santé, avec des résultats publics commune par commune. Et selon le guide du fabricant des perles EM, elle coûte environ 120 fois moins cher que l’eau en bouteille.',
        'Si l’on continue à acheter des packs, c’est surtout à cause du goût de chlore, et c’est ce goût que les perles atténuent.',
      ],
    },
    {
      titre: 'Le plastique, de la bouteille à l’eau',
      blocs: [
        'Les bouteilles qui échappent au recyclage sont incinérées, enfouies ou dispersées, et le plastique s’y fragmente en particules de plus en plus fines, que la faune marine confond avec de la nourriture.',
        'Le plastique se retrouve aussi dans l’eau elle-même : une étude de l’université Columbia publiée en 2024 dans la revue PNAS a compté en moyenne environ 240 000 particules de plastique par litre dans trois marques d’eau en bouteille vendues aux États-Unis, dont 90 % de nanoplastiques, en grande partie issues de la bouteille et des filtres d’embouteillage.',
        'Leurs effets sur la santé ne sont pas encore établis. Limiter les contenants plastiques reste un geste simple : l’Anses recommande de conserver l’eau du robinet dans du verre ou de l’inox.',
      ],
    },
    {
      titre: 'Faire le calcul avec vos propres chiffres',
      blocs: [
        'Le montant de l’économie dépend de ce que vous achetez aujourd’hui. Trois chiffres suffisent :',
        '1. Votre dépense actuelle : le prix d’un pack, multiplié par le nombre de packs achetés par mois, puis par 12.',
        '2. Le coût de l’eau du robinet : il figure sur votre facture, en euros par mètre cube (1 000 litres). Pour l’eau de boisson d’un foyer, il représente quelques euros par an.',
        '3. Le coût des perles : un achat unique, sans consommable. Le guide du fabricant annonce plus de 10 ans d’utilisation.',
        'Exemple : un foyer de 4 personnes qui boit 1,5 litre d’eau en bouteille par personne et par jour achète environ 2 190 litres par an, soit plus de 2 tonnes à porter. L’essentiel de cette dépense devient une économie dès la première année.',
      ],
    },
    {
      titre: 'Ce que vous évitez chaque année',
      blocs: [
        '- Bouteilles : environ 365 bouteilles de 1,5 litre par personne, pour qui boit 1,5 litre par jour.',
        '- Transport : plus de 500 kg d’eau par personne à ne plus porter du magasin à la maison.',
        '- Cartouches : si vous utilisiez une carafe filtrante, une douzaine de cartouches par an. Voir [les alternatives à la carafe filtrante](' + P.carafe + ').',
      ],
    },
    {
      titre: 'Passer à l’eau du robinet en 4 étapes',
      blocs: [
        '1. Choisissez votre format : le [Pack 55](' + P.pack55 + ') pour une carafe de 2 litres et une bouilloire, le [Pack 100](' + P.pack100 + ') pour toute la maison.',
        '2. Faites bouillir les perles 10 minutes, puis déposez 15 perles par litre dans une carafe en verre (30 pour 2 litres).',
        '3. Remplissez au robinet et attendez 30 minutes. Les perles restent ensuite en permanence ; renouvelez l’eau chaque jour.',
        '4. Tous les 3 à 6 mois, ' + ENTRETIEN + '.',
        'En déplacement, emportez la même eau dans une gourde : voir [comment choisir une gourde filtrante](' + P.gourdeFiltrante + '). Le détail des dosages est dans [comment ça marche](' + P.ccm + ').',
      ],
    },
    {
      titre: 'L’eau du robinet est-elle sûre ?',
      blocs: [
        'En France, l’eau du robinet fait l’objet d’une double surveillance : celle de l’exploitant du réseau et le contrôle sanitaire des ARS. Vous pouvez consulter la qualité de l’eau de votre commune en ligne ou en mairie.',
        'Son goût de chlore ne signifie pas qu’elle est impropre : ce désinfectant la protège jusqu’à votre robinet. ' + LIMITE + ' Ce que les perles font et ne font pas : [avis, dangers et science](' + P.avis + ').',
      ],
    },
  ],
  faq: [
    { question: 'Combien économise-t-on en remplaçant l’eau en bouteille ?', reponse: 'Tout dépend de votre consommation. Selon le guide du fabricant des perles EM, l’eau du robinet coûte environ 120 fois moins cher que l’eau en bouteille : pour un foyer qui achète régulièrement des packs, l’essentiel de cette dépense devient une économie.' },
    { question: 'Que deviennent les perles en fin de vie ?', reponse: 'Ce sont des billes d’argile cuite : en fin de vie, elles peuvent être enfouies au jardin, sans laisser de déchet plastique.' },
    { question: 'Faut-il une carafe en verre ?', reponse: 'C’est préférable : le verre ne retient pas les odeurs, se lave facilement, et l’Anses recommande le verre ou l’inox pour conserver l’eau du robinet.' },
  ],
  sources: [S.guide, S.columbia, S.ansesBouteille, S.santeControle, S.servicePublic],
});

const authentiques = avecLecture({
  slug: 'authenticite-des-perles-de-ceramique-em-et-leur-efficacite',
  titre: 'Perles de céramique EM authentiques : comment les reconnaître et où les acheter',
  titreCarte: 'Reconnaître des perles EM authentiques',
  libelleCourt: 'Perles EM authentiques',
  categorie: 'Comparatifs',
  datePublication: '2025-02-10',
  dateMiseAJour: MAJ,
  extrait: 'Origine du procédé EM, fabrication au Japon, revendeurs agréés, pièges des imitations et tests à faire chez soi : comment choisir de vraies perles EM.',
  chapo: 'Toutes les perles vendues sous le nom « EM » ne se valent pas. Le plus sûr est de remonter à l’origine du procédé et à l’agrément du vendeur ; deux tests faits chez soi complètent la vérification.',
  reponseCourte: 'Des perles de céramique EM authentiques sont fabriquées au Japon selon le procédé du Pr Teruo Higa et vendues par des revendeurs agréés. Le plus sûr est de vérifier l’agrément du vendeur ; un test du goût à l’aveugle (30 minutes dans une carafe d’eau du robinet) permet ensuite de constater l’effet sur le chlore.',
  metaTitle: 'Perles de céramique EM authentiques : les reconnaître',
  metaDescription: 'Procédé EM du Pr Teruo Higa, fabrication au Japon, revendeurs agréés, imitations et tests chez soi : comment reconnaître et où acheter de vraies perles EM.',
  sections: [
    {
      titre: 'L’origine des micro-organismes EM',
      blocs: [
        'Les micro-organismes EM (Effective Micro-organisms) ont été mis au point en 1982 par le Professeur Teruo Higa, de l’Université des Ryukyus à Okinawa (Japon). D’abord destinés à l’agriculture, ils sont aujourd’hui promus par l’EM Research Organization (EMRO), présente dans de nombreux pays.',
        'Selon l’EMRO, les EM associent plusieurs groupes de micro-organismes que l’on trouve dans la nature et dans l’alimentation : bactéries lactiques, levures et bactéries photosynthétiques notamment. Les perles de céramique en sont une application : de l’argile fermentée avec ces micro-organismes, puis cuite.',
      ],
    },
    {
      titre: 'Comment sont fabriquées les perles d’origine',
      blocs: [
        'Selon le fabricant, les perles EM d’origine sont fabriquées au Japon en quatre étapes : une argile sélectionnée est mélangée à un concentré de micro-organismes EM, fermente plusieurs semaines, est façonnée en billes d’environ 8 mm, puis cuite entre 800 et 1 000 °C.',
        'C’est ce procédé que le fabricant met en avant pour annoncer une durée d’utilisation de plus de 10 ans, avec une régénération régulière par ébullition. Le détail, et ce que les perles font à l’eau : [purifier l’eau du robinet avec les perles EM](' + P.purifier + ').',
      ],
    },
    {
      titre: 'Les pièges des imitations',
      blocs: [
        'Le nom « perles de céramique » n’est pas protégé : on trouve des billes d’argile ou de céramique sans lien avec le procédé EM, parfois vendues sous ce nom. Quelques signaux doivent alerter :',
        '- aucune mention du fabricant ni de l’origine ;',
        '- un prix très bas pour une grande quantité ;',
        '- des promesses sur la santé, ou des théories sur l’eau sans fondement scientifique : un vendeur sérieux ne les fait pas ;',
        '- des perles colorées, vernies ou de tailles très irrégulières.',
        'L’EMRO recommande d’acheter les produits EM d’origine auprès de distributeurs agréés, et a mis en place une certification pour les identifier.',
      ],
    },
    {
      titre: 'Où acheter des perles de céramique EM ?',
      blocs: [
        'Magasins bio, sites spécialisés, places de marché : l’offre est large, la traçabilité inégale. Avant d’acheter, vérifiez que le vendeur indique l’origine des perles et son agrément EM.',
        'Aimez la Nature est revendeur agréé EM : nos perles sont importées du Japon, et vendues en [Pack 55](' + P.pack55 + '), [Pack 100](' + P.pack100 + ') et avec notre [gourde en verre](' + P.packGourde + '). Vous tenez un magasin ? Voyez notre [offre revendeurs](/revendeurs/).',
      ],
    },
    {
      titre: 'Les tests à faire chez soi',
      blocs: [
        '### Le test du goût à l’aveugle',
        'Remplissez deux carafes d’eau du robinet à la même heure, mettez 15 perles par litre dans l’une seulement, attendez 30 minutes, puis faites goûter les deux à l’aveugle. C’est sur le goût de chlore que l’effet se remarque le plus nettement.',
        '### Le test du vase',
        'Le fabricant propose aussi de comparer deux bouquets identiques, l’un dans un vase avec 10 à 15 perles, l’autre sans. C’est un test amusant, dont le résultat dépend de nombreux facteurs (fleurs, chaleur, eau) : à prendre comme une observation, pas comme une preuve.',
        'Ce que l’on peut vérifier, et ce qui reste à prouver : [perles de céramique, avis, dangers et science](' + P.avis + ').',
      ],
    },
  ],
  faq: [
    { question: 'Comment savoir si mes perles EM sont authentiques ?', reponse: 'Vérifiez que le vendeur indique l’origine japonaise des perles et qu’il est revendeur agréé EM. Aimez la Nature est revendeur agréé, avec des perles importées du Japon.' },
    { question: 'Les perles de céramique EM sont-elles vraiment efficaces ?', reponse: 'Sur le goût de chlore, l’effet se constate facilement : faites le test du goût à l’aveugle avec deux carafes. Les perles améliorent une eau déjà potable ; elles ne la désinfectent pas et ne retirent ni pesticides ni métaux lourds.' },
    { question: 'Peut-on utiliser les perles EM avec n’importe quelle eau ?', reponse: 'Elles s’utilisent avec une eau potable, comme l’eau du robinet contrôlée en France. Elles ne rendent pas consommable une eau qui ne l’est pas, comme l’eau d’un puits non analysée.' },
  ],
  sources: [S.higa, S.emro, S.emroCertif, S.guide],
});

export const brouillons = [hydratation, ecologique, authentiques].map(brouillonArticle);
