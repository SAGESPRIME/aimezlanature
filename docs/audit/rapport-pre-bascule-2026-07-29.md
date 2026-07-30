# Rapport pré-bascule DNS — WordPress → Astro/Vercel

**Date :** 2026-07-29
**Ancien site :** https://aimezlanature.fr (WordPress + WooCommerce, nginx/Hostinger)
**Nouveau site :** projet Vercel `aimezlanatureseo`, déploiement production = commit `5626893` (master)
**Périmètre vérifié :** build local (29 pages HTML), déploiement Vercel réel, sitemap WordPress en ligne (67 URLs)

## Note de méthode — sur quoi porte cet audit

L'URL de préproduction fournie (`...git-depot-avis-clients...`) correspond à la branche
`depot-avis-clients`, commit `c21833d`, soit **3 commits derrière master**. J'ai vérifié que
`vercel.json`, `astro.config.mjs` et `public/robots.txt` sont **identiques** entre ce commit et
master : toutes les conclusions SEO/redirections de ce rapport s'appliquent donc bien à ce qui
partira en production. Les 3 commits manquants ne touchent que les emails transactionnels.

Le projet est réglé sur `ssoProtection: all_except_custom_domains`, et j'ai utilisé un jeton
d'accès temporaire pour tester l'URL de déploiement. **Ce réglage est le bon** : le jour où
`aimezlanature.fr` est rattaché comme domaine personnalisé, il sera public et crawlable.

> **Rectification du 2026-07-30.** J'ai d'abord écrit que « le déploiement est protégé par SSO ».
> C'est vrai des trois adresses techniques du projet — URL de déploiement, alias de branche, alias
> d'équipe renvoient tous un **302** vers la connexion Vercel — mais **faux de l'alias de
> production** : `https://aimezlanatureseo.vercel.app/` répond **200 sans authentification**.
> Mesuré, pas déduit. Le marchand a confirmé que c'est **volontaire** : c'est l'adresse sur
> laquelle il éprouve les flux avant la bascule, elle doit rester accessible. Deux conséquences
> assumées : l'adresse est crawlable (pas de `X-Robots-Tag: noindex`, `robots.txt` en `Allow: /`),
> le garde-fou étant le `canonical` vers `aimezlanature.fr` présent sur toutes les pages ; et le
> tunnel de paiement y est atteignable en mode test, donc sans débit possible. Ce n'est **pas** un
> défaut à corriger, c'est un état de recette — voir la section « État volontaire de la recette ».

### État volontaire de la recette (précisé par le marchand)

Le site Vercel **n'est pas encore rattaché à `aimezlanature.fr` : c'est délibéré**, la recette se
fait avant la bascule. En conséquence :

- **Stripe est en mode test à dessein**, et un déploiement a été promu en `production` uniquement
  pour éprouver les flux (paiement, webhook, emails) sur une cible stable.
- **L'alias `aimezlanatureseo.vercel.app` est public à dessein** : c'est l'adresse de recette, elle
  doit rester joignable sans connexion Vercel (confirmé par le marchand le 2026-07-30).
- Ce ne sont donc **ni l'un ni l'autre des défauts** : ce sont des **étapes de la bascule**, pas des
  correctifs. Elles restent listées au plan du jour J parce que les oublier serait critique — un
  domaine rattaché alors que les clés sont encore en test donnerait un tunnel qui *paraît*
  fonctionner sans jamais débiter personne.

---

## 1. Tableau de synthèse

### 🔴 Bloquants — défauts à corriger dans le code AVANT de toucher au DNS

| Catégorie | Point vérifié | Statut | Action recommandée | Priorité |
|---|---|---|---|---|
| Redirections | 6 URLs `/product-category/*/` | ✅ **Corrigé le 2026-07-30** | Le joker `/product-category/:path*` **ne matche pas le slash final** (prouvé : sans slash → 308, avec slash → 404). Or les 6 URLs du sitemap WP ont toutes un slash. Remplacer par `/product-category/(.*)`. | P0 |
| Redirections | `/perles-de-ceramique-em/` | ✅ **Corrigé le 2026-07-30** | 404 confirmée. C'est la page en **correspondance exacte avec le mot-clé principal**. Ajouter un 301 vers `/perles-ceramique-em/`. | P0 |
| Analytics | Google Ads `AW-17799798810` | ✅ **Corrigé le 2026-07-30** | Le WordPress charge `gtag/js?id=AW-17799798810` (+ Doubleclick). Le nouveau site n'a **aucun tracking**. Si des campagnes Ads tournent, les conversions cesseront d'être mesurées et l'optimisation des enchères se dégradera. Décider : réintégrer (⇒ assouplir la CSP + bandeau de consentement obligatoire) ou assumer l'arrêt. | P0 |
| Analytics | Balise de vérification Search Console | ✅ **Corrigé le 2026-07-30** | `<meta name="google-site-verification" content="UhQ55Ibs19Xue-Hi6BWyZzfUG9tOYktlkTzEVH2T1hg">` est présente sur le WordPress, **absente** du nouveau site. Si la propriété GSC est vérifiée par cette balise, l'accès sera perdu à la bascule. Ajouter la balise dans `BaseLayout.astro`, **ou** basculer la vérification en TXT DNS avant. | P0 |

### 🔵 Bascules d'environnement — pas des défauts, mais critiques si oubliées

Ces deux points sont dans leur **état volontaire de recette**. Ils ne demandent aucune correction
aujourd'hui, seulement d'être exécutés au bon moment.

| Catégorie | Point vérifié | Statut | Action recommandée | Priorité |
|---|---|---|---|---|
| E-commerce | Stripe en mode test | **Volontaire** | `POST /api/checkout` renvoie une session `cs_test_…` — normal, la recette se fait en test. **Au jour J** : basculer `STRIPE_SECRET_KEY` sur `sk_live_…` en environnement Production, créer le webhook en mode **live** et reporter son `STRIPE_WEBHOOK_SECRET` (les secrets test et live sont différents), puis redéployer. Un domaine rattaché avec des clés test = tunnel qui paraît marcher sans jamais débiter. | Jour J |
| Infra | Domaine non rattaché | **Volontaire** | Le projet n'a que des `*.vercel.app`, la recette précède la bascule. **Au jour J** : ajouter `aimezlanature.fr` + `www` au projet `aimezlanatureseo` avant de changer les DNS. | Jour J |

### 🟠 Importants — à traiter avant ou juste après la bascule

