# TODO — Aimez la Nature

---

# ⏸️ REPRENDRE ICI — règle de pare-feu en brouillon (arrêt le 2026-07-30)

**Une règle est préparée sur Vercel mais PAS publiée. Elle n'existe nulle part dans ce dépôt :
c'est un brouillon côté Vercel, invisible d'un `git status`.** Sans cette note, la prochaine
session la referait de zéro — ou pire, croirait la protection en place.

### État exact au moment de l'arrêt

| Élément | État |
|---|---|
| CLI Vercel | **installée** (v58.4.0), connecté comme `sagesprime` |
| Dossier rattaché | ✅ `aimezlanatureseo` (`prj_AxqIcUMlk1i3lbacS9qAghFdumaY`) — **pas** l'autre projet `aimezlanature`, dont le nom ressemble à celui du dossier |
| Règle | **staged (brouillon)**, `rule_limite_paiement_sK41Kp` |
| Protection réelle aujourd'hui | ❌ **aucune** au-delà du limiteur applicatif, qui ne bloque pas le parallélisme |

La règle en attente :

```
Nom        : Limite paiement
ID         : rule_limite_paiement_sK41Kp
Condition  : le chemin commence par /api/checkout
Comptage   : 30 requêtes / 60 s, par adresse IP
Si dépassé : log   ← n'empêche RIEN, se contente d'enregistrer
```

Deux garanties de cette forme : la condition ne touche **que** `/api/checkout`, donc elle ne peut
pas atteindre `/api/stripe-webhook` où un blocage casserait les emails de commande en boucle de
rejeu ; et l'action `log` ne peut refuser personne, même mal réglée.

### Étape 1 — publier (action du marchand)

```bash
vercel firewall publish --yes
```

Rien n'est actif tant que cette commande n'a pas tourné. `vercel firewall diff` montre ce qui
partira, `vercel firewall discard --yes` abandonne le brouillon.

### Étape 2 — observer avant de bloquer

```bash
npm run check:ratelimit https://aimezlanatureseo.vercel.app
```

La rafale de 30 appels parallèles doit apparaître dans le journal de la règle **sans être bloquée**
(action `log`). Puis relire le trafic réel :

https://vercel.com/saddikis-projects/aimezlanatureseo/firewall/traffic?filter=rule_limite_paiement_sK41Kp

Ce qu'on cherche : **une IP légitime dépasse-t-elle 30 paiements par minute ?** Normalement jamais.
Le risque à écarter est un réseau d'entreprise ou un opérateur mobile qui fait sortir plusieurs
clients par la même adresse.

### Étape 3 — bloquer pour de vrai

```bash
vercel firewall rules edit "Limite paiement" \
  --condition '{"type":"path","op":"pre","value":"/api/checkout"}' \
  --rate-limit-action rate_limit --yes
vercel firewall publish --yes
```

⚠️ `edit --condition` **remplace** toutes les conditions : il faut donc la redonner en entier, même
inchangée. `rate_limit` renvoie un **429** (et non `deny`/403) : c'est le code que `cart.js` sait
afficher proprement depuis le correctif `5375a98`.

### Le critère qui prouve que c'est fini

```bash
npm run check:ratelimit https://aimezlanatureseo.vercel.app
```

Il sort **en erreur aujourd'hui**, volontairement. Il doit passer **au vert** après l'étape 3 —
c'est la preuve que le trou est bouché, pas une affirmation.

### Pourquoi tout ce travail (résumé d'une ligne)

Le limiteur applicatif laisse passer **30 appels sur 30** envoyés en parallèle, et une telle rafale
épuise le budget d'API **Stripe du compte** : les vrais clients ne peuvent alors plus payer. Détail
mesuré et sources plus bas dans ce fichier, et dans `docs/audit/rapport-pre-bascule-2026-07-29.md`,
section « Le mur ».

---

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

