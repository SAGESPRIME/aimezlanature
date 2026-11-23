#!/usr/bin/env node
// @ts-check
/**
 * Vérifie, sur un serveur réel, les en-têtes HTTP qui protègent le site et
 * règlent son cache — ceux que Vercel posait seul et que server.mjs pose
 * désormais lui-même.
 *
 * Il compare aux valeurs ATTENDUES de src/data/securite.mjs (source unique) :
 * si quelqu'un affaiblit la CSP dans le code, ce script ne le voit pas ; mais
 * si le serveur, un proxy ou Coolify les perd ou les altère, il le voit.
 *
 * Usage : node scripts/check-headers.mjs http://127.0.0.1:4321 [--recette]
 * Sortie 1 au premier écart.
 */
import { ENTETES_SECURITE } from '../src/data/securite.mjs';
import http from 'node:http';
import https from 'node:https';

const args = process.argv.slice(2);
const BASE = (args.find((a) => !a.startsWith('--')) ?? '').replace(/\/$/, '');
const RECETTE = args.includes('--recette');
if (!BASE) {
  console.error('Usage : node scripts/check-headers.mjs <url> [--recette]');
  process.exit(2);
}

let echecs = 0;
/** @param {boolean} ok @param {string} msg */
const verifier = (ok, msg) => {
  console.log(`${ok ? '✅' : '❌'} ${msg}`);
  if (!ok) echecs++;
};

/** @param {string} chemin @param {RequestInit} [init] */
const get = (chemin, init) => fetch(BASE + chemin, { redirect: 'manual', ...init });

// 1. Sécurité, sur trois types de réponses : page, fichier, API.
const accueil = await get('/');
const html = await accueil.text();
const css = html.match(/href="(\/_astro\/[^"]+\.css)"/)?.[1];
const cibles = [
  ['page /', accueil],
  ['fichier /js/cart.js', await get('/js/cart.js')],
  ['API /api/sante', await get('/api/sante')],
  ['404', await get('/page-qui-n-existe-pas/')],
];
for (const [nom, res] of /** @type {[string, Response][]} */ (cibles)) {
  for (const [entete, valeur] of Object.entries(ENTETES_SECURITE)) {
    verifier(res.headers.get(entete) === valeur, `${nom} — ${entete}`);
  }
  verifier(!res.headers.has('x-powered-by'), `${nom} — pas de X-Powered-By`);
}

// 2. Codes de réponse.
verifier(accueil.status === 200, `/ répond 200 (${accueil.status})`);
verifier(cibles[3][1].status === 404, `page inconnue répond 404 (${cibles[3][1].status})`);
const sansSlash = await get('/faq');
verifier(
  sansSlash.status === 301 && (sansSlash.headers.get('location') ?? '').endsWith('/faq/'),
  `/faq → 301 vers /faq/ (${sansSlash.status} ${sansSlash.headers.get('location')})`
);
// www → domaine nu : seulement hors recette. Sur la recette, aucun domaine
// « www.recette… » n'est déclaré dans Coolify : le proxy Traefik répond 503
// avant même d'atteindre server.mjs, ce qui ne dit rien du site.
if (RECETTE) {
  console.log('ℹ️  www → domaine nu : non testé en recette (aucun domaine www déclaré)');
} else {
  // `fetch` ignore un en-tête Host forcé : requête bas niveau pour simuler www.
  const www = await new Promise((resoudre, rejeter) => {
    const u = new URL(BASE + '/faq/');
    const hoteNu = u.hostname.replace(/^www\./, '');
    (u.protocol === 'https:' ? https : http)
      .get(u, { headers: { host: `www.${hoteNu}` }, servername: u.hostname }, (r) => {
        r.resume();
        resoudre({ status: r.statusCode, location: r.headers.location, hoteNu });
      })
      .on('error', rejeter);
  });
  verifier(
    www.status === 301 && /^https:\/\/[^/]+\/faq\/$/.test(www.location ?? '') && !String(www.location).includes('//www.'),
    `www → domaine nu en 301 (${www.status} ${www.location})`
  );
}

// 3. Cache.
verifier(
  /max-age=0/.test(accueil.headers.get('cache-control') ?? ''),
  `HTML revalidé à chaque visite (${accueil.headers.get('cache-control')})`
);
if (css) {
  const r = await get(css);
  verifier(
    (r.headers.get('cache-control') ?? '').includes('immutable'),
    `/_astro/* en cache immuable (${r.headers.get('cache-control')})`
  );
} else verifier(false, 'feuille de style /_astro introuvable dans la page');

// 4. Indexation : fermée en recette, ouverte en production.
const robots = await (await get('/robots.txt')).text();
if (RECETTE) {
  verifier(accueil.headers.get('x-robots-tag') === 'noindex, nofollow', 'recette : X-Robots-Tag noindex');
  verifier(/Disallow: \/\s*$/m.test(robots), 'recette : robots.txt fermé');
} else {
  verifier(!accueil.headers.has('x-robots-tag'), 'production : aucun X-Robots-Tag');
  verifier(!/Disallow: \/\s*$/m.test(robots), 'production : robots.txt ouvert');
}

console.log(echecs === 0 ? '\nTous les en-têtes sont conformes.' : `\n${echecs} écart(s).`);
process.exit(echecs === 0 ? 0 : 1);
