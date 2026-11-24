# SECURITY-NOTES — état au 2026-11-24 (migration VPS Coolify + Sanity, correctifs d'audit)

Historique : audit du 2026-07-20 (`docs/audit/rapport-audit-2026-07-20.md`), puis rapport
pré-bascule du 2026-07-29, puis audit du 2026-11-24 (skill Cloudflare `security-audit`, profil
quick, code source seulement : 0 faille confirmée, 6 pistes à valider, toutes corrigées ci-dessous). Cette page décrit l'état ACTUEL ; les détails de mise en œuvre sont en
commentaire à l'endroit du code concerné.

## Où vit chaque protection

| Protection | Fichier | Vérifiée par |
|---|---|---|
| En-têtes (CSP stricte, HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP) | `src/data/securite.mjs`, posés par `server.mjs` | `npm run check:headers` |
| Limite anti-abus `/api/checkout`, `/api/avis`, `/api/revendeur` | `src/lib/rateLimit.ts` (+ Traefik, `docs/deploiement-coolify.md`) | `npm run check:ratelimit` (rafale parallèle + IP falsifiées) |
| IP de confiance du client : en-tête cru **seulement** si la connexion vient d'une adresse privée (Traefik) ; jamais d'IP vide | `src/data/ip-client.mjs`, `server.mjs` (`CLIENT_IP_HEADER`) | `npm test` ; `check:ratelimit` (X-Forwarded-For, X-Real-IP et CF-Connecting-IP falsifiés) |
| Limiteur : IPv6 comptée par /64 ; au-delà de 5 000 compteurs, éviction des plus anciens (plus de remise à zéro générale) ; IP absente = compteur commun | `src/lib/rateLimit.ts` | `npm test` |
| Corps de requête plafonnés à 256 Kio (413), avant toute lecture | `server.mjs` (Content-Length), `astro.config.mjs` (`bodySizeLimit`, envois sans longueur) | test local : 300 Kio → 413, avec et sans Content-Length |
| Avis : réponse envoyée dès le formulaire validé, identique pour tous (statut, corps, temps) ; vérification Stripe et notification marchand **après** la réponse, transmis seulement si une commande payée contient **ce** produit ; échec → avis au journal | `src/pages/api/avis.ts` | recette : client et inconnu → 200 en ~0,46 s chacun (2026-11-24) |
| Recette avec brouillons : mot de passe HTTP obligatoire (sinon refus de démarrer) ; brouillons refusés en prod même avec `AUTORISER_SEED` | `server.mjs` | test local : 401 / 200, refus de démarrer |
| Liens du CMS : https, mailto ou chemin interne seulement, revérifiés au build | `src/content.config.ts` | build |
| Prix toujours décidés côté serveur | `src/pages/api/checkout.ts`, données figées au build | test manuel : slug inconnu 400, rupture 409 |
| Webhook Stripe : signature HMAC + anti-rejeu 5 min + anti-doublon par `event.id` (409 tant qu'un premier traitement est en cours) ; notification marchand jamais renvoyée lors des rejeux ; événement d'un autre mode (test/live) ignoré ; sessions marquées `metadata.source` | `src/lib/stripe-signature.ts`, `src/lib/evenements-traites.ts`, `src/lib/marque-stripe.ts` | — |
| JSON dans `<script>` échappé (JSON-LD, catalogue) | `src/lib/json-script.ts` | — |
| Texte du CMS échappé (panier, Portable Text) | `public/js/cart.js`, `src/components/texte/` | — |
| Production jamais servie avec contenu de dev, brouillons ou mention légale vide | `server.mjs` (gardes au démarrage) | — |
| Webhook Sanity → reconstruction : signature HMAC (`@sanity/webhook`) + messages de plus de 5 min refusés ; le jeton Coolify ne quitte pas le serveur | `src/pages/api/reconstruction.ts`, `src/lib/reconstruction.ts` | test local : 401 si signature absente, fausse, corps modifié ou message ancien |
| Conteneur non-root, healthcheck | `Dockerfile`, `studio/Dockerfile` | CI |

## Règles à maintenir

- **CSP** : jamais `'unsafe-inline'`. CSS toujours externe (`build.inlineStylesheets: 'never'`),
  JS dans `public/js/`, images Sanity optimisées au build (servies depuis `/_astro`).
- **HSTS sans `includeSubDomains` ni `preload`** : les sous-domaines d'envoi d'emails (Emailit) ne
  sont pas vérifiés en HTTPS, et `preload` est quasi irréversible. À réactiver après vérification.
- **Une seule réplique** du conteneur site (compteur anti-abus en mémoire).
- **Aucun jeton d'écriture Sanity sur le serveur** : seul un jeton Viewer sert au build.
- `/api/stripe-webhook` n'est **jamais** limité en débit (un 429 casserait les emails de commande).
- Tout appel à un service tiers (Stripe, Emailit) a un délai maximum (`AbortSignal.timeout`).
- Aucune URL absolue construite depuis la requête (`url.origin` vaut localhost) : `src/lib/origine.ts`.
- **Aucun port du conteneur publié sur l'hôte** : tout passe par Traefik. Un accès direct serait
  compté sous sa propre IP (l'en-tête n'est plus cru), mais contournerait Traefik.
- Avec `CLIENT_IP_HEADER=cf-connecting-ip`, n'autoriser que les plages Cloudflare sur 80/443 :
  sinon un client qui contourne Cloudflare écrit lui-même cet en-tête.
- Un mois après le jour J : passer le webhook en **refus** des sessions sans marque
  `metadata.source` (aujourd'hui simplement signalées, pour ne pas perdre les commandes en cours
  lors de la bascule).

## Dépendances

`npm audit --omit=dev` : 0 vulnérabilité (contrôlé en CI, niveau high). Studio : 2 failles « high »
résiduelles dans l'outillage de build de la CLI Sanity (`js-yaml` via `@vercel/frameworks`), sans
exposition à l'exécution (le Studio publié est statique).
