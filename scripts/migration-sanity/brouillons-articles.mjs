#!/usr/bin/env node
/**
 * Réécriture des 8 articles du blog — génère des BROUILLONS Sanity
 * (`drafts.article-…`) dans contenu/seed.ndjson, à côté des versions publiées.
 *
 * Rien n'est publié : le marchand relit chaque brouillon dans le Studio (ou
 * sur la recette construite avec CONTENU_BROUILLONS=1) et clique « Publier »
 * pour chaque article qu'il valide. La version en ligne reste intacte d'ici là.
 *
 * Principes de réécriture (cf. tasks/lessons.md, 2026-07-23) :
 *   - La terminologie EM du fabricant (« probiotique », « antioxydant »…) est
 *     CONSERVÉE, mais attribuée (« selon le fabricant ») : le marchand est
 *     revendeur agréé, ce vocabulaire est celui de la marque qu'il distribue.
 *   - Les chiffres ne restent que s'ils ont une source. « Plus de 10 ans » et
 *     « 120 fois moins cher » viennent du guide officiel du fabricant (publié
 *     sur le site) : ils restent, attribués et sourcés. Les montants
 *     d'économie (« 2 000 à 8 000 € », « 3 700 à 7 700 € »), qui se
 *     contredisaient d'un article à l'autre, sont remplacés par une méthode
 *     de calcul que le lecteur refait avec ses propres chiffres.
 *   - Entretien et dosages alignés sur le mode d'emploi officiel (ébullition
 *     tous les 3 à 6 mois ; 40 perles lave-vaisselle, 50 lave-linge…).
 *   - Les limites sont dites : les perles améliorent une eau DÉJÀ potable.
 *   - Correction de sécurité : la taille des perles n'empêche PAS
 *     l'ingestion — c'est au contraire un risque d'étouffement.
 *
 * Usage : node scripts/migration-sanity/brouillons-articles.mjs
 * (idempotent : remplace les brouillons existants, ne touche pas au publié)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const SEED = resolve(import.meta.dirname, '..', '..', 'contenu', 'seed.ndjson');
const DATE_REVISION = '2026-11-23';

// ── Sources (relevées le 2026-11-23) ─────────────────────────────────────
const S = {
  guide: { titre: 'Guide d’utilisation des Perles de Céramique EM®', editeur: 'Documentation du fabricant EM (PDF, 68 pages)', url: 'https://aimezlanature.fr/guide-perles-de-ceramique-em.pdf' },
  higa: { titre: 'Dr. Teruo Higa', editeur: 'EM Research Organization (EMRO)', url: 'https://emrojapan.com/dr-higa' },
  emro: { titre: 'What is EM?', editeur: 'EM Research Organization (EMRO)', url: 'https://emrojapan.com/what' },
  emroCertif: { titre: 'About EM Certification', editeur: 'EM Research Organization (EMRO)', url: 'https://emrojapan.com/emcertification/about' },
  santeControle: { titre: 'Comment est contrôlée la qualité de l’eau du robinet ?', editeur: 'Santé.fr — ministère chargé de la Santé', url: 'https://www.sante.fr/eau-du-robinet' },
  servicePublic: { titre: 'Comment obtenir des informations sur la qualité de l’eau du robinet ?', editeur: 'Service-public.fr', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F664' },
  ansesChlore: { titre: 'Chlore dans l’eau du robinet : pourquoi est-il utilisé et peut-on s’en passer ?', editeur: 'Anses', url: 'https://www.anses.fr/fr/content/chlore-dans-leau-du-robinet-pourquoi-est-il-utilise-et-peut-sen-passer' },
  ansesBouteille: { titre: 'Eau en bouteille ou eau du robinet : bonnes pratiques de consommation', editeur: 'Anses', url: 'https://www.anses.fr/fr/content/eau-en-bouteille-ou-eau-du-robinet-bonnes-pratiques-de-consommation' },
  calcaire: { titre: 'Réponse ministérielle sur la dureté de l’eau (question écrite n° 121870)', editeur: 'Assemblée nationale — ministère de la Santé', url: 'https://questions.assemblee-nationale.fr/dyn/13/questions/QANR5L13QE121870.pdf' },
  efsa: { titre: 'EFSA sets European dietary reference values for nutrient intakes (eau)', editeur: 'Autorité européenne de sécurité des aliments (EFSA)', url: 'https://www.efsa.europa.eu/en/press/news/nda100326' },
  columbia: { titre: 'Bottled water can contain hundreds of thousands of previously uncounted tiny plastic bits (étude PNAS, 2024)', editeur: 'Université Columbia', url: 'https://news.columbia.edu/news/bottled-water-can-contain-hundreds-thousands-previously-uncounted-tiny-plastic-bits-study' },
};

const ENTRETIEN = 'régénérez-les par ébullition 10 à 15 minutes tous les 3 à 6 mois, sans savon ni vinaigre';
const LIMITE = 'Les perles ne désinfectent pas l’eau : elles s’utilisent avec une eau déjà potable et ne remplacent pas un filtre certifié contre les bactéries, les pesticides ou les métaux lourds.';

/** Corrections appliquées à tous les articles (coquilles et chiffres non sourcés récurrents). */
const PARTOUT = [
  ['Université de Ryukyus', 'Université des Ryukyus'],
  ['Faconnage', 'Façonnage'],
  ['37 degres', '37 degrés'],
  ['renouvellez', 'renouvelez'],
  // Les intertitres d'origine séparaient par « -- » (tiret double de traitement de texte).
  [' -- ', ' : '],
  ['est potable pour 99 % de la population', 'est potable et contrôlée en permanence'],
  ['est potable et 99 % de la population y a accès', 'est potable et contrôlée en permanence'],
  ['contiennent plus de 80 micro-organismes', 'contiennent, selon le fabricant, plus de 80 micro-organismes'],
  // « Breveté » : affirmation juridique qu'aucune source à notre disposition
  // (ni le guide du fabricant) ne confirme. Retirée, le reste de la phrase tient.
  ['suivant le procédé du Professeur Teruo Higa breveté au Japon', 'suivant le procédé mis au point par le Professeur Teruo Higa'],
  ['est unique et breveté', 'suit le procédé EM d’origine'],
  ['sans respecter le procédé breveté du professeur Higa', 'sans respecter le procédé du professeur Higa'],
  ['suivent le procédé breveté du Professeur Higa', 'suivent le procédé du Professeur Higa'],
  ['selon un procédé breveté au Japon', 'selon le procédé EM d’origine japonaise'],
  [', de 30 à 50 % de durée supplémentaire', ''],
];

