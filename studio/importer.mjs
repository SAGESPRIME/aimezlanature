#!/usr/bin/env node
/**
 * Import du contenu initial (contenu/seed.ndjson) dans le dataset Sanity.
 *
 * À lancer UNE SEULE FOIS, juste après la création du projet Sanity, depuis
 * un poste où l'on est connecté à Sanity (`npx sanity login`) :
 *
 *   cd studio
 *   SANITY_STUDIO_PROJECT_ID=xxxx npm run importer          (macOS / Linux)
 *   $env:SANITY_STUDIO_PROJECT_ID="xxxx"; npm run importer   (Windows PowerShell)
 *
 * `npm run importer -- --simulation` montre ce qui serait envoyé, sans rien
 * envoyer.
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
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const racine = resolve(import.meta.dirname, '..');
const dataset = process.env.SANITY_STUDIO_DATASET ?? 'production';
const remplacer = process.argv.includes('--remplacer');
const simulation = process.argv.includes('--simulation');

// Garde-fou : le script doit tourner DANS le dépôt cloné (il lit le seed et
// les photos à la racine), pas depuis un dossier « studio » copié à part.
const seed = join(racine, 'contenu', 'seed.ndjson');
if (!existsSync(seed) || !existsSync(join(racine, 'src', 'assets'))) {
  console.error(
    `⛔ Contenu introuvable (${seed}).\n` +
      '   Lancer ce script depuis le dossier studio/ du dépôt aimezlanature cloné\n' +
      '   (branche claude/busy-albattani-hdkhlq ou master après fusion).'
  );
  process.exit(1);
}
if (!process.env.SANITY_STUDIO_PROJECT_ID) {
  console.error('⛔ SANITY_STUDIO_PROJECT_ID manquant (ex. PowerShell : $env:SANITY_STUDIO_PROJECT_ID="0lgh06ly").');
  process.exit(1);
}

// Chemins d'images : `pathToFileURL` produit une URL valide sur tous les
// systèmes (file:///C:/Users/... sous Windows, file:///home/... sous Linux).
// Une simple concaténation donnait « file://C:\Users\... » sous Windows, que
// Sanity ne sait pas lire.
const baseFichiers = pathToFileURL(racine + '/').href;
const ndjson = readFileSync(seed, 'utf8').replace(/image@file:\/\/\.\//g, `image@${baseFichiers}`);
const tmp = join(mkdtempSync(join(tmpdir(), 'aln-import-')), 'seed.ndjson');
writeFileSync(tmp, ndjson);

const args = ['sanity', 'dataset', 'import', tmp, dataset, remplacer ? '--replace' : '--missing', '--allow-assets-in-different-dataset'];
console.log(`> npx ${args.join(' ')}`);
if (simulation) {
  const exemple = ndjson.match(/image@file:[^"]+/)?.[0];
  console.log(`(simulation : rien n'est envoyé) Exemple de chemin d'image : ${exemple}`);
  process.exit(0);
}
// Sous Windows, `npx` est un script .cmd : il faut passer par le shell.
const r = spawnSync('npx', args, { stdio: 'inherit', cwd: import.meta.dirname, shell: process.platform === 'win32' });
process.exit(r.status ?? 1);
