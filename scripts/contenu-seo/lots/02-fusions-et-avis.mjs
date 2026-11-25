/**
 * Lot 2 (25/11/2026) — consolidation du blog + article « avis et dangers ».
 *
 * Fusions (décision du marchand) : les 3 articles qui doublaient d'autres
 * pages sont retirés, leur contenu utile repris, leurs adresses redirigées
 * (src/data/redirections.json) :
 *   alternative-bio-…            → perles-de-ceramique-purifier-votre-eau-du-robinet
 *   …-source-de-vie-au-quotidien → les-bienfaits-des-perles-de-ceramique
 *   les-differents-usages-…      → /utilisations/ (page pilier, mêmes dosages)
 * Nouveau : perles-de-ceramique-avis-dangers (« danger » 480/mois, « avis
 * scientifique » 390, « eau avis » 260 — docs/seo/strategie-seo.md), la page
 * n°1 de la stratégie SEO, supprimée en juillet et jamais remplacée.
 * Tout part en BROUILLON : le marchand relit et publie.
 */
import { brouillonArticle, tempsDeLecture } from '../redaction.mjs';
import { S, P, LIMITE, ENTRETIEN } from '../sources.mjs';

const MAJ = '2026-11-25';
const avecLecture = (a) => ({ ...a, tempsLecture: tempsDeLecture(a) });

