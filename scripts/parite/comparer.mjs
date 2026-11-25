#!/usr/bin/env node
// @ts-check
/**
 * Compare le build courant à la photo de référence (`reference.json`, prise sur
 * le site d'avant Sanity) et liste chaque écart SEO.
 *
 * Un écart n'est pas forcément une erreur — raccourcir un title trop long est
 * voulu — mais chacun doit être LU et justifié. C'est ce qui distingue une
 * refonte maîtrisée d'une refonte qui « a l'air de marcher ».
 *
 * Usage : node scripts/parite/comparer.mjs [reference.json] [dossier-dist]
 * Sortie 1 si une page a disparu, a perdu son h1, ou si son JSON-LD est illisible.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { extraire } from './extraire.mjs';

const ici = dirname(fileURLToPath(import.meta.url));
const ref = JSON.parse(await readFile(process.argv[2] ?? join(ici, 'reference.json'), 'utf8'));
const actuel = await extraire(process.argv[3] ?? 'dist/client');

let bloquants = 0;
let ecarts = 0;
const dire = (/** @type {string} */ niveau, /** @type {string} */ msg) => {
  if (niveau === 'BLOQUANT') bloquants++;
  else ecarts++;
  console.log(`${niveau === 'BLOQUANT' ? '❌' : '•'} ${msg}`);
};

for (const url of Object.keys(ref)) {
  const a = ref[url];
  const b = actuel[url];
  if (!b) {
    dire('BLOQUANT', `${url} : page disparue`);
    continue;
  }
  for (const champ of ['title', 'description', 'canonical', 'robots']) {
    if (a[champ] !== b[champ]) dire('ecart', `${url} ${champ} :\n    avant « ${a[champ]} »\n    après « ${b[champ]} »`);
  }
  if (b.h1.length !== 1) dire('BLOQUANT', `${url} : ${b.h1.length} h1`);
  else if (a.h1.join() !== b.h1.join()) dire('ecart', `${url} h1 : « ${a.h1} » → « ${b.h1} »`);
  if (!b.jsonLdValide) dire('BLOQUANT', `${url} : JSON-LD illisible`);
  const perdus = a.jsonLd.filter((t) => !b.jsonLd.includes(t));
  const gagnes = b.jsonLd.filter((t) => !a.jsonLd.includes(t));
  if (perdus.length) dire('ecart', `${url} JSON-LD perdu : ${perdus.join(', ')}`);
  if (gagnes.length) dire('ecart', `${url} JSON-LD ajouté : ${gagnes.join(', ')}`);
  const titresPerdus = a.titres.filter((t) => !b.titres.includes(t));
  if (titresPerdus.length) dire('ecart', `${url} titres disparus : ${titresPerdus.join(' | ')}`);
  const liensPerdus = a.liensInternes.filter((l) => !b.liensInternes.includes(l));
  if (liensPerdus.length) dire('ecart', `${url} liens internes disparus : ${liensPerdus.join(', ')}`);
  const delta = b.mots - a.mots;
  if (a.mots > 0 && Math.abs(delta) / a.mots > 0.05) {
    dire('ecart', `${url} texte : ${a.mots} → ${b.mots} mots (${delta > 0 ? '+' : ''}${delta})`);
  }
}
for (const url of Object.keys(actuel)) if (!ref[url]) dire('ecart', `${url} : nouvelle page`);

console.log(`\n${Object.keys(ref).length} pages de référence · ${ecarts} écart(s) à justifier · ${bloquants} bloquant(s)`);
process.exit(bloquants > 0 ? 1 : 0);
