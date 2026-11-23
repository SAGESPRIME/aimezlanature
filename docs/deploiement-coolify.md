# Déploiement sur le VPS (Coolify)

Le site quitte Vercel. Tout tourne sur le VPS administré avec Coolify, en **trois applications**
construites depuis ce dépôt GitHub :

| Application Coolify | Source | Domaine | Rôle |
|---|---|---|---|
| `site-prod` | branche `master`, `Dockerfile` (racine) | `aimezlanature.fr` + `www.aimezlanature.fr` | le site public |
| `site-recette` | branche de travail, `Dockerfile` (racine) | `recette.aimezlanature.fr` | préproduction, Stripe en **test**, jamais indexée |
| `studio` | branche `master`, `studio/Dockerfile` | `studio.aimezlanature.fr` | interface d'édition Sanity |

Le contenu (produits, prix, avis, articles, FAQ) vit dans Sanity : voir [`docs/sanity.md`](sanity.md).

---

## 1. Préparer le VPS (une fois)

- Accès SSH **par clé uniquement** (`PasswordAuthentication no`), pas de connexion root directe.
- Pare-feu : `ufw allow 22,80,443/tcp` et rien d'autre. **Ne jamais exposer le port 8000** de Coolify :
  servir son interface sur un domaine en HTTPS (Coolify → Settings → Instance Domain).
- `fail2ban` et `unattended-upgrades` installés.
- Double authentification activée sur le compte Coolify.
- Notifications Coolify (email ou Discord) pour les **échecs de déploiement** : c'est par là qu'on
  apprend qu'une publication Sanity invalide n'a pas été mise en ligne.

## 2. Application `site-prod`

**Build pack** : Dockerfile · **Port** : 4321 · **Healthcheck** : `/api/sante` · **1 seule réplique**.

> ⚠️ Une seule réplique : la limite anti-abus de `/api/checkout` compte en mémoire. Avec deux
> conteneurs, chacun aurait son compteur et une rafale parallèle passerait deux fois plus.

### Variables de BUILD (cocher « Build Variable »)

| Variable | Valeur |
|---|---|
| `SANITY_PROJECT_ID` | identifiant du projet Sanity |
| `SANITY_DATASET` | `production` |
| `SANITY_READ_TOKEN` | jeton Sanity **Viewer** (lecture seule ; requis pour la relecture des brouillons) |
| `CONTENU_SOURCE` | `sanity` (défaut du Dockerfile ; sans projet Sanity, le build échoue — voulu) |

### Variables d'EXÉCUTION

| Variable | Valeur |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_…` (au jour J ; `sk_test_…` avant) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` du webhook **live** pointant vers `https://aimezlanature.fr/api/stripe-webhook` |
| `EMAILIT_API_KEY`, `EMAILIT_FROM` | identiques à Vercel |
| `CLIENT_IP_HEADER` | `x-real-ip` (Traefik). `cf-connecting-ip` si Cloudflare est placé devant |

