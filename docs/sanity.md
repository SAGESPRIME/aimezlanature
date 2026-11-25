# Sanity — le contenu du site

Produits, prix, stock, avis, articles, FAQ et réglages (frais de port, seuil de livraison offerte,
note globale, profils de la marque) se modifient dans le **Studio** :
`https://studio.aimezlanature.fr`. Restent dans le code, versionnés et testés : redirections, CGV,
mentions légales, gabarits d'email, tracking.

## Comment le site lit le contenu

```
Studio ──publier──▶ Sanity ──webhook──▶ Coolify reconstruit le site (2-3 min)
                                         │
                                         ├─ build : 1 requête GROQ, validation zod stricte
                                         │          (donnée invalide = build en échec,
                                         │           le site en ligne reste l'ancien)
                                         └─ site statique + serveur : prix FIGÉS dans le build
```

- **Aucun appel à Sanity pendant une visite ou un paiement.** Sanity peut être en panne sans que
  la vente s'arrête ; un prix ne change qu'à la reconstruction.
- Images : téléchargées et optimisées au build, servies depuis le site (la CSP reste stricte).
- Limites communes au Studio et au site : `contenu/regles.json` (longueur des titres Google, bornes
  de prix…).
- Code : `src/content.config.ts` (schémas), `src/lib/cms/source.ts` (requête), façades
  `src/data/products.ts`, `reviews.ts`, `blogPosts.ts`, `faq.ts`.

## Plan Sanity : le plan Free suffit

Tout nouveau projet démarre par un **essai gratuit des fonctions du plan Growth**. À la fin de
l'essai, le projet repasse **automatiquement et sans frais** sur le plan **Free** : Sanity ne
facture rien sans passage volontaire au plan Growth. Le site est conçu pour ce plan Free :

| Limite du plan Free | Besoin du site |
|---|---|
| 10 000 documents | ~150 (produits, avis, articles, FAQ, réglages) |
| 2 datasets | 1 (`production`) |
| 2 webhooks GROQ | 2 (reconstruction de la prod et de la recette) |
| 20 utilisateurs | 1 à 2 |

Le site n'interroge Sanity qu'au build : les visites et les paiements ne consomment aucun quota.

Deux conséquences, appliquées dès la création pour ne pas subir la fin de l'essai :

