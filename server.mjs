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
 *   HOST              interface d'écoute. Par défaut « :: » (IPv4 ET IPv6), repli
 *                     automatique sur 0.0.0.0 si le noyau n'a pas IPv6
 *   SITE_RECETTE=1    préproduction : noindex partout + robots.txt fermé
 *   SOURCE_COMMIT     commit déployé (fourni par Coolify), affiché par /api/sante
 *   AUTORISER_SEED=1  dérogation : servir en production un build fait sans Sanity
 *   CLIENT_IP_HEADER  d'où lire l'IP réelle du client (voir plus bas) :
 *                     x-real-ip (défaut, Traefik), cf-connecting-ip (Cloudflare)
 *                     ou socket (aucun proxy : développement, CI)
 *   RECETTE_UTILISATEUR / RECETTE_MOT_DE_PASSE
 *                     identifiants exigés (HTTP Basic) quand le build contient
 *                     des BROUILLONS Sanity (CONTENU_BROUILLONS=1) ; sans eux,
 *                     un tel build refuse de démarrer
 */
import express from 'express';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { createHash, timingSafeEqual } from 'node:crypto';
import { ENTETES_SECURITE } from './src/data/securite.mjs';
import { chargerRegles, creerResolveur } from './src/data/redirections.mjs';
import { ipClient } from './src/data/ip-client.mjs';

const ICI = fileURLToPath(new URL('.', import.meta.url));
const CLIENT = join(ICI, 'dist', 'client');
const RECETTE = process.env.SITE_RECETTE === '1';
const PORT = Number(process.env.PORT ?? 4321);
/**
 * Interface d'écoute. « :: » accepte IPv4 ET IPv6 : indispensable sur un
 * Docker où IPv6 est activé, car `localhost` y désigne ::1. Le 2026-11-23, le
 * premier déploiement Coolify a échoué ainsi : le serveur écoutait sur
 * 0.0.0.0, le contrôle de santé interrogeait localhost (::1) → « Connection
 * refused » dix fois, et Coolify est revenu en arrière.
 */
const HOST = process.env.HOST ?? '::';
const SOURCE_IP = (process.env.CLIENT_IP_HEADER ?? 'x-real-ip').toLowerCase();

/**
 * En-tête INTERNE qui transmet à Astro l'IP de confiance du client.
 * Lu par src/lib/rateLimit.ts, et seulement par lui.
 */
export const ENTETE_IP_CLIENT = 'x-aln-client-ip';

/**
 * Taille maximale d'un corps de requête sur les routes /api/*. Les vrais corps
 * font quelques Kio (événement Stripe, webhook Sanity, formulaires) ; sans
 * plafond, l'adaptateur Astro acceptait 1 Gio, lu EN MÉMOIRE avant même la
 * vérification de signature des webhooks (audit du 2026-11-24). Même valeur
 * que `bodySizeLimit` dans astro.config.mjs, qui couvre les envois sans
 * Content-Length (chunked).
 */
const CORPS_MAX = 256 * 1024;

/** Domaine canonique : seule cible de la redirection www. */
const DOMAINE = 'aimezlanature.fr';

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

// Origine du contenu de ce build, écrite par astro.config.mjs :
// « sanity », « seed », suivie de « +brouillons » si CONTENU_BROUILLONS=1.
let SOURCE_CONTENU = 'inconnue';
try {
  SOURCE_CONTENU = readFileSync(join(ICI, 'dist', 'source-contenu.txt'), 'utf8').trim();
} catch {
  // Fichier absent : build trop ancien. Les gardes ci-dessous refusent la prod.
}
const BROUILLONS = SOURCE_CONTENU.includes('+brouillons');

// Garde-fou : des brouillons ne sont JAMAIS servis en production — sans
// dérogation possible, AUTORISER_SEED compris (avant l'audit du 2026-11-24,
// cette variable désactivait aussi ce refus).
if (!RECETTE && BROUILLONS) {
  console.error(
    '⛔ Démarrage refusé : ce build contient des BROUILLONS Sanity (CONTENU_BROUILLONS=1).\n' +
      '   Réservé à la recette (SITE_RECETTE=1). Reconstruire sans CONTENU_BROUILLONS.'
  );
  process.exit(1);
}

