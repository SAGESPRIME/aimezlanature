#!/usr/bin/env node
// @ts-check
/**
 * Garde-fou des allégations : refuse les promesses de santé et les théories
 * sans fondement dans TOUT le contenu (contenu/allegations.json).
 *
 * Deux sources contrôlées :
 *   - les documents du contenu (seed.ndjson, ou un export Sanity passé en
 *     argument), y compris les BROUILLONS : un article en relecture doit déjà
 *     être propre avant que le marchand ne le publie ;
 *   - le texte visible du build (dist/client) : textes écrits dans les pages.
 * Les occurrences anciennes listées dans « dette » sont signalées sans bloquer
 * (jamais pour un brouillon).
 *
 * Usage : node scripts/check-allegations.mjs [contenu.ndjson] [dist/client]
 */
import { readFileSync, existsSync } from 'node:fs';
import { parse } from 'node-html-parser';
import { extraire } from './parite/extraire.mjs';

const SOURCE = process.argv[2] ?? 'contenu/seed.ndjson';
const DIST = process.argv[3] ?? 'dist/client';
/** @type {{ termes: {id: string, niveau: 'erreur'|'vigilance', motif: string, raison: string}[], dette: string[], admis?: {cle: string, raison: string}[] }} */
const regles = JSON.parse(readFileSync(new URL('../contenu/allegations.json', import.meta.url), 'utf8'));
const termes = regles.termes.map((t) => ({ ...t, re: new RegExp(t.motif, 'giu') }));
const dette = new Set(regles.dette);
const admis = new Set((regles.admis ?? []).map((/** @type {{cle: string}} */ a) => a.cle));

/** @type {string[]} */ const erreurs = [];
/** @type {string[]} */ const signalements = [];

/** @param {string} ou @param {string} texte @param {boolean} brouillon */
function examiner(ou, texte, brouillon) {
  for (const t of termes) {
    for (const m of texte.matchAll(t.re)) {
      const extrait = texte.slice(Math.max(0, (m.index ?? 0) - 50), (m.index ?? 0) + m[0].length + 50).replace(/\s+/g, ' ');
      const ligne = `${brouillon ? "(brouillon) " : ""}${ou} [${t.id}] « …${extrait}… » — ${t.raison}`;
      if (admis.has(`${ou}|${t.id}`)) continue;
      if (t.niveau === 'vigilance') signalements.push(ligne);
      else if (!brouillon && dette.has(`${ou}|${t.id}`)) signalements.push(`(dette) ${ligne}`);
      else erreurs.push(ligne);
    }
  }
}

/** Tout le texte d'un document, sans identifiants, clés, adresses ni références. */
function textes(/** @type {any} */ n, /** @type {string[]} */ acc = []) {
  if (typeof n === 'string') acc.push(n);
  else if (Array.isArray(n)) n.forEach((x) => textes(x, acc));
  else if (n && typeof n === 'object') {
    for (const [k, v] of Object.entries(n)) {
      if (k.startsWith('_') || ['url', 'href', 'slug', 'current', 'asset', 'style', 'listItem', 'level', 'marks'].includes(k)) continue;
      textes(v, acc);
    }
  }
  return acc;
}

// ── 1. Contenu (publié et brouillons) ─────────────────────────────────────
const documents = readFileSync(SOURCE, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
const TYPES = new Set(['article', 'produit', 'faq', 'reglages', 'avis', 'auteur']);
for (const d of documents) {
  if (!TYPES.has(d._type)) continue;
  const brouillon = String(d._id).startsWith('drafts.');
  examiner(String(d._id).replace(/^drafts\./, ''), textes(d).join('\n'), brouillon);
}

// ── 2. Pages construites (textes écrits dans le code) ─────────────────────
if (existsSync(DIST)) {
  const pages = await extraire(DIST);
  for (const url of Object.keys(pages)) {
    const fichier = url.endsWith('.html') ? `${DIST}${url}` : `${DIST}${url}index.html`;
    const main = parse(readFileSync(fichier, 'utf8')).querySelector('main');
    main?.querySelectorAll('script, style, noscript').forEach((n) => n.remove());
    examiner(url, main?.textContent ?? '', false);
  }
}

for (const s of signalements) console.log(`⚠️  ${s}`);
for (const e of erreurs) console.log(`❌ ${e}`);
console.log(`\nAllégations : ${erreurs.length} erreur(s), ${signalements.length} signalement(s).`);
process.exit(erreurs.length ? 1 : 0);
