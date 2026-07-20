# Rapport d'audit complet — Aimez la Nature (2026-07-20)

Audit en 4 axes (SEO, Design, Sécurité, Marketing) sur le build de production (16 pages).
Preuves : `npm run build` OK, JSON-LD des 16 pages parsé et valide, Lighthouse accueil mobile
(SEO 100, Bonnes pratiques 100, Accessibilité 95), trace performance (LCP 396 ms local, CLS 0),
`npm audit` : 0 vulnérabilité.

Statuts : ✅ OK · ⚠️ À corriger · 🔴 Critique

---

## AXE 1 — SEO

| # | Point | Statut |
|---|---|---|
| 1 | Structure Hn, unicité title/description | ⚠️ Uniques et 1 H1 partout, mais 7 titles trop longs (65-87 car.) et 5 descriptions > 160 car. |
| 2 | JSON-LD rendu SSR + syntaxe valide | ✅ 16/16 pages, tous les blocs parsent, types corrects (Product, FAQPage, HowTo, Article, BreadcrumbList, Organization…) |
| 3 | Cohérence prix/stock affichés vs schema | 🔴 Prix/stock OK (source unique `products.ts`), MAIS l'URL `image` du schema Product et l'og:image des 4 fiches pointent vers un `.jpg` qui n'existe pas dans le build (seuls des `.webp` sont générés) → image 404 envoyée à Google et aux réseaux sociaux |
| 4 | Mots-clés vs vraies requêtes (DataForSEO) | ✅ La recherche DataForSEO date d'aujourd'hui même (2026-07-20, docs/seo/strategie-seo.md) — déjà actualisée, re-payer un appel serait inutile |
| 5 | Maillage interne produits ↔ guides | ✅ Solide et bidirectionnel (footer, sections guides, CTA packs) |
| 6 | sitemap.xml, robots.txt, canonicals, duplication | ⚠️ Tous OK, sauf : cannibalisation FAQ — la question « Combien de perles par litre ? » est dans le schema FAQPage de `/comment-ca-marche/` ET de `/utilisations/` (réponses quasi identiques) ; pas de page 404 personnalisée ; libellés de breadcrumb générés du slug (« Perles Ceramique Em », « Cgv ») envoyés tels quels à Google |
| 7 | Lighthouse 95-100 sur chaque page | ⚠️ Échantillon accueil mobile : SEO 100, BP 100, A11y 95 (contraste), LCP local 396 ms / CLS 0. Le run complet 16 pages × mobile/desktop sera fait après corrections pour l'avant/après. Risque perf identifié : Google Fonts render-blocking |
| 8 | llms.txt + citabilité GEO | ✅ llms.txt complet et cohérent avec products.ts ; blocs autonomes factuels présents (« Réponse courte », dosages, verdict en 30 s) |

Autres points relevés :
- ⚠️ Schema `Product` « catalogue » sur l'accueil avec `aggregateRating` global (96 avis agrégés de 2 produits) sans `offers` : contraire aux consignes Google (une note doit porter sur un produit précis). Risque : rich result ignoré ou avertissement Search Console.
- ⚠️ Schema `Organization` maigre : pas de `sameAs`, pas de téléphone/email dans le ContactPoint alors qu'ils existent (+33 1 84 80 15 22).
- ✅ 301 WooCommerce/Shopify/WordPress complètes dans `_redirects`.
- ℹ️ `robots.txt` interdit `/succes` qui n'existe pas encore (préparation Stripe) — inoffensif.

## AXE 2 — DESIGN

