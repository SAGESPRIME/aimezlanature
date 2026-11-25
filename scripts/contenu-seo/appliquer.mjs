#!/usr/bin/env node
/**
 * Applique un lot de modifications de contenu au seed (contenu/seed.ndjson)
 * et, avec --sanity, au dataset Sanity — mêmes changements des deux côtés,
 * pour que la CI (seed) teste ce que le site publie (Sanity).
 *
 *   node scripts/contenu-seo/appliquer.mjs scripts/contenu-seo/lots/<lot>.mjs [--sanity] [--annuler]
 *
 * Un lot exporte :
 *   patches     [{ id, set: {champ: valeur}, avant: {champ: valeur} }]
 *               corrections de documents existants ; `avant` garde l'ancienne
 *               valeur (--annuler la remet) ;
 *   brouillons  [document complet « drafts.… »] créés ou remplacés : rien
 *               n'apparaît sur le site avant que le marchand ne publie ;
 *   suppressions [id] documents retirés (publié et brouillon), après fusion.
 *
 * Sanity : jeton Editor dans SANITY_WRITE_TOKEN, ou (session cloud) injecté par
 * le proxy réseau. Un brouillon modifié dans le Studio depuis son écriture par
 * ce script n'est jamais écrasé : il est signalé et ignoré (empreintes.json).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = resolve(import.meta.dirname, '..', '..');
/** Date de l'import des premiers brouillons d'articles (brouillons-articles.mjs). */
const IMPORT_INITIAL = '2026-11-23T19:50:00Z';
const SEED = resolve(RACINE, 'contenu', 'seed.ndjson');
const [fichierLot] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const versSanity = process.argv.includes('--sanity');
const annuler = process.argv.includes('--annuler');
/** --intact-jusqu-a=<date ISO> : brouillons non modifiés depuis cette date (vérifié à la main) remplaçables. */
const intactDepuis = process.argv.find((a) => a.startsWith('--intact-jusqu-a='))?.split('=')[1];
if (!fichierLot) {
  console.error('Usage : appliquer.mjs <lot.mjs> [--sanity] [--annuler]');
  process.exit(1);
}
const lot = await import(pathToFileURL(resolve(fichierLot)).href);
const patches = (lot.patches ?? []).map((p) => (annuler ? { id: p.id, set: p.avant } : p));
const brouillons = annuler ? [] : lot.brouillons ?? [];
const suppressions = annuler ? [] : lot.suppressions ?? [];

// ── Seed ──────────────────────────────────────────────────────────────────
let docs = readFileSync(SEED, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
for (const p of patches) {
  const d = docs.find((x) => x._id === p.id);
  if (!d) throw new Error(`Seed : document ${p.id} introuvable`);
  const dejaFait = Object.entries(p.set).every(([k, v]) => JSON.stringify(d[k]) === JSON.stringify(v));
  if (!annuler && !dejaFait) {
    for (const [k, v] of Object.entries(p.avant ?? {})) {
      if (JSON.stringify(d[k]) !== JSON.stringify(v)) throw new Error(`Seed : ${p.id}.${k} ne correspond plus à « avant »`);
    }
  }
  Object.assign(d, p.set);
}
const idsSupprimes = new Set(suppressions.flatMap((id) => [id, `drafts.${id}`]));
docs = docs.filter((d) => !idsSupprimes.has(d._id));
for (const b of brouillons) {
  if (!String(b._id).startsWith('drafts.')) throw new Error(`${b._id} : un brouillon doit commencer par « drafts. »`);
  const i = docs.findIndex((d) => d._id === b._id);
  if (i === -1) docs.push(b);
  else docs[i] = b;
}
writeFileSync(SEED, docs.map((d) => JSON.stringify(d)).join('\n') + '\n');
console.log(`Seed : ${patches.length} correction(s), ${brouillons.length} brouillon(s), ${suppressions.length} suppression(s).`);

// ── Sanity ────────────────────────────────────────────────────────────────
if (versSanity) {
  const projet = process.env.SANITY_PROJECT_ID ?? '0lgh06ly';
  const dataset = process.env.SANITY_DATASET ?? 'production';
  const base = `https://${projet}.api.sanity.io/v2025-02-19/data`;
  const entetes = { 'Content-Type': 'application/json', ...(process.env.SANITY_WRITE_TOKEN ? { Authorization: `Bearer ${process.env.SANITY_WRITE_TOKEN}` } : {}) };
  const lire = async (id) => {
    const r = await fetch(`${base}/doc/${dataset}/${encodeURIComponent(id)}`, { headers: entetes });
    const j = await r.json();
    return j.documents?.[0] ?? null;
  };
  const mutations = [];
  for (const p of patches) {
    if (!annuler) {
      const actuel = await lire(p.id);
      if (!actuel) throw new Error(`Sanity : ${p.id} introuvable`);
      if (Object.entries(p.set).every(([k, v]) => JSON.stringify(actuel[k]) === JSON.stringify(v))) continue;
      for (const [k, v] of Object.entries(p.avant ?? {})) {
        if (JSON.stringify(actuel[k]) !== JSON.stringify(v)) throw new Error(`Sanity : ${p.id}.${k} a été modifié dans le Studio — lot non appliqué`);
      }
    }
    mutations.push({ patch: { id: p.id, set: p.set } });
  }
  const FICHIER_EMPREINTES = resolve(import.meta.dirname, 'empreintes.json');
  const empreintes = JSON.parse(readFileSync(FICHIER_EMPREINTES, 'utf8'));
  for (const b of brouillons) {
    const actuel = await lire(b._id);
    // Remplaçable : absent, intact depuis l'import initial des brouillons
    // (23/11), ou identique à ce que ce script a écrit la dernière fois.
    const intact = !actuel || actuel._updatedAt <= IMPORT_INITIAL || actuel._updatedAt <= (intactDepuis ?? '') || empreintes[b._id] === empreinte(actuel);
    if (!intact) {
      console.warn(`⚠️  ${b._id} a été modifié dans le Studio : non remplacé (reporter la modification à la main)`);
      continue;
    }
    mutations.push({ createOrReplace: b });
    empreintes[b._id] = empreinte(b);
  }
  writeFileSync(FICHIER_EMPREINTES, JSON.stringify(empreintes, null, 2) + '\n');
  for (const id of suppressions) mutations.push({ delete: { id } }, { delete: { id: `drafts.${id}` } });
  if (mutations.length) {
    const r = await fetch(`${base}/mutate/${dataset}?returnIds=true`, { method: 'POST', headers: entetes, body: JSON.stringify({ mutations }) });
    const j = await r.json();
    if (!r.ok) throw new Error(`Sanity : ${r.status} ${JSON.stringify(j).slice(0, 300)}`);
    console.log(`Sanity : ${mutations.length} mutation(s) appliquée(s), transaction ${j.transactionId}.`);
  }
}

/** Empreinte du contenu rédactionnel (hors champs système) : détecte une retouche dans le Studio. */
function empreinte(d) {
  const { _rev, _updatedAt, _createdAt, _system, ...reste } = d;
  // Clés triées : Sanity réordonne les champs qu'il enregistre.
  const trie = (v) => (Array.isArray(v) ? v.map(trie) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, trie(v[k])])) : v);
  let h = 0;
  for (const c of JSON.stringify(trie(reste))) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return String(h >>> 0);
}