// ── 1. Purifier l'eau du robinet (absorbe « alternative naturelle ») ─────────
const purifier = avecLecture({
  slug: 'perles-de-ceramique-purifier-votre-eau-du-robinet',
  titre: 'Purifier l’eau du robinet avec les perles de céramique EM : ce qu’elles font, et ne font pas',
  titreCarte: 'Purifier l’eau du robinet avec les perles EM',
  libelleCourt: 'Purifier l’eau du robinet',
  categorie: 'Guides',
  datePublication: '2025-03-08',
  dateMiseAJour: MAJ,
  extrait: 'Chlore, calcaire, résidus : ce que les perles de céramique EM changent vraiment à l’eau du robinet, comment elles sont fabriquées, et leurs limites.',
  chapo: 'On achète souvent des perles de céramique EM pour le goût de chlore, parfois pour le calcaire, plus rarement par inquiétude sur les résidus. Elles règlent les deux premiers points et pas le troisième. Voici comment elles sont faites et ce qu’elles changent à l’eau du robinet.',
  reponseCourte: 'Les perles de céramique EM atténuent le goût et l’odeur de chlore de l’eau du robinet et limitent les dépôts de calcaire, sans produit chimique ni cartouche. Elles améliorent une eau déjà potable : elles ne retirent ni pesticides, ni nitrates, ni métaux lourds, ni bactéries.',
  metaTitle: 'Purifier l’eau du robinet avec des perles de céramique EM',
  metaDescription: 'Ce que les perles de céramique EM changent à l’eau du robinet (chlore, calcaire), comment elles sont fabriquées, leurs limites et comment les utiliser.',
  sections: [
    {
      titre: 'Purifier une eau déjà potable : de quoi parle-t-on ?',
      blocs: [
        'En France, l’eau du robinet est potable et contrôlée en permanence par les Agences régionales de santé, avec des résultats publics commune par commune. Quand on cherche à la « purifier », c’est donc presque toujours une question de confort.',
        'Les raisons qui poussent à traiter son eau sont presque toujours les mêmes :',
        '- Le goût de chlore : c’est la plainte numéro un. Le chlore protège l’eau tout au long du réseau ; une fois au robinet, son goût reste. Nous lui consacrons un article : [pourquoi l’eau a un goût de chlore et comment l’enlever](' + P.chlore + ').',
        '- Le calcaire : sans effet sur la santé selon le ministère de la Santé, il entartre la bouilloire, la cafetière et les machines.',
        '- Les résidus (pesticides, nitrates, médicaments) : l’eau distribuée doit respecter des limites réglementaires. Si c’est votre préoccupation, il faut un filtre certifié pour ces substances, pas des perles.',
        '- Le plastique : beaucoup achètent de l’eau en bouteille à cause du goût. Une étude de l’université Columbia (PNAS, 2024) a compté en moyenne environ 240 000 particules de plastique par litre dans des eaux en bouteille vendues aux États-Unis.',
        'Les perles de céramique EM répondent aux deux premières attentes, le goût et le calcaire, sans produit chimique et sans consommable.',
      ],
    },
    {
      titre: 'Comment les perles sont fabriquées',
      blocs: [
        'Les perles de céramique EM sont faites d’argile et de micro-organismes EM (Effective Micro-organisms), mis au point en 1982 par le Professeur Teruo Higa, de l’Université des Ryukyus à Okinawa. D’abord destinée à l’agriculture, cette technologie est aujourd’hui utilisée dans de nombreux pays, notamment pour l’eau et les déchets.',
        'Selon le fabricant, la fabrication suit quatre étapes :',
        '1. Une argile sélectionnée pour sa pureté est mélangée à un concentré de plus de 80 micro-organismes (bactéries lactiques, levures, actinomycètes, bactéries photosynthétiques, champignons).',
        '2. Le mélange fermente plusieurs semaines.',
        '3. L’argile est façonnée en petites billes d’environ 8 mm.',
        '4. Les billes sont cuites entre 800 et 1 000 °C.',
        'Les perles ne contiennent que de l’argile cuite, sans la résine synthétique des cartouches de carafe ni la membrane d’un osmoseur. Nous parlons d’alternative « naturelle » et non « bio » : ce mot est réservé en France aux produits certifiés agriculture biologique.',
        'Pour reconnaître des perles fabriquées selon le procédé d’origine, voyez notre guide [perles EM authentiques : comment les reconnaître](' + P.authentiques + ').',
      ],
    },
    {
      titre: 'Ce que les perles font à l’eau',
      blocs: [
        '### Le goût de chlore',
        'C’est l’effet le plus net : après une trentaine de minutes de contact, l’eau perd l’essentiel de son goût et de son odeur de chlore. Le fabricant l’explique par l’action des micro-organismes EM fixés dans la céramique.',
        '### Le calcaire',
        'Selon le fabricant, les perles modifient la façon dont le calcaire cristallise : il se dépose moins sur les parois et les résistances. Le calcium et le magnésium, eux, restent dans l’eau : les perles ne « déminéralisent » pas.',
        '### Ce que décrit le fabricant',
        'La documentation du fabricant parle aussi d’action « probiotique » (les micro-organismes EM occupent le milieu) et « antioxydante » (abaissement du potentiel d’oxydo-réduction de l’eau). Ce sont ses termes et ses mesures ; nous ne connaissons pas d’étude indépendante qui les confirme pour l’eau de boisson.',
        LIMITE,
      ],
    },
    {
      titre: 'Le vérifier chez vous : le test des 3 verres',
      blocs: [
        'L’essai prend 10 minutes. Il faut trois verres identiques et quelqu’un pour les servir.',
        '1. Remplissez deux carafes d’eau du robinet, à la même heure. Mettez 15 perles par litre dans l’une, rien dans l’autre. Laissez-les côte à côte 30 minutes.',
        '2. Servez trois verres : carafe avec perles, carafe sans perles, et une eau en bouteille.',
        '3. Faites goûter à l’aveugle : la deuxième personne mélange les verres, vous goûtez et classez.',
        'Comparer deux carafes ouvertes, dont une seule contient des perles, est important : une partie du chlore s’évapore aussi d’une carafe laissée à l’air. Si vous ne sentez aucune différence, dites-le-nous : notre [garantie](' + P.faq + ') s’applique.',
      ],
    },
    {
      titre: 'Les dosages au quotidien',
      blocs: [
        '- Carafe : 15 perles par litre (30 pour 2 litres), eau prête en 30 minutes, perles laissées en permanence.',
        '- Gourde de 500 ml : 8 à 10 perles.',
        '- Bouilloire ou cafetière : 25 perles, en permanence.',
        '- Lave-vaisselle : 40 perles dans un sachet, dans le panier à couverts ; lave-linge : 50 perles dans un filet, dans le tambour.',
        'Pour l’entretien, ' + ENTRETIEN + '. Tous les usages et leurs dosages sont réunis dans notre guide [des 16 utilisations des perles](' + P.usages + '), et la mise en route pas à pas dans [comment ça marche](' + P.ccm + ').',
      ],
    },
    {
      titre: 'Perles, carafe filtrante, charbon ou osmoseur ?',
      blocs: [
        'Chaque solution répond à un problème différent :',
        '- Carafe filtrante : retient davantage de substances selon le modèle, mais demande une cartouche à changer chaque mois ; mal entretenue, la cartouche peut devenir un nid à bactéries. Voir [les alternatives à la carafe filtrante](' + P.carafe + ').',
        '- Charbon binchotan : naturel et efficace sur le chlore, mais à remplacer tous les 3 à 6 mois et sans effet sur le tartre. Voir [perles ou binchotan](' + P.binchotan + ').',
        '- Osmoseur : le plus complet (il retient aussi pesticides et métaux), mais coûteux, installé sous l’évier, il rejette une partie de l’eau et retire les minéraux.',
        '- Perles EM : un achat unique, sans consommable, pour le goût et le calcaire. Le guide du fabricant annonce plus de 10 ans d’utilisation.',
        'Le tableau complet, prix et coût par an compris, est dans notre [comparatif des solutions pour purifier l’eau du robinet](' + P.comparatif + ').',
      ],
    },
  ],
  faq: [
    { question: 'Les perles de céramique rendent-elles l’eau potable ?', reponse: 'Non. Elles s’utilisent avec une eau déjà potable, comme l’eau du robinet en France. Elles en améliorent le goût et limitent le calcaire, mais ne désinfectent pas : pour une eau de source ou de puits non contrôlée, il faut un traitement adapté.' },
    { question: 'Les perles EM retirent-elles les minéraux de l’eau ?', reponse: 'Non. Contrairement à l’osmose inverse, les perles ne retirent ni le calcium ni le magnésium naturellement présents dans l’eau.' },
    { question: 'Peut-on mettre les perles dans de l’eau chaude ?', reponse: 'Oui : elles supportent l’ébullition, c’est d’ailleurs ainsi qu’on les régénère. Vous pouvez les laisser en permanence dans la bouilloire.' },
  ],
  sources: [S.santeControle, S.servicePublic, S.ansesChlore, S.calcaire, S.columbia, S.higa, S.guide],
});

