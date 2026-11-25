// Frais de livraison au poids : la règle du marchand (2026-11-24), et
// l'accord exact entre le calcul serveur (montant débité) et celui du panier.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fraisLivraison } from '../src/data/livraison.mjs';

const REGLES = {
  forfait: 4.9,
  poidsMaxForfait: 500,
  grille: [
    { poidsMax: 250, prix: 5.49 },
    { poidsMax: 500, prix: 7.59 },
    { poidsMax: 750, prix: 9.29 },
    { poidsMax: 1000, prix: 9.59 },
    { poidsMax: 2000, prix: 11.19 },
    { poidsMax: 5000, prix: 17.39 },
    { poidsMax: 10000, prix: 25.29 },
    { poidsMax: 15000, prix: 31.99 },
    { poidsMax: 30000, prix: 39.59 },
  ],
};
const P55 = { poids: 90, offerte: false };
const P100 = { poids: 160, offerte: true };
const PACK_GOURDE = { poids: 500, offerte: true };
const GOURDE = { poids: 500, offerte: false };
const l = (p, qty) => ({ ...p, qty });

// Tableau validé avec le marchand : [panier, poids attendu, frais attendus].
const CAS = [
  [[l(P55, 1)], 90, 4.9],
  [[l(P55, 3)], 270, 4.9],
  [[l(P100, 1)], 160, 0],
  [[l(P100, 3)], 480, 0],
  [[l(P100, 4)], 640, 9.29],
  [[l(P55, 1), l(P100, 1)], 250, 0],
  [[l(PACK_GOURDE, 1)], 500, 0],
  [[l(PACK_GOURDE, 1), l(P55, 1)], 590, 9.29],
  [[l(PACK_GOURDE, 2)], 1000, 9.59],
  [[l(GOURDE, 1)], 500, 4.9],
  [[l(GOURDE, 1), l(P55, 1)], 590, 9.29],
  [[l(GOURDE, 1), l(P100, 1)], 660, 9.29],
  [[l(GOURDE, 2)], 1000, 9.59],
  [[l(GOURDE, 60)], 30000, 39.59],
  [[l(GOURDE, 61)], 30500, null],
  [[], 0, 0],
];

test('règle du marchand : frais selon le poids', () => {
  for (const [lignes, poids, frais] of CAS) {
    const r = fraisLivraison(lignes, REGLES);
    assert.equal(r.poids, poids, JSON.stringify(lignes));
    assert.equal(r.frais, frais, JSON.stringify(lignes));
  }
});

test('le panier du navigateur calcule exactement comme le serveur', () => {
  const contexte = { globalThis: {} };
  contexte.globalThis = contexte;
  vm.runInNewContext(readFileSync('public/js/livraison.js', 'utf8'), contexte);
  const navigateur = contexte.alnFraisLivraison;
  assert.equal(typeof navigateur, 'function');
  for (const [lignes] of CAS) {
    // Copie JSON : les objets créés dans le contexte vm n'ont pas le même prototype.
    const duNavigateur = JSON.parse(JSON.stringify(navigateur(lignes, REGLES)));
    assert.deepEqual(duNavigateur, fraisLivraison(lignes, REGLES), JSON.stringify(lignes));
  }
});