| # | Point | Statut |
|---|---|---|
| 1 | Anti-patterns design IA | ⚠️ Le skill `/impeccable` n'existe pas dans cet environnement — revue manuelle faite. Principal pattern IA : emojis utilisés comme icônes (🚚 🔄 💧 🇯🇵 💡) dans le trust strip, les fiches et les encarts |
| 2 | Cohérence visuelle globale | ✅ Très cohérente : palette crème/vert/brun, Playfair Display + Inter, rayons 2xl/3xl systématiques, eyebrows uppercase |
| 3 | Responsive 375/768/1440 | 🔴 Pas de menu mobile : la navigation est `hidden md:flex` sans hamburger. Sur mobile (< 768 px), il ne reste que le logo et « Commander » — 5 rubriques inaccessibles hors footer. Le reste du responsive est structurellement sain (grilles 1 col, tableaux scrollables) — vérification Playwright complète prévue après correction |
| 4 | États interactifs | ⚠️ Hover soignés partout ; AUCUN style `:focus-visible` personnalisé (navigation clavier peu visible) ; pas de formulaires donc pas d'états loading/erreur à auditer (commande = mailto) |
| 5 | Accessibilité | ⚠️ Alt 100 % OK, ARIA correct, mais Lighthouse confirme : contraste insuffisant du brun `#8B6F47` sur fond crème (eyebrows, prix barrés, CTA secondaire du hero — utilisé sur tout le site) ; pas de skip-link |
| 6 | Animations 21st.dev | ⚠️ Constat : il n'y a AUCUNE animation (uniquement des transitions CSS hover) et pas de GSAP installé, contrairement à ce que suppose le brief. Le MCP 21st.dev est disponible pour la phase corrections : scroll reveal léger + micro-interactions, sans dégrader LCP/CLS |
| 7 | Animations vs SSR JSON-LD | ✅ Sans objet aujourd'hui (aucun JS client) ; à re-vérifier après intégration |

Autre point : ⚠️ `font-bold` (700) est utilisé partout alors qu'Inter n'est chargée qu'en 400/500/600 → le navigateur fabrique un faux gras dégradé. Charger la 700 ou basculer sur 600.

## AXE 3 — SÉCURITÉ

| # | Point | Statut |
|---|---|---|
| 1 | Clés API en dur | ✅ Aucun secret dans le code (grep vide), aucun `.env`, Stripe pas encore intégré |
| 2 | Cloudflare WAF / rate limiting | ⚠️ Non vérifiable depuis le code (dashboard). Aucun endpoint dynamique aujourd'hui donc risque faible ; config WAF à prévoir au moment du checkout Stripe |
| 3 | PCI / tunnel Stripe | ✅ Direction validée = Stripe Payment Links : aucune donnée carte ne transite par le site (SAQ-A, le cas le plus sûr) |
| 4 | Headers de sécurité HTTP | ⚠️ Absents : le `_headers` généré ne contient que du Cache-Control. Ajouter CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS |
| 5 | Injections (formulaires, recherche) | ✅ Sans objet : aucun formulaire, aucune recherche interne, zéro JS client |
| 6 | Routes admin/debug exposées | ✅ Aucune (site 100 % statique, 16 pages connues) |
| 7 | CORS et cookies | ✅ Aucun cookie déposé, aucune API — conforme à ce qu'annoncent les mentions légales |
| 8 | Scan dépendances | ✅ `npm audit` : 0 vulnérabilité |

## AXE 4 — MARKETING & COPYWRITING

