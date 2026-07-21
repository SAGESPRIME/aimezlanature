# TODO — Aimez la Nature

## État actuel (2026-07-20)
- [x] Page d'accueil codée (`src/pages/index.astro`)
- [x] Données produits (`src/data/products.ts`)
- [x] Recherche SEO DataForSEO terminée → `docs/seo/strategie-seo.md` (coût 0,17 $)

## À faire — pages (ordre validé par les données SEO)
- [x] 1. Collection `/perles-ceramique-em/` (page money — mots-clés tête ~3 000/mois)
- [x] 2. Fiches produits ×4 (`/perles-ceramique-em/[slug]/`) — schema Product + FAQPage
- [x] 3. `/comment-ca-marche/` — cluster usage/entretien, structure en questions PAA
- [x] 4. Guide `/perles-de-ceramique-avis/` — cluster confiance 1 700/mois, concurrence faible
- [x] 5. Guide `/purifier-eau-robinet-comparatif/` — perles vs charbon vs carafe vs osmoseur
- [x] 6. `/a-propos/`
- [x] Ajouter « billes anti calcaire » (Pack 55) et « anti-calcaire naturel » (Pack 100) dans products.ts
- [x] Footer : ajouter les liens vers les 2 guides (maillage interne prévu par la stratégie)

✅ Vérification 2026-07-20 : `npm run build` OK — 10 pages générées, schema FAQPage/Article/AboutPage présents dans le HTML, mots-clés bien injectés dans les fiches 55 et 100.

## Prochaines étapes
- [x] Pages du footer manquantes : `/faq/`, `/contact/`, `/mentions-legales/`, `/cgv/`
  - Infos légales réelles récupérées via WebFetch sur aimezlanature.fr (SAS Naturalis Vert, Hostinger, tribunal Versailles)
  - ⚠️ À signaler : mentions légales citent Hostinger comme hébergeur, mais ce projet a `wrangler.jsonc` (Cloudflare) → à corriger si ce build Astro remplace un jour le site Hostinger en prod
  - ✅ Vérification 2026-07-20 : `npm run build` OK — 14 pages générées (10→14), schema FAQPage présent sur `/faq/`, tous les liens du footer/header résolvent vers un dossier `dist/client/` existant
- [x] Remplacer les placeholders « Photo produit » par de vraies photos
  - 3 photos + logo récupérés depuis aimezlanature.fr, intégrés via `<Image>` d'Astro (WebP + srcset au build)
  - Corrigé au passage 3 références vers des fichiers inexistants : `og-default.jpg`, `/images/{slug}.jpg`, `logo.svg`
  - ✅ Vérification : build OK, 18 variantes WebP générées, chaque URL d'image du HTML résolue vers un fichier réel, rendu contrôlé au navigateur
- [x] Pack 35 retiré du site (absent du catalogue en ligne — produit arrêté)
  - Supprimé de products.ts, footer, carte accueil (grille rééquilibrée), guide de choix, tableau de dosage, metaDescription « dès 15,90 € » → « dès 19,90 € »
  - 301 ajoutée depuis l'ancienne URL WooCommerce **et** depuis la fiche supprimée
  - ✅ Vérification : 13 pages (au lieu de 14), absent du sitemap, aucune référence produit restante (les « 25 à 35 perles par litre » conservés = conseil de dosage générique)

- [x] Gourde Écologique seule remise en vente (29,90 € au lieu de 39,90 €) + Pack Gourde repassé en stock à 59,90 €
  - Données et photo récupérées du catalogue en ligne ; description rédigée **sans** les allégations non sourcées du site actuel (« 2,3x mieux », « perles 10 ans ») pour rester cohérent avec la ligne honnête du site
  - La gourde seule n'ayant aucun avis, `rating`/`reviewCount` sont devenus optionnels : pas d'étoiles affichées et `aggregateRating` omis du schema, au lieu d'inventer une note
  - Anciennes URLs Shopify de la bouteille redirigées vers la gourde seule (elles pointaient vers le bundle faute de mieux)
  - ✅ Vérification : build OK 14 pages, schema gourde `InStock` 29,90 € sans aggregateRating, bundle `InStock` sans mention de rupture, grilles accueil et collection équilibrées (contrôle navigateur)