| Catégorie | Point vérifié | Statut | Action recommandée | Priorité |
|---|---|---|---|---|
| Performance | CLS = 0,11 → **0,00** | ✅ **Corrigé le 2026-07-30** | Cause racine mesurée : le **swap des 6 polices latin** décalait la mise en page à 396 ms. Corrigé par le préchargement des 3 polices de la ligne de flottaison — voir l'encadré. **Mesuré à 0,00** sur l'accueil (2 fois) et sur une fiche produit. | P1 |
| Redirections | URLs **sans** slash final → 404 | ✅ **Corrigé le 2026-07-30** | `/qui-sommes-nous/` → 308 OK, mais `/qui-sommes-nous` → **404**. Corrigé par 50 règles jumelles explicites (chaque source existe désormais dans ses deux formes), et **surtout PAS** par `"trailingSlash": true` — voir l'encadré ci-dessous. | P1 |
| Redirections | `/category/blog/` | ✅ **Corrigé le 2026-07-30** | 404 confirmée. Ajouter un 301 vers `/blog/`. | P1 |
| Outillage | `check-redirects.mjs` donne un **faux vert** | ✅ **Corrigé le 2026-07-30** | Le script teste les jokers avec un chemin **sans slash final** (`sampleForWildcard`). Il annonce « 53/53 OK » alors que les 6 vraies URLs `/product-category/*/` sont en 404. Faire tester chaque règle dans ses **deux formes** (avec et sans slash final). | P1 |
| E-commerce | `/api/checkout` : pas de limite de débit | 🟠 **Partiel — à finir AVANT la bascule** | Un POST **JSON** sans en-tête `Origin` est accepté (200 + session Stripe créée) ; un POST sans `Content-Type` est bien rejeté en 403. Le contrôle d'origine d'Astro ne couvre que les types de formulaire, car un POST JSON cross-origin exige de toute façon un préflight CORS que le navigateur refuse : **ce n'est donc pas une faille CSRF exploitable depuis un navigateur**. Aucune donnée exposée. Le risque est l'abus scripté. Limiteur applicatif ajouté (10 / 60 s par IP), mais **mesuré le 2026-07-30 : il ne bloque rien en parallèle** (27 appels sur 30 passent) et une rafale épuise le budget d'API **Stripe du compte**, donc empêche les vrais clients de payer. La correction réelle est la règle de pare-feu Vercel — **incluse dès Hobby**, contrairement à ce que ce rapport affirmait. Voir l'encadré « Le mur ». | **P0 avant bascule** |

### Google Ads réintégré derrière un bandeau maison — 2026-07-30

Décision du marchand : garder Google Ads, avec un bandeau **écrit dans le projet** plutôt que
Cookiebot (le WordPress utilise Cookiebot, un service tiers payant qui aurait imposé d'ouvrir la CSP
à un **second** domaine et pose ses propres cookies).

Relevé sur le WordPress : `AW-17799798810`, Consent Mode v2 **déjà en place**, tag posé par le
plugin WooCommerce **Google Listings & Ads** (`groups: "GLA"`, `developer_id.dOGY3NW`). Ce plugin
n'existant pas sous Astro, les événements sont recréés à la main.

**La règle tenue :** aucune requête vers Google, aucun cookie Google, avant un clic explicite sur
« Accepter ».

| Conformité CNIL | Comment c'est tenu |
|---|---|
| Consentement préalable | gtag.js n'est chargé que par le clic « Accepter ». Sans JavaScript, rien ne se charge : fail-closed. |
| Refus aussi facile que l'accord | Deux boutons, même écran, **mêmes classes à la couleur près** — tous deux pleins, texte blanc, bordure. Le motif « vert plein / gris clair » rend le refus moins saillant ; un commentaire dans le composant interdit d'« alléger » le bouton Refuser. |
| Pas de consentement déduit | Aucune case pré-cochée. Échap ferme le bandeau **sans accepter** : fermer n'est pas consentir. |
| Retrait aussi simple que l'octroi | « Gérer les cookies » en pied de page, sur les 29 pages, rouvre le bandeau. |
| Le retrait fait **cesser** le traitement | Un refus repasse Consent Mode en `denied` **et efface les cookies `_gcl_*` / `_gac_*`** déjà posés. Trouvé au test : sans ça, `_gcl_au` survivait à un refus et le traçage continuait. |
| Information | Section Cookies des mentions légales : tableau finalité / durée / destinataire, transfert hors UE mentionné. |
| Durée | Choix mémorisé 6 mois, **refus comme acceptation** (ne pas harceler celui qui refuse, ne pas oublier vite celui qui accepte). |

**Consent Mode v2 malgré tout.** Les défauts `denied` sont posés avant tout chargement. Cela paraît
redondant puisqu'on ne charge rien sans accord, mais sans consent mode v2 les données Ads du
visiteur qui **accepte** sont elles aussi dégradées. Le WordPress le faisait déjà : on ne régresse
pas.

**CSP.** Ouverte aux seuls domaines **documentés par Google**, pas devinés, plus `www.google.fr`
pour le TLD français. `style-src 'self'` reste intact. Contrôle a posteriori : les 7 domaines
réellement contactés après acceptation sont tous dans la liste, **zéro violation** en console.

**Conversion d'achat.** `/api/checkout` renvoie le montant qu'il vient de calculer (frais de port
compris), `cart.js` le mémorise avant la redirection Stripe, `commande.js` l'envoie depuis la page
de confirmation avec `transaction_id` = session Stripe pour que Google **dédoublonne** un
rechargement de page. L'étiquette de conversion reste **vide** dans `src/data/tracking.ts` : le tag
de base tourne, l'achat n'est pas envoyé, rien ne casse. Une ligne à remplir le jour où le marchand
la fournit (Google Ads → Objectifs → Conversions → « Configurer avec une balise »).

**Vérifié sur le déploiement réel** (pas seulement en local, la CSP n'existant qu'en production) :

| Contrôle | Résultat |
|---|---|
| Avant tout choix | bandeau affiché, **0 script Google**, 6 requêtes toutes locales |
| Défauts Consent Mode | les 4 signaux en `denied`, `wait_for_update: 500` |
| Après « Refuser » | 0 script Google, choix persistant au rechargement |
| Après « Accepter » | gtag.js chargé, `gcs=G111` reçu par Google, cookie `_gcl_au` posé |
| Violations CSP | **aucune**, les 7 domaines répondent 200/204 |
| Retrait après acceptation | `_gcl_au` **effacé**, Consent Mode repassé en `denied` |
| CLS **avec bandeau affiché** | **0,00** (`position: fixed`, le bandeau ne pousse pas le contenu) |
| Mobile 390 px | aucun débordement, les deux boutons à l'écran |

