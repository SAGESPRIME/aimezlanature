// Fiches clients : identifiant privé, mise à jour par commande, import WooCommerce.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normaliserEmail, idClient, statutEmailsSelonDate, villeDepuisAdresse, codePays,
  majClientDepuisCommande, agregerCommandes, agregerRapportClients, fichesImport,
} from '../src/data/client-doc.mjs';
import { documentCommande } from '../src/data/commande-doc.mjs';

test('identifiant : privé (point), stable, insensible à la casse, sans email en clair', () => {
  const a = idClient(' Marie@Example.org ');
  assert.match(a, /^clients\.[0-9a-f]{24}$/);
  assert.equal(a, idClient('marie@example.org'));
  assert.ok(!a.includes('marie'));
  assert.match(idClient('marie@example.org', { test: true }), /^clients\.test\.[0-9a-f]{24}$/);
  assert.equal(normaliserEmail('pas-un-email'), null);
  assert.throws(() => idClient(''));
});

test('statut emails : 3 ans après le dernier achat', () => {
  const maintenant = new Date('2026-11-25T12:00:00Z');
  assert.equal(statutEmailsSelonDate('2024-01-10T10:00:00Z', maintenant), 'client_existant');
  assert.equal(statutEmailsSelonDate('2023-11-20T10:00:00Z', maintenant), 'hors_delai');
  assert.equal(statutEmailsSelonDate(undefined, maintenant), 'hors_delai');
});

test('ville, code postal, pays', () => {
  assert.deepEqual(villeDepuisAdresse(['1 rue des Lilas', '93260 Les Lilas', 'FR']), { codePostal: '93260', ville: 'Les Lilas' });
  assert.deepEqual(villeDepuisAdresse(undefined), {});
  assert.equal(codePays('France'), 'FR');
  assert.equal(codePays('fr'), 'FR');
  assert.equal(codePays(''), undefined);
});

const SESSION = {
  id: 'cs_test_a1b2c3d4e5f6g7h8QPXAYX9F',
  created: 1795560000,
  livemode: true,
  amount_subtotal: 2990,
  amount_total: 2990,
  payment_intent: 'pi_1',
  metadata: { source: 'aimezlanature' },
  customer_details: { name: 'Marie Dupont', email: 'Marie@Example.org' },
  collected_information: { shipping_details: { name: 'Marie Dupont', address: { line1: '1 rue des Lilas', postal_code: '93260', city: 'Les Lilas', country: 'FR' } } },
};

test('commande du site → fiche client (création + incréments) et lien depuis la commande', () => {
  const commande = documentCommande(SESSION, [{ description: 'Pack 100', quantite: 1, montant: 2990 }]);
  const maj = majClientDepuisCommande(commande);
  assert.equal(maj.base._id, idClient('marie@example.org'));
  assert.equal(commande.ficheClient._ref, maj.base._id);
  assert.equal(commande.ficheClient._weak, true);
  assert.equal(maj.base.email, 'marie@example.org');
  assert.equal(maj.base.origine, 'site');
  assert.deepEqual(maj.inc, { nbCommandes: 1, depense: 29.9 });
  assert.equal(maj.set.derniereCommande, commande.date);
  assert.equal(maj.setIfMissing.premiereCommande, commande.date);
  assert.equal(maj.set.ville, 'Les Lilas');
  assert.equal(maj.set.pays, 'FR');
});

test('paiement de test → fiche de test séparée', () => {
  const commande = documentCommande({ ...SESSION, livemode: false }, []);
  const maj = majClientDepuisCommande(commande);
  assert.match(maj.base._id, /^clients\.test\./);
  assert.equal(maj.base.modeTest, true);
  assert.equal(commande.ficheClient._ref, maj.base._id);
});

test('commande sans email : pas de fiche client', () => {
  const commande = documentCommande({ ...SESSION, customer_details: {} }, []);
  assert.equal(majClientDepuisCommande(commande), null);
  assert.equal(commande.ficheClient, undefined);
});

test('rapport WooCommerce : doublons identiques comptés une fois (max, pas de somme)', () => {
  const ligne = { 'E-mail': 'a@x.fr', Commandes: '2', 'Dépense totale': '59.80', Nom: 'A', Ville: 'Paris', 'Code postal': '75001', 'Pays/région': 'FR' };
  const r = agregerRapportClients([ligne, { ...ligne }, { ...ligne, 'E-mail': 'A@X.FR ' }]);
  assert.equal(r.size, 1);
  assert.equal(r.get('a@x.fr').nbCommandes, 2);
  assert.equal(r.get('a@x.fr').depense, 59.8);
});

test('import : commandes payées font foi, rapport en complément, comptes sans achat ignorés', () => {
  const maintenant = new Date('2026-11-25T00:00:00Z');
  const rapport = agregerRapportClients([
    { 'E-mail': 'fidele@x.fr', Commandes: '1', 'Dépense totale': '29.90', Nom: 'F', Ville: '', 'Pays/région': 'FR', 'Dernière activité': '' },
    { 'E-mail': 'rapport-seul@x.fr', Commandes: '1', 'Dépense totale': '19.90', Nom: 'R', Ville: 'Lyon', 'Pays/région': 'FR', 'Dernière activité': '2025-02-01T10:00:00Z' },
    { 'E-mail': 'sans-achat@x.fr', Commandes: '0', 'Dépense totale': '0', Nom: 'S' },
  ]);
  const commandes = agregerCommandes([
    { email: 'Fidele@x.fr', date: '2024-06-01T10:00:00Z', total: 29.9, numero: '12', ville: 'Nantes', pays: 'France' },
    { email: 'fidele@x.fr', date: '2022-01-01T10:00:00Z', total: 19.9, numero: '5' },
    { email: 'ancien@x.fr', date: '2021-03-01T10:00:00Z', total: 19.9, numero: '3', nom: 'Ancien' },
  ]);
  const fiches = fichesImport(rapport, commandes, maintenant);
  const par = Object.fromEntries(fiches.map((f) => [f.email, f]));
  assert.deepEqual(Object.keys(par).sort(), ['ancien@x.fr', 'fidele@x.fr', 'rapport-seul@x.fr']);
  const f = par['fidele@x.fr'];
  assert.equal(f.nbCommandes, 2);
  assert.equal(f.depense, 49.8);
  assert.equal(f.premiereCommande, '2022-01-01T10:00:00Z');
  assert.equal(f.derniereCommande, '2024-06-01T10:00:00Z');
  assert.equal(f.ville, 'Nantes');
  assert.equal(f.pays, 'FR');
  assert.equal(f.emails, 'client_existant');
  assert.equal(f.historiqueWoo.length, 2);
  assert.equal(f._id, idClient('fidele@x.fr'));
  assert.equal(par['ancien@x.fr'].emails, 'hors_delai');
  assert.equal(par['rapport-seul@x.fr'].nbCommandes, 1);
  assert.equal(par['rapport-seul@x.fr'].derniereCommande, '2025-02-01T10:00:00Z');
  assert.ok(fiches.every((x) => x.origine === 'woocommerce' && x.modeTest === false));
});