/**
 * Spécification par article.
 *   remplacer : { 'section.bloc': texte | [textes] | null }   (null = supprimer ;
 *               un texte commençant par « - » devient un élément de liste)
 *   sections  : { index: { titre?, contenu?: [textes] } }      (réécriture d'une section)
 *   faq       : { index: { question?, reponse } }              (réponses de la « FAQ rapide »)
 */
const ARTICLES = {
  'perles-de-ceramique-une-solution-ecologique-et-economique': {
    titre: 'Perles de céramique EM : une alternative écologique et économique à l’eau en bouteille',
    titreCarte: 'Une alternative écologique à l’eau en bouteille',
    metaTitle: 'Perles EM : une alternative écologique à l’eau en bouteille',
    metaDescription: 'Remplacer l’eau en bouteille par l’eau du robinet grâce aux perles de céramique EM : coût, déchets évités, mise en route. Chiffres sourcés.',
    chapo: 'Boire l’eau du robinet plutôt que de l’eau en bouteille : moins de plastique, moins de packs à porter, et une dépense qui fond. Les perles de céramique EM lèvent le principal frein, le goût de chlore.',
    reponseCourte: 'Oui. En atténuant le goût de chlore, les perles de céramique EM rendent l’eau du robinet agréable à boire et permettent de se passer d’eau en bouteille. C’est un achat unique, sans consommable : il suffit de les régénérer par ébullition tous les 3 à 6 mois.',
    remplacer: {
      '0.1': 'Boire de l’eau en bouteille, c’est acheter, transporter puis jeter des centaines de bouteilles chaque année : à 1,5 litre par jour, une seule personne en consomme environ 365 bouteilles de 1,5 litre par an.',
      '0.2': 'Le paradoxe est total : l’eau du robinet est contrôlée en permanence par les Agences régionales de santé, avec des résultats publics commune par commune, et elle coûte bien moins cher — environ 120 fois moins que l’eau en bouteille selon le guide du fabricant des perles EM.',
      '1.0': 'Les bouteilles qui échappent au recyclage sont incinérées, enfouies ou dispersées dans l’environnement, où le plastique se fragmente en particules de plus en plus fines :',
      '1.1': '- Faune : les fragments de plastique sont confondus avec de la nourriture par les oiseaux marins, les tortues et les poissons.',
      '1.4': 'Une étude de l’université Columbia publiée en 2024 dans la revue PNAS a compté en moyenne environ 240 000 particules de plastique par litre dans trois marques d’eau en bouteille vendues aux États-Unis, dont 90 % de nanoplastiques. Une grande partie semble provenir de la bouteille elle-même et des filtres utilisés lors de la mise en bouteille.',
      '1.5': 'Les effets de ces particules sur la santé ne sont pas encore établis. Mais limiter les contenants plastiques reste un geste simple : l’Anses recommande d’ailleurs de conserver l’eau du robinet dans du verre ou de l’inox plutôt que dans des bouteilles en plastique.',
      '2.1': '- Durables : selon le guide du fabricant, les perles sont réutilisables plus de 10 ans, à condition de les régénérer par ébullition (10 à 15 minutes tous les 3 à 6 mois). Pas de cartouche à remplacer.',
      '2.2': '- Investissement unique : le Pack 55 perles équipe une carafe de 2 litres et une bouilloire ; le Pack 100 couvre toute la maison.',
      '2.4': '- Zéro déchet : plus de bouteilles à jeter. En fin de vie, les perles, faites d’argile, peuvent être enfouies au jardin.',
      '6.2': '- Placez 15 perles par litre dans votre carafe (30 perles pour une carafe de 2 litres) et remplissez-la d’eau du robinet.',
      '6.4': `- Adoptez le réflexe : remplissez votre carafe chaque jour, les perles restent dedans en permanence, et ${ENTRETIEN}.`,
    },
    sections: {
      3: {
        titre: 'Faire le calcul avec vos propres chiffres',
        contenu: [
          'Le montant de l’économie dépend de ce que vous achetez aujourd’hui. Pour le calculer chez vous, trois chiffres suffisent :',
          '- Votre dépense actuelle : le prix d’un pack de bouteilles, multiplié par le nombre de packs achetés par mois, puis par 12.',
          '- Le coût de l’eau du robinet : il figure sur votre facture d’eau, en euros par mètre cube (1 000 litres). Pour l’eau de boisson d’un foyer, il représente quelques euros par an.',
          '- Le coût des perles : un achat unique, sans consommable.',
          'Exemple : un foyer de 4 personnes qui boit 1,5 litre d’eau en bouteille par personne et par jour achète environ 2 190 litres par an, soit plus de 2 tonnes à porter. L’eau du robinet coûtant environ 120 fois moins cher selon le guide du fabricant, l’essentiel de la dépense en bouteilles devient une économie dès la première année.',
          'S’y ajoutent les économies indirectes que constatent nos clients : moins de détartrant pour la bouilloire et la cafetière, moins d’adoucissant pour le linge.',
        ],
      },
      4: {
        contenu: [
          'Passer de l’eau en bouteille à l’eau du robinet traitée aux perles a des effets immédiats et faciles à mesurer :',
          '- Bouteilles évitées : environ 365 bouteilles de 1,5 litre par personne et par an, pour qui boit 1,5 litre par jour.',
          '- Transport évité : plus de 500 kg d’eau par personne et par an à ne plus porter du magasin à la maison.',
          '- Contenant : l’eau se boit dans une carafe en verre, que l’Anses recommande plutôt que le plastique pour conserver l’eau du robinet.',
        ],
      },
      5: {
        contenu: [
          'En France, l’eau du robinet fait l’objet d’une double surveillance : celle de l’exploitant du réseau, et le contrôle sanitaire des Agences régionales de santé (ARS).',
          'Les résultats de ces analyses sont publics : vous pouvez consulter la qualité de l’eau de votre commune sur le site du ministère chargé de la santé, ou sur l’affichage de votre mairie.',
          'Si l’eau a parfois un goût de chlore, c’est que ce désinfectant la protège jusqu’à votre robinet. Ce goût ne signifie pas que l’eau est impropre à la consommation ; les perles de céramique EM servent précisément à l’atténuer, pour qu’on ait envie de la boire.',
        ],
      },
    },
    faq: {
      0: { reponse: 'Tout dépend de votre consommation actuelle. Selon le guide du fabricant, l’eau du robinet coûte environ 120 fois moins cher que l’eau en bouteille : pour un foyer qui achète régulièrement des packs, l’essentiel de cette dépense devient une économie, pour un achat de perles unique.' },
      1: { reponse: 'Pour la plupart de nos clients, oui : une fois le goût de chlore atténué, l’eau du robinet devient agréable à boire et les bouteilles n’ont plus de raison d’être. Les perles ne rendent pas potable une eau qui ne l’est pas : elles s’utilisent avec l’eau du robinet, déjà contrôlée.' },
      2: { reponse: 'Selon le guide du fabricant, elles s’utilisent plus de 10 ans, en les régénérant par ébullition tous les 3 à 6 mois. En fin de vie, ces billes d’argile peuvent être enfouies au jardin : aucun déchet plastique.' },
    },
    sources: [S.guide, S.columbia, S.ansesBouteille, S.santeControle, S.servicePublic],
  },

  'les-perles-de-ceramique-une-alternative-bio-pour-la-purification-deau-de-robinet': {
    titre: 'Perles de céramique EM : une alternative naturelle pour l’eau du robinet',
    titreCarte: 'Une alternative naturelle pour l’eau du robinet',
    metaTitle: 'Perles de céramique EM : purifier l’eau naturellement',
    metaDescription: 'Fabrication, mode d’action et comparaison avec la carafe filtrante : comment les perles de céramique EM améliorent l’eau du robinet, sans produit chimique.',
    chapo: 'Argile et micro-organismes, sans résine ni produit chimique ajouté : les perles de céramique EM sont une alternative naturelle aux filtres à cartouche pour améliorer le goût de l’eau du robinet.',
    reponseCourte: 'Les perles de céramique EM sont faites d’argile et de micro-organismes EM cuits à haute température, sans résine ni produit chimique ajouté. Elles atténuent le goût de chlore et limitent le calcaire, sans cartouche à remplacer. Le terme « bio » étant réservé aux produits certifiés, nous parlons d’alternative naturelle.',
    remplacer: {
      '0.0': 'Les perles de céramique EM sont une alternative naturelle pour améliorer l’eau du robinet. Elles sont fabriquées à partir d’argile et de micro-organismes EM (Effective Micro-organisms), mélangés puis cuits à haute température.',
      '0.1': 'Le procédé est issu des recherches du Professeur Teruo Higa, de l’Université des Ryukyus à Okinawa (Japon), qui a mis au point les EM en 1982. D’abord destinée à l’agriculture, cette technologie est aujourd’hui utilisée dans de nombreux pays, notamment pour l’eau et la gestion des déchets.',
      '0.2': 'Les perles ne contiennent ni résine synthétique, comme les cartouches de carafes filtrantes, ni membrane, comme les osmoseurs : seulement de l’argile et des micro-organismes. Le mot « bio » étant réservé en France aux produits certifiés agriculture biologique, nous parlons d’alternative naturelle.',
      '1.2': '- Fermentation avec les EM : selon le fabricant, l’argile est mélangée à un concentré de plus de 80 micro-organismes efficaces (bactéries lactiques, levures, actinomycètes, bactéries photosynthétiques et champignons), puis fermentée plusieurs semaines.',
      '1.6': 'Au contact de l’eau, ces micro-organismes reprennent leur activité. Le guide du fabricant indique une durée d’utilisation de plus de 10 ans, à condition de régénérer les perles par ébullition tous les 3 à 6 mois.',
      '2.1': '- Action purifiante : les perles atténuent le goût et l’odeur de chlore, et limitent les dépôts de calcaire. Selon le fabricant, les micro-organismes transforment le chlore libre et modifient la structure cristalline du calcaire, qui se dépose moins sur les surfaces.',
      '2.2': `- Action probiotique : c’est ainsi que le fabricant décrit le rôle des micro-organismes EM, qui occupent le milieu au détriment des micro-organismes indésirables. ${LIMITE}`,
      '2.3': '- Action antioxydante : selon le fabricant, les perles abaissent le potentiel d’oxydo-réduction (ORP) de l’eau.',
      '2.4': 'Contrairement aux carafes filtrantes et à leurs cartouches à changer régulièrement, les perles ne produisent aucun déchet.',
      '4.1': 'Régénérées par ébullition tous les 3 à 6 mois, elles s’utilisent plus de 10 ans selon le guide du fabricant, sans consommable.',
      '5.1': 'Les perles EM s’inscrivent dans une démarche zéro déchet et minimaliste : un seul achat, sans consommable ni remplacement.',
    },
    sections: {
      3: {
        contenu: [
          'Les carafes filtrantes sont la solution la plus connue pour améliorer l’eau du robinet. Elles ne font pas exactement la même chose que les perles :',
          'Le coût :',
          '- Carafe filtrante : une cartouche à racheter régulièrement, souvent chaque mois, soit un budget récurrent.',
          '- Perles EM : un achat unique, régénéré par ébullition.',
          'Les déchets :',
          '- Carafe filtrante : une cartouche usagée à jeter à chaque remplacement.',
          '- Perles EM : aucun consommable ; en fin de vie, les perles en argile peuvent être enfouies au jardin.',
          'L’entretien :',
          '- Carafe filtrante : il faut changer la cartouche à temps, sinon son efficacité chute et des bactéries peuvent se développer dans le filtre usagé.',
          `- Perles EM : ${ENTRETIEN}.`,
          'L’efficacité :',
          '- Carafe filtrante : selon le modèle, elle retient davantage de substances, mais son efficacité baisse à mesure que la cartouche se sature.',
          '- Perles EM : elles agissent surtout sur le goût de chlore et le calcaire, et conservent leur action tant qu’elles sont régénérées.',
        ],
      },
    },
    faq: {
      0: { question: 'En quoi les perles EM sont-elles une alternative naturelle ?', reponse: 'Elles sont faites d’argile et de micro-organismes, sans résine ni produit chimique ajouté, et ne génèrent aucun consommable. Le terme « bio » étant réservé aux produits certifiés agriculture biologique, nous parlons d’alternative naturelle.' },
      1: { reponse: 'Elles ne font pas la même chose. Une carafe filtrante retient davantage de substances selon le modèle, mais demande une cartouche à changer régulièrement ; les perles agissent surtout sur le goût de chlore et le calcaire, sans consommable. Notre comparatif des solutions vous aide à choisir selon votre besoin.' },
    },
    sources: [S.higa, S.guide, S.ansesChlore],
  },

  'leau-est-une-source-de-vie': {
    titre: 'L’eau, source de vie : combien boire et comment bien s’hydrater',
    titreCarte: 'Combien d’eau boire par jour ?',
    metaTitle: 'Bien s’hydrater : combien d’eau boire par jour ?',
    metaDescription: 'Combien d’eau boire par jour, signes de déshydratation, erreurs courantes : les repères de l’EFSA, et comment rendre l’eau du robinet agréable à boire.',
    chapo: 'L’eau est indispensable à chaque cellule du corps. Voici les repères officiels pour bien s’hydrater, les signes qui doivent alerter, et pourquoi le goût de l’eau compte autant que la quantité.',
    reponseCourte: 'L’Autorité européenne de sécurité des aliments (EFSA) considère comme adéquat un apport total en eau de 2 litres par jour pour une femme et de 2,5 litres pour un homme, eau des aliments comprise. Par forte chaleur ou en cas d’effort, les besoins augmentent.',
    remplacer: {
      '0.1': 'L’EFSA considère comme adéquat un apport total en eau de 2 litres par jour pour une femme et de 2,5 litres pour un homme, en comptant l’eau apportée par les aliments. Ces repères valent pour une température et une activité modérées : par temps chaud ou lors d’un effort physique, les besoins augmentent.',
      '2.2': '- Peau : l’eau participe à son hydratation et à sa souplesse.',
      '2.4': '- Gestion du poids : l’eau ne contient aucune calorie, ce qui en fait la boisson de référence à la place des boissons sucrées.',
      '3.2': 'Selon le fabricant, les micro-organismes EM présents dans la céramique ont aussi une action « probiotique » et « antioxydante » sur l’eau. Le bénéfice que nos clients constatent d’abord reste le goût : une eau agréable, c’est une eau que l’on boit.',
      '5.2': '- Boire trop d’un coup : mieux vaut boire régulièrement, par petites quantités, tout au long de la journée.',
    },
    faq: {
      0: { reponse: 'L’EFSA retient un apport total de 2 litres par jour pour une femme et de 2,5 litres pour un homme, aliments compris. Augmentez par forte chaleur ou en cas d’effort physique.' },
      2: { reponse: 'Chez une personne en bonne santé, les reins éliminent l’excès d’eau. Les intoxications par l’eau existent mais sont rares, liées à de très grandes quantités bues en peu de temps. Buvez régulièrement, selon votre soif, sans vous forcer.' },
    },
    sources: [S.efsa, S.ansesBouteille, S.santeControle],
  },

  'perles-de-ceramique-purifier-votre-eau-du-robinet': {
    titre: 'Purifier l’eau du robinet avec les perles de céramique EM : ce qu’elles font, et ne font pas',
    titreCarte: 'Purifier l’eau du robinet : ce que font les perles',
    metaTitle: 'Purifier l’eau du robinet avec des perles de céramique EM',
    metaDescription: 'Chlore, calcaire, microplastiques : ce que les perles de céramique EM changent réellement à l’eau du robinet, leurs limites, et comment les utiliser.',
    chapo: 'Goût de chlore, calcaire, inquiétudes sur les résidus : ce que les perles de céramique EM changent réellement à l’eau du robinet — et ce qu’elles ne changent pas.',
    reponseCourte: 'Les perles de céramique EM atténuent le goût et l’odeur de chlore de l’eau du robinet et limitent les dépôts de calcaire, sans produit chimique ni cartouche. Elles améliorent une eau déjà potable : elles ne retirent ni pesticides, ni métaux lourds, ni bactéries, pour lesquels il faut un filtre certifié.',
    remplacer: {
      '0.0': 'En France, l’eau du robinet est potable et contrôlée, mais elle peut avoir un goût de chlore et être plus ou moins calcaire selon les régions. Le Professeur Teruo Higa, de l’Université des Ryukyus à Okinawa, a mis au point en 1982 les micro-organismes EM (Effective Micro-organisms), à l’origine des perles de céramique EM.',
      '0.1': 'Selon le fabricant, les perles de céramique EM contiennent plus de 80 micro-organismes, qui agissent ensemble au contact de l’eau.',
      '0.4': '- Le calcaire : selon les régions, l’eau est plus ou moins dure. Le calcaire est sans conséquence sur la santé, mais il entartre les appareils et laisse des traces sur la vaisselle.',
      '0.5': '- Les résidus de pesticides et de médicaments : l’eau distribuée doit respecter des limites réglementaires, contrôlées par les ARS. Les perles de céramique EM n’agissent pas sur ces substances : si c’est votre préoccupation, seul un filtre certifié pour ces polluants (charbon actif certifié, osmose inverse) est adapté.',
      '0.6': '- Les microplastiques : une étude de l’université Columbia (PNAS, 2024) a compté en moyenne environ 240 000 particules de plastique par litre dans des eaux en bouteille vendues aux États-Unis, en grande partie issues de la bouteille elle-même.',
      '0.7': 'Les perles de céramique EM répondent aux deux premières attentes, le goût et le calcaire, sans produit chimique, sans filtre à remplacer et sans déchet.',
      '1.1': 'Action purifiante : les perles atténuent le goût de chlore ; après 30 minutes de contact, l’eau retrouve un goût plus neutre. Selon le fabricant, les micro-organismes de la céramique transforment le chlore libre et modifient la structure cristalline du calcaire, qui se dépose moins sur les surfaces.',
      '1.2': 'À condition d’être régénérées par ébullition tous les 3 à 6 mois, les perles conservent leur action, sans cartouche à remplacer.',
      '1.3': 'Action probiotique : c’est le terme employé par le fabricant pour décrire le rôle des micro-organismes EM, qui occupent le milieu.',
      '1.4': LIMITE,
      '1.5': 'Action antioxydante : selon le fabricant, les perles abaissent le potentiel d’oxydo-réduction (ORP) de l’eau.',
      '1.6': null,
      '3.2': [
        '- Carafe 1 litre : 15 perles, eau prête en 30 minutes (30 perles pour 2 litres)',
        '- Gourde 500 ml : 8 à 10 perles',
        '- Bouilloire ou cafetière : 25 perles, en permanence',
        '- Réfrigérateur : 15 à 30 perles dans un verre d’eau, dans le bac à légumes',
        '- Lave-vaisselle : 40 perles dans un sachet, dans le panier à couverts',
        '- Lave-linge : 50 perles dans un sachet en coton, dans le tambour',
      ],
      '4.1': '- Carafe filtrante : efficace sur le chlore et sur certaines substances selon le modèle, mais une cartouche plastique à remplacer régulièrement.',
      '4.2': '- Charbon binchotan : naturel et efficace sur le chlore, mais à remplacer tous les 3 à 6 mois.',
      '4.3': '- Osmose inverse : la plus complète (elle retient aussi pesticides et métaux), mais coûteuse à installer ; elle rejette une partie de l’eau et retire aussi les minéraux.',
      '4.4': '- Perles EM : sans déchet ni consommable, polyvalentes, pour un achat unique — plus de 10 ans d’utilisation selon le guide du fabricant, avec une régénération régulière.',
      '4.5': 'Les perles EM se distinguent par leur simplicité et leur polyvalence. Pour choisir selon votre besoin, consultez notre comparatif des solutions de purification.',
    },
    sections: { 1: { titre: 'Les 3 actions des perles de céramique EM, et leurs limites' } },
    faq: {
      0: { reponse: 'Oui. En France, l’eau du robinet est soumise au contrôle sanitaire régulier des Agences régionales de santé, et les résultats sont publics commune par commune. Les perles EM n’ont pas pour rôle de la rendre potable : elles en améliorent le goût et limitent le calcaire.' },
      1: { reponse: 'Au contact de l’eau, elles atténuent le goût de chlore en une trentaine de minutes et limitent les dépôts de calcaire. Selon le fabricant, ce sont les micro-organismes EM fixés dans la céramique qui agissent ; il suffit de régénérer les perles par ébullition tous les 3 à 6 mois.' },
      2: { reponse: 'Non. Contrairement à l’osmose inverse, les perles ne retirent ni le calcium ni le magnésium naturellement présents dans l’eau.' },
    },
    sources: [S.santeControle, S.servicePublic, S.calcaire, S.columbia, S.higa, S.guide],
  },

  'les-differents-usages-des-perles-de-ceramique': {
    titre: 'Les usages des perles de céramique EM : carafe, cuisine, linge et maison',
    titreCarte: 'Tous les usages des perles de céramique EM',
    metaTitle: 'Perles de céramique EM : tous les usages et dosages',
    metaDescription: 'Carafe, bouilloire, lave-linge, lave-vaisselle, réfrigérateur, fleurs : combien de perles de céramique EM utiliser pour chaque usage, et comment les répartir.',
    chapo: 'Carafe, bouilloire, lave-linge, réfrigérateur, fleurs : chaque usage a son dosage. Le guide complet pour tirer parti de vos perles de céramique EM dans toute la maison.',
    reponseCourte: 'Comptez 15 perles par litre pour l’eau de boisson (30 pour une carafe de 2 litres), 25 pour une bouilloire ou une cafetière, 40 pour le lave-vaisselle et 50 pour le lave-linge, dans un sachet en tissu. Utilisez des perles distinctes pour l’eau de boisson et pour les autres usages.',
    remplacer: {
      '0.0': '15 perles par litre dans votre carafe (30 pour 2 litres), puis attendez 30 minutes : vous retrouvez le goût de l’eau du robinet, sans goût de chlore ni mauvaises odeurs. C’est l’usage le plus courant et le plus apprécié des perles de céramique EM.',
      '0.5': '- Pour une gourde : 8 à 10 perles pour une gourde de 500 ml, à raison de 15 perles par litre. Idéal pour le bureau ou les déplacements.',
      '2.1': 'Selon le fabricant, les micro-organismes efficaces limitent les processus de décomposition. Nos clients en voient surtout l’effet sur :',
      '2.2': '- Les salades et herbes fraîches : elles restent croquantes plus longtemps.',
      '3.4': '- Moins de lessive : de nombreux utilisateurs réduisent la dose de lessive, à ajuster selon le résultat obtenu.',
      '5.4': '- Fleurs coupées : 10 à 15 perles dans le vase pour garder les fleurs fraîches plus longtemps.',
    },
    faq: {
      0: { reponse: '15 perles par litre : 15 pour une carafe d’un litre, 30 pour 2 litres. Attendez 30 minutes avant de boire, et laissez les perles en permanence dans la carafe.' },
      2: { reponse: 'Elles ne libèrent aucun produit chimique dans l’eau. Mais comme toute petite bille, elles présentent un risque d’étouffement : gardez-les, ainsi que la carafe ou la gourde qui les contient, hors de portée des jeunes enfants, et ne les laissez pas en libre accès aux animaux.' },
    },
    sources: [S.guide],
  },

  'authenticite-des-perles-de-ceramique-em-et-leur-efficacite': {
    titre: 'Perles de céramique EM authentiques : comment les reconnaître',
    titreCarte: 'Reconnaître des perles EM authentiques',
    metaTitle: 'Perles de céramique EM authentiques : comment les reconnaître',
    metaDescription: 'Origine du procédé EM du Pr Teruo Higa, fabrication au Japon, revendeurs agréés et tests simples à faire chez soi pour reconnaître des perles EM authentiques.',
    chapo: 'Toutes les perles vendues sous le nom « EM » ne se valent pas. Origine du procédé, fabrication, agrément des revendeurs et tests à faire chez soi : comment reconnaître des perles authentiques.',
    reponseCourte: 'Des perles de céramique EM authentiques sont fabriquées au Japon selon le procédé EM du Pr Teruo Higa et distribuées par des revendeurs agréés. Le plus sûr est de vérifier l’agrément du vendeur ; un test du goût à l’aveugle (30 minutes dans un verre d’eau du robinet) permet ensuite de constater l’effet sur le chlore.',
    remplacer: {
      '0.0': 'Les micro-organismes EM (Effective Micro-organisms) ont été développés par le Professeur Teruo Higa, de l’Université des Ryukyus à Okinawa (Japon). D’abord destinés à l’agriculture, ils ont été mis au point en 1982 et sont aujourd’hui promus par l’EM Research Organization (EMRO).',
      '1.4': 'L’EM Research Organization (EMRO) recommande d’acheter les produits EM d’origine uniquement auprès de distributeurs agréés, et a mis en place une certification pour les identifier.',
      '3.0': 'Les perles de céramique EM sont fabriquées au Japon selon le procédé du Professeur Teruo Higa, à partir d’argile et de micro-organismes EM, cuites entre 800 et 1 000 degrés.',
      '3.7': 'C’est ce savoir-faire que le fabricant met en avant pour annoncer une durée d’utilisation de plus de 10 ans, avec une régénération régulière par ébullition.',
      '4.3': '- Action antioxydante : selon le fabricant, le potentiel d’oxydo-réduction (ORP) de l’eau est abaissé.',
      '4.4': '- Conservation des aliments : nos clients constatent que fruits et légumes se gardent plus longtemps.',
      '4.5': 'Les tests décrits plus haut permettent de constater ces effets chez soi, sans matériel. C’est aussi la meilleure façon de vérifier que vos perles sont authentiques.',
    },
    sections: { 4: { titre: 'Ce que vous pouvez constater avec des perles authentiques' } },
    faq: {
      1: { reponse: 'Sur le goût de chlore et le calcaire, l’effet se constate facilement : faites le test du goût à l’aveugle décrit plus haut. Les perles améliorent une eau déjà potable ; elles ne la désinfectent pas et ne retirent ni pesticides ni métaux lourds.' },
      2: { reponse: 'Elles s’utilisent avec une eau potable, comme l’eau du robinet contrôlée en France. Elles ne rendent pas consommable une eau qui ne l’est pas.' },
    },
    sources: [S.higa, S.emro, S.emroCertif, S.guide],
  },

  'les-bienfaits-des-perles-de-ceramique': {
    titre: 'Les bienfaits des perles de céramique EM au quotidien',
    titreCarte: 'Les bienfaits des perles au quotidien',
    metaTitle: 'Perles de céramique EM : les bienfaits au quotidien',
    metaDescription: 'Goût de l’eau, calcaire dans les appareils, linge, vaisselle, conservation des aliments : les effets des perles de céramique EM, et leurs limites.',
    chapo: 'Une eau qui a meilleur goût, des appareils moins entartrés, du linge plus souple : ce que les perles de céramique EM changent au quotidien, et ce qu’elles ne font pas.',
    reponseCourte: 'Le premier bienfait des perles de céramique EM est le goût : l’eau du robinet perd son odeur de chlore en une trentaine de minutes. Elles limitent aussi les dépôts de calcaire dans la bouilloire, la cafetière et les machines. Elles ne désinfectent pas l’eau et ne remplacent pas un filtre certifié.',
    remplacer: {
      '1.0': 'Une eau agréable à boire, c’est une eau que l’on boit davantage. Les perles de céramique EM rendent l’eau du robinet plus douce en bouche, sans produit chimique.',
      '1.1': 'Selon le fabricant, les micro-organismes efficaces agissent selon trois mécanismes complémentaires :',
      '1.4': '- L’action antioxydante : abaissement du potentiel d’oxydo-réduction de l’eau',
      '1.5': `Ces actions décrites par le fabricant complètent l’essentiel : une eau au bon goût. ${LIMITE}`,
      '3.1': 'Selon le fabricant, les micro-organismes efficaces limitent les processus de décomposition. Nos clients en voient surtout l’effet sur :',
      '4.0': 'En plaçant 50 perles dans un sachet en tissu dans le tambour de votre lave-linge, vous adoucissez l’eau, réduisez les dépôts calcaires et protégez l’appareil. Le linge sort plus souple, et vous pouvez réduire la dose d’adoucissant.',
      '4.1': 'Même principe pour le lave-vaisselle : 40 perles dans un sachet en tissu dans le panier à couverts, pour une vaisselle plus brillante et un appareil protégé du calcaire.',
      '5.7': null,
    },
    sections: {
      1: { titre: 'L’eau que vous buvez' },
      5: {
        titre: 'Écologique et économique',
        contenu: [
          'Une famille de 4 personnes qui boit 1,5 litre d’eau en bouteille par personne et par jour achète environ 2 190 litres par an, soit plus de 2 tonnes d’eau à transporter. Selon le guide du fabricant, l’eau du robinet coûte environ 120 fois moins cher que l’eau en bouteille.',
          'Passer à l’eau du robinet, c’est aussi environ 1 460 bouteilles de 1,5 litre en moins par an pour ce foyer.',
          `Côté perles, c’est un achat unique : le guide du fabricant annonce une durée d’utilisation de plus de 10 ans, à condition de les régénérer (${ENTRETIEN}).`,
        ],
      },
    },
    faq: {
      0: { reponse: `Oui : placez-les dans l’eau et attendez 30 minutes. Pour l’entretien, ${ENTRETIEN}.` },
      1: { question: 'Quel pack choisir pour commencer ?', reponse: 'Le Pack 55 est notre format d’entrée, pour une carafe de 2 litres et une bouilloire ; le Pack 100 couvre plusieurs usages, dont le lave-vaisselle. C’est un achat unique : selon le guide du fabricant, les perles s’utilisent plus de 10 ans avec une régénération régulière.' },
    },
    sources: [S.guide, S.calcaire, S.ansesChlore],
  },

  'perles-de-ceramique-em-une-vraie-source-de-vie-au-quotidien': {
    titre: 'Perles de céramique EM : une eau du robinet agréable au quotidien',
    titreCarte: 'Bien démarrer avec les perles EM',
    metaTitle: 'Perles de céramique EM : une eau agréable au quotidien',
    metaDescription: 'Origine du procédé EM, mode d’emploi au quotidien, entretien et geste pour la planète : tout pour bien démarrer avec les perles de céramique EM.',
    chapo: 'Origine du procédé, gestes du quotidien, entretien : tout ce qu’il faut savoir pour bien démarrer avec les perles de céramique EM et retrouver le plaisir de boire l’eau du robinet.',
    reponseCourte: `Placez 15 perles par litre dans votre carafe d’eau du robinet et attendez 30 minutes : le goût de chlore s’atténue. Laissez-les en permanence, renouvelez l’eau chaque jour, et ${ENTRETIEN}.`,
    remplacer: {
      '0.1': 'Face à ce constat, beaucoup se tournent vers l’eau en bouteille, avec ce que cela implique : des packs à porter, des bouteilles plastique à jeter et un budget récurrent.',
      '2.3': '- Au bureau : 8 à 10 perles dans une gourde de 500 ml. Remplissez-la au robinet et attendez 30 minutes.',
      '2.5': `D’après le guide du fabricant, les perles sont réutilisables plus de 10 ans. Pour l’entretien, ${ENTRETIEN}.`,
      '2.6': 'Selon ce même guide, l’eau du robinet coûte environ 120 fois moins cher que l’eau en bouteille.',
      '3.1': `Le fabricant décrit aussi une action « probiotique » et « antioxydante » des micro-organismes EM sur l’eau. ${LIMITE}`,
      '4.0': 'Chaque bouteille d’eau achetée est un emballage à produire, transporter, puis recycler ou jeter. Les perles de céramique EM vous permettent de vous en passer, chez vous comme en déplacement.',
      '4.1': 'Avec les perles, vous n’avez plus besoin de bouteilles en plastique et vous réduisez le transport d’eau. En fin de vie, les perles en argile peuvent être enfouies au jardin.',
      '5.5': `- Entretien : ${ENTRETIEN}.`,
    },
    faq: {
      0: { reponse: `Selon le guide du fabricant, plus de 10 ans, à condition de les régénérer : ${ENTRETIEN}. Aucun remplacement n’est nécessaire entre-temps.` },
      1: { reponse: 'Elles ne génèrent ni plastique ni consommable, et remplacent l’achat d’eau en bouteille. En fin de vie, ces billes d’argile peuvent être enfouies au jardin.' },
      2: { reponse: 'Oui : 8 à 10 perles pour une gourde de 500 ml, 15 pour une gourde d’un litre. Remplissez au robinet et attendez 30 minutes.' },
    },
    sources: [S.guide, S.higa, S.santeControle, S.ansesChlore],
  },
};