- **Dataset public** : les datasets privés sont une fonction payante (un dataset privé redevient
  public à la fin de l'essai). Ce n'est pas un risque ici : le contenu publié est déjà visible sur
  le site, aucune donnée personnelle n'est stockée (les avis n'ont pas d'email), et les
  **brouillons ne sont jamais lisibles publiquement**, même sur un dataset public — il faut un
  jeton pour les voir.
- **Éditeurs administrateurs** : après l'essai, tout membre qui n'est pas administrateur devient
  lecteur. Quiconque publie du contenu (marchand compris) doit donc avoir le rôle
  **Administrator**. Rester peu nombreux : un administrateur peut aussi gérer les jetons et les
  membres.

Le Studio n'utilise aucune fonction réservée à l'essai (commentaires, brouillons planifiés,
AI Assist) : rien ne disparaît à sa fin.

## Mise en place (une fois)

1. [sanity.io/manage](https://www.sanity.io/manage) → créer le projet « Aimez la Nature », dataset
   `production` en visibilité **publique**. Activer la double authentification sur chaque compte
   administrateur.
2. API → Tokens : créer un jeton **Viewer** (lecture seule) → variable de build `SANITY_READ_TOKEN`
   des applications site. Sur un dataset public, il n'est pas indispensable pour lire le contenu
   publié, mais il l'est pour le **mode relecture des brouillons** (`CONTENU_BROUILLONS=1`) : le
   renseigner partout pour un comportement identique. **Aucun jeton d'écriture sur le serveur** :
   en cas de fuite, il permettrait de modifier les prix.
3. API → CORS origins : ajouter `https://studio.aimezlanature.fr` (avec credentials) et
   `http://localhost:3333` pour l'édition locale. Rien d'autre.
4. Importer le contenu actuel (141 documents + 8 brouillons d'articles) depuis un poste connecté :
   Depuis le dossier `studio/` **du dépôt cloné** (le script lit `contenu/seed.ndjson` et les
   photos de `src/assets/` à la racine du dépôt) :
   ```bash
   cd studio && npm ci && npx sanity login
   SANITY_STUDIO_PROJECT_ID=<id> npm run importer
   ```
   Sous Windows (PowerShell), la variable se définit autrement :
   ```powershell
   cd studio; npm ci; npx sanity login
   $env:SANITY_STUDIO_PROJECT_ID="<id>"; npm run importer
   ```
   `npm run importer -- --simulation` affiche ce qui serait envoyé sans rien envoyer.

   **Sans `sanity login`** (serveur, CI, session cloud) : `scripts/migration-sanity/importer-api.mjs`
   fait la même chose par l'API avec un jeton **Editor temporaire**, à révoquer juste après
   (`SANITY_PROJECT_ID=… SANITY_WRITE_TOKEN=… node scripts/migration-sanity/importer-api.mjs`).
   C'est ainsi que le projet `0lgh06ly` a été rempli le 2026-11-23 : 4 photos et 149 documents,
   vérifiés ensuite par requêtes, et un build issu de Sanity identique, page par page, au build
   issu du seed. En cas
   d'erreur npm `ECOMPROMISED` (cache npm abîmé) : `npm cache clean --force`, puis recommencer.
   Les photos produit sont téléversées au passage. L'import n'écrase jamais un document existant
   (sauf `--remplacer`).
5. Renseigner `SANITY_PROJECT_ID` / `SANITY_READ_TOKEN` dans Coolify, puis configurer le webhook de
   reconstruction : [`docs/deploiement-coolify.md`](deploiement-coolify.md), section 5.

## Travailler au quotidien

- **Publier un avis** : l'email reçu via le formulaire du site contient tout. Studio → Avis clients →
  Créer, recopier **tel quel**, publier. La note et le nombre d'avis du produit se recalculent seuls.
- **Changer un prix** : Studio → Produits → Prix & stock. Le prix barré est **optionnel** : ne le
  remplir que pour une vraie réduction temporaire (directive Omnibus, aide affichée sous le champ).
- **Rupture de stock** : décocher « En stock ». La fiche reste en ligne, le produit ne peut plus être
  commandé, Google est informé.
- **Ne jamais modifier l'adresse (slug)** d'un produit ou d'un article publié : elle est indexée par
  Google. Pour une exception, ajouter d'abord la redirection dans `src/data/redirections.json`.

## Relire avant de publier (les 8 articles réécrits)

Les articles réécrits sont des **brouillons** : la version en ligne ne change pas tant qu'ils ne
sont pas publiés. Pour les voir dans le vrai site, construire la recette avec
`CONTENU_BROUILLONS=1` **et** les identifiants `RECETTE_UTILISATEUR` / `RECETTE_MOT_DE_PASSE`
(la recette demande alors un mot de passe sur toutes ses pages), relire sur
`recette.aimezlanature.fr`, puis publier dans le Studio chaque article validé. La production
refuse un build fait avec les brouillons, sans dérogation possible.

Ce qui a changé dans ces brouillons, et pourquoi :
[`scripts/migration-sanity/brouillons-articles.mjs`](../scripts/migration-sanity/brouillons-articles.mjs)
(en-tête du fichier).

## Développement local et CI

Sans `SANITY_PROJECT_ID`, le site lit `contenu/seed.ndjson` avec les mêmes requêtes GROQ (groq-js).
Ce seed est un instantané : une fois Sanity en service, c'est Sanity qui fait foi.

## Changer une photo du site

Les photos d'ambiance (grande photo de l'accueil, tuiles, photos des en-têtes de
pages) se changent dans le Studio : **Réglages du site → onglet « Photos du site »**.

1. Choisir l'emplacement (sa description dit où la photo apparaît).
2. Déposer la photo (format portrait pour l'accueil ; au moins 1 600 px de large
   pour les autres), régler le point d'intérêt si besoin.
3. Renseigner le **texte alternatif** (obligatoire : décrit la photo pour les
   personnes aveugles et pour Google).
4. **Crédit** : à remplir seulement si la photo n'est pas la vôtre (licence CC BY :
   « Titre, Auteur, CC BY 2.0 ») ; il s'affiche dans les mentions légales.
5. Publier : le site se reconstruit seul (environ 2 minutes).

Un emplacement laissé vide garde la photo actuelle (photo libre de secours,
`src/data/photosSite.ts`). Les emplacements sont déclarés dans
`contenu/photos-site.json` (lu par le Studio et par le site). La photo est
téléchargée et optimisée au build : le navigateur ne contacte jamais Sanity.

## Frais de livraison (au poids)

Réglés dans le Studio, appliqués tels quels au panier et au paiement Stripe :

- **Produit → Prix & stock** : « Poids du colis (g) », emballage compris, et
  « Ouvre la livraison offerte » (coché pour le Pack 100 et le Pack Gourde).
- **Réglages du site → Livraison & avis** : « Livraison des petits colis (€) »
  (4,90 €), « Seuil de poids du forfait » (500 g) et la grille Colissimo
  au-delà (une ligne par tranche, poids croissants).

Règle : jusqu'au seuil de poids, livraison offerte si le panier contient un
produit « Ouvre la livraison offerte », sinon le forfait ; au-delà, tarif de la
grille selon le poids total. Les textes du site (bandeau, fiches, CGV art. 4)
se mettent à jour seuls. Calcul : `src/data/livraison.mjs` (serveur) et
`public/js/livraison.js` (panier), vérifiés identiques par
`tests/livraison.test.mjs`.

## Revendeurs (espace pro)

- Chaque candidature du formulaire `/revendeurs/` arrive dans **Revendeurs → En
  attente de validation** (document privé, identifiant `revendeurs.…` : jamais
  lisible sans jeton, même si le dataset est public).
- Pour accepter : statut **Validé**, puis **Publier**. Dans les 5 minutes, le
  revendeur reçoit par email un lien de connexion (valable 7 jours) vers
  `/pro/` : commande à −30 %, minimum 300 € de produits, livraison Colissimo au
  poids (`src/data/commande-pro.mjs`). Il peut redemander un lien sur
  `/pro/connexion/`.
- **Suspendu** ou **Refusé** : l'accès est coupé dans la minute (statut relu à
  chaque page et à chaque paiement). Les notes internes ne sont jamais montrées.
