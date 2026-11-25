#!/usr/bin/env node
// @ts-check
/**
 * Extrait, pour chaque page HTML d'un build, ce qui compte pour le SEO :
 * title, description, canonical, robots, h1, titres h2/h3, types JSON-LD,
 * liens internes et nombre de mots visibles.
 *
 * Sert de « photo » avant/après une refonte (ici : passage du contenu en dur à
 * Sanity). On compare ensuite deux photos avec `comparer.mjs` : une refonte
 * technique ne doit rien changer de ce que voit Google, sauf ce qu'on a
 * décidé de changer.
 *
 * Usage : node scripts/parite/extraire.mjs [dossier-dist] > photo.json
 */
import { readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { parse } from 'node-html-parser';

const RACINE = process.argv[2] ?? 'dist/client';

/** @param {string} dir @returns {AsyncGenerator<string>} */
async function* fichiersHtml(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '_astro') continue;
      yield* fichiersHtml(p);
    } else if (e.name.endsWith('.html')) yield p;
  }
}

/** Chemin public d'un fichier : dist/client/a/index.html -> /a/ */
function urlDe(fichier) {
  const rel = relative(RACINE, fichier).split(sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel;
}

/** Normalise les espaces (les sauts de ligne du code source n'ont pas de sens). */
const net = (/** @type {string | undefined} */ s) => (s ?? '').replace(/\s+/g, ' ').trim();

/** @param {any} n @param {Set<string>} acc */
function typesJsonLd(n, acc) {
  if (Array.isArray(n)) n.forEach((x) => typesJsonLd(x, acc));
  else if (n && typeof n === 'object') {
    if (n['@type']) [].concat(n['@type']).forEach((t) => acc.add(String(t)));
    Object.values(n).forEach((v) => typesJsonLd(v, acc));
  }
}

export async function extraire(racine = RACINE) {
  /** @type {Record<string, any>} */
  const pages = {};
  for await (const f of fichiersHtml(racine)) {
    const doc = parse(await readFile(f, 'utf8'));
    const types = new Set();
    let jsonLdValide = true;
    for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        typesJsonLd(JSON.parse(s.textContent), types);
      } catch {
        jsonLdValide = false;
      }
    }
    const main = doc.querySelector('main') ?? doc.querySelector('body');
    // Texte visible : sans scripts ni styles.
    main?.querySelectorAll('script, style, noscript').forEach((n) => n.remove());
    const texte = net(main?.textContent);
    const liens = [
      ...new Set(
        doc
          .querySelectorAll('a[href]')
          .map((a) => a.getAttribute('href') ?? '')
          .filter((h) => h.startsWith('/') && !h.startsWith('//'))
          .map((h) => h.split('#')[0])
      ),
    ].sort();

    pages[urlDe(f)] = {
      title: net(doc.querySelector('title')?.textContent),
      description: doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? null,
      canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
      robots: doc.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null,
      h1: doc.querySelectorAll('h1').map((h) => net(h.textContent)),
      titres: doc.querySelectorAll('h2, h3').map((h) => `${h.tagName.toLowerCase()} ${net(h.textContent)}`),
      jsonLd: [...types].sort(),
      jsonLdValide,
      liensInternes: liens,
      mots: texte ? texte.split(' ').length : 0,
      images: doc.querySelectorAll('img').map((i) => ({ alt: i.getAttribute('alt') ?? null })),
    };
  }
  return Object.fromEntries(Object.entries(pages).sort(([a], [b]) => a.localeCompare(b)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.stdout.write(JSON.stringify(await extraire(), null, 2) + '\n');
}
