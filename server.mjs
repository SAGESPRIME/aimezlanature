// @ts-check
/**
 * Serveur de production — remplace la plateforme Vercel sur le VPS (Coolify).
 *
 * Tout ce que Vercel faisait « par configuration » est fait ici, en clair et
 * dans le dépôt, pour que le site se comporte pareil sur n'importe quel hôte :
 *
 *   1. en-têtes de sécurité (CSP, HSTS…) sur TOUTES les réponses ;
 *   2. www → domaine nu, en 301 ;
 *   3. redirections des anciennes URLs WordPress (src/data/redirections.json) ;
 *   4. fichiers statiques (pages prérendues, /_astro, /js…) avec le bon cache ;
 *   5. routes à la demande d'Astro (/api/checkout, /api/avis, /api/revendeur,
 *      /api/stripe-webhook) ;
 *   6. page 404 avec le vrai code 404.
 *
 * Le HTTPS (certificat Let's Encrypt) et la compression sont assurés par le
 * proxy Traefik de Coolify, devant ce serveur.
 *
 * Variables d'environnement :
 *   PORT              port d'écoute (4321 par défaut)
 *   HOST              interface d'écoute (0.0.0.0 par défaut, requis en conteneur)
 *   SITE_RECETTE=1    préproduction : noindex partout + robots.txt fermé
 *   SOURCE_COMMIT     commit déployé (fourni par Coolify), affiché par /api/sante
 *   AUTORISER_SEED=1  dérogation : servir en production un build fait sans Sanity
 *   CLIENT_IP_HEADER  d'où lire l'IP réelle du client (voir plus bas) :
 *                     x-real-ip (défaut, Traefik), cf-connecting-ip (Cloudflare)
 *                     ou socket (aucun proxy : développement, CI)
 */
import express from 'express';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { ENTETES_SECURITE } from './src/data/securite.mjs';
import { chargerRegles, creerResolveur } from './src/data/redirections.mjs';

const ICI = fileURLToPath(new URL('.', import.meta.url));
const CLIENT = join(ICI, 'dist', 'client');
const RECETTE = process.env.SITE_RECETTE === '1';
const PORT = Number(process.env.PORT ?? 4321);
const HOST = process.env.HOST ?? '0.0.0.0';
const SOURCE_IP = (process.env.CLIENT_IP_HEADER ?? 'x-real-ip').toLowerCase();

/**
 * En-tête INTERNE qui transmet à Astro l'IP de confiance du client.
 * Lu par src/lib/rateLimit.ts, et seulement par lui.
 */
export const ENTETE_IP_CLIENT = 'x-aln-client-ip';

// Le handler Astro est construit au build (adaptateur @astrojs/node, mode
// « middleware ») : il ne sert que les routes à la demande.
const { handler: astro } = await import('./dist/server/entry.mjs');

// Garde-fou : une mention légale « à compléter » ne part jamais en production.
// La recette démarre quand même, pour qu'on puisse tout tester avant.
if (!RECETTE) {
  const mentions = readFileSync(join(CLIENT, 'mentions-legales', 'index.html'), 'utf8');
  const manque = mentions.match(/data-a-completer="([^"]+)"/);
  if (manque) {
    console.error(
      `⛔ Démarrage refusé : information légale à compléter (${manque[1]}) dans les mentions légales.\n` +
        '   Voir src/data/hebergeur.ts. En préproduction, définir SITE_RECETTE=1.'
    );
    process.exit(1);
  }
}

// Garde-fou : la production n'est jamais servie depuis le seed de développement
// (contenu/seed.ndjson), sauf dérogation explicite AUTORISER_SEED=1.
if (!RECETTE && process.env.AUTORISER_SEED !== '1') {
  const source = readFileSync(join(ICI, 'dist', 'source-contenu.txt'), 'utf8').trim();
  if (source !== 'sanity') {
    console.error(
      `⛔ Démarrage refusé : ce build a été fait avec le contenu « ${source} », pas avec Sanity.\n` +
        '   Renseigner SANITY_PROJECT_ID / SANITY_READ_TOKEN (variables de build) et reconstruire.'
    );
    process.exit(1);
  }
}

const resoudreRedirection = creerResolveur(chargerRegles());
const app = express();