| # | Point | Statut |
|---|---|---|
| 1 | Titres orientés bénéfice | ✅ Globalement bons (« L'eau du robinet, purifiée naturellement », « Prêt à purifier votre eau ? ») |
| 2 | UVP explicite dès le hero | ✅ Présente : purification naturelle sans filtre/plastique/effort + différenciation vs carafes via le comparatif |
| 3 | Fiches produit AIDA | ⚠️ Attention/Intérêt/Désir OK ; l'Action est cassée par le CTA « Commander par email » (voir point 8) |
| 4 | Objections traitées en amont | ✅ FAQ produit + page Avis & science remarquables d'honnêteté (« est-ce que ça marche », « combien de temps », « danger ») |
| 5 | CTA génériques | ⚠️ « Commander », « Voir le pack », « En savoir plus » → à remplacer par des CTA bénéfice (variantes proposées dans le rapport) |
| 6 | Preuve sociale au-dessus de la ligne de flottaison | 🔴 Présente partout (4,93/5 · 96 avis) MAIS les 3 témoignages nominatifs de l'accueil (« Marie L. », « Thomas G. », « Sophie M. ») n'ont pas de source vérifiée — même risque juridique que l'épisode « 192 avis » (L121-2, pratique commerciale trompeuse). À remplacer par de vrais avis extraits des 96 vérifiés du site actuel, ou à retirer |
| 7 | Déclencheurs psychologiques | ⚠️ Garantie/autorité/cohérence OK. MAIS les prix barrés permanents (-23 %, -30 %, -25 %, -18 %) doivent respecter la directive Omnibus : le prix de référence doit être le prix le plus bas pratiqué sur les 30 derniers jours. À confirmer avec les prix réellement pratiqués sur le site actuel |
| 8 | Tunnel de conversion | 🔴 Friction majeure connue : commande par email avec « réponse sous 24 h » = le vrai tueur de conversion. Débloquage = vos liens Stripe Payment Links (en attente de votre côté, cf. todo) |
| 9 | Réassurance près du bouton d'achat | ✅ Livraison, garantie 30 j, dons — juste sous le CTA |
| 10 | Storytelling à-propos | ⚠️ Bon, sans greenwashing, mais « des associations spécialisées » (puits) reste vague — nommer l'association/le programme renforcerait la crédibilité |
| 11 | Cohérence du ton | ⚠️ Ton cohérent, MAIS incohérence factuelle sur le don : « 2,5 % de nos bénéfices » (footer, llms.txt) vs « 2,5 % de chaque commande » (accueil, à-propos) vs « 2,5 % de votre achat » (fiches). Juridiquement, ce n'est pas la même promesse. Emails de confirmation : inexistants dans ce repo, non auditables |
| 12 | Variantes A/B hero + CTA | ✅ Proposées ci-dessous |

### Variantes A/B proposées (à valider)

**Hero — H1 actuel : « L'eau du robinet, purifiée naturellement. »**
- V1 (coût/ancrage) : « Ne rachetez plus jamais d'eau. 19,90 € une fois, une eau meilleure pendant des années. » — ancre le prix contre le budget bouteilles/cartouches, répond à l'objection prix avant qu'elle n'arrive.
- V2 (ennemi commun) : « Le goût du chlore s'arrête ici. Sans filtre à racheter, sans bouteille à porter. » — cible la douleur n°1 (goût) + les 2 corvées connues ; le cerveau retient mieux ce qu'on lui enlève.
- V3 (preuve sociale d'entrée) : « 96 foyers ont dit adieu aux bouteilles. L'eau du robinet, purifiée naturellement. » — conformité sociale dès la première seconde, chiffre réel donc défendable.

**CTA principal (après mise en place de Stripe) :**
- V1 : « Purifier mon eau — 19,90 € » (bénéfice + prix = zéro surprise, réduit l'anxiété du clic)
- V2 : « J'essaie 30 jours sans risque » (transfert du risque sur la garantie — réciprocité)
- V3 : « Commander mon Pack 55 » (possession — « mon » augmente l'engagement vs « Commander »)

---

## PRIORISATION PROPOSÉE

**🔴 Critiques (à corriger en premier)**
1. Image 404 dans le schema Product + og:image des 4 fiches produit (SEO)
2. Menu mobile inexistant (Design)
3. Témoignages nominatifs non sourcés sur l'accueil (Marketing/juridique)
4. Incohérence « bénéfices vs commande » sur le don 2,5 % (Marketing/juridique) — nécessite votre réponse : quelle est la vraie formule ?
5. Prix barrés vs directive Omnibus — nécessite votre confirmation des prix pratiqués sur 30 jours

**⚠️ À corriger ensuite**
- SEO : titles/descriptions trop longs, FAQ dupliquée entre /comment-ca-marche/ et /utilisations/, schema accueil (aggregateRating), Organization enrichi, page 404, libellés breadcrumb
- Design : contraste #8B6F47, focus-visible, Inter 700, icônes SVG à la place des emojis, animations 21st.dev légères
- Sécurité : fichier `_headers` avec CSP/HSTS/XFO/XCTO/Referrer-Policy
- Marketing : CTA bénéfice, nommer l'association des puits, rapatrier de vrais avis sur les fiches

**Bloqué côté utilisateur** : liens Stripe Payment Links (friction n°1 du tunnel).
