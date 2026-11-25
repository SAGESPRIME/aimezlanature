#!/usr/bin/env node
/**
 * Recopie dans contenu/seed.ndjson les articles et les FAQ tels qu'ils sont
 * dans Sanity (publiés ET brouillons) : Sanity fait foi, et la CI doit tester
 * le contenu réel. Les produits, avis et réglages (qui référencent des photos
 * locales dans le seed) ne sont pas touchés.
 *
 *   node scripts/contenu-seo/synchroniser-seed.mjs [export.ndjson]
 * Sans argument, interroge l'API Sanity (jeton injecté ou SANITY_READ_TOKEN).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SEED = resolve(import.meta.dirname, '..', '..', 'contenu', 'seed.ndjson');
const TYPES = ['article', 'faq'];
let distants;
if (process.argv[2]) {
  distants = readFileSync(process.argv[2], 'utf8').trim().split('\n').map((l) => JSON.parse(l));
} else {
  const url = new URL('https://0lgh06ly.api.sanity.io/v2025-02-19/data/query/production');
  url.searchParams.set('query', `*[_type in ${JSON.stringify(TYPES)}]`);
  url.searchParams.set('perspective', 'raw');
  const r = await fetch(url, { headers: process.env.SANITY_READ_TOKEN ? { Authorization: `Bearer ${process.env.SANITY_READ_TOKEN}` } : {} });
  distants = (await r.json()).result;
}
distants = distants
  .filter((d) => TYPES.includes(d._type))
  .map(({ _rev, _updatedAt, _createdAt, _system, ...d }) => d)
  .sort((a, b) => a._id.localeCompare(b._id));
const locaux = readFileSync(SEED, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const garde = locaux.filter((d) => !TYPES.includes(d._type));
writeFileSync(SEED, [...garde, ...distants].map((d) => JSON.stringify(d)).join('\n') + '\n');
console.log(`Seed : ${distants.length} articles et FAQ recopiés depuis Sanity (${locaux.length - garde.length} remplacés).`);