### ✅ DETTE LEVÉE (vérifié le 2026-07-30)
`src/pages/commande-confirmee.astro` promettait « un email de confirmation avec le détail de
votre commande » alors qu'aucun webhook n'existait — la promesse était fausse. Le webhook
`api/stripe-webhook.ts` envoie désormais ce mail détaillé (commit `c21833d`), et le texte de
la page annonce les deux envois : « un email de confirmation avec le détail de votre commande
**et votre reçu** ». La promesse est donc tenue, plus rien à reformuler avant la bascule.

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

### Conditions de publication — levées le 2026-07-30, sauf une (état vérifié)
La page **est publiée** : lien dans le pied de page, et présente au sitemap de production
(24 URLs, contrôlé sur le déploiement réel `8b4b192`). Reprise des 4 conditions d'origine :

1. ✅ **Domaine vérifié chez Emailit** — fait le 2026-07-29. Les enregistrements vivent sur le
   sous-domaine `emailit.*`, donc sans toucher aux MX de la boîte mail existante.
2. ✅ **`EMAILIT_API_KEY` en production** — prouvé indirectement mais solidement : les emails de
   confirmation de commande partent réellement en production, et les trois routes
   (`avis`, `revendeur`, `stripe-webhook`) passent par **le même** `src/lib/email.ts`.
   ⚠️ Reste non éprouvé : l'envoi déclenché par CE formulaire précis (le gabarit, pas l'envoi).
3. ✅ **CGV pro** — traité par construction, pas contourné : aucune commande pro ne peut passer en
   ligne (formulaire → devis), et la FAQ de la page l'écrit noir sur blanc — « les CGV publiées sur
   ce site encadrent les ventes aux particuliers et ne s'appliquent pas à une commande
   professionnelle ». Les conditions dédiées arrivent avec le devis.
4. ⏳ **Droit de sous-distribuer** — SEULE condition encore ouverte, à confirmer auprès du
   fournisseur EM. Le site affirme déjà « revendeur agréé EM, partenaire officiel ».

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

---

## Chantier 2026-07-30 — Google Ads + bandeau de consentement

Décisions du marchand : bandeau MAISON (pas Cookiebot, contrairement au WordPress),
et suivi pages vues + achat avec l'étiquette de conversion à remplir plus tard.

Relevé sur le WordPress : `AW-17799798810`, Consent Mode v2 déjà en place (defaults
`denied` sur UE+UK+CH), tag posé par le plugin WooCommerce Google Listings & Ads
(`groups: "GLA"`, `developer_id.dOGY3NW`) — plugin inexistant sur Astro, les
événements doivent donc être recréés à la main.

### Ordre d'exécution
- [x] 1. `src/data/tracking.ts` — source unique : ID Ads, étiquette de conversion (vide),
      clés de stockage, durée de validité du consentement
- [x] 2. `vercel.json` — ouvrir la CSP aux domaines Google **documentés** (liste
      officielle developers.google.com/tag-platform/security/guides/csp, pas devinée)
- [x] 3. `public/js/consentement.js` — Consent Mode v2 en `denied` AVANT tout, lecture
      du choix stocké, chargement de gtag.js UNIQUEMENT après acceptation, pilotage du
      bandeau. Fichier externe : `script-src` interdit l'inline.
- [x] 4. `src/components/BandeauCookies.astro` — « Accepter » et « Refuser » au MÊME
      niveau (exigence CNIL), `position: fixed` pour ne pas réintroduire de CLS
- [x] 5. `src/styles/global.css` — styles du bandeau (CSS externe, CSP)
- [x] 6. `BaseLayout.astro` — inclure le bandeau + le script
- [x] 7. `Footer.astro` — « Gérer les cookies » (retrait du consentement aussi facile
      que son octroi — exigence CNIL)
- [x] 8. `api/checkout.ts` — renvoyer le montant autoritatif avec l'URL Stripe
- [x] 9. `public/js/cart.js` — mémoriser le montant avant la redirection Stripe
- [x] 10. `public/js/commande.js` — envoyer la conversion d'achat, avec `transaction_id`
      = session Stripe pour que Google dédoublonne un rechargement de page
