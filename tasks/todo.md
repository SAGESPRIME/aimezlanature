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
- [ ] Remplacer les placeholders « Photo produit » par de vraies photos (les schemas pointent vers `/images/{slug}.jpg`)
- [ ] Paiement en ligne (les fiches produits commandent par email en attendant)

## En attente
- [ ] Pack Gourde : au retour en stock, travailler l'angle « gourde filtrante » (12 100/mois)
