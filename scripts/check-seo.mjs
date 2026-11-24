#!/usr/bin/env node
// @ts-check
/**
 * Audit SEO du build (dist/client), rejouable à chaque modification et en CI.
 *
 * C'est l'audit manuel du 2026-07-29 transformé en script : ce qui était
 * vérifié une fois à la main est désormais vérifié à chaque build, y compris
 * quand le contenu vient de Sanity et change sans passer par un développeur.
 *
 * Contrôles par page indexable :
 *   - title présent, unique, ≤ metaTitleMax caractères ;
 *   - meta description présente, unique, entre metaDescriptionMin et Max ;
 *   - exactement un h1 ;
 *   - canonical absolu, sur le domaine du site, égal à l'URL de la page ;
 *   - tout le JSON-LD se lit (JSON valide) ;
 *   - aucune image sans attribut alt ;
 *   - aucun lien interne cassé (la cible existe dans le build ou est une
 *     redirection déclarée) ;
 *   - aucun mot collé à un lien (« àcontact@… ») ;
 * et pour le site : sitemap sans page noindex, toutes les pages indexables
 * présentes au sitemap, robots.txt qui déclare le sitemap.
 *
 * Usage : node scripts/check-seo.mjs [dist/client]   — sortie 1 au moindre écart.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'node-html-parser';
import { extraire } from './parite/extraire.mjs';
import { chargerRegles, creerResolveur } from '../src/data/redirections.mjs';

const RACINE = process.argv[2] ?? 'dist/client';
const regles = JSON.parse(readFileSync(new URL('../contenu/regles.json', import.meta.url), 'utf8'));
const SITE = 'https://aimezlanature.fr';
const redirection = creerResolveur(chargerRegles());

/** Longueur perçue (les entités HTML comptent pour un caractère). */
const longueur = (/** @type {string} */ s) =>
  parse(`<p>${s}</p>`).textContent.length;

/** @type {string[]} */
const erreurs = [];
const err = (/** @type {string} */ m) => erreurs.push(m);

const pages = await extraire(RACINE);
const indexables = Object.entries(pages).filter(([url, p]) => !(p.robots ?? '').includes('noindex') && url !== '/404.html');

// ── Par page ───────────────────────────────────────────────────────────────
/** @type {Map<string, string[]>} */ const titres = new Map();
/** @type {Map<string, string[]>} */ const descriptions = new Map();

for (const [url, p] of indexables) {
  if (!p.title) err(`${url} : title absent`);
  else if (longueur(p.title) > regles.metaTitleMax) err(`${url} : title de ${longueur(p.title)} caractères (max ${regles.metaTitleMax}) — « ${p.title} »`);
  if (!p.description) err(`${url} : meta description absente`);
  else {
    const n = longueur(p.description);
    if (n > regles.metaDescriptionMax || n < regles.metaDescriptionMin) {
      err(`${url} : description de ${n} caractères (attendu ${regles.metaDescriptionMin}-${regles.metaDescriptionMax})`);
    }
  }
  titres.set(p.title, [...(titres.get(p.title) ?? []), url]);
  descriptions.set(p.description, [...(descriptions.get(p.description) ?? []), url]);
  if (p.h1.length !== 1) err(`${url} : ${p.h1.length} h1 (exactement 1 attendu)`);
  if (p.canonical !== SITE + url) err(`${url} : canonical « ${p.canonical} » au lieu de « ${SITE + url} »`);
  if (!p.jsonLdValide) err(`${url} : JSON-LD illisible`);
  const sansAlt = p.images.filter((/** @type {{alt: string|null}} */ i) => i.alt === null).length;
  if (sansAlt) err(`${url} : ${sansAlt} image(s) sans attribut alt`);
}
for (const [t, urls] of titres) if (urls.length > 1) err(`title en double « ${t} » : ${urls.join(', ')}`);
for (const [d, urls] of descriptions) if (urls.length > 1) err(`description en double : ${urls.join(', ')} — « ${d} »`);

// ── Liens internes ───────────────────────────────────────────────────────
// Pages rendues à la demande (prerender = false, noindex) : absentes du build
// statique mais bien servies par le serveur.
const A_LA_DEMANDE = new Set(['/pro/', '/pro/connexion/']);
const existe = (/** @type {string} */ chemin) => {
  const sansQuery = chemin.split('?')[0];
  if (pages[sansQuery]) return true;
  if (existsSync(join(RACINE, sansQuery)) && /\.[a-z0-9]+$/i.test(sansQuery)) return true;
  if (sansQuery.startsWith('/api/')) return true;
  if (A_LA_DEMANDE.has(sansQuery)) return true;
  return false;
};
for (const [url, p] of Object.entries(pages)) {
  for (const lien of p.liensInternes) {
    if (existe(lien)) continue;
    const cible = redirection(lien.split('?')[0]);
    if (cible) err(`${url} : lien vers ${lien}, qui est une redirection vers ${cible} — pointer directement la cible`);
    else if (!lien.endsWith('/') && pages[lien + '/']) err(`${url} : lien ${lien} sans slash final (redirection 301 inutile)`);
    else err(`${url} : lien interne cassé ${lien}`);
  }
}

// ── Mots collés à un lien ────────────────────────────────────────────────
// Astro supprime l'espace de fin de ligne avant une balise : « écrivez-nous à »
// suivi d'un <a> à la ligne donne « àcontact@… ». Défaut consigné deux fois
// dans tasks/lessons.md et toujours revenu : il est donc vérifié ici, à chaque
// build. Correctif : écrire {' '} en fin de ligne.
for (const url of Object.keys(pages)) {
  const fichier = url.endsWith('.html') ? join(RACINE, url) : join(RACINE, url, 'index.html');
  const colles = readFileSync(fichier, 'utf8').match(/[A-Za-zÀ-ÿ,—:]{2,}<(a |em>|strong>)/g) ?? [];
  for (const c of colles) err(`${url} : mot collé à la balise suivante « ${c} » (ajouter {' '})`);
}

// ── Sitemap et robots ────────────────────────────────────────────────────
const sitemapXml = readFileSync(join(RACINE, 'sitemap-0.xml'), 'utf8');
const auSitemap = new Set([...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, '')));
for (const [url, p] of Object.entries(pages)) {
  const noindex = (p.robots ?? '').includes('noindex') || url === '/404.html';
  if (noindex && auSitemap.has(url)) err(`sitemap : ${url} est noindex mais présente au sitemap`);
  if (!noindex && !auSitemap.has(url)) err(`sitemap : ${url} est indexable mais absente du sitemap`);
}
for (const url of auSitemap) if (!pages[url]) err(`sitemap : ${url} n'existe pas dans le build`);
const robots = readFileSync(join(RACINE, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${SITE}/sitemap-index.xml`)) err('robots.txt ne déclare pas le sitemap');

// ── Verdict ──────────────────────────────────────────────────────────────
for (const e of erreurs) console.log(`❌ ${e}`);
console.log(
  `\n${indexables.length} pages indexables · ${auSitemap.size} URLs au sitemap · ` +
    (erreurs.length ? `${erreurs.length} problème(s)` : 'aucun problème')
);
process.exit(erreurs.length ? 1 : 0);
