#!/usr/bin/env node
/**
 * Import de contenu/seed.ndjson dans Sanity PAR L'API (sans la CLI Sanity).
 *
 * Variante de studio/importer.mjs pour les environnements sans navigateur ni
 * `sanity login` (serveur, CI, session cloud) : il suffit d'un jeton Sanity
 * « Editor » TEMPORAIRE, à révoquer juste après.
 *
 *   SANITY_PROJECT_ID=xxxx SANITY_WRITE_TOKEN=<jeton> node scripts/migration-sanity/importer-api.mjs [--simulation]
 *
 * Ce que fait le script :
 *   1. téléverse chaque photo référencée (`_sanityAsset: image@file://./…`)
 *      une seule fois, et remplace la référence locale par l'asset Sanity ;
 *   2. crée les documents avec `createIfNotExists` : un document déjà présent
 *      (modifié dans le Studio par exemple) n'est JAMAIS écrasé ;
 *   3. les brouillons (`drafts.*`, ex. les 8 articles réécrits) sont créés
 *      comme brouillons : rien n'apparaît sur le site avant publication.
 *
 * Ré-exécutable sans risque : les photos déjà présentes sont retrouvées par
 * leur empreinte (Sanity déduplique), les documents existants sont ignorés.
 */
import { readFileSync, createReadStream } from 'node:fs';
import { resolve, basename } from 'node:path';
import { createClient } from '@sanity/client';

const RACINE = resolve(import.meta.dirname, '..', '..');
const simulation = process.argv.includes('--simulation');
const projectId = process.env.SANITY_PROJECT_ID;
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || (!token && !simulation)) {
  console.error('⛔ SANITY_PROJECT_ID et SANITY_WRITE_TOKEN (jeton Editor) sont requis.');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset: process.env.SANITY_DATASET ?? 'production',
  apiVersion: '2025-02-19',
  token,
  useCdn: false,
});

const documents = readFileSync(resolve(RACINE, 'contenu', 'seed.ndjson'), 'utf8')
  .split('\n')
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l));

// ── 1. Photos ──────────────────────────────────────────────────────────────
/** Toutes les images locales, où qu'elles soient dans les documents. */
function imagesLocales(noeud, acc = new Set()) {
  if (Array.isArray(noeud)) noeud.forEach((n) => imagesLocales(n, acc));
  else if (noeud && typeof noeud === 'object') {
    if (typeof noeud._sanityAsset === 'string') acc.add(noeud._sanityAsset);
    Object.values(noeud).forEach((v) => imagesLocales(v, acc));
  }
  return acc;
}

const assets = new Map();
for (const ref of imagesLocales(documents)) {
  const chemin = resolve(RACINE, ref.replace(/^image@file:\/\/\.\//, ''));
  if (simulation) {
    assets.set(ref, `image-simulation-${basename(chemin)}`);
    continue;
  }
  const asset = await client.assets.upload('image', createReadStream(chemin), { filename: basename(chemin) });
  assets.set(ref, asset._id);
  console.log(`📷 ${basename(chemin)} → ${asset._id}`);
}

/** Remplace chaque `_sanityAsset` local par une vraie référence d'asset. */
function brancherImages(noeud) {
  if (Array.isArray(noeud)) return noeud.map(brancherImages);
  if (noeud && typeof noeud === 'object') {
    if (typeof noeud._sanityAsset === 'string') {
      const { _sanityAsset, ...reste } = noeud;
      return { ...reste, asset: { _type: 'reference', _ref: assets.get(_sanityAsset) } };
    }
    return Object.fromEntries(Object.entries(noeud).map(([k, v]) => [k, brancherImages(v)]));
  }
  return noeud;
}
const prets = documents.map(brancherImages);

// ── 2. Documents, par lots ────────────────────────────────────────────────
const parType = prets.reduce((a, d) => {
  const t = `${String(d._id).startsWith('drafts.') ? 'brouillon ' : ''}${d._type}`;
  return { ...a, [t]: (a[t] ?? 0) + 1 };
}, {});
console.log(`${prets.length} documents à créer (s'ils n'existent pas) :`, parType);
if (simulation) {
  console.log('(simulation : rien n\'a été envoyé)');
  process.exit(0);
}

const LOT = 50;
for (let i = 0; i < prets.length; i += LOT) {
  const tx = client.transaction();
  for (const d of prets.slice(i, i + LOT)) tx.createIfNotExists(d);
  await tx.commit({ visibility: 'async' });
  console.log(`✔ lot ${i / LOT + 1} : documents ${i + 1} à ${Math.min(i + LOT, prets.length)}`);
}
console.log('Import terminé.');