// ── 2. Les bienfaits (absorbe « source de vie au quotidien ») ───────────────
const bienfaits = avecLecture({
  slug: 'les-bienfaits-des-perles-de-ceramique',
  titre: 'Les bienfaits des perles de céramique EM au quotidien',
  titreCarte: 'Les bienfaits des perles au quotidien',
  libelleCourt: 'Les bienfaits des perles',
  categorie: 'Usages',
  datePublication: '2025-01-28',
  dateMiseAJour: MAJ,
  extrait: 'Goût de l’eau, bouilloire, linge, vaisselle, budget : ce que les perles de céramique EM changent au quotidien, comment bien démarrer, et leurs limites.',
  chapo: 'Le premier changement se goûte dans la carafe, au bout d’une demi-heure. Les autres prennent quelques semaines : une bouilloire moins entartrée, des packs de bouteilles qu’on n’achète plus. Voici comment démarrer, et où s’arrête l’effet des perles.',
  reponseCourte: 'Le premier bienfait des perles de céramique EM est le goût : l’eau du robinet perd son odeur de chlore en une trentaine de minutes. Elles limitent aussi le calcaire dans la bouilloire, la cafetière et les machines, et permettent de se passer d’eau en bouteille. Elles ne désinfectent pas l’eau.',
  metaTitle: 'Perles de céramique EM : les bienfaits au quotidien',
  metaDescription: 'Goût de l’eau, calcaire, linge, vaisselle, budget : les bienfaits des perles de céramique EM au quotidien, comment bien démarrer, et leurs limites.',
  sections: [
    {
      titre: 'Une eau du robinet qu’on a envie de boire',
      blocs: [
        'C’est le bienfait que l’on remarque en premier : après une trentaine de minutes dans une carafe, l’eau du robinet perd l’essentiel de son goût et de son odeur de chlore. Elle devient plus neutre en bouche.',
        'Une eau agréable, on en boit davantage, et on finit par ne plus acheter d’eau en bouteille. Pour savoir combien boire, l’Autorité européenne de sécurité des aliments donne des repères : voir notre article [combien d’eau boire par jour](' + P.hydratation + ').',
        'Le meilleur moyen d’en juger reste de goûter : nous décrivons un test à l’aveugle simple, à faire en famille, dans notre article [ce que les perles font, et ne font pas](' + P.purifier + ').',
      ],
    },
    {
      titre: 'Des appareils moins entartrés',
      blocs: [
        'Le calcaire est sans effet sur la santé, mais il entartre tout ce qui chauffe l’eau. Les régions à eau dure (bassin parisien, nord, est) le savent bien. Selon le fabricant, les perles modifient la façon dont le calcaire cristallise : il se dépose moins sur les parois.',
        '- Bouilloire (25 perles en permanence) : moins de dépôts blancs, des détartrages plus espacés.',
        '- Cafetière (25 perles dans le réservoir) : un appareil qui s’entartre moins vite.',
        '- Lave-vaisselle (40 perles dans un sachet, panier à couverts) : moins de traces blanches sur les verres.',
        '- Lave-linge (50 perles dans un filet, dans le tambour) : selon le fabricant, des doses de lessive et d’adoucissant réduites.',
        'Le détail appareil par appareil est dans notre guide [anti-calcaire naturel pour la bouilloire et les machines](' + P.calcaire + ').',
      ],
    },
    {
      titre: 'Moins de plastique, moins de dépenses',
      blocs: [
        'Une famille de 4 personnes qui boit 1,5 litre d’eau en bouteille par personne et par jour achète environ 2 190 litres par an : plus de 2 tonnes à porter et près de 1 500 bouteilles de 1,5 litre à jeter. Selon le guide du fabricant, l’eau du robinet coûte environ 120 fois moins cher.',
        'Côté perles, c’est un achat unique : le guide du fabricant annonce plus de 10 ans d’utilisation, à condition de les régénérer. Faites le calcul avec vos propres chiffres dans notre article [l’alternative écologique et économique à l’eau en bouteille](' + P.ecologique + ').',
      ],
    },
    {
      titre: 'Au réfrigérateur et dans la maison',
      blocs: [
        'Le fabricant propose d’autres usages : 15 à 30 perles dans un verre d’eau au bac à légumes (changer l’eau tous les 3 à 4 jours), 10 à 15 perles dans un vase de fleurs coupées, 20 perles dans le réservoir des toilettes. Il les présente comme une aide à la conservation et contre les dépôts ; ce sont ses observations, sans étude indépendante à notre connaissance.',
        'Tous les usages et leurs dosages : [les 16 utilisations des perles de céramique](' + P.usages + ').',
      ],
    },
    {
      titre: 'Bien démarrer en 4 gestes',
      blocs: [
        '1. Avant la première utilisation, faites bouillir les perles 10 minutes dans de l’eau claire.',
        '2. Déposez 15 perles par litre au fond de votre carafe, de préférence en verre, et remplissez-la au robinet.',
        '3. Attendez 30 minutes. Laissez ensuite les perles en permanence et renouvelez l’eau chaque jour.',
        '4. Tous les 3 à 6 mois, ' + ENTRETIEN + '.',
        'En déplacement, 8 à 10 perles suffisent pour une gourde de 500 ml. La mise en route pas à pas est détaillée dans [comment ça marche](' + P.ccm + ').',
      ],
    },
    {
      titre: 'Ce que les perles ne font pas',
      blocs: [
        LIMITE,
        'La documentation du fabricant décrit aussi une action « probiotique » et « antioxydante » sur l’eau : ce sont ses termes, et nous ne connaissons pas d’étude indépendante qui les confirme pour l’eau de boisson. Le point complet est dans [perles de céramique : avis, dangers et ce que dit la science](' + P.avis + ').',
      ],
    },
  ],
  faq: [
    { question: 'Combien de perles faut-il pour couvrir toute la maison ?', reponse: 'Comptez 30 perles pour une carafe de 2 litres, 25 pour la bouilloire et 40 pour le lave-vaisselle, soit environ 95 perles : c’est ce que couvre le Pack 100. Le lave-linge (50 perles) demande un second pack.' },
    { question: 'Au bout de combien de temps voit-on la différence ?', reponse: 'Pour le goût de l’eau, après une trentaine de minutes dans la carafe. Pour le calcaire dans la bouilloire ou la cafetière, il faut quelques semaines d’usage pour juger.' },
    { question: 'Les perles fonctionnent-elles dans une gourde ?', reponse: 'Oui : 8 à 10 perles pour une gourde de 500 ml, 15 pour une gourde d’un litre. Remplissez au robinet et attendez 30 minutes.' },
  ],
  sources: [S.guide, S.ansesChlore, S.calcaire, S.efsa],
});