**Reste à faire côté marchand :** fournir l'étiquette de conversion, et résilier l'abonnement
Cookiebot une fois le WordPress éteint (il ne sert plus à rien sur le nouveau site).

### Le rate-limiting a existé, puis a été perdu dans la migration

Retracé le 2026-07-30, parce que ce rapport conseillait d'abord « finir la branche
`rate-limiting-a-verifier` » — **ce conseil était faux sur deux points**.

1. `dcccb08` avait ajouté `src/lib/rateLimit.ts` et l'avait branché sur `/api/checkout` et
   `/api/revendeur`.
2. `04dc9fd` l'a **reverté** : la protection reposait sur le binding Cloudflare `ratelimits`, qui
   exige un plan Workers payant non confirmé à l'époque. Le revert visait à garder master
   déployable, en attendant de re-merger « après vérif Cloudflare ».
3. Sauf que la PR #5 a migré tout le projet **de Cloudflare vers Vercel**. Le binding `ratelimits`
   et `wrangler.jsonc` n'existent plus : ce code **ne pourra jamais être re-mergé tel quel**.
4. Les branches `rate-limiting-a-verifier` et `security/rate-limiting-api` **n'existent plus sur
   GitHub**. Une branche locale `security/rate-limiting-api` pointe encore sur `dcccb08`.

**Le code n'est pas en danger** : `dcccb08` ayant été mergé puis reverté, il fait partie de
l'historique de master et ne sera donc jamais nettoyé par git. Le fichier reste lisible à tout
moment, branche ou pas :

```bash
git show dcccb08:src/lib/rateLimit.ts
```

Il est utile comme référence pour la **logique** (fenêtre, clé de comptage, réponse 429), pas pour
le **mécanisme**, qui était le limiteur natif de Cloudflare.

### Réimplémenté le 2026-07-30 — `src/lib/rateLimit.ts`

Portée réelle constatée : ce n'était pas « `/api/*` sans protection », mais **une seule route**.

| Route | Avant | Après |
|---|---|---|
| `/api/checkout` | **aucune protection** | 10 appels / 60 s par IP |
| `/api/avis` | piège + délai + achat Stripe vérifié | + 5 / 60 s |
| `/api/revendeur` | piège + délai | + 5 / 60 s |
| `/api/stripe-webhook` | signature HMAC + anti-rejeu | **inchangé, volontairement** |

**Pourquoi le webhook est exclu.** Stripe ne suit pas les redirections et considère toute réponse
non-2xx comme un échec de livraison : un 429 déclencherait des rejeux en boucle et casserait les
emails de confirmation de commande. Même famille de piège que `trailingSlash`. Vérifié dans le
bundle réellement déployé : `stripe-webhook_*.mjs` contient **0 référence** au limiteur, là où
`checkout`, `avis` et `revendeur` importent bien `rateLimit_*.mjs`.

Choix techniques : clé = IP via `x-forwarded-for`, non falsifiable car « Vercel overwrites this
header and does not forward external IPs to prevent spoofing » (doc Vercel). **Fail-open** partout —
IP illisible, bug, mémoire saturée laissent passer : la disponibilité de la vente primait déjà dans
la version Cloudflare. Compteurs **cloisonnés par route**, pour qu'un flot sur le formulaire
revendeur ne puisse pas empêcher un client de payer. Mémoire bornée à 5 000 clés, sinon la
protection deviendrait elle-même le déni de service. Zéro dépendance ajoutée.

**Sur les « 13 tests unitaires au vert » annoncés ici le 2026-07-30 :** ils ont bien tourné, mais
dans un dossier de travail temporaire et **n'ont jamais été versionnés** — vérifié,
`git log --diff-filter=A -- "*test*"` ne renvoie rien. Personne ne peut donc les rejouer : une
vérification non reproductible n'est pas une vérification, c'est un souvenir. Remplacés par un
contrôle versionné, sur le modèle de `check-redirects.mjs` :

```bash
npm run check:ratelimit https://aimezlanatureseo.vercel.app
```

`scripts/check-rate-limit.mjs` envoie deux fois 30 appels sur `/api/checkout` — une fois en
parallèle, une fois en série — et **sort en erreur si la rafale parallèle n'est pas freinée**. Il est
donc rouge aujourd'hui, volontairement : c'est le **critère d'acceptation de la règle de pare-feu**.
Le jour où elle est publiée, il doit passer au vert sans qu'on touche au script.

Deux garde-fous dans le script, parce qu'il crée de vraies sessions Stripe : il **refuse de tourner**
si le site répond une session `cs_live_…` sans le drapeau `--live` explicite, et il lit le slug de
produit dans `products.ts` au lieu de l'inventer (un slug inconnu renverrait 400 et testerait la
validation, pas la limite de débit).

Relevé des deux exécutions du 2026-07-30 : en parallèle 27 puis 30 appels passés sur 30 — le nombre
varie avec le nombre d'instances que Vercel démarre, ce qui illustre le défaut mieux qu'un chiffre
fixe. En série, 10 passés / 20 bloqués aux deux essais.

#### ⚠️ Mesuré le 2026-07-30 : le limiteur ne résiste pas au parallélisme

J'avais écrit ici « vérifié en production : 10 appels passent, le 11ᵉ renvoie 429 ». C'est exact,
mais **j'avais testé le seul scénario que le limiteur sait traiter**. Rejoué avec 30 appels, même
IP, même région, en faisant varier uniquement la façon de les envoyer :

| Façon d'envoyer les 30 appels | Sessions Stripe créées | Bloqués (429) |
|---|---|---|
| **En série**, l'un après l'autre | 10 | **20** ✅ |
| **En parallèle**, tous en même temps | **27** | **0** ❌ |

Le compteur vit en mémoire, donc **par instance de fonction**. Vercel en démarre autant que
nécessaire pour absorber la charge, et chacune repart de 10 : les 27 passages correspondent à
~3 instances × 10. D'où une propriété perverse — **plus l'attaque est forte, plus il y a
d'instances, donc plus le plafond effectif monte.** La protection grandit avec l'attaquant.

Et il ne faut **pas** se répartir sur plusieurs IP ni plusieurs régions pour passer, contrairement
à ce que ce rapport et le commentaire du fichier affirmaient : le parallélisme depuis une seule
machine suffit.

