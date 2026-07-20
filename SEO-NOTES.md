# SEO-NOTES — corrections du 2026-07-20

Suite à l'audit `docs/audit/rapport-audit-2026-07-20.md`. Vérification : build 17 pages OK,
JSON-LD parsé et valide sur toutes les pages, Lighthouse accueil mobile SEO 100.

## 🔴 Critique corrigé
- **Image 404 dans le schema Product + og:image des 4 fiches produit.**
  Cause : `photo.src` (ImageMetadata) référençait un `.jpg` jamais émis au build — seuls
  les `.webp` du composant `<Image>` existaient. Fix : `getImage({ format: 'jpg', 1080×1080 })`
  dans `[slug].astro`, qui émet réellement le fichier. Vérifié : les 4 URLs du schema
  correspondent à des fichiers présents dans `dist/client/_astro/`.

## Corrections
- **Titles trop longs** (jusqu'à 87 caractères → max 70) : collection, comment-ca-marche,
  avis, comparatif, blog, pack-55, pack-gourde. Mot-clé principal en tête, marque en fin.
- **Descriptions > 160** raccourcies : avis, comparatif, utilisations, collection, a-propos.
- **FAQ dupliquée** : « Combien de perles par litre ? » était dans le schema FAQPage de
  `/comment-ca-marche/` ET `/utilisations/` → retirée d'utilisations (concurrence interne).
  Règle : une question de schema FAQPage = une seule page.
- **Schema accueil** : suppression du Product « catalogue » fictif qui agrégeait les avis
  de 2 produits (contraire aux consignes Google sur les avis). Organization enrichi
  (téléphone, email).
- **Breadcrumb** : map de libellés lisibles dans `BaseLayout.astro` (« Perles de Céramique EM »,
  « CGV »…) au lieu des slugs capitalisés envoyés à Google.
- **Page 404** créée (`src/pages/404.astro`, noindex, maillage vers packs et guides).
- **Polices auto-hébergées** (@fontsource) : supprime les requêtes render-blocking
  fonts.googleapis.com. Zéro requête externe désormais.

## Scores Lighthouse accueil mobile (local, non throttlé)
| | Avant | Après |
|---|---|---|
| SEO | 100 | 100 |
| Bonnes pratiques | 100 | 100 |
| Accessibilité | 95 | **100** |
| LCP / CLS | 396 ms / 0.00 | 395 ms / 0.00 |

## Restant / notes
- Run Lighthouse complet 16 pages × mobile+desktop à faire depuis la prod Cloudflare
  (les chiffres locaux ne reflètent pas le réseau réel).
- DataForSEO : recherche du 2026-07-20 toujours valide (docs/seo/strategie-seo.md).
- `robots.txt` garde `Disallow: /succes` en prévision de la page de confirmation Stripe.
