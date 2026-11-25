// Espace revendeurs : jetons signés et calcul d'une commande pro.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signerJeton, verifierJeton } from '../src/data/jeton-pro.mjs';
import { calculerCommandePro, prixPro } from '../src/data/commande-pro.mjs';

const SECRET = 'x'.repeat(48);
const ID = 'revendeurs.3f1c2b9e-0000-4000-8000-123456789abc';

test('jeton : valide, puis refusé si altéré, expiré, mauvais type ou mauvais secret', () => {
  const t0 = Date.UTC(2026, 10, 24);
  const j = signerJeton({ id: ID, type: 'lien' }, SECRET, 3600, t0);
  assert.deepEqual(verifierJeton(j, SECRET, 'lien', t0 + 1000), { id: ID });
  assert.equal(verifierJeton(j, SECRET, 'lien', t0 + 3601_000), null, 'expiré');
  assert.equal(verifierJeton(j, SECRET, 'session', t0), null, 'mauvais type');
  assert.equal(verifierJeton(j, 'y'.repeat(48), 'lien', t0), null, 'mauvais secret');
  const [corps, sig] = j.split('.');
  const faux = Buffer.from(JSON.stringify({ id: 'revendeurs.autre', type: 'lien', exp: 9e9 })).toString('base64url');
  assert.equal(verifierJeton(`${faux}.${sig}`, SECRET, 'lien', t0), null, 'contenu modifié');
  assert.equal(verifierJeton(`${corps}.`, SECRET, 'lien', t0), null);
  assert.equal(verifierJeton('', SECRET, 'lien', t0), null);
  assert.throws(() => signerJeton({ id: ID, type: 'lien' }, 'court', 60));
});

const REGLES = {
  forfait: 4.9,
  poidsMaxForfait: 500,
  grille: [
    { poidsMax: 250, prix: 5.49 }, { poidsMax: 500, prix: 7.59 }, { poidsMax: 750, prix: 9.29 },
    { poidsMax: 1000, prix: 9.59 }, { poidsMax: 2000, prix: 11.19 }, { poidsMax: 5000, prix: 17.39 },
    { poidsMax: 10000, prix: 25.29 }, { poidsMax: 15000, prix: 31.99 }, { poidsMax: 30000, prix: 39.59 },
  ],
};
const CATALOGUE = [
  { slug: 'pack-55-perles', name: 'Pack 55', shortName: 'Pack 55', priceCurrent: 19.9, poids: 90, inStock: true },
  { slug: 'pack-100-perles', name: 'Pack 100', shortName: 'Pack 100', priceCurrent: 29.9, poids: 160, inStock: true },
  { slug: 'gourde-ecologique', name: 'Gourde', shortName: 'Gourde', priceCurrent: 29.9, poids: 500, inStock: false },
];

test('prix pro : −30 % au centime', () => {
  assert.equal(prixPro(29.9), 20.93);
  assert.equal(prixPro(19.9), 13.93);
});

test('commande pro : minimum 300 €, Colissimo au poids, refus', () => {
  const ok = calculerCommandePro([{ slug: 'pack-100-perles', qty: 15 }], CATALOGUE, REGLES);
  assert.equal(ok.ok, true);
  assert.equal(ok.sousTotal, 313.95);
  assert.equal(ok.poids, 2400);
  assert.equal(ok.livraison, 17.39);
  assert.equal(ok.total, 331.34);

  // Petit colis : grille dès le 1er gramme, jamais le forfait de 4,90 €.
  const leger = calculerCommandePro([{ slug: 'pack-55-perles', qty: 22 }], CATALOGUE, REGLES);
  assert.equal(leger.ok, true);
  assert.equal(leger.poids, 1980);
  assert.equal(leger.livraison, 11.19);

  const peu = calculerCommandePro([{ slug: 'pack-100-perles', qty: 14 }], CATALOGUE, REGLES);
  assert.equal(peu.ok, false);
  assert.match(peu.erreur, /il manque 6,98 €/);

  assert.equal(calculerCommandePro([{ slug: 'gourde-ecologique', qty: 20 }], CATALOGUE, REGLES).ok, false, 'rupture');
  assert.equal(calculerCommandePro([{ slug: 'inconnu', qty: 20 }], CATALOGUE, REGLES).ok, false);
  assert.equal(calculerCommandePro([{ slug: 'pack-100-perles', qty: 0 }], CATALOGUE, REGLES).ok, false);
  assert.equal(calculerCommandePro([{ slug: 'pack-100-perles', qty: 10 }, { slug: 'pack-100-perles', qty: 10 }], CATALOGUE, REGLES).ok, false, 'doublon');
  assert.equal(calculerCommandePro([], CATALOGUE, REGLES).ok, false);
  // 200 × 160 g = 32 kg > 30 kg : hors grille.
  assert.match(calculerCommandePro([{ slug: 'pack-100-perles', qty: 200 }], CATALOGUE, REGLES).erreur, /trop lourd/);
});
