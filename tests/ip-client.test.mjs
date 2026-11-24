// Tests de src/data/ip-client.mjs (IP de confiance, clé de limite).
// Lancer : npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adressePrivee, ipClient, cleDeLimite } from '../src/data/ip-client.mjs';

test('adresses privées et locales reconnues', () => {
  for (const ip of ['10.0.1.5', '172.16.0.1', '172.31.255.254', '192.168.1.1', '127.0.0.1',
    '::1', '::ffff:10.0.1.7', 'fd12:3456::1', 'fe80::1%eth0', '[::1]']) {
    assert.equal(adressePrivee(ip), true, ip);
  }
});

test('adresses publiques et invalides refusées', () => {
  for (const ip of ['203.0.113.9', '172.32.0.1', '8.8.8.8', '2a01:4f8::1', '::ffff:8.8.8.8',
    '', undefined, 'n/importe', '10.0.0.256']) {
    assert.equal(adressePrivee(ip), false, String(ip));
  }
});

test("l'en-tête est cru quand la connexion vient du proxy (réseau privé)", () => {
  assert.equal(ipClient({ source: 'x-real-ip', enTete: '198.51.100.7', pair: '10.0.1.3' }), '198.51.100.7');
  // Plusieurs valeurs : la dernière est celle vue par le proxy.
  assert.equal(ipClient({ source: 'x-real-ip', enTete: '1.1.1.1, 198.51.100.7', pair: '::ffff:10.0.1.3' }), '198.51.100.7');
});

test("l'en-tête est IGNORÉ quand la connexion vient d'Internet (proxy contourné)", () => {
  assert.equal(ipClient({ source: 'x-real-ip', enTete: '1.2.3.4', pair: '203.0.113.9' }), '203.0.113.9');
  assert.equal(ipClient({ source: 'cf-connecting-ip', enTete: '1.2.3.4', pair: '::ffff:203.0.113.9' }), '203.0.113.9');
});

test("jamais d'IP vide : sans en-tête, l'adresse de la connexion", () => {
  assert.equal(ipClient({ source: 'x-real-ip', enTete: undefined, pair: '10.0.1.3' }), '10.0.1.3');
  assert.equal(ipClient({ source: 'x-real-ip', enTete: '  ', pair: '10.0.1.3' }), '10.0.1.3');
  assert.equal(ipClient({ source: 'socket', enTete: '1.2.3.4', pair: '203.0.113.9' }), '203.0.113.9');
});

test('clé de limite : IPv4 telle quelle, IPv6 regroupée par /64', () => {
  assert.equal(cleDeLimite('198.51.100.7'), '198.51.100.7');
  assert.equal(cleDeLimite('::ffff:198.51.100.7'), '198.51.100.7');
  const a = cleDeLimite('2001:db8:1:2::1');
  assert.equal(a, '2001:db8:1:2::/64');
  assert.equal(cleDeLimite('2001:0db8:0001:0002:ffff:ffff:ffff:ffff'), a);
  assert.notEqual(cleDeLimite('2001:db8:1:3::1'), a);
});
