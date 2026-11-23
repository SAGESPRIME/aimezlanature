#!/usr/bin/env node
/**
 * Import du contenu initial (contenu/seed.ndjson) dans le dataset Sanity.
 *
 * À lancer UNE SEULE FOIS, juste après la création du projet Sanity, depuis
 * un poste où l'on est connecté à Sanity (`npx sanity login`) :
 *
 *   cd studio
 *   SANITY_STUDIO_PROJECT_ID=xxxx npm run importer
 *
 * Ce que fait le script :
 *   1. lit contenu/seed.ndjson (produits, avis, articles, FAQ, réglages) ;
 *   2. transforme les chemins d'images relatifs (`image@file://./src/...`) en
 *      chemins absolus, seule forme que `sanity dataset import` accepte ;
 *   3. appelle `sanity dataset import`, qui téléverse aussi les photos.
 *
 * Les articles réécrits (brouillons `drafts.*`) sont importés comme
 * BROUILLONS : ils n'apparaissent pas sur le site tant que le marchand ne les a
 * pas relus et publiés dans le Studio.
 *
 * Sans `--remplacer`, l'import refuse d'écraser un document existant : on ne
 * peut pas effacer par erreur des modifications faites dans le Studio.
 */
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const racine = resolve(import.meta.dirname, '..');
const dataset = process.env.SANITY_STUDIO_DATASET ?? 'production';
const remplacer = process.argv.includes('--remplacer');

const ndjson = readFileSync(join(racine, 'contenu', 'seed.ndjson'), 'utf8').replace(
  /image@file:\/\/\.\//g,
  `image@file://${racine}/`
);
const tmp = join(mkdtempSync(join(tmpdir(), 'aln-import-')), 'seed.ndjson');
writeFileSync(tmp, ndjson);

const args = ['sanity', 'dataset', 'import', tmp, dataset, remplacer ? '--replace' : '--missing', '--allow-assets-in-different-dataset'];
console.log(`> npx ${args.join(' ')}`);
const r = spawnSync('npx', args, { stdio: 'inherit', cwd: import.meta.dirname });
process.exit(r.status ?? 1);