**Le dégât réel n'est pas le coût, c'est l'indisponibilité de la vente.** Les 3 appels qui n'ont pas
abouti ne sont pas des 429 du limiteur mais des **502**, et les logs Vercel donnent la cause :
`Stripe: Request rate limit exceeded`. Les limites d'API Stripe sont comptées **par compte** —
25 req/s en test, 100 req/s en réel, 25 req/s par endpoint par défaut. Après la bascule, une rafale
consommerait donc le budget Stripe du compte, et **les vrais clients recevraient « Le paiement est
momentanément indisponible » pendant qu'elle dure**. Déclenchable depuis un ordinateur portable.

Ce que le limiteur applicatif garde comme mérite : il arrête une boucle séquentielle, ne coûte
aucune dépendance, ne dépend d'aucun plan, et un appel qu'il bloque **ne consomme pas** de budget
Stripe. Il reste en place comme filet. Il ne peut simplement pas être la seule protection.

Deux choses bien faites, confirmées au passage : le limiteur s'exécute **avant** l'appel à Stripe,
et le message d'erreur brut de Stripe est journalisé côté serveur mais **jamais renvoyé au client**
(`checkout.ts:135`) — il peut contenir des détails de configuration du compte.

### Le mur : le plan N'EST PAS l'obstacle qu'on croyait (vérifié le 2026-07-30)

Le rapport disait « le rate limiting WAF peut être réservé aux plans payants — c'est exactement ce
qui avait tué la version Cloudflare ». **Faux, vérifié dans la documentation Vercel** : le rate
limiting WAF est inclus **dès le plan Hobby**.

| Ressource (doc Vercel, 2026-06-16) | Hobby |
|---|---|
| Clés de comptage | IP, empreinte JA4 |
| Algorithme | fenêtre fixe |
| Fenêtre | 10 s minimum, 10 min maximum |
| **Nombre de règles de rate limit** | **1 par projet** (et 3 règles de pare-feu au total) |
| Requêtes incluses | 1 000 000 autorisées |

Deux propriétés qui changent tout par rapport au limiteur applicatif :

1. **Le comptage est fait par la plateforme, par RÉGION** — plus par instance. La rafale parallèle
   mesurée plus haut venait entièrement de `cdg1` : une règle WAF l'aurait donc arrêtée. Le défaut
   résiduel existe (« traffic matching a given rate limit key in multiple regions can exceed the
   limit ») mais il exige de répartir l'attaque géographiquement — un tout autre niveau d'effort.
2. **Le trafic bloqué n'est pas facturé** : « You do not pay for requests or bandwidth for denies,
   challenges, or rate-limits from WAF custom rules or managed rules. » La règle protège donc aussi
   la facture, là où le limiteur applicatif consomme une invocation pour chaque appel qu'il refuse.

**Une seule règle disponible sur Hobby** : elle doit donc aller sur `/api/checkout`, la seule route
qui appelle un tiers payant et qui n'a aucune autre barrière (`avis` et `revendeur` ont déjà piège +
délai, et `avis` vérifie l'achat chez Stripe).

#### Mode opératoire

La CLI Vercel n'est pas installée sur cette machine, et **publier une règle de pare-feu est une
modification d'infrastructure de production : c'est au marchand de la déclencher**, pas à moi.

```bash
npm i -g vercel          # la CLI n'est pas installée
vercel link              # rattacher le dossier au projet aimezlanatureseo
```

**Étape 1 — observer sans bloquer.** Jamais de règle qui bloque du premier coup : on regarde
d'abord qui elle attraperait.

```bash
vercel firewall rules add "Limite paiement" \
  --condition '{"type":"path","op":"pre","value":"/api/checkout"}' \
  --action rate_limit \
  --rate-limit-window 60 \
  --rate-limit-requests 30 \
  --rate-limit-keys ip \
  --rate-limit-action log --yes

vercel firewall diff              # relire ce qui va partir
vercel firewall publish --yes     # ← à jouer par le marchand
```

Puis vérifier dans le tableau de bord (`Firewall` → trafic filtré sur la règle) que seul du trafic
anormal correspond. Un réseau d'entreprise ou un opérateur mobile fait sortir plusieurs clients par
la **même IP** : c'est le risque à écarter avant de bloquer.

**Étape 2 — bloquer.** Une fois l'observation propre :

```bash
vercel firewall rules edit "Limite paiement" \
  --condition '{"type":"path","op":"pre","value":"/api/checkout"}' \
  --rate-limit-action rate_limit --yes
vercel firewall publish --yes
```

Trois précisions qui comptent :

- `--rate-limit-action rate_limit` renvoie **429**, `deny` renvoie 403. Le 429 est le bon code (il
  dit « réessaie plus tard »), et c'est ce que la version précédente de ce rapport recommandait à
  tort en `deny`.
- La règle porte sur `/api/checkout` **uniquement**. Elle ne peut donc jamais toucher
  `/api/stripe-webhook`, où un 429 casserait les emails de commande en boucle de rejeu.
- `rules add` et `rules edit` ne font que **préparer un brouillon** : sans `publish`, rien ne
  s'applique. `vercel firewall rules inspect "Limite paiement" --expand` permet de relire la règle
  avant de publier.

#### Ce qui a été écarté, et pourquoi

- **Le SDK `@vercel/firewall`** (`checkRateLimit()` appelé depuis la route) corrigerait aussi le
  défaut du compteur par instance, et garderait notre message JSON — plus joli que la page
  d'erreur Vercel. Écarté malgré cela : il consomme **la même unique règle** disponible sur Hobby,
  tout en payant une invocation de fonction pour chaque appel refusé, et en laissant la rafale
  atteindre notre code. La règle de pare-feu bloque plus tôt, ce qui est exactement ce qu'on veut :
  la rafale ne doit atteindre ni notre fonction, ni Stripe. À reconsidérer seulement si on a besoin
  de compter sur autre chose que l'IP.
- **Un compteur partagé externe** (Redis Upstash via la place de marché) : dépendance et service
  tiers supplémentaires pour un résultat que le pare-feu donne sans rien installer.