## Audit complet 4 axes (2026-07-20) — CORRECTIONS FAITES ✅
- [x] Audit → rapport : `docs/audit/rapport-audit-2026-07-20.md`
- [x] Corrections validées par l'utilisateur et appliquées, documentées dans
      SEO-NOTES.md / SECURITY-NOTES.md / COPY-NOTES.md / DESIGN-NOTES.md
- ✅ Vérifications : build 17 pages OK · 4 images schema Product existent dans dist ·
  Lighthouse accueil mobile A11y 95→100, SEO 100, BP 100 · CLS 0, LCP 395 ms (local) ·
  menu mobile testé au navigateur (375 px) · don unifié (0 ancienne formulation) ·
  0 vulnérabilité npm
- [x] Don 2,5 % / puits : le marchand a confirmé qu'il n'existe pas → SUPPRIMÉ de tout
      le site le 2026-07-20 (0 mention dans le HTML généré, vérifié). Mission remplacée
      par l'angle réel « zéro plastique ». Ne jamais le réintroduire (commentaire dans
      products.ts).
- ⚠️ **1 confirmation encore attendue du marchand** :
  Prix barrés (25,90/42,90/39,90/72,80 €) : conformité Omnibus (prix le plus bas
  des 30 derniers jours) à confirmer.
- [ ] Lighthouse complet 16 pages × mobile/desktop depuis la prod Cloudflare (après déploiement)

## Section blog SEO/GEO (2026-07-20) — FAIT ✅
Stratégie appliquée : ne PAS recréer les anciens articles (contenu mince, pseudo-science,
301 en place vers les piliers) mais créer 4 articles NEUFS sur les requêtes non couvertes :
- [x] `/blog/alternative-carafe-filtrante/` — 110/mois, SERP FAIBLE = opportunité n°1
- [x] `/blog/perles-de-ceramique-ou-charbon-binchotan/` — binchotan 1 000/mois en longue traîne
- [x] `/blog/perles-de-ceramique-em-authentiques/` — E-E-A-T ; factuel de l'ancien article repris (5 familles de micro-organismes, Pr Higa), pseudo-science écartée
- [x] `/blog/gourde-filtrante/` — 12 100/mois en longue traîne, angle honnête, maille Gourde + Pack Gourde
- [x] `articles.ts` + hub /blog/ (section Articles, ItemList 11 items) + llms.txt + 301 authenticité re-pointée + maillage comparatif ↔ articles
- ✅ Vérif : build 21 pages OK · 4 articles dans le sitemap · schemas Article+FAQPage valides ·
  titles 57-65 · descriptions ≤ 160 · 0 doublon sur les 70 questions FAQPage du site ·
  tous les liens internes des articles résolvent dans dist/ · 0 claim pseudo-science

## Prochaine étape en cours
- [ ] Paiement en ligne via Stripe Payment Links (direction validée)
  - ⏳ Bloqué : nécessite que l'utilisateur crée les liens dans son dashboard Stripe et fournisse les URLs `https://buy.stripe.com/...` (une par pack)
  - Une fois fournis : ajouter le champ `stripeUrl` dans products.ts et remplacer le bouton « Commander par email » des fiches

## En attente
- [ ] Pack Gourde : au retour en stock, travailler l'angle « gourde filtrante » (12 100/mois)
- [ ] « Gourde écologique » seule existe dans le catalogue en ligne mais pas sur ce site — à ajouter plus tard (angle SEO « gourde filtrante »)
- [ ] ⚠️ Mentions légales : hébergeur indiqué = Hostinger (site actuel). Si ce build Astro passe en prod sur Cloudflare, mettre à jour
