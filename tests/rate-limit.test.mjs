// Tests de src/lib/rateLimit.ts (Node 22 lit le TypeScript sans compilation).
// Lancer : npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifierLimite } from '../src/lib/rateLimit.ts';

const requete = (ip) => new Request('http://x/', { headers: ip ? { 'x-aln-client-ip': ip } : {} });

test('10 appels passent, le 11e est bloqué', () => {
  for (let i = 0; i < 10; i++) assert.equal(verifierLimite(requete('198.51.100.1'), 't1', 10, 60).autorise, true);
  assert.equal(verifierLimite(requete('198.51.100.1'), 't1', 10, 60).autorise, false);
});

test('changer d\'adresse IPv6 dans le même /64 ne donne PAS un nouveau quota', () => {
  for (let i = 1; i <= 10; i++) verifierLimite(requete(`2001:db8:aa:bb::${i}`), 't2', 10, 60);
  assert.equal(verifierLimite(requete('2001:db8:aa:bb::ffff'), 't2', 10, 60).autorise, false);
  assert.equal(verifierLimite(requete('2001:db8:aa:cc::1'), 't2', 10, 60).autorise, true);
});

test('IP absente : comptée dans un compteur commun, plus de passe-droit', () => {
  for (let i = 0; i < 3; i++) verifierLimite(requete(null), 't3', 3, 60);
  assert.equal(verifierLimite(requete(null), 't3', 3, 60).autorise, false);
});