- [x] 11. `mentions-legales.astro` — section Cookies réécrite (finalité, durée, retrait)
      ET **hébergeur Hostinger → Vercel** : mention obligatoire (LCEN) devenue fausse
      avec la migration, avertissement déjà noté dans ce fichier le 2026-07-20

### Vérifications exigées avant de dire que c'est fini
- [x] Aucune requête vers Google AVANT clic sur « Accepter » (onglet réseau)
- [x] Après « Refuser » : toujours aucune requête, et le choix survit à un rechargement
- [x] Après « Accepter » : gtag.js chargé, `consent update granted`, aucune violation CSP
      dans la console
- [x] CLS toujours à 0,00 avec le bandeau affiché
- [x] Build OK, et le webhook Stripe toujours intact

---

## Contrôle d'état du 2026-07-30 (fin de journée) — tout est en ligne

Vérifié sur Vercel et sur le site réel, pas d'après les notes.

- **Merges** : `master` = `origin/master` = `8b4b192`, **0 PR ouverte**. Le déploiement de
  production `dpl_BJCyp…` porte ce même commit → le code déployé EST le code local.
  Les 20 derniers déploiements sont tous `READY`.
- **Redirections** : `node scripts/check-redirects.mjs https://aimezlanatureseo.vercel.app`
  → **220/220 OK**. C'était l'étape J-3 n°2 du plan de bascule, la seule non vérifiable en
  local. Elle est faite, sur le commit du jour.
- **Consentement** : 3 scripts locaux seulement, **0 occurrence de `googletagmanager`** dans le
  HTML servi → rien de Google avant acceptation. Balise Search Console présente
  (`UhQ55Ibs…`, identique au WordPress). CSP en place, `style-src 'self'` intact.
- **Contenu** : 8 pages clés en 200, sitemap 24 URLs (`/revendeurs/` dedans, 0 page de tunnel),
  mentions légales annonçant bien **Vercel** comme hébergeur.
- **Paiement** : `POST /api/checkout` → 200, session `cs_test_…`, `montant: 24,80 €`.
  Tunnel fonctionnel, Stripe en test — volontaire.

### 🔴 Le limiteur anti-abus ne tient pas face au parallélisme (mesuré le 2026-07-30)

Rejouée avec 30 appels sur `/api/checkout`, même IP, même région, en ne changeant QUE la façon
d'envoyer :

| Façon d'envoyer | Sessions Stripe créées | Bloqués (429) |
|---|---|---|
| en série | 10 | **20** ✅ |
| en parallèle | **27** | **0** ❌ |

Le compteur vit en mémoire, donc par instance de fonction, et Vercel en démarre autant que la
charge l'exige : ~3 instances × 10 = 27. **Plus l'attaque est forte, plus le plafond monte.**

Le dégât réel n'est pas le coût mais **l'indisponibilité de la vente** : les 3 appels en échec
étaient des 502 causés par `Stripe: Request rate limit exceeded`. Les limites Stripe se comptent
**par compte** (25 req/s en test, 100 en réel, 25 par endpoint par défaut) — après la bascule, une
rafale empêcherait les vrais clients de payer pendant qu'elle dure.

- [x] Vérité rétablie dans `src/lib/rateLimit.ts` (l'en-tête affirmait qu'il fallait se répartir sur
      plusieurs IP ou régions pour passer — faux, le parallélisme depuis une machine suffit)
- [x] Rapport corrigé : ligne du tableau de synthèse en 🟠 « P0 avant bascule », encadré de mesure,
      conclusion réécrite, étape J+30 périmée remplacée
- [x] Vérifié dans la doc Vercel : **le rate limiting du pare-feu est inclus dès Hobby** (1 règle par
      projet, clé IP, fenêtre 10 s-10 min, 1 M de requêtes incluses, trafic bloqué non facturé).
      Le plan n'est PAS l'obstacle — c'est lui qui avait tué la version Cloudflare, j'avais transposé
      la crainte sans la vérifier
