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

## Paiement Stripe — état réel (2026-07-23)
Direction finale : **pas** de Payment Links. `src/pages/api/checkout.ts` crée une vraie
session Stripe Checkout côté Worker Cloudflare, prix TOUJOURS recalculés serveur depuis
products.ts (un panier trafiqué dans la console ne peut pas changer le montant débité).

- [x] Récapitulatif des articles envoyé dans `payment_intent_data[description]`
      (ex. `Pack 100 Perles ×2, Gourde Écologique ×1`, coupé à 500 car., limite Stripe 1 000)
      → sert au reçu client ET de bon de préparation dans la liste des paiements du dashboard
  - ✅ Vérif 2026-07-23 : `npm run build` OK 26 pages · paramètre présent dans le bundle
    (`dist/server/chunks/checkout_3O-oUl5J.mjs:338`) · chaîne rejouée avec les 4 vrais
    shortName (18/40/56 car.) · reste NON vérifié faute de clé Stripe : le rendu réel
    du reçu — à contrôler au 1er paiement en mode test

### Après-paiement — décidé, pas encore fait
Aujourd'hui : aucun webhook, aucun email envoyé par nous, aucune commande stockée.
Niveau retenu = **niveau 1** (webhook Cloudflare + provider email), à faire APRÈS la
finalisation du site et le choix du provider (Brevo pressenti : UE/FR, ~300 mails/jour
gratuits ; Resend en alternative ; ❌ MailChannels n'existe plus en gratuit sur Workers).

- [ ] Cocher « Paiements réussis » dans Stripe → Emails clients (`dashboard.stripe.com/settings/emails`)
      — désactivé par défaut, sinon le client ne reçoit RIEN. À garder actif même au niveau 1
      (filet de sécurité si le webhook plante). ⚠️ En mode test, Stripe n'envoie ces reçus
      qu'à TES adresses vérifiées : un email de test qui n'arrive pas ≠ panne.
- [ ] `src/pages/api/stripe-webhook.ts` : vérif de signature (Web Crypto, sans SDK, comme
      checkout.ts) → email de confirmation client + alerte marchand
- [ ] Anti-doublon (Stripe rejoue les événements) : mémoriser `event.id` dans Cloudflare KV
- [ ] DNS SPF/DKIM sur aimezlanature.fr pour envoyer depuis contact@ — ⚠️ domaine chez
      Hostinger, accès utilisateur requis. C'est le vrai point bloquant, à anticiper.
- [ ] Test bout en bout en mode test Stripe avant le passage en réel

### ⚠️ DETTE ASSUMÉE — à lever avant toute mise en ligne
`src/pages/commande-confirmee.astro` promet « un email de confirmation **avec le détail de
votre commande** ». C'est FAUX tant que le webhook n'existe pas (le reçu Stripe ne contient
ni adresse de livraison, ni délai, ni rétractation). Correction volontairement reportée : le
texte final sera écrit UNE fois, avec le webhook, pour annoncer les deux emails
(confirmation détaillée + reçu Stripe). Sans risque tant que ce build n'est pas en prod
(la prod actuelle est l'ancien site Hostinger).
**Si le site est déployé avant le webhook → reformuler ce texte AVANT le déploiement.**

### À trancher avec le marchand avant la vente réelle
- [ ] TVA : la SAS est-elle assujettie ? Aucune mention TTC/HT sur le site, aucun calcul de taxe côté Stripe
- [ ] Facture sur demande (B2C) : utiliser `invoice_creation` de Stripe plutôt que de bricoler
- [ ] Stock : `inStock` est en dur dans products.ts, rien ne limite les quantités vendues

## Audit design & conversion (2026-07-22) — RAPPORT FAIT, corrections à valider
Rapport complet : `docs/audit/audit-design-2026-07-22.md`
Build `fe81b54` OK (25 pages) · mesures faites au navigateur sur le build réel, 1440 px et 390 px.

⚠️ MCP 21st : `logo_search` OK, mais les endpoints composants renvoient une réponse vide
(bug serveur 21st, clé API valide). Et 21st génère du **React** alors que le projet est Astro pur
avec CSP stricte → l'utiliser comme inspiration, porter à la main en `.astro`.

- [x] Lot A — conversion : sticky add-to-cart mobile · visuel produit dans le hero mobile ·
      filet de sécurité `data-reveal` (cartes produits sans opacity:0, blocs isolés en try/catch dans site.js) ·
      `sizes`/`widths` collection (widths [320,560,1120], sizes 560px)
- [x] Lot B — copywriting : note Amazon reformulée en VOLUME (« + 816 commentaires sur Amazon (4,6/5) »,
      plus d'étoiles concurrentes) · CTA en bénéfice (« Purifier mon eau », « Choisir mon pack ») ·
      « Livraison en 2-5 jours — offerte dès 50 € » + « Satisfait ou remboursé 30 j » dans le BuyBox
- [x] Lot C — finition : logo `whitespace-nowrap` + CTA header masqué < sm · animation tiroir (slide + fondu) ·
      cross-sell avec images (grid auto-fit) · 1er paragraphe description en accroche · fil d'Ariane en `<nav aria-label>`
- [x] BONUS bug corrigé : jauges de répartition des notes (ProductReviews) étaient vides en prod —
      `style="width:…"` inline bloqué par la CSP `style-src 'self'` → passées en `data-p` + classe CSS externe
- [x] BONUS bug corrigé : barre collante inerte (IntersectionObserver sur repère de hauteur 0 ne se
      déclenchait jamais) → remplacé par handler scroll throttlé en requestAnimationFrame
- [x] Contraste `#75592F → #6E5330` propagé PARTOUT y compris les 2 occurrences dans cart.js (RÈGLE N°1)
- ✅ Vérifications (2026-07-23) : `npm run build` OK 26 pages · 0 occurrence de `#75592F` dans dist ·
      contrôle navigateur build réel : barre collante masquée en haut / apparaît après le BuyBox (fix scroll+rAF) ·
      clic barre → +2 au panier (palier coché), tiroir ouvert, total 33,84 € synchro barre/panier · jauges de notes
      remplies aux bonnes largeurs (41/4/0/0/0) · note Amazon en volume + réassurance BuyBox affichées
- [ ] ⚠️ À faire confirmer par le marchand AVANT affichage : comparatif chiffré
      « bouteilles vs perles » (P2.4), délai transporteur réel (P2.3), galerie/visuels d'usage (P2.5, 4.5)

## Design premium via skills ui-ux-pro-max + impeccable (2026-07-23) — FAIT ✅
- [x] Recherche best-practices avec ui-ux-pro-max (base locale) : pattern retenu = Before-After
      Transformation. Sortie « Liquid Glass » bleu/cyan écartée (casserait la DA naturelle existante).
- [x] 3 solutions proposées → retenu Solution B (rendre tangible le bénéfice cœur), la seule
      encore inexploitée (preuve sociale déjà forte, polish = terrain d'impeccable)
- [x] Implémenté `src/components/BenefitTransformation.astro` : bande vert nuit avant/après,
      3 effets DÉJÀ affirmés (chlore/goût, calcaire, plastique), zéro chiffre inventé, sans JS
- [x] impeccable critique (mode dégradé single-context, sous-agents interdits sans demande) :
      Nielsen 33/36 (92 %, Excellent) · détecteur mécanique 0 défaut réel (2 faux positifs header,
      1 note em-dash) · contrastes du module mesurés ≥ 4,5:1 (avant 5,30 / après 12,22 / titre 13,88)
- ✅ Vérif checklist : UX·UI·A11y·Responsive·SEO·Perf·Conversion·Cohérence·Mobile — tout vert
- ⚠️ Plafond premium restant = ASSETS non fabricables (photos usage/détail par produit) +
      chiffres à confirmer marchand. Ne PAS « itérer » du décoratif au-delà : le premium tient
      maintenant à ces assets réels. Commits fe81b54→3ebd4ad poussés sur origin/master.
- 📦 Skills installés dans `.agents/skills/` (symlink `.claude/skills/`) : ui-ux-pro-max, impeccable.
      Aucun hook auto-enregistré. impeccable fait des appels externes (génération d'images) = clé API
      requise pour ces fonctions ; les fonctions audit/critique restent locales.

## Offre revendeur B2B (2026-07-23) — LIVRÉE, non publiable en l'état
Page `/revendeurs/` pour les boutiques bio et vendeurs pro. Plan complet :
`C:\Users\consu\.claude\plans\ajouter-une-offre-kind-quiche.md`

- [x] Recherche DataForSEO préalable (~0,05 $) : « grossiste perles de céramique », « perles de
      céramique en gros », « revendeur produits écologiques » = **0 recherche/mois**. Conclusion :
      ce n'est PAS un levier SEO → une seule page de démarchage, pas de cluster, hors menu principal.
- [x] `src/data/revendeur.ts` (source unique) · `src/pages/revendeurs/index.astro` ·
      `revendeurs/merci.astro` (noindex) · `components/RevendeurForm.astro` ·
      `pages/api/revendeur.ts` · `public/js/revendeur.js`
- [x] Modifs minimales du site existant : 1 lien dans le footer, filtre sitemap, bloc llms.txt,
      `revendeurs` dans les libellés de fil d'Ariane
- [x] **Aucun chiffre de remise** : `paliersRemise` est un tableau VIDE, la page affiche le
      principe. Le jour où le marchand valide sa grille → remplir ce seul tableau, rien d'autre.
- [x] BONUS bug corrigé : `/commande-confirmee/` (noindex) partait dans le sitemap — le filtre
      d'`astro.config.mjs` visait `/succes`, page supprimée depuis. Corrigé pour les deux pages.
- ✅ Vérifications : build 0 erreur · sitemap 25 URLs, `/revendeurs/` dedans, merci et
      commande-confirmee dehors · noindex présent · 5 questions FAQPage complètes, 0 doublon
      introduit · **0 chiffre de remise dans dist** · 7 cas de la route testés au réel
      (503 sans clé + adresse de secours, piège robot → 303, champs manquants, email invalide,
      SIRET court, envoi instantané, réponse JSON) · formulaire testé au navigateur 1440 et 390 px ·
      contrastes mesurés 7,26 à 17,45:1 · piège hors écran et non focusable · 0 débordement
      horizontal · tous les fichiers ≤ 203 lignes

### ⛔ Ne PAS publier cette page tant que :
1. **Domaine vérifié chez Emailit** — Emailit refuse d'envoyer depuis un domaine non vérifié
   (pas d'option « expéditeur validé par clic » comme Brevo). Il faut poser les enregistrements
   SPF/DKIM dans les DNS de aimezlanature.fr, **hébergés chez Hostinger** → accès utilisateur.
   Ce même réglage servira aux emails clients du niveau 1 : un seul travail pour les deux.
2. `EMAILIT_API_KEY` (+ `EMAILIT_FROM` si l'expéditeur diffère de `notifications@aimezlanature.fr`)
   dans les variables Cloudflare, et `.dev.vars` en local.
3. **CGV pro** : les CGV du site sont B2C (rétractation 14 j) et ne doivent pas encadrer une
   commande revendeur. La page annonce déjà que les conditions pro arrivent avec le devis.
4. Droit de sous-distribuer à confirmer auprès du fournisseur EM (le site affirme déjà
   « revendeur agréé EM, partenaire officiel »).
- ⚠️ Jamais vérifié faute de clé : l'envoi réel d'un email par Emailit. À tester au premier essai.

## Reprise de la présentation interactive Manus (2026-07-23) — 3 ajouts FAITS
Le marchand a fait analyser une présentation externe (aimez-nat-*.manus.space, 8 chapitres).
Retenu 3 éléments sur 5 (validés par lui) : rituel 3 verbes, les 4 irritants, l'e-book.
Idées reprises, PAS le format (diaporama JS = incompatible CSP + mauvais SEO).

- [x] **Les 4 irritants** : nouveau composant `src/components/Irritants.astro` (« Le problème
      n'est pas l'eau » — goût/chlore, packs, plastique, tartre), inséré sur l'accueil entre la
      TrustStrip et les packs. Décrit le PROBLÈME, jamais un effet produit → rien à sourcer.
      Extrait en composant car index.astro dépassait 400 lignes (plafond mou).
- [x] **Rituel 3 verbes** : ajout d'un champ `verbe` aux `steps` d'index.astro + accroche
      « Déposez. Patientez. Régénérez. » sous le titre « Comment ça marche ». Contenu factuel
      inchangé, seule la forme mémorisable est ajoutée.
- [x] **E-book** : PDF fourni (CloudFront) auto-hébergé dans `public/guide-perles-de-ceramique-em.pdf`
      (68 p, 1,1 Mo), lien dans le BuyBox « Guide d'utilisation offert — le feuilleter (PDF,
      68 pages) ». Poids/format annoncés dans le libellé, `target=_blank rel=noopener`.
- ✅ Vérifs : build OK · PDF servi en application/pdf (1 144 366 o) · rendu navigateur 1440 +
      390 px (0 débordement) · contrastes du bloc irritants 7,14 à 17,45:1 (n° déco 3,62 = large
      text, seuil 3:1, teinte #9C8358 déjà utilisée par « Comment ça marche ») · espaces des 2
      nouveaux liens corrects dans dist (`{' '}`)

### ⚠️ Écartés (proposés mais NON retenus / à surveiller)
- Éléments 1 (module « forme réelle » 7-9 mm) et 2 (audit « 10 ans » du blog) : non demandés
  cette fois. L'audit « 10 ans » reste une DETTE réelle : le blog affirme sans source « garantit
  10 ans », « économie 2 000-8 000 € sur 10 ans », « 400 kg plastique évités » — même famille que
  les « 192 avis » supprimés. À traiter un jour.
- L'e-book est le document OFFICIEL du fabricant EM, fourni par le marchand qui est revendeur
  agréé EM avec la documentation scientifique du procédé Higa. La terminologie EM (« antioxydant »,
  « revitalisation », « structure de l'eau ») est donc celle de la marque distribuée, pas une
  invention — publié à la demande du marchand, sans réserve sur l'authenticité. Seul point de
  vigilance étroit, sans présumer quoi que ce soit : garder de quoi justifier les 2 chiffres
  « 120 x moins coûteuse » et « 10 ans » si un client le demande (marchand informé). NE PAS
  reformuler cette nuance en jugement global — cf. l'entrée du 2026-07-23 dans lessons.md.
- Nom « Perles grises » / « Grey Pipes » : 10 recherches/mois, NON introduit (un nom de produit
  de plus nuirait à la clarté).

## En attente
- [ ] Pack Gourde : au retour en stock, travailler l'angle « gourde filtrante » (12 100/mois)
- [ ] « Gourde écologique » seule existe dans le catalogue en ligne mais pas sur ce site — à ajouter plus tard (angle SEO « gourde filtrante »)
- [ ] ⚠️ Mentions légales : hébergeur indiqué = Hostinger (site actuel). Si ce build Astro passe en prod sur Cloudflare, mettre à jour

---

## Dépôt d'avis natif par les clients (2026-07-28)

**Demande** : permettre aux clients de déposer un avis, sans service tiers.
**Constat de départ** : impossible aujourd'hui — `src/data/reviews.ts` est écrit à la main,
aucune route `/api/avis`, aucun formulaire hors revendeur, et la CSP (`connect-src 'self'`,
`form-action 'self'`) bloquerait de toute façon un widget type Judge.me / Trustpilot.

### Choix d'architecture validés avec le marchand
1. **Aucune base de données** — l'avis part par email chez le marchand (même canal Emailit que
   le formulaire revendeur). Il valide, l'avis est ajouté à `reviews.ts`, le site se redéploie.
   → zéro donnée client stockée, zéro surface d'attaque, zéro coût, modération par construction.
2. **Vérification d'achat via Stripe** — l'email saisi doit correspondre à une Checkout Session
   payée. Le badge « Achat vérifié » de `ProductReviews.astro:101` reste donc VRAI, et
   l'`aggregateRating` envoyé à Google continue de refléter de vrais acheteurs.
   → **fail-closed** : si Stripe est injoignable ou la clé absente, l'avis est REFUSÉ, jamais
   accepté « au bénéfice du doute ». Un avis non vérifié publié avec ce badge serait une
   pratique commerciale trompeuse (L121-2), exactement ce que `reviews.ts:5` interdit.
3. **Formulaire sur la fiche produit**, replié dans un `<details>` juste sous les avis.

### Étapes
- [x] `src/lib/antispam.ts` — piège + horodatage extraits en source unique, `revendeur.ts` les
      ré-exporte (évite que les deux formulaires divergent — RÈGLE N°1)
- [x] `src/data/avis.ts` — champs, limites, notes, adresse destinataire
- [x] `src/pages/api/avis.ts` — validation serveur, anti-robot, vérif Stripe, email au marchand
      avec la ligne `reviews.ts` prête à coller
- [x] `src/components/AvisForm.astro` — `<form method="post">` natif, fonctionne sans JavaScript
- [x] `public/js/avis.js` — amélioration progressive (horodatage, envoi sans rechargement)
- [x] `src/pages/avis/merci.astro` — confirmation sans JavaScript (noindex)
- [x] Branchement dans `[slug].astro` sous `<ProductReviews>` + filtre sitemap

### Limites assumées (à dire au marchand, pas à masquer)
- Pas de limitation de débit (pas de KV/base) : la barrière est le piège anti-robot, le délai
  minimum ET surtout l'obligation d'un email ayant réellement payé.
- Pas de détection de doublon automatique : deux avis du même client passent, la modération
  manuelle les voit.
- La vérification confirme « cette personne a acheté sur le site », pas « elle a acheté CE
  produit précis » — suffisant pour « Achat vérifié », à resserrer si besoin plus tard.

---

## Migration de la base clients WooCommerce (2026-07-29) — TERMINÉ

**Extraction** via l'API REST WooCommerce (clé en lecture seule, révoquée après usage).
Fichiers dans `Documents\aimezlanature-archives\` — volontairement HORS du dépôt, qui est public.

- [x] `commandes-brutes.json` — 9,7 Mo, archive intégrale (conservation légale 10 ans)
- [x] `commandes.csv` — 1 686 commandes, 13 colonnes
- [x] `clients.csv` — 1 550 personnes, agrégées (nb achats, total, dates, produits)
- [x] Import des 1 550 contacts dans Emailit, audience `aud_4HBuCHDHyTyTPpfHPijqc3akYzG`
      (1 549 ajoutés + 1 test, 0 échec, vérifié côté Emailit)

### Chiffres relevés
CA cumulé 55 447 € · panier moyen 33,48 € · période 07/10/2020 → 20/07/2026
Commandes par an : 2020 200 · 2021 415 · 2022 367 · **2023 514** · 2024 141 · **2025 12** · 2026 37
→ **1 507 des 1 550 clients n'ont pas acheté depuis plus de 12 mois** (97 %)

### Décisions
- **AITable écarté** : société canadienne, DPA non fourni d'après leur propre équipe conformité
  (info ~2023, à revérifier). Surtout, les commandes sont figées et les nouvelles arrivent dans
  Stripe → l'outil aurait créé une vue coupée en deux. Le CSV suffit pour le SAV.
- **Attributs Emailit impossibles** : l'API accepte `custom_fields`, répond 201, stocke un objet
  vide (5 formats testés, aucun endpoint de déclaration). Les attributs restent dans `clients.csv`,
  la segmentation se fait par filtre Excel puis audience dédiée.

### Avant la première campagne
- [ ] Monter en volume progressivement (100-200 d'abord) : domaine d'envoi neuf, adresses vieilles
      de 6 ans, risque de réputation sur un envoi massif d'un coup
- [ ] Comprendre la chute 2024-2025 avant d'investir dans la relance
