# SECURITY-NOTES — état au 2026-11-23 (migration VPS Coolify + Sanity)

Historique : audit du 2026-07-20 (`docs/audit/rapport-audit-2026-07-20.md`), puis rapport
pré-bascule du 2026-07-29. Cette page décrit l'état ACTUEL ; les détails de mise en œuvre sont en
commentaire à l'endroit du code concerné.

## Où vit chaque protection

| Protection | Fichier | Vérifiée par |
|---|---|---|
| En-têtes (CSP stricte, HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP) | `src/data/securite.mjs`, posés par `server.mjs` | `npm run check:headers` |
| Limite anti-abus `/api/checkout`, `/api/avis`, `/api/revendeur` | `src/lib/rateLimit.ts` (+ Traefik, `docs/deploiement-coolify.md`) | `npm run check:ratelimit` (rafale parallèle + IP falsifiées) |
| IP de confiance du client | `server.mjs` (`CLIENT_IP_HEADER`) | idem, rafale à IP falsifiées |
| Prix toujours décidés côté serveur | `src/pages/api/checkout.ts`, données figées au build | test manuel : slug inconnu 400, rupture 409 |
| Webhook Stripe : signature HMAC + anti-rejeu 5 min + anti-doublon par `event.id` | `src/lib/stripe-signature.ts`, `src/lib/evenements-traites.ts` | — |
| JSON dans `<script>` échappé (JSON-LD, catalogue) | `src/lib/json-script.ts` | — |
| Texte du CMS échappé (panier, Portable Text) | `public/js/cart.js`, `src/components/texte/` | — |
| Production jamais servie avec contenu de dev, brouillons ou mention légale vide | `server.mjs` (gardes au démarrage) | — |
| Conteneur non-root, healthcheck | `Dockerfile`, `studio/Dockerfile` | CI |

## Règles à maintenir

- **CSP** : jamais `'unsafe-inline'`. CSS toujours externe (`build.inlineStylesheets: 'never'`),
  JS dans `public/js/`, images Sanity optimisées au build (servies depuis `/_astro`).
- **HSTS sans `includeSubDomains` ni `preload`** : les sous-domaines d'envoi d'emails (Emailit) ne
  sont pas vérifiés en HTTPS, et `preload` est quasi irréversible. À réactiver après vérification.
- **Une seule réplique** du conteneur site (compteur anti-abus en mémoire).
- **Aucun jeton d'écriture Sanity sur le serveur** : seul un jeton Viewer sert au build.
- `/api/stripe-webhook` n'est **jamais** limité en débit (un 429 casserait les emails de commande).

## Dépendances

`npm audit --omit=dev` : 0 vulnérabilité (contrôlé en CI, niveau high). Studio : 2 failles « high »
résiduelles dans l'outillage de build de la CLI Sanity (`js-yaml` via `@vercel/frameworks`), sans
exposition à l'exécution (le Studio publié est statique).
