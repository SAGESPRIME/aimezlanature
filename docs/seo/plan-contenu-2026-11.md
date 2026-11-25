# Plan de contenu SEO — novembre 2026

Analyse du concurrent lesvertsmoutons.com (page « Comment ça marche » + 56 articles, lus le
24/11/2026) et remise à niveau du blog. Volumes : `strategie-seo.md` (DataForSEO, juillet 2026).

## Angle
« La marque qui dit ce que les perles font — et ne font pas » : sources officielles, effets
attribués au fabricant, tests à faire chez soi, données structurées complètes. Le concurrent a
de nombreux articles, mais aucune donnée structurée, aucune source, une forte cannibalisation
et des allégations (eau « structurée », « détox », tiques, peau) qu'il ne peut pas retirer
sans renier son discours.

## Carte des articles (slug → requêtes)
| Article | Requêtes | Statut |
|---|---|---|
| perles-de-ceramique-avis-dangers | danger 480, avis scientifique 390, UFC 2×260, eau avis 260 | publié (nouveau) |
| gourde-filtrante | gourde filtrante 12 100 | publié (nouveau) |
| alternative-carafe-filtrante | carafe filtrante 14 800 (traîne), alternative 110 | publié (nouveau) |
| perles-de-ceramique-ou-charbon-binchotan | binchotan 1 000, charbon actif eau 1 300 | publié (nouveau) |
| anti-calcaire-naturel-bouilloire | billes anti calcaire 390, anti calcaire naturel 320 | publié (nouveau) |
| gout-de-chlore-eau-du-robinet | goût / odeur de chlore | publié (nouveau) |
| entretenir-perles-de-ceramique | nettoyer, entretenir, faire bouillir, durée de vie | publié (nouveau) |
| perles-de-ceramique-purifier-votre-eau-du-robinet | perles pour purifier l'eau 260-320 | publié (+ fusion « alternative bio ») |
| les-bienfaits-des-perles-de-ceramique | bienfaits | publié (+ fusion « source de vie ») |
| perles-de-ceramique-une-solution-ecologique-et-economique | remplacer l'eau en bouteille | publié |
| authenticite-des-perles-de-ceramique-em-et-leur-efficacite | perles authentiques, où acheter | publié |
| leau-est-une-source-de-vie | combien d'eau boire par jour | publié |
Fusionnés (301) : alternative-bio → purifier ; source-de-vie → bienfaits ; differents-usages → /utilisations/.

Règles de chaque article : réponse courte, 3 questions FAQ uniques au site, sources, au moins
3 liens dans le texte, limites dites, effets des perles attribués au fabricant.

## Outils
- `scripts/contenu-seo/lots/*.mjs` : le contenu, versionné ; `appliquer.mjs <lot> [--sanity]`
  l'écrit dans le seed et dans Sanity (brouillons jamais écrasés s'ils ont été retouchés dans
  le Studio) ; `synchroniser-seed.mjs` recopie Sanity dans le seed.
- `npm run check:allegations` (CI) : termes interdits (`contenu/allegations.json`), brouillons
  compris. La « dette » liste les anciennes versions encore publiées : la vider après publication.
- `npm run check:seo` (CI) : une question FAQ = une seule page ; articles < 3 liens signalés.
- Un lien vers un article non publié s'affiche en texte simple (`Marque.astro`,
  `lienArticle()` dans les pages) : on peut publier dans n'importe quel ordre.

## Après publication par le marchand
1. `node scripts/contenu-seo/synchroniser-seed.mjs`, puis vider la « dette » de
   `contenu/allegations.json` pour les articles republiés.
2. Rediriger `/perles-de-ceramique-avis/` vers `/blog/perles-de-ceramique-avis-dangers/`
   (`src/data/redirections.json`).
3. Suite possible : origine / Teruo Higa, restaurants et hôtels (B2B), animaux, eaux aromatisées
   (été) ; calculateur « bouteilles ou perles » ; volumes à remesurer (DataForSEO).