- **Vercel BotID** serait pourtant bien adapté — l'abuseur est un script, pas un humain. Écarté
  parce qu'il charge un script depuis un domaine Vercel : il faudrait ouvrir la CSP `script-src
  'self'`, la contrainte structurelle du projet (même motif que le refus de l'API Fonts d'Astro).
| Config | `EMAIL_SITE_URL` | À corriger | Variable temporaire pointant les liens des emails vers l'URL de déploiement (le domaine servant encore WordPress). **À supprimer de Vercel juste après la bascule**, sinon les emails continueront de pointer vers `*.vercel.app`. Le commentaire de `src/data/email-commande.ts:49` le rappelle. | P1 |
| RGPD | Bandeau de consentement | ✅ **Livré le 2026-07-30** | Aucun cookie n'est posé : seul `localStorage` sert au panier (strictement nécessaire) et il n'y a **aucun script tiers**. Pas de bandeau requis en l'état. ⚠️ **Dès que Google Ads est réintégré, un bandeau conforme CNIL devient obligatoire** (consentement préalable, refus aussi facile que l'acceptation). Les deux sujets sont liés. | P1 |
| SEO | 11 URLs `/x/` à `/x-11/` | Accepté | Articles vides du WordPress, présents au sitemap WP, non couverts → 404. **Le 404 est ici la bonne réponse** : rediriger 11 pages poubelle vers l'accueil crée des « soft 404 » que Google pénalise. À laisser tomber, Google les désindexera. | P2 |

### 🟢 Mineurs — après la bascule

| Catégorie | Point vérifié | Statut | Action recommandée | Priorité |
|---|---|---|---|---|
| SEO | Longueur de 3 balises | Mineur | `title` : `/a-propos/` 67 car., `/comment-ca-marche/` 70 car. (cible ≤ 65). `description` : `/a-propos/` 164 car. (cible ≤ 160). Risque : troncature en SERP. | P2 |
| Performance | Pas d'AVIF | Mineur | 38 WebP émis, 0 AVIF. Ajouter `formats: ['avif','webp']` : ~20-30 % de poids image en moins. | P2 |
| Performance | Sous-ensembles de polices inutiles | ✅ **Corrigé le 2026-07-30** | 540 Ko de woff2 déployés dont **144 Ko seulement en latin** : ~400 Ko de cyrillique/grec/vietnamien jamais téléchargés (l'`unicode-range` les filtre) mais déployés. Importer `@fontsource/inter/latin-400.css` au lieu de `400.css`. | P2 |
| SEO | Canonical de la page 404 | Mineur | `/404.html` déclare `canonical: https://aimezlanature.fr/404/`, une URL qui n'existe pas. Page en `noindex`, impact nul, mais incohérent. | P2 |
| A11y | Contraste sur chiffres décoratifs | Mineur | Lighthouse A11y 96/100 : 3 gros chiffres décoratifs (`aria-hidden="true"`) en contraste faible. Invisibles des lecteurs d'écran, donc faux positif fonctionnel. | P2 |
| Infra | Deux projets Vercel | Mineur | `aimezlanature` **et** `aimezlanatureseo` coexistent. Rattacher le domaine au mauvais projet ferait tomber le site. Supprimer/renommer le projet inutilisé pour lever l'ambiguïté. | P2 |
| Divers | `llms.txt` sans liens | Mineur | Seul autre échec Lighthouse. Aucun impact SEO Google. | P2 |

### ✅ Vérifiés conformes — aucune action

| Catégorie | Point vérifié | Preuve |
|---|---|---|
| SEO | `<title>` + `meta description` uniques | 29/29 pages en ont ; **0 doublon** de title, 0 doublon de description |
| SEO | Canonical | 29/29 pages, toutes auto-référentes et cohérentes avec l'URL de production |
| SEO | Structure Hn | **Exactement 1 `<h1>` par page** sur 29 pages, 0 saut de hiérarchie |
| SEO | Attributs `alt` | **0 `<img>` sans alt, 0 `alt=""`** sur tout le site, y compris les 4 fiches produit |
| SEO | JSON-LD | Présent sur 29/29 pages, **tous parsés valides** : `Product`, `Organization`, `WebSite`, `BreadcrumbList`, `Review`+`AggregateRating`, `FAQPage`, `Article`, `ItemList`, `HowTo`, `CollectionPage`, `AboutPage` |
| SEO | `robots.txt` | `Allow: /` propre, `Sitemap:` déclaré, aucune règle bloquante héritée |
| SEO | `sitemap.xml` | 24 URLs ; exclut correctement `/panier/`, `/commande-confirmee/`, `/revendeurs/merci/`, `/avis/merci/` (toutes en `noindex`) |
| SEO | Langue | `<html lang="fr">`, `og:locale=fr_FR`, `i18n` mono-locale → **pas de hreflang nécessaire** |
| SEO | `noindex` du tunnel | Correct sur `/panier/`, `/commande-confirmee/`, `/revendeurs/merci/`, `/avis/merci/`, `/404` |
| Redirections | Chaînes et boucles | **0 chaîne**, 0 boucle (aucune destination n'est source d'une autre règle) |
| Redirections | Codes temporaires | **0 redirection en 302** : les 53 règles sont permanentes (Vercel sert du 308, équivalent SEO au 301) |
| Redirections | Destinations mortes | Les 53 destinations pointent vers une page réellement présente dans le build |
| Redirections | Couverture globale | 54 des 67 URLs WordPress couvertes (5 identiques + 49 redirigées) |
| Performance | Compression | **Brotli actif** (`content-encoding: br`) sur le HTML |
| Performance | Cache | `/_astro/*` en `public, max-age=31536000, immutable` ; HTML en `max-age=0, must-revalidate` + ETag — correct pour un site statique |
| Performance | JavaScript | **0 script tiers.** 2 fichiers propres (`site.js` + `cart.js` ≈ 17,6 Ko), tous deux en `defer`. Aucun widget avis/chat |
| Performance | Blocage au rendu | 1 seule ressource bloquante (le CSS, 66 Ko) — attendu et acceptable |
| Performance | Image LCP | `pack-100-perles.webp` en `loading="eager"` + **`fetchpriority="high"`** : correctement priorisée, **jamais lazy-loadée par erreur** |
| Performance | Dimensions d'images | **0 `<img>` sans `width` + `height`** → aucune contribution des images au CLS |
| Performance | Polices | Auto-hébergées (@fontsource), `font-display: swap` sur les 36 déclarations, zéro requête vers Google Fonts (conforme position CNIL) |
| E-commerce | Sécurité des prix | Les prix sont **recalculés côté serveur** depuis `products.ts` ; le navigateur n'envoie que `{slug, qty}`. Panier trafiqué = montant inchangé |
| E-commerce | Dégradation | `/api/checkout` est **fail-closed** : clé absente → 503 explicite, jamais un paiement silencieusement cassé |
| E-commerce | Avis indexables | Les avis sont **rendus côté serveur** (6 badges « Achat vérifié » dans le HTML statique) + 5 `reviewBody` en JSON-LD. **Pas de rendu client-only** |
| Fonctionnel | Liens internes | **0 lien cassé** sur l'ensemble du build |
| Fonctionnel | Liens externes | 3 liens distincts, **tous en 200** (Amazon, Hostinger, Google Drive) |
| Légal | Pages obligatoires | `/mentions-legales/` (éditeur, hébergement, données personnelles, cookies, juridiction) et `/cgv/` présentes ; anciennes URLs de politique de confidentialité / retours toutes 301-ées |
| Mobile | Responsive | `viewport` correct ; **aucun débordement horizontal** (scrollWidth 397 ≤ innerWidth 412) |
| Infra | Crawlabilité future | `ssoProtection = all_except_custom_domains` → le domaine personnalisé sera public. Le `X-Robots-Tag: noindex` observé est le comportement **automatique des previews Vercel** et ne s'applique pas à la production |

