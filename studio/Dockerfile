# syntax=docker/dockerfile:1
#
# Studio Sanity (interface d'édition), servi en statique par nginx sur
# studio.aimezlanature.fr — application Coolify séparée du site.
# Contexte de build : la RACINE du dépôt (le Studio lit contenu/regles.json).
#   docker build -f studio/Dockerfile --build-arg SANITY_STUDIO_PROJECT_ID=xxx .

FROM node:22-alpine AS build
WORKDIR /app
COPY contenu/regles.json contenu/photos-site.json ./contenu/
COPY studio/package.json studio/package-lock.json ./studio/
RUN cd studio && npm ci
COPY studio ./studio
# L'identifiant de projet n'est pas un secret : il est visible dans le Studio publié.
ARG SANITY_STUDIO_PROJECT_ID
ARG SANITY_STUDIO_DATASET=production
ENV SANITY_STUDIO_PROJECT_ID=$SANITY_STUDIO_PROJECT_ID \
    SANITY_STUDIO_DATASET=$SANITY_STUDIO_DATASET
RUN test -n "$SANITY_STUDIO_PROJECT_ID" || (echo "SANITY_STUDIO_PROJECT_ID manquant" && exit 1)
RUN cd studio && npx sanity build --yes

# Image d'exécution : nginx sans privilèges root (écoute sur 8080).
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY studio/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/studio/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:8080/ > /dev/null || exit 1
