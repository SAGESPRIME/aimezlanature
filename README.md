# Aimez la Nature — site e-commerce

Boutique de Perles de Céramique EM® : [aimezlanature.fr](https://aimezlanature.fr).

- **Astro 7**, site statique + 4 routes serveur (`/api/checkout`, `/api/stripe-webhook`,
  `/api/avis`, `/api/revendeur`), servi par `server.mjs` (Express) dans un conteneur Docker.
- **Hébergement** : VPS administré avec **Coolify** → [`docs/deploiement-coolify.md`](docs/deploiement-coolify.md)
- **Contenu** (produits, prix, avis, articles, FAQ) : **Sanity**, Studio dans `studio/` → [`docs/sanity.md`](docs/sanity.md)
- **Paiement** : Stripe Checkout, prix toujours recalculés côté serveur.

## Commandes

| Commande | Rôle |
|---|---|
| `npm ci` | installer |
| `npm run dev` | développement (contenu : `contenu/seed.ndjson` sans Sanity) |
| `npm run build` | construire `dist/` |
| `npm start` | servir le build comme en production (`SITE_RECETTE=1 CLIENT_IP_HEADER=socket` en local) |
| `npm run check` | types (astro check) |
| `npm run check:seo` | audit SEO du build : titles, h1, canonical, JSON-LD, liens, sitemap, espaces |
| `npm run check:redirects -- <url>` | les 120 redirections des anciennes URLs |
| `npm run check:headers -- <url> [--recette]` | en-têtes de sécurité et de cache |
| `npm run check:ratelimit -- <url>` | limite anti-abus (rafale parallèle + IP falsifiées) |
| `npm run check:parite` | compare le build à la photo SEO d'avant Sanity |

## Où trouver quoi

- `tasks/todo.md` — ce qui reste à faire, en tête de fichier ; `tasks/lessons.md` — pièges déjà rencontrés.
- `SECURITY-NOTES.md`, `SEO-NOTES.md`, `COPY-NOTES.md`, `DESIGN-NOTES.md` — règles par domaine.
- `docs/audit/` — rapports d'audit datés.
