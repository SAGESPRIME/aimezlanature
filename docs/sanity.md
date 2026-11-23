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

## Mise en place (une fois)

1. [sanity.io/manage](https://www.sanity.io/manage) → créer le projet « Aimez la Nature », dataset
   `production` en visibilité **privée**. Activer la double authentification.
2. API → Tokens : créer un jeton **Viewer** (lecture seule) → variable de build `SANITY_READ_TOKEN`
   des applications site. **Aucun jeton d'écriture sur le serveur** : en cas de fuite, il permettrait
   de modifier les prix.
3. API → CORS origins : ajouter `https://studio.aimezlanature.fr` (avec credentials) et
   `http://localhost:3333` pour l'édition locale. Rien d'autre.
4. Importer le contenu actuel (141 documents + 8 brouillons d'articles) depuis un poste connecté :
   ```bash
   cd studio && npm ci && npx sanity login
   SANITY_STUDIO_PROJECT_ID=<id> npm run importer
   ```
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
`CONTENU_BROUILLONS=1`, relire sur `recette.aimezlanature.fr`, puis publier dans le Studio chaque
article validé. La production refuse un build fait avec les brouillons.

Ce qui a changé dans ces brouillons, et pourquoi :
[`scripts/migration-sanity/brouillons-articles.mjs`](../scripts/migration-sanity/brouillons-articles.mjs)
(en-tête du fichier).

## Développement local et CI

Sans `SANITY_PROJECT_ID`, le site lit `contenu/seed.ndjson` avec les mêmes requêtes GROQ (groq-js).
Ce seed est un instantané : une fois Sanity en service, c'est Sanity qui fait foi.
