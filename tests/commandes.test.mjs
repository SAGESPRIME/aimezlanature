// Fiche « commande » enregistrée dans Sanity à chaque paiement.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { documentCommande, idCommande, numeroCommande, numeroSuiviPropre, lienSuivi, lireLivraison } from '../src/data/commande-doc.mjs';

const SESSION = {
  id: 'cs_test_a1b2c3d4e5f6g7h8QPXAYX9F',
  created: 1795560000,
  livemode: false,
  amount_subtotal: 31395,
  amount_total: 33134,
  total_details: { amount_shipping: 1739 },
  payment_intent: 'pi_3Test123',
  metadata: { source: 'aimezlanature', revendeur: 'revendeurs.abc' },
  customer_details: { name: 'Marie Dupont', email: 'marie@example.org', phone: '+33600000000' },
  collected_information: {
    shipping_details: { name: 'Bio & Co', address: { line1: '1 rue des Lilas', line2: null, postal_code: '93260', city: 'Les Lilas', country: 'FR' } },
  },
};
const ARTICLES = [{ description: 'Pack 100 Perles — tarif revendeur', quantite: 15, montant: 31395 }];

test('fiche commande : identifiant privé, montants en euros, revendeur, lien Stripe test', () => {
  const d = documentCommande(SESSION, ARTICLES);
  assert.equal(d._id, 'commandes.cs_test_a1b2c3d4e5f6g7h8QPXAYX9F');
  assert.equal(d._type, 'commande');
  assert.equal(d.numero, 'ALN-QPXAYX9F');
  assert.equal(d.statut, 'a_expedier');
  assert.equal(d.source, 'revendeur');
  assert.equal(d.modeTest, true);
  assert.equal(d.sousTotal, 313.95);
  assert.equal(d.fraisLivraison, 17.39);
  assert.equal(d.total, 331.34);
  assert.deepEqual(JSON.parse(JSON.stringify(d.lignes)), [{ _key: 'l0', description: 'Pack 100 Perles — tarif revendeur', quantite: 15, total: 313.95 }]);
  assert.deepEqual(JSON.parse(JSON.stringify(d.livraison)), { nom: 'Bio & Co', adresse: ['1 rue des Lilas', '93260 Les Lilas', 'FR'] });
  assert.equal(d.client.email, 'marie@example.org');
  assert.equal(d.lienStripe, 'https://dashboard.stripe.com/test/payments/pi_3Test123');
  assert.equal(d.date, new Date(1795560000 * 1000).toISOString());
});

test('fiche commande : client ordinaire, mode réel, ancienne place de l\'adresse', () => {
  const s = { ...SESSION, livemode: true, metadata: { source: 'aimezlanature' }, collected_information: undefined,
    shipping_details: { name: 'M. D', address: { line1: 'a', postal_code: '75001', city: 'Paris', country: 'FR' } } };
  const d = documentCommande(s, ARTICLES);
  assert.equal(d.source, 'client');
  assert.equal(d.revendeurId, undefined);
  assert.equal(d.lienStripe, 'https://dashboard.stripe.com/payments/pi_3Test123');
  assert.deepEqual(lireLivraison(s).adresse, ['a', '75001 Paris', 'FR']);
});

test('identifiant : refuse ce qui n\'est pas une session Stripe', () => {
  assert.throws(() => idCommande('../drafts.x'));
  assert.throws(() => idCommande(''));
  assert.equal(numeroCommande('cs_live_abcdefgh12345678'), 'ALN-12345678');
});

test('numéro de suivi : nettoyé, refusé s\'il est mal formé, lien La Poste', () => {
  assert.equal(numeroSuiviPropre(' 6a 1234 5678 901 '), '6A12345678901');
  assert.equal(numeroSuiviPropre('123'), null);
  assert.equal(numeroSuiviPropre('6A123<script>'), null);
  assert.equal(numeroSuiviPropre(undefined), null);
  assert.equal(lienSuivi('6A12345678901'), 'https://www.laposte.fr/outils/suivre-vos-envois?code=6A12345678901');
});
