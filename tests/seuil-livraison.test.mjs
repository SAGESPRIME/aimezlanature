// Garde-fou : le seuil de livraison offerte ne doit jamais être inséré BRUT
// dans un texte affiché. Un seuil non entier (29,9 saisi dans le Studio)
// s'affichait « 29.9 € » à 9 endroits (test du CMS, 2026-11-24).
// Pour l'affichage : SITE.seuilLivraisonTexte (« 50 », « 29,90 »).
// Le nombre SITE.freeShippingThreshold reste réservé aux calculs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function fichiers(dossier) {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return /\.(astro|ts|mjs)$/.test(nom) ? [chemin] : [];
  });
}

test('le seuil de livraison n’est jamais interpolé brut dans un texte', () => {
  // `{SITE.freeShippingThreshold}` (gabarit Astro) ou `${SITE.freeShippingThreshold}`
  // (chaîne) : une insertion dans du texte. Une comparaison ou une affectation
  // (`>= SITE.freeShippingThreshold`, `seuil: SITE.freeShippingThreshold`) reste permise.
  const insertion = /\$?\{\s*SITE\.freeShippingThreshold\s*\}/;
  const fautifs = fichiers('src').filter((f) => insertion.test(readFileSync(f, 'utf8')));
  assert.deepEqual(fautifs, [], `Utiliser SITE.seuilLivraisonTexte dans : ${fautifs.join(', ')}`);
});