---

## 2. Corrections appliquées le 2026-07-30

`vercel.json` est passé de **53 à 110 redirections**, toutes en 301/308, sans chaîne ni doublon.

| Correction | Détail |
|---|---|
| Joker cassé | `/product-category/:path*` → `/product-category/(.*)`. `(.*)` traverse les slashs, `:path*` non. |
| Catégorie blog | Ajout de `/category/(.*)` → `/blog/`. |
| Mot-clé principal | Ajout de `/perles-de-ceramique-em/` → `/perles-ceramique-em/`. |
| Formes sans slash | 50 règles jumelles générées : chaque source existe dans ses deux formes. |
| Vérification GSC | Balise `google-site-verification` ajoutée à `BaseLayout.astro` → présente sur **29/29 pages**. |
| Faux vert du script | `check-redirects.mjs` teste désormais chaque règle **dans ses deux formes** et suit les chaînes à la main : 110 règles → **220 requêtes**. |

### ⚠️ Pourquoi `"trailingSlash": true` a été écarté

C'était la solution évidente pour les URLs sans slash final, et elle est **dangereuse ici**. Le
réglage est global chez Vercel : il place un 308 devant **toutes** les routes, y compris
`/api/stripe-webhook`. Or **Stripe ne suit pas les redirections** et compte tout 3xx comme un échec
de livraison — le webhook serait rejoué en boucle et **les emails de confirmation de commande
cesseraient de partir**. Le gain SEO (des URLs sans slash que Google n'a de toute façon pas
indexées, sa version canonique ayant le slash) ne justifie pas de mettre la chaîne de commande en
risque. Les 50 jumelles explicites donnent le même résultat sans jamais toucher aux routes API.

Contrôle automatisé de cette garantie : `scripts/` ne contient pas ce test, il a été joué en
recette — aucune des 110 règles ne capture `/api/checkout`, `/api/stripe-webhook`, `/api/avis` ni
`/api/revendeur`, dans l'une ou l'autre de leurs formes, et `trailingSlash` est absent du fichier.

### CLS : 0,11 → 0,00, et pourquoi PAS l'API Fonts d'Astro

L'API Fonts d'Astro (stable en 7.1.1) était la solution élégante : elle génère les preloads **et**
des polices de repli à métriques ajustées. **Elle est inutilisable ici.** Son composant `Font.astro`
émet `<style set:html={data.css}></style>`, donc du CSS **inline** — que la CSP du projet
(`style-src 'self'`, sans `unsafe-inline`) bloque. Les `@font-face` ne s'appliqueraient jamais et le
site perdrait ses polices. L'adopter imposerait de défaire la décision de sécurité documentée dans
le playbook (`inlineStylesheets: 'never'`).

Correctif retenu, compatible CSP :

- **Préchargement de 3 polices** dans `BaseLayout.astro` (~70 Ko) : Playfair 600 (le H1, plus gros
  texte donc plus gros décalage), Inter 400 (corps), Inter 600 (boutons). Les URL viennent d'imports
  Vite `?url`, jamais de chemins en dur — l'empreinte du fichier change à chaque build.
  Inter 500 et 700 ne sont **pas** préchargées : elles ne servent qu'à de petits éléments, et
  précharger les 5 (115 Ko) volerait de la bande passante à l'image LCP.
- **`crossorigin` sur chaque preload**, obligatoire même en même origine : sans lui le navigateur
  télécharge le fichier une seconde fois et le préchargement ne sert à rien.
- **Sous-ensembles `latin-*`** au lieu des fichiers complets : **36 → 6** fichiers woff2,
  **540 Ko → 144 Ko** déployés (traite du même coup le point P2 « sous-ensembles inutiles »).