Le serveur **refuse de démarrer** (Coolify garde alors l'ancienne version en ligne) si :
- les mentions légales contiennent encore « À COMPLÉTER » (hébergeur, `src/data/hebergeur.ts`) ;
- le build a été fait sans Sanity (`seed`) ou avec les brouillons (`+brouillons`).

### Domaines et HTTPS

Renseigner `https://aimezlanature.fr,https://www.aimezlanature.fr`. Coolify obtient les certificats
Let's Encrypt. La redirection `www` → domaine nu (301) est faite par `server.mjs`, pas besoin de règle.
Activer la compression (gzip) de Traefik dans les réglages de l'application.

### Seconde barrière anti-abus (Traefik)

Le limiteur applicatif bloque déjà la rafale parallèle (`npm run check:ratelimit` au vert). Pour
couper l'abus **avant** qu'il atteigne Node, ajouter dans « Container Labels » de `site-prod`
(remplacer `<service>` par le nom du service que Coolify a généré dans ses propres labels) :

```
traefik.http.middlewares.aln-paiement.ratelimit.average=30
traefik.http.middlewares.aln-paiement.ratelimit.period=1m
traefik.http.middlewares.aln-paiement.ratelimit.burst=10
traefik.http.routers.aln-paiement.rule=Host(`aimezlanature.fr`) && PathPrefix(`/api/checkout`)
traefik.http.routers.aln-paiement.entrypoints=https
traefik.http.routers.aln-paiement.tls=true
traefik.http.routers.aln-paiement.tls.certresolver=letsencrypt
traefik.http.routers.aln-paiement.priority=100
traefik.http.routers.aln-paiement.middlewares=aln-paiement
traefik.http.routers.aln-paiement.service=<service>
```

⚠️ Uniquement `/api/checkout` : un 429 sur `/api/stripe-webhook` ferait rejouer Stripe en boucle et
casserait les emails de commande. Ordre des seuils à garder : application 10/min (l'humain qui
reclique reçoit un message clair), Traefik 30/min (l'automate est coupé à l'entrée).

## 3. Application `site-recette`

Comme `site-prod`, avec :

- domaine `https://recette.aimezlanature.fr` ;
- `SITE_RECETTE=1` (exécution) → `X-Robots-Tag: noindex` partout et `robots.txt` fermé ;
- clés Stripe **test**, webhook Stripe **test** vers `https://recette.aimezlanature.fr/api/stripe-webhook` ;
- `EMAIL_SITE_URL=https://recette.aimezlanature.fr` (liens des emails) ;
- `CONTENU_BROUILLONS=1` (build) quand on veut **relire les brouillons** Sanity avant publication ;
- `CONTENU_SOURCE=seed` (build) tant que le projet Sanity n'existe pas encore.

## 4. Application `studio`

**Build pack** : Dockerfile · **Dockerfile** : `studio/Dockerfile` · **Base directory** : `/`
(le Studio lit `contenu/regles.json` à la racine) · **Port** : 8080.
Variable de build : `SANITY_STUDIO_PROJECT_ID`. Domaine : `https://studio.aimezlanature.fr`.

## 5. Publication Sanity → reconstruction du site (relais signé)

Une publication dans le Studio n'apparaît sur le site qu'après une reconstruction. Le chemin :

```
Studio ─publier─▶ Sanity ─webhook signé─▶ https://<site>/api/reconstruction
                                            │ vérifie la signature (SANITY_WEBHOOK_SECRET)
                                            │ regroupe : 45 s de calme, 3 min au plus
                                            ▼
                               API Coolify /deploy (COOLIFY_DEPLOY_TOKEN) → build 2-3 min
```

Le jeton Coolify reste sur notre serveur ; Sanity ne détient qu'un secret de signature, qui ne
permet rien d'autre que de demander une reconstruction. Dix publications d'affilée = **un** build.

Variables d'exécution de chaque application site (recette, puis prod au jour J) :

| Variable | Valeur |
|---|---|
| `COOLIFY_API_URL` | `https://coolify.presencebusiness.com/api/v1` |
| `COOLIFY_APP_UUID` | identifiant Coolify de l'application elle-même |
| `COOLIFY_DEPLOY_TOKEN` | jeton Coolify (Keys & Tokens) avec la **seule** permission *deploy* |
| `SANITY_WEBHOOK_SECRET` | secret aléatoire, identique à celui du webhook Sanity |

Côté Sanity (API → Webhooks), un webhook par application site (le plan Free en permet 2) :
URL `https://<site>/api/reconstruction`, méthode POST, dataset `production`, événements
create/update/delete, filtre `_type in ["produit","avis","article","faq","reglages","auteur"]`,
projection `{_id, _type}`, brouillons **non** inclus, secret = `SANITY_WEBHOOK_SECRET`.

Code : `src/pages/api/reconstruction.ts` (signature, réponse 202 immédiate) et
`src/lib/reconstruction.ts` (regroupement, appel Coolify, une nouvelle tentative en cas d'échec).

## 6. Sauvegardes

- **Sanity** : tâche planifiée Coolify hebdomadaire
  `npx sanity dataset export production /sauvegardes/sanity-$(date +%F).tar.gz`
  (jeton en lecture), avec une copie hors du VPS.
- **Code** : GitHub. **Images Docker** : Coolify garde les précédentes → retour arrière en un clic.
- **WordPress** : sauvegarde complète (base + `wp-content`) conservée jusqu'à J+30.

## 7. Surveillance

Uptime Kuma (installable depuis Coolify) sur `https://aimezlanature.fr/` et
`https://aimezlanature.fr/api/sante` (renvoie le commit déployé), alertes par email.

## 8. Contrôles avant la bascule (sur la recette)

```bash
npm run check:redirects -- https://recette.aimezlanature.fr
npm run check:headers -- https://recette.aimezlanature.fr --recette
npm run check:ratelimit -- https://recette.aimezlanature.fr
```

Les trois doivent passer au vert. `check:ratelimit` rejoue aussi une rafale à **IP falsifiées** :
elle prouve que Traefik pose bien `X-Real-IP` et ne laisse pas passer un `X-Forwarded-For` inventé.

## 9. Jour J

1. Clés Stripe **live** + webhook live dans `site-prod`, redéployer.
2. DNS chez Hostinger : TTL 300 quelques heures avant, puis enregistrements `A` de `@` et `www`
   vers l'IP du VPS. **Ne toucher à aucun MX ni TXT** (boîte mail, Emailit, Search Console).
3. Vérifier : HTTPS, `/robots.txt` ouvert, **pas** de `X-Robots-Tag`, `npm run check:redirects` et
   `npm run check:headers -- https://aimezlanature.fr` au vert.
4. Vraie commande à petit montant, puis remboursement.
5. Search Console et Bing Webmaster Tools : soumettre `https://aimezlanature.fr/sitemap-index.xml`.

**Retour arrière** : remettre les anciens enregistrements DNS (WordPress, toujours en ligne).

## 10. Après la bascule (J+30)

Supprimer les projets Vercel `aimezlanature` et `aimezlanatureseo` (et jeter le brouillon de règle de
pare-feu `rule_limite_paiement_sK41Kp`, devenu sans objet), puis décommissionner WordPress.