// ── 3. Nouveau : avis, dangers et ce que dit la science ─────────────────────
const avis = avecLecture({
  slug: 'perles-de-ceramique-avis-dangers',
  titre: 'Perles de céramique : avis, dangers et ce que dit vraiment la science',
  titreCarte: 'Perles de céramique : avis, dangers et science',
  libelleCourt: 'Avis et dangers',
  categorie: 'Science',
  datePublication: MAJ,
  extrait: 'Les perles de céramique sont-elles dangereuses, efficaces, ou une arnaque ? Ce qui se vérifie chez soi, ce qui repose sur le fabricant, et les précautions utiles.',
  chapo: 'Les perles de céramique ont leurs adeptes et leurs sceptiques, et les deux camps ont en partie raison. Nous vendons ces perles ; voici pourtant ce qui se vérifie, ce qui repose sur la seule parole du fabricant, ce qui est faux, et les précautions à prendre.',
  reponseCourte: 'Les perles de céramique EM ne sont pas dangereuses pour l’eau : c’est de l’argile cuite, qui ne libère pas de produit chimique. Le vrai risque est l’étouffement des jeunes enfants et des animaux. Leur effet sur le goût de chlore se vérifie à l’aveugle ; leurs autres effets annoncés n’ont pas d’étude indépendante.',
  metaTitle: 'Perles de céramique : avis, dangers et ce que dit la science',
  metaDescription: 'Perles de céramique dangereuses ? Efficaces ? Ce qui se vérifie, ce qui reste à prouver, ce qui est faux et les vraies précautions, sources à l’appui.',
  sections: [
    {
      titre: 'Les réponses courtes',
      blocs: [
        '- Dangereuses pour l’eau ? Non : c’est de l’argile cuite à haute température, qui ne libère pas de produit chimique.',
        '- Dangereuses tout court ? Oui, sur un point : ce sont de petits objets, avec un risque d’étouffement pour les jeunes enfants et les animaux.',
        '- Efficaces ? Sur le goût de chlore, oui, et cela se vérifie à l’aveugle en 30 minutes. Sur le reste, il faut distinguer ce que vous constaterez de ce qu’annonce le fabricant.',
        '- Une arnaque ? Non, si l’on n’en attend pas ce qu’elles ne font pas : elles ne rendent pas potable une eau qui ne l’est pas et n’ont aucun effet médical.',
      ],
    },
    {
      titre: 'Les vrais dangers, et comment les éviter',
      blocs: [
        '### L’étouffement',
        'Une perle mesure environ 8 mm : la taille idéale pour être avalée de travers par un jeune enfant ou un petit animal. Gardez les perles, et la carafe ou la gourde qui les contient, hors de portée des enfants ; ne laissez pas un animal jouer avec. Dans une fontaine à eau pour chat, placez-les dans un réservoir qu’il ne peut pas atteindre.',
        '### L’hygiène de la carafe',
        'Une eau qui stagne plusieurs jours à température ambiante n’est bonne pour personne, avec ou sans perles. Renouvelez l’eau chaque jour, gardez la carafe au frais, lavez-la régulièrement, et régénérez les perles par ébullition tous les 3 à 6 mois.',
        '### Les perles abîmées ou douteuses',
        'Une perle fendue ou qui s’effrite se retire. Méfiez-vous aussi des imitations : des billes vendues comme « EM » sans lien avec le procédé d’origine. Comment les reconnaître : [perles EM authentiques](' + P.authentiques + ').',
      ],
    },
    {
      titre: 'Ce qui se vérifie, ce qui reste à prouver, ce qui est faux',
      blocs: [
        '### Ce que vous pouvez vérifier vous-même',
        '- Le goût et l’odeur de chlore atténués après 30 minutes : faites le test des 3 verres à l’aveugle décrit dans [notre article sur la purification](' + P.purifier + ').',
        '- Les dépôts de calcaire dans la bouilloire : comparez sur quelques semaines.',
        '### Ce qu’annonce le fabricant, sans étude indépendante à notre connaissance',
        '- L’action sur la cristallisation du calcaire, présentée comme la raison de ces dépôts réduits.',
        '- Une action « probiotique » et « antioxydante » sur l’eau.',
        '- La conservation prolongée des fruits et légumes, ou du linge plus souple.',
        'Sur ce site, ces effets sont toujours attribués au fabricant.',
        '### Ce qui est faux, ou ce que nous ne promettons pas',
        '- Rendre potable une eau qui ne l’est pas, ou éliminer bactéries, pesticides, nitrates et métaux lourds.',
        '- Un effet médical, sur l’organisme ou sur la santé : aucune eau ne fait cela, et aucun vendeur ne devrait le promettre.',
        '- « Structurer » l’eau ou lui donner une « mémoire » : ces théories n’ont pas de fondement scientifique.',
      ],
    },
    {
      titre: 'Que disent les scientifiques ?',
      blocs: [
        'La technologie EM est issue des travaux du Professeur Teruo Higa, agronome à l’Université des Ryukyus, au Japon, publiés pour l’agriculture. Pour les perles plongées dans l’eau de boisson, en revanche, nous ne connaissons pas d’étude indépendante publiée dans une revue scientifique : les effets annoncés reposent sur la documentation du fabricant et sur l’expérience des utilisateurs.',
        'Le scepticisme que l’on lit en ligne est donc légitime, surtout face aux vendeurs qui promettent des effets sur la santé. Nous vendons les perles pour le goût de l’eau et le calcaire, et nous vous invitons à en juger par vous-même.',
        'L’eau du robinet est contrôlée en permanence par les Agences régionales de santé, et le chlore qu’elle contient la protège jusqu’au robinet. Lire : [pourquoi l’eau a un goût de chlore](' + P.chlore + ').',
      ],
    },
    {
      titre: 'Ce que disent les utilisateurs',
      blocs: [
        'Les avis publiés sur nos fiches produits sont ceux de clients ayant acheté les perles. Ils parlent surtout du goût de l’eau et du tartre dans la bouilloire. Les remarques moins positives portent sur des détails pratiques, comme la tenue du sachet dans le lave-linge : utilisez un filet de lavage solide, bien fermé.',
        'Lisez-les sur la fiche du [Pack 55](' + P.pack55 + ') ou du [Pack 100](' + P.pack100 + '), et faites votre propre essai : nos perles sont couvertes par une [garantie satisfait ou remboursé](' + P.faq + ').',
      ],
    },
    {
      titre: 'Pour qui les perles sont un bon choix',
      blocs: [
        '- Vous trouvez que l’eau du robinet a un goût de chlore et vous achetez de l’eau en bouteille pour cette raison.',
        '- Vous voulez limiter le calcaire dans la bouilloire et la cafetière, sans produit détartrant.',
        '- Vous cherchez une solution sans cartouche à racheter chaque mois.',
        'Elles ne sont pas le bon choix si vous voulez retirer des pesticides, des nitrates ou du plomb : il vous faut alors un filtre certifié. Notre [comparatif des solutions](' + P.comparatif + ') vous aide à choisir.',
      ],
    },
  ],
  faq: [
    { question: 'Les perles de céramique sont-elles dangereuses pour la santé ?', reponse: 'Pas pour l’eau : c’est de l’argile cuite à haute température, qui ne libère pas de produit chimique. Le risque réel est l’étouffement : gardez-les hors de portée des jeunes enfants et des animaux, et renouvelez l’eau de la carafe chaque jour.' },
    { question: 'Les perles de céramique sont-elles une arnaque ?', reponse: 'Non, tant qu’on n’en attend pas ce qu’elles ne font pas. Leur effet sur le goût de chlore se vérifie à l’aveugle en 30 minutes. Méfiez-vous en revanche des vendeurs qui promettent des effets sur la santé ou une eau « structurée » : ces promesses n’ont pas de fondement.' },
    { question: 'Existe-t-il des études scientifiques sur les perles de céramique ?', reponse: 'La technologie EM a fait l’objet de travaux en agriculture. Pour les perles dans l’eau de boisson, nous ne connaissons pas d’étude indépendante publiée : les effets annoncés reposent sur la documentation du fabricant et l’expérience des utilisateurs.' },
  ],
  sources: [S.ansesChlore, S.santeControle, S.ansesBouteille, S.higa, S.emro, S.guide],
});

export const brouillons = [purifier, bienfaits, avis].map(brouillonArticle);
export const suppressions = [
  'article-les-perles-de-ceramique-une-alternative-bio-pour-la-purification-deau-de-robinet',
  'article-perles-de-ceramique-em-une-vraie-source-de-vie-au-quotidien',
  'article-les-differents-usages-des-perles-de-ceramique',
];