// ── Construction des brouillons ──────────────────────────────────────────
const cle = (...p) => createHash('sha1').update(p.join('|')).digest('hex').slice(0, 12);

/** Bloc Portable Text à partir d'un texte (« - » en tête = élément de liste). */
function bloc(texte, graine) {
  const liste = texte.startsWith('- ');
  const t = liste ? texte.slice(2) : texte;
  return {
    _type: 'block',
    _key: cle(graine, t),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: cle(graine, 'span', t), text: t, marks: [] }],
    ...(liste ? { listItem: 'bullet', level: 1 } : {}),
  };
}

const texteDe = (b) => b.children.map((c) => c.text).join('');
const corrigerPartout = (t) => PARTOUT.reduce((acc, [de, vers]) => acc.split(de).join(vers), t);

const documents = readFileSync(SEED, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const sansBrouillons = documents.filter((d) => !String(d._id).startsWith('drafts.article-'));
const brouillons = [];

for (const [slug, spec] of Object.entries(ARTICLES)) {
  const publie = documents.find((d) => d._id === `article-${slug}`);
  if (!publie) throw new Error(`Article publié introuvable : ${slug}`);
  const d = structuredClone(publie);

  const utilises = new Set();
  d.sections = d.sections.map((section, si) => {
    const reecrite = spec.sections?.[si];
    let contenu = section.contenu.flatMap((b, bi) => {
      const k = `${si}.${bi}`;
      if (!(k in (spec.remplacer ?? {}))) return [b];
      utilises.add(k);
      const v = spec.remplacer[k];
      if (v === null) return [];
      return (Array.isArray(v) ? v : [v]).map((t) => bloc(t, `${slug}|${k}`));
    });
    if (reecrite?.contenu) contenu = reecrite.contenu.map((t, i) => bloc(t, `${slug}|${si}|${i}`));
    // Corrections communes sur tout ce qui n'a pas été réécrit.
    contenu = contenu.map((b) => ({ ...b, children: b.children.map((c) => ({ ...c, text: corrigerPartout(c.text) })) }));
    return { ...section, titre: reecrite?.titre ?? corrigerPartout(section.titre), contenu };
  });
  for (const k of Object.keys(spec.remplacer ?? {})) {
    if (!utilises.has(k)) throw new Error(`${slug} : bloc ${k} introuvable (le texte publié a-t-il changé ?)`);
  }

  // La section « FAQ rapide » devient une vraie FAQ structurée (données FAQPage).
  const iFaq = d.sections.findIndex((s) => /^FAQ/i.test(s.titre));
  if (iFaq === -1) throw new Error(`${slug} : section FAQ introuvable`);
  d.faq = d.sections[iFaq].contenu.map((b, i) => {
    const t = texteDe(b);
    const coupe = t.indexOf('?');
    const question = t.slice(0, coupe + 1).trim();
    const reponse = t.slice(coupe + 1).trim();
    const surcharge = spec.faq?.[i] ?? {};
    return {
      _type: 'questionReponse',
      _key: cle(slug, 'faq', String(i)),
      question: surcharge.question ?? question,
      reponse: surcharge.reponse ?? corrigerPartout(reponse),
    };
  });
  d.sections.splice(iFaq, 1);

  Object.assign(d, {
    _id: `drafts.article-${slug}`,
    titre: spec.titre,
    titreCarte: spec.titreCarte,
    metaTitle: spec.metaTitle,
    metaDescription: spec.metaDescription,
    chapo: spec.chapo,
    reponseCourte: spec.reponseCourte,
    sources: spec.sources.map((s) => ({ _type: 'source', _key: cle(slug, s.url), ...s })),
    dateMiseAJour: DATE_REVISION,
  });
  brouillons.push(d);
}

writeFileSync(SEED, [...sansBrouillons, ...brouillons].map((d) => JSON.stringify(d)).join('\n') + '\n');
console.log(`${brouillons.length} brouillons d'articles écrits dans ${SEED}`);