- Ne pas créer de revendeur à la main dans le Studio (son identifiant serait
  public) : le menu « Créer » ne le propose pas.

Variables serveur (Coolify) : `SANITY_WRITE_TOKEN` (jeton Sanity **Editor**,
saisi par le marchand), `PRO_SECRET` (≥ 32 caractères, signature des liens et
sessions), `ENVOIS_AUTOMATIQUES=1` (ancien nom `PRO_INVITATIONS=1`, encore
accepté) sur **un seul** environnement (celui qui envoie les emails d'accès et
de suivi).

## Commandes

- Chaque paiement Stripe crée une fiche dans **Commandes → À expédier**
  (document privé `commandes.<session Stripe>`, créé par le webhook ; un rejeu
  de Stripe ne crée pas de doublon). On y lit : articles, montants, client,
  adresse de livraison, origine (client ou revendeur), lien vers le paiement
  dans Stripe. Les paiements de test sont marqués « TEST ».
- À l'envoi du colis : statut **Expédiée**, **numéro de suivi Colissimo**, puis
  **Publier**. Dans les 5 minutes, le client reçoit l'email « Votre colis est
  en route » avec le lien de suivi La Poste (une seule fois ; le numéro est
  ensuite verrouillé). Sans numéro, aucun email ne part.
- **Annulée / remboursée** : simple classement ; le remboursement se fait dans
  Stripe.
- Seuls le statut, le numéro de suivi et les notes se modifient ; le reste vient
  de Stripe, qui reste la référence comptable. Le menu « Créer » ne propose pas
  de commande.
- Si Sanity est indisponible au moment du paiement, la commande n'apparaît pas
  dans le Studio (journal `[commandes]`) mais reste dans Stripe et dans l'email
  « Nouvelle commande ».

Code : `src/data/commande-doc.mjs` (fiche, testée par
`tests/commandes.test.mjs`), `src/lib/commandes.ts`, `src/pages/api/taches.ts`.

## Clients

Menu **Clients** du Studio : une fiche par adresse email (`clients.<empreinte>` : privée,
illisible sans jeton, l'email n'est pas dans l'identifiant).

- **Fidèles** (2 commandes et plus), **Tous**, **Emails autorisés**, **Désinscrits**,
  **Clients de test** (paiements de test, comptés à part). Ouvrir un client → « Fiche » et
  « Commandes sur le nouveau site ».
- Anciens clients : importés une fois depuis WooCommerce (`scripts/clients/importer-woocommerce.mjs
  <rapport-clients.csv> <export-wordpress.xml> [--sanity]`). Seuls ceux qui ont **payé** une
  commande ; onglet « Historique WooCommerce » (date, numéro, montant). Fichiers sources hors
  du dépôt (données personnelles). Ré-exécutable sans doublon (`createIfNotExists`).
- Nouvelles commandes : le webhook Stripe crée ou complète la fiche (`src/lib/clients.ts`) ;
  chaque commande n'est comptée qu'une fois (`compteeClient` posé sur la fiche commande dans la
  même transaction, protégée par sa révision).
- **Emails commerciaux** : « autorisés » pendant 3 ans après le dernier achat (règle CNIL des
  clients existants, produits analogues, lien de désinscription dans chaque email) ; au-delà,
  « hors délai » ; « Désinscrit » à poser dès qu'un client le demande.
