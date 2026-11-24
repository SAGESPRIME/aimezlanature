# syntax=docker/dockerfile:1
#
# Image de production du site Aimez la Nature, déployée par Coolify.
#
#   docker build -t aimezlanature .
#   docker run -p 4321:4321 --env-file .env aimezlanature
#
# Le contenu (produits, prix, articles…) est lu dans Sanity AU BUILD : les
# variables SANITY_* doivent donc être fournies comme « Build Variables » dans
# Coolify. Les secrets d'exécution (Stripe, Emailit) ne sont fournis qu'au
# démarrage du conteneur et n'entrent jamais dans l'image.

# ── 1. Build ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Variables de build (contenu). Aucune n'est un secret d'écriture : le jeton
# Sanity est en lecture seule (« Viewer »).
ARG SANITY_PROJECT_ID
ARG SANITY_DATASET=production
ARG SANITY_READ_TOKEN
# `sanity` par défaut : sans SANITY_PROJECT_ID, le build ÉCHOUE au lieu de
# retomber silencieusement sur le contenu de développement. Pour une recette
# avant la création du projet Sanity : CONTENU_SOURCE=seed.
ARG CONTENU_SOURCE=sanity
# Recette uniquement : 1 = afficher les brouillons Sanity pour relecture.
ARG CONTENU_BROUILLONS=0
ENV SANITY_PROJECT_ID=$SANITY_PROJECT_ID \
    SANITY_DATASET=$SANITY_DATASET \
    SANITY_READ_TOKEN=$SANITY_READ_TOKEN \
    CONTENU_SOURCE=$CONTENU_SOURCE \
    CONTENU_BROUILLONS=$CONTENU_BROUILLONS

RUN npm run build

# Dépendances d'exécution uniquement, sans les outils de build.
RUN npm prune --omit=dev

# ── 2. Exécution ──────────────────────────────────────────────────────────
FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    PORT=4321

# Seuls les fichiers nécessaires à l'exécution : ni sources, ni .git, ni jeton
# Sanity (les ENV de l'étape de build ne passent pas dans cette étape).
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/server.mjs ./
COPY --from=build --chown=node:node /app/src/data/securite.mjs /app/src/data/redirections.mjs /app/src/data/ip-client.mjs /app/src/data/redirections.json ./src/data/

# Jamais root dans le conteneur.
USER node
EXPOSE 4321

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4321/api/sante > /dev/null || exit 1

CMD ["node", "server.mjs"]