// Ne pas annoncer la technologie du serveur.
app.disable('x-powered-by');
// Les chemins /Page/ et /page/ sont deux URL différentes pour les fichiers ;
// les redirections, elles, sont insensibles à la casse (voir redirections.mjs).
app.set('case sensitive routing', true);

// ── 1. En-têtes de sécurité ──────────────────────────────────────────────
app.use((_req, res, next) => {
  for (const [nom, valeur] of Object.entries(ENTETES_SECURITE)) res.setHeader(nom, valeur);
  // La préproduction ne doit jamais être indexée : sinon Google y verrait un
  // double du site. Le canonical vers aimezlanature.fr ne suffit pas à lui
  // seul — c'était le garde-fou fragile de l'ancienne recette Vercel.
  if (RECETTE) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
});

// ── IP de confiance du client ────────────────────────────────────────────
// Décidée ICI, en un seul endroit, puis transmise à Astro dans un en-tête
// interne. Toute valeur de cet en-tête envoyée par le client est d'abord
// effacée : il ne peut pas choisir l'IP sous laquelle il est compté.
//
// ⚠️ On ne lit JAMAIS la première entrée de `x-forwarded-for` : derrière
// Traefik, c'est le client qui l'écrit. Sur Vercel c'était sûr (la plateforme
// réécrit l'en-tête), sur un VPS ça ne l'est plus.
app.use((req, _res, next) => {
  delete req.headers[ENTETE_IP_CLIENT];
  const brut = SOURCE_IP === 'socket' ? req.socket.remoteAddress : req.headers[SOURCE_IP];
  // Si un proxy y concatène plusieurs adresses, la DERNIÈRE est celle qu'il a vue.
  const ip = String(Array.isArray(brut) ? brut.at(-1) : brut ?? '').split(',').pop()?.trim();
  if (ip) req.headers[ENTETE_IP_CLIENT] = ip;
  next();
});

// ── Santé (healthcheck Coolify, surveillance) ────────────────────────────
app.get('/api/sante', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ ok: true, commit: process.env.SOURCE_COMMIT ?? null });
});

// ── 2. www → domaine nu ──────────────────────────────────────────────────
app.use((req, res, next) => {
  const hote = req.headers.host ?? '';
  if (hote.startsWith('www.')) {
    return res.redirect(301, `https://${hote.slice(4)}${req.originalUrl}`);
  }
  next();
});

// ── robots.txt de préproduction ──────────────────────────────────────────
if (RECETTE) {
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send('User-agent: *\nDisallow: /\n');
  });
}

// ── 3. Redirections des anciennes URLs ───────────────────────────────────
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const destination = resoudreRedirection(req.path);
  if (!destination) return next();
  // La chaîne de requête suit, comme sur Vercel (ex. paramètres utm_*).
  const requete = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
  res.redirect(301, destination + requete);
});

// ── 4. Fichiers statiques ────────────────────────────────────────────────
app.use(
  express.static(CLIENT, {
    // /page → /page/ en 301 quand le dossier existe (pages prérendues).
    redirect: true,
    // Pas de listing de dossiers, pas de fichiers cachés (.env, .git…).
    dotfiles: 'ignore',
    index: ['index.html'],
    setHeaders(res, chemin) {
      // Les fichiers de /_astro portent une empreinte dans leur nom : ils ne
      // changent jamais, on peut les garder un an. Tout le reste (HTML, /js/*,
      // PDF…) garde le même nom d'un déploiement à l'autre : le navigateur doit
      // revalider à chaque fois, sinon il servirait une version périmée.
      if (chemin.includes(`${join('dist', 'client', '_astro')}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      }
    },
  })
);

// ── 5. Routes à la demande d'Astro (/api/*) ──────────────────────────────
// Astro appelle `next()` quand aucune de ses routes ne correspond.
app.use(astro);

// ── 6. 404 ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.sendFile(join(CLIENT, '404.html'));
});

const serveur = app.listen(PORT, HOST, () => {
  console.log(`Aimez la Nature — à l'écoute sur http://${HOST}:${PORT}${RECETTE ? ' (RECETTE, noindex)' : ''}`);
});

// Arrêt propre lors d'un redéploiement : Coolify envoie SIGTERM, on finit les
// requêtes en cours (un paiement, un webhook Stripe) avant de quitter.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    serveur.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 10_000).unref();
  });
}