| Mesure | Avant | Après |
|---|---|---|
| CLS accueil | 0,11 | **0,00** (2 mesures) |
| CLS fiche produit | — | **0,00** (l'insight « CLSCulprits » disparaît de la trace) |
| Fichiers woff2 déployés | 36 (540 Ko) | **6 (144 Ko)** |
| `@font-face` dans le CSS | 36 | **6** |

Contrôles de non-régression :

- Les 3 URL préchargées correspondent à des fichiers réellement présents dans `dist/` (le projet
  s'est déjà fait piéger par une URL d'asset en 404).
- Les 6 polices sont `loaded` au runtime, et `document.fonts.check()` confirme que Playfair et Inter
  sont **réellement utilisées** (pas de repli silencieux sur Georgia).
- Passer en `latin` seul supprime le filet des sous-ensembles latin-ext / cyrillique / grec /
  vietnamien. Scan du texte visible des 29 pages : les seuls caractères hors plage sont des symboles
  et emoji (`→ ★ ✓ 🌿`…). Vérifié sur les **188 plages `unicode-range`** des fichiers complets :
  **aucun n'était couvert avant** — ils étaient déjà rendus par une police système, leur rendu est
  donc inchangé. Contrôle de cohérence du script : `é œ ® €` bien détectés comme couverts.

### Preuves de la correction

Les redirections `vercel.json` ne sont pas rejouables en local (c'est la plateforme qui les
applique). Elles ont donc été validées contre un serveur reproduisant la sémantique Vercel
**constatée sur le déploiement réel** (`(.*)` traverse les slashs — prouvé via la règle
`headers: "/(.*)"` qui s'applique bien aux chemins imbriqués avec slash final ; `:path*` s'arrête
au slash — prouvé par un 308 sans slash et un 404 avec) :

| Contrôle | Résultat |
|---|---|
| Couverture des 67 URLs du sitemap WordPress | 5 identiques + **51 redirigées** + 11 non couvertes (les `/x-*/` poubelle, 404 volontaire) |
| `check-redirects.mjs`, 220 requêtes | **220/220 OK**, code de sortie 0 |
| Idem en inversant l'ordre d'application des étapes | **220/220 OK** → le résultat ne dépend pas d'un ordre non documenté |
| Chaînes / destinations mortes / 302 / doublons | 0 / 0 / 0 / 0 |
| Routes `/api/*` capturées par une règle | **0 sur 8 formes testées** |
| Balise GSC dans le build | **29/29 pages** |
| Le script détecte-t-il l'ancienne panne ? | Sur la sémantique `:path*` : **118/220, sortie 1**, en nommant les 2 formes à slash final |
| L'ancien script sur cette même panne | **60/60 OK, sortie 0** — le faux vert, démontré |

**Reste à vérifier sur un déploiement réel** (impossible en local) : que Vercel applique bien
`(.*)` comme constaté, en rejouant `node scripts/check-redirects.mjs <url-preview>` après le
déploiement de la branche.

---

## 3. Comparaison mesurée : ancien vs nouveau

| Indicateur | WordPress (mesuré) | Astro (mesuré) |
|---|---|---|
| Poids total de la page | **20,2 Mo** (vidéos Gumlet) | ~0,5 Mo |
| HTML décompressé (accueil) | 169 Ko | **47 Ko** |
| Scripts externes / inline | 5 / 21 | **2 / 4** (JSON-LD et catalogue) |
| Feuilles CSS | 3 | **1** |
| Domaines tiers | **5** (GTM, Doubleclick, Gumlet, jsDelivr, Google Fonts, Sentry) | **0** script tiers |
| LCP | 3 130 ms | **333 ms** |
| CLS | **0,304** (mauvais) | 0,11 (à améliorer) |
| Réponse serveur | 340 ms | 7 ms (TTFB local) |
| Temps perdu en redirections | 771 ms | 0 |
| Lighthouse Performance | **57** | non comparable directement (mesure locale non throttlée) |
| Lighthouse SEO | 92 | **100** |
| Lighthouse Bonnes pratiques | 96 | **100** |
| Lighthouse Accessibilité | 97 | 96 |

Conditions : WordPress mesuré par Lighthouse 13.4 desktop (throttling simulé, DataForSEO) ;
Astro mesuré en local sur le build servi en statique — les valeurs absolues de LCP/TTFB ne sont
donc pas comparables terme à terme, mais **CLS et la composition de la page le sont**. Le gain de
poids (20,2 Mo → 0,5 Mo) et la suppression des 5 tiers sont, eux, structurels.

---

## 4. Plan d'action séquencé

### J-3 → J-1 : avant de toucher au DNS

1. ✅ **Fait le 2026-07-30** — redirections corrigées (53 → 110 règles), balise GSC ajoutée,
   `check-redirects.mjs` réparé. **Reste à fusionner sur master : rien n'est en ligne avant.**
2. ✅ **Fait le 2026-07-30** — `node scripts/check-redirects.mjs https://aimezlanatureseo.vercel.app`
   → **220/220 OK** sur le déploiement de production réel (commit `8b4b192`). C'est le contrôle qui
   confirme que Vercel applique bien `(.*)` comme constaté — la seule partie non vérifiable en
   local. À rejouer une dernière fois sur le domaine définitif au jour J (étape 14).
3. **Préparer** (sans encore basculer, la recette a besoin du mode test) : récupérer la clé
   `sk_live_…`, créer le webhook Stripe en mode **live** vers `/api/stripe-webhook` et noter son
   `STRIPE_WEBHOOK_SECRET`. Vérifier au passage que `EMAILIT_API_KEY` et `EMAILIT_FROM` sont bien
   définies en environnement Production.
4. **Trancher la question du tracking** : réintégrer `AW-17799798810` (⇒ CSP + bandeau de
   consentement CNIL) ou acter son arrêt par écrit.
5. **Sécuriser l'accès Search Console** : ajouter la balise `google-site-verification` au
   `BaseLayout`, ou ajouter une vérification TXT DNS sur le domaine (à faire **avant** la bascule,
   pendant que le WordPress répond encore).
6. **Rattacher `aimezlanature.fr` + `www.aimezlanature.fr`** au projet `aimezlanatureseo` dans
   Vercel (sans encore changer les DNS), et lever l'ambiguïté avec le projet `aimezlanature`.
7. **Relever l'état DNS complet** (`A`, `MX`, `TXT`, DMARC) et le consigner comme point de
   restauration — les MX de la boîte mail ne doivent surtout pas bouger.
8. **Exporter depuis Search Console** les pages indexées et les requêtes des 3 derniers mois :
   c'est la seule référence pour mesurer une éventuelle perte après la bascule.
9. **Faire un test de commande de bout en bout en mode test** (état actuel) : panier → Stripe →
   `/commande-confirmee/` → email client → email marchand. C'est la recette qui valide la chaîne
   avant qu'on y branche les vraies clés.
10. 🔴 **Poser la règle de rate limiting du pare-feu sur `/api/checkout`** — déplacée ici depuis
    J+30 le 2026-07-30, parce que le risque n'existe **qu'après** la bascule : une rafale parallèle
    épuise le budget d'API Stripe du compte et empêche les vrais clients de payer. Le limiteur
    applicatif ne suffit pas (mesuré : 27 appels sur 30 passent en parallèle). Le plan Hobby
    l'autorise. Mode opératoire complet dans la section « Le mur » : installer la CLI, poser la
    règle en `log`, relire le trafic, puis passer en `rate_limit`. **Chaque étape se termine par un
    `vercel firewall publish --yes` joué par le marchand.**

### Jour J : bascule

11. **Rattacher `aimezlanature.fr` + `www` au projet** `aimezlanatureseo`, puis **basculer Stripe en
    live** : `STRIPE_SECRET_KEY` = `sk_live_…` et `STRIPE_WEBHOOK_SECRET` = celui du webhook live,
    en environnement Production. **Redéployer** (une variable d'environnement ne prend effet qu'au
    déploiement suivant). Contrôle : un `POST /api/checkout` doit désormais renvoyer une session
    `cs_live_…` et non plus `cs_test_…`.
12. Baisser le TTL DNS à 300 s **quelques heures avant**, puis pointer l'enregistrement A/CNAME
    vers Vercel. **Ne toucher à aucun enregistrement MX ni TXT.**
13. Vérifier immédiatement : `https://aimezlanature.fr/` en 200, certificat HTTPS émis,
    **absence de `X-Robots-Tag: noindex`** (contrôle capital), `robots.txt` et
    `/sitemap-index.xml` accessibles publiquement.
14. **Relancer `check-redirects.mjs` sur le domaine de production** et exiger 100 % de vert.
15. Tester à la main les 6 URLs `/product-category/*/`, `/perles-de-ceramique-em/` et
    `/category/blog/` — celles qui étaient en 404.
16. **Supprimer la variable `EMAIL_SITE_URL`** de Vercel et redéployer.
17. **Passer une vraie commande en live** (petit montant, remboursé ensuite) sur le domaine
    définitif : c'est le seul test qui prouve à la fois les clés live, le webhook live et le
    `success_url` (qui dépend de `url.origin` et change donc avec le domaine).
18. Remettre le TTL DNS à sa valeur normale.

### J+1

19. **Search Console** : soumettre `https://aimezlanature.fr/sitemap-index.xml`, puis retirer
    l'ancien `wp-sitemap.xml`.
20. **Inspection d'URL** sur 8-10 URLs témoins : accueil, `/perles-ceramique-em/`, les 4 fiches
    produit, 2 articles de blog. Demander l'indexation. Confirmer que Google voit bien le
    contenu rendu (les avis notamment).
21. Vérifier le rapport **Couverture / Pages** : aucune « Bloquée par robots.txt », aucune
    « Détectée mais non indexée » inattendue.
22. Contrôler le **rapport Résultats enrichis** : `Produit`, `FAQ`, `Fil d'Ariane`, `Article`.
23. Si Google Ads a été réintégré : vérifier qu'une conversion test remonte bien.

### J+7

24. **Corriger le CLS** (préchargement des polices ou API Fonts d'Astro) et re-mesurer : viser
    < 0,10. C'est le seul Core Web Vital hors seuil.
25. Comparer impressions/clics à la référence pré-bascule. Une baisse de 10-20 % sur 2-3 semaines
    est normale ; au-delà, chercher une cause (404, canonical, indexation).
26. Passer en revue le **rapport 404 de Search Console** : toute URL entrante non prévue
    (backlinks externes anciens) doit recevoir sa règle 301.
27. Vérifier les logs Vercel : aucune erreur 500 sur `/api/checkout`, `/api/stripe-webhook`,
    `/api/avis`, `/api/revendeur`.
28. Raccourcir les 2 `title` et la `description` hors gabarit.

### J+30

29. Bilan de positionnement complet vs référence pré-bascule, requête par requête.
30. Vérifier que les **11 URLs `/x-*/`** et les anciennes URLs WooCommerce sont sorties de l'index.
31. Contrôler les **Core Web Vitals sur données de terrain** (CrUX) dans Search Console — les
    premières données réelles arrivent vers J+28.
32. **Relire le trafic de la règle de pare-feu** posée en J-1 (étape 10) : combien de 429 réels,
    et sur quelles IP. Si zéro déclenchement en un mois, resserrer le plafond de 30 à 15 par
    minute ; si des clients légitimes ont été bloqués, l'élargir. ⚠️ L'ancienne rédaction de cette
    étape (« finir le rate limiting sur les routes API, branche `rate-limiting-a-verifier` ») était
    doublement fausse : la branche n'existe plus, et le travail a été fait le 2026-07-30.
33. Optimisations restantes : AVIF, sous-ensembles de polices latin uniquement.
34. Ne décommissionner l'hébergement WordPress **qu'après** ce bilan, et **conserver une
    sauvegarde complète** (base + `wp-content`) : c'est le seul rollback possible.

---

## 5. Ce qu'il faut retenir

Le travail SEO on-page est de très bonne qualité et **au-dessus** de l'ancien site sur tous les
axes mesurables : 100/100 en SEO Lighthouse contre 92, aucune balise manquante sur 29 pages,
JSON-LD valide partout, zéro image sans `alt`, zéro lien cassé, 40× moins de poids par page.

Les risques ne sont pas dans les pages. Deux des trois points de cette conclusion ont été traités le
2026-07-30 ; il reste **une manœuvre à ne pas rater** et **un mur à poser** :

1. ✅ **Google Ads** — tranché et livré : réintégré derrière un bandeau de consentement maison, avec
   les preuves relevées sur le déploiement réel. Reste l'étiquette de conversion à fournir.
2. 🔴 **Le passage de Stripe en live au jour J.** Ce n'est pas un bug — le mode test est voulu pendant
   la recette — mais c'est le geste dont l'oubli coûterait le plus cher : le tunnel continuerait de
   s'ouvrir normalement sans qu'aucune commande ne soit encaissée.
3. ✅ **`check-redirects.mjs` rejoué sur la production réelle** — **220/220 OK** sur le commit
   `8b4b192`. C'était le seul contrôle impossible en local.
4. 🔴 **La règle de rate limiting du pare-feu, à poser AVANT la bascule** (étape 10). Le limiteur
   applicatif ne bloque rien face à une rafale parallèle — mesuré, 27 appels sur 30 passent — et une
   rafale épuise le budget d'API Stripe **du compte**, ce qui empêche les vrais clients de payer.
   Bonne nouvelle vérifiée au passage : le plan Hobby autorise cette règle, l'obstacle qui avait tué
   la version Cloudflare n'existe pas ici.

Ce que cet audit a appris de plus utile au projet : **un script — ou un test — au vert n'est pas une
preuve.** Le même défaut s'est produit deux fois, sur deux sujets sans rapport, le même jour :

- `check-redirects.mjs` affichait « 53/53 OK » pendant que 6 URLs réellement indexées tombaient en
  404, parce qu'il fabriquait ses cas de test au plus simple au lieu de les fabriquer à l'image des
  vraies données.
- la vérification du limiteur annonçait « 10 passent, le 11ᵉ est bloqué » en testant une boucle
  séquentielle — alors que **personne n'attaque en série**. Le scénario réaliste, 30 requêtes
  parallèles, ne bloque rien du tout.

Dans les deux cas le test était juste, mais posait la question facile. La règle qui en sort : **le
cas de test doit ressembler à la réalité qu'on redoute, pas à celle qu'on sait traiter.**