// Garde-fou : la production n'est jamais servie depuis le seed de développement
// (contenu/seed.ndjson), sauf dérogation explicite AUTORISER_SEED=1.
if (!RECETTE && process.env.AUTORISER_SEED !== '1' && SOURCE_CONTENU !== 'sanity') {
  console.error(
    `⛔ Démarrage refusé : ce build a été fait avec le contenu « ${SOURCE_CONTENU} », pas avec Sanity.\n` +
      '   Renseigner SANITY_PROJECT_ID / SANITY_READ_TOKEN (variables de build) et reconstruire.'
  );
  process.exit(1);
}

// Garde-fou : une recette qui montre des brouillons est protégée par un mot de
// passe. « noindex » empêche seulement l'indexation, pas la lecture : sans
// cela, n'importe quel visiteur lirait les contenus non publiés (audit du
// 2026-11-24). Pas d'identifiants → pas de démarrage.
const IDENTIFIANTS_RECETTE = BROUILLONS
  ? { u: process.env.RECETTE_UTILISATEUR ?? '', m: process.env.RECETTE_MOT_DE_PASSE ?? '' }
  : null;
if (IDENTIFIANTS_RECETTE && (!IDENTIFIANTS_RECETTE.u || IDENTIFIANTS_RECETTE.m.length < 12)) {
  console.error(
    '⛔ Démarrage refusé : build avec brouillons, mais RECETTE_UTILISATEUR / RECETTE_MOT_DE_PASSE\n' +
      '   (12 caractères minimum) ne sont pas définis. Les brouillons ne sont jamais servis sans mot de passe.'
  );
  process.exit(1);
}

/** Empreinte de longueur fixe, pour comparer en temps constant. */
const empreinte = (/** @type {string} */ t) => createHash('sha256').update(t).digest();

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
//
// L'en-tête choisi (CLIENT_IP_HEADER) n'est cru que si la connexion vient d'une
// adresse PRIVÉE — Traefik, dans le réseau Docker. Une connexion qui arrive
// d'Internet sans passer par le proxy est comptée sous sa propre adresse :
// elle ne peut plus choisir son IP (src/data/ip-client.mjs, audit 2026-11-24).
let pairPublicSignale = false;
app.use((req, _res, next) => {
  delete req.headers[ENTETE_IP_CLIENT];
  const pair = req.socket.remoteAddress;
  const ip = ipClient({ source: SOURCE_IP, enTete: req.headers[SOURCE_IP], pair });
  if (ip) req.headers[ENTETE_IP_CLIENT] = ip;
  if (!pairPublicSignale && SOURCE_IP !== 'socket' && ip === pair && req.headers[SOURCE_IP]) {
    // Une seule fois : utile pour repérer un port publié qui contourne Traefik.
    pairPublicSignale = true;
    console.warn(`⚠️ Requête reçue sans passer par le proxy (pair ${pair}) : ${SOURCE_IP} ignoré.`);
  }
  next();
});

// ── Corps de requête bornés ──────────────────────────────────────────────
// Refus immédiat (413) d'un corps annoncé trop gros, AVANT toute lecture. Les
// envois sans Content-Length sont coupés par l'adaptateur (bodySizeLimit).
app.use((req, res, next) => {
  const annonce = Number(req.headers['content-length'] ?? 0);
  if (req.path.startsWith('/api/') && annonce > CORPS_MAX) {
    res.setHeader('Connection', 'close');
    return res.status(413).json({ error: 'Requête trop volumineuse.' });
  }
  next();
});

// ── Santé (healthcheck Coolify, surveillance) ────────────────────────────
app.get('/api/sante', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ ok: true, commit: process.env.SOURCE_COMMIT ?? null });
});

// ── Recette avec brouillons : mot de passe ───────────────────────────────
// Exemptés : la santé (contrôle Coolify) et les deux webhooks, qui ont leur
// propre signature et ne livrent aucun contenu.
if (IDENTIFIANTS_RECETTE) {
  const attendu = empreinte(`${IDENTIFIANTS_RECETTE.u}:${IDENTIFIANTS_RECETTE.m}`);
  const LIBRES = new Set(['/api/stripe-webhook', '/api/reconstruction', '/api/taches']);
  app.use((req, res, next) => {
    if (LIBRES.has(req.path)) return next();
    const [type, valeur] = (req.headers.authorization ?? '').split(' ');
    const recu = type === 'Basic' && valeur ? Buffer.from(valeur, 'base64').toString('utf8') : '';
    if (recu && timingSafeEqual(empreinte(recu), attendu)) return next();
    res.setHeader('WWW-Authenticate', 'Basic realm="Recette Aimez la Nature", charset="UTF-8"');
    res.setHeader('Cache-Control', 'no-store');
    res.status(401).type('text/plain').send('Recette protégée : identifiants requis.');
  });
}