- [x] Écartés et documentés : SDK `@vercel/firewall` (consomme la même unique règle et laisse la
      rafale atteindre notre code), Redis Upstash (dépendance inutile), BotID (exigerait d'ouvrir
      la CSP `script-src 'self'`)
- [x] `scripts/check-rate-limit.mjs` + `npm run check:ratelimit` — contrôle VERSIONNÉ qui rejoue les
      deux rafales et sort en erreur si la parallèle n'est pas freinée. Il remplace les « 13 tests
      unitaires » annoncés dans le rapport, qui avaient tourné dans un dossier temporaire et
      n'avaient jamais été versionnés (donc irrejouables). Rouge aujourd'hui = normal : c'est le
      critère d'acceptation de la règle de pare-feu. Refuse de tourner sur une boutique en mode live
      sans `--live`, pour ne pas épuiser le budget Stripe d'un site qui vend.
- [x] **Parcours vérifié au navigateur (Playwright)** : bandeau OK, 0 requête Google après « Refuser »,
      0 violation CSP, fiche → panier → Stripe (`Environnement de test NATURALIS VERT`), et quota
      épuisé → message dans un `role="alert"` avec l'adresse de commande par email, panier conservé,
      bouton re-cliquable. La dégradation est bien construite.
- [x] **BUG corrigé, trouvé par ce test** : `cart.js` appelait `r.json()` avant de tester le code
      HTTP. Sans effet aujourd'hui, mais la règle de pare-feu répond du **HTML** : le client aurait
      lu « Unexpected token '<' … is not valid JSON » au milieu d'une phrase française.
      Corps lu en texte + `JSON.parse` dans un `try` + message dédié au 429. Contre-épreuve jouée au
      navigateur sur une réponse `429 + text/html` : avant/après documentés dans le rapport.
      ⚠️ Ordre des seuils à NE PAS inverser : limiteur applicatif à 10 (l'humain clique en série et
      reçoit le bon message), pare-feu à 30 (l'attaquant tape en parallèle et est coupé à l'entrée).
- [ ] ⏳ **ACTION MARCHAND, avant la bascule** — poser la règle de pare-feu sur `/api/checkout` :
      `npm i -g vercel` puis `vercel link`, poser la règle en `--rate-limit-action log`,
      `vercel firewall publish --yes`, relire le trafic dans le tableau de bord, puis repasser en
      `rate_limit` (429) et republier. Commandes exactes dans la section « Le mur » du rapport.
      ⚠️ La règle porte sur `/api/checkout` SEULEMENT : un 429 sur le webhook casserait les emails.

### 🔵 `aimezlanatureseo.vercel.app` est PUBLIC — et c'est voulu
Les trois autres adresses du projet (URL de déploiement, alias de branche, alias d'équipe)
renvoient un **302** vers la connexion Vercel ; l'alias de production, lui, répond **200 sans
authentification**. Le marchand l'a confirmé le 2026-07-30 : le site est déployé sur cette
adresse de test pour éprouver les flux avant la bascule, et **doit rester accessible**.

Ne PAS le signaler comme un défaut. Conséquences connues et assumées :
- aucun `X-Robots-Tag: noindex` (Vercel n'en pose que sur les previews) et `robots.txt` en
  `Allow: /` → l'adresse est crawlable. Le garde-fou est le `canonical`, qui pointe vers
  `https://aimezlanature.fr/…` sur toutes les pages : Google consolide vers le vrai domaine.
- le tunnel de paiement y est atteignable **en mode test**. Un inconnu qui tenterait d'y
  commander ne serait pas débité. Risque accepté jusqu'à la bascule.
- ⚠️ Le rapport d'audit affirmait « déploiement protégé par SSO » : vrai de l'URL de
  déploiement testée alors, faux de l'alias de production. Corrigé dans le rapport.