// ── 2. www → domaine nu ──────────────────────────────────────────────────
// Cible FIXE : jamais l'en-tête Host renvoyé tel quel (audit du 2026-11-24).
app.use((req, res, next) => {
  // `originalUrl` doit commencer par « / » : une cible de requête en forme
  // absolue (rare, jamais envoyée par un navigateur) ne s'accole pas au domaine.
  if ((req.headers.host ?? '').toLowerCase() === `www.${DOMAINE}` && req.originalUrl.startsWith('/')) {
    return res.redirect(301, `https://${DOMAINE}${req.originalUrl}`);
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
      if (IDENTIFIANTS_RECETTE) {
        // Recette avec brouillons : rien de ce qui est servi derrière le mot de
        // passe ne doit finir dans un cache partagé.
        res.setHeader('Cache-Control', 'private, no-store');
      } else if (chemin.includes(`${join('dist', 'client', '_astro')}`)) {
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
  // Recette avec brouillons : la page 404 est construite avec le contenu des
  // brouillons (menu, panier…) — jamais dans un cache partagé.
  res.status(404).setHeader('Cache-Control', IDENTIFIANTS_RECETTE ? 'private, no-store' : 'public, max-age=0, must-revalidate');
  res.sendFile(join(CLIENT, '404.html'));
});

/**
 * Démarre l'écoute ; si IPv6 est absent du noyau, se replie sur IPv4.
 * `node:http` plutôt que `app.listen` : avec Express 5, le rappel de
 * `app.listen` est aussi appelé en cas d'ERREUR, ce qui faisait annoncer
 * « à l'écoute » un serveur qui ne l'était pas.
 */
function ecouter(hote) {
  const s = http.createServer(app);
  s.once('error', (e) => {
    const err = /** @type {NodeJS.ErrnoException} */ (e);
    if (hote === '::' && (err.code === 'EAFNOSUPPORT' || err.code === 'EADDRNOTAVAIL')) {
      console.warn('IPv6 indisponible, écoute en IPv4 seulement (0.0.0.0).');
      serveur = ecouter('0.0.0.0');
    } else {
      throw e;
    }
  });
  s.once('listening', () => {
    console.log(`Aimez la Nature — à l'écoute sur le port ${PORT} (${hote})${RECETTE ? ' (RECETTE, noindex)' : ''}`);
  });
  s.listen(PORT, hote);
  return s;
}
let serveur = ecouter(HOST);

// ── Envois automatiques (src/pages/api/taches.ts) ─────────────────────────
// Toutes les 5 minutes : liens de connexion des revendeurs que le marchand
// vient de valider dans le Studio (src/lib/pro.ts) et emails « votre colis est
// en route » des commandes passées à « Expédiée » (src/lib/commandes.ts).
// Appel interne, authentifié par PRO_SECRET. Sur UN SEUL environnement
// (ENVOIS_AUTOMATIQUES=1, ancien nom PRO_INVITATIONS=1), sinon recette et
// prod enverraient chacune un email.
const ENVOIS_AUTO = process.env.ENVOIS_AUTOMATIQUES === '1' || process.env.PRO_INVITATIONS === '1';
if (ENVOIS_AUTO && (process.env.PRO_SECRET ?? '').length >= 32) {
  const lancer = () =>
    fetch(`http://127.0.0.1:${PORT}/api/taches`, {
      method: 'POST',
      headers: { 'x-aln-interne': /** @type {string} */ (process.env.PRO_SECRET) },
      signal: AbortSignal.timeout(120_000),
    })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.liens === 'number' && d.liens > 0) console.log(`[pro] ${d.liens} lien(s) d'accès envoyé(s)`);
        if (typeof d?.suivis === 'number' && d.suivis > 0) console.log(`[commandes] ${d.suivis} email(s) d'expédition envoyé(s)`);
      })
      .catch((e) => console.error('[taches] :', e?.message ?? e));
  setTimeout(lancer, 30_000).unref();
  setInterval(lancer, 5 * 60_000).unref();
}

// Arrêt propre lors d'un redéploiement : Coolify envoie SIGTERM, on finit les
// requêtes en cours (un paiement, un webhook Stripe) avant de quitter.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    serveur.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 10_000).unref();
  });
}
