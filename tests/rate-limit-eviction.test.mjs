// Test isolé dans son propre fichier : `node --test` lance chaque fichier dans
// un processus séparé, la mémoire du limiteur part donc de zéro.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifierLimite } from '../src/lib/rateLimit.ts';

const requete = (ip) => new Request('http://x/', { headers: { 'x-aln-client-ip': ip } });

test('dépasser 5 000 clés ne remet PAS à zéro un appelant récent déjà bloqué', () => {
  // Ce test échouait avec l'ancien code, qui vidait TOUS les compteurs au-delà
  // du plafond (audit du 2026-11-24).
  const ip = (i) => `10.${(i >> 16) & 255}.${(i >> 8) & 255}.${i & 255}`;
  for (let i = 0; i < 4990; i++) verifierLimite(requete(ip(i)), 'remplissage', 100, 60);
  for (let i = 0; i < 2; i++) verifierLimite(requete('198.51.100.200'), 't5', 1, 60);
  for (let i = 4990; i < 5020; i++) verifierLimite(requete(ip(i)), 'remplissage', 100, 60);
  assert.equal(verifierLimite(requete('198.51.100.200'), 't5', 1, 60).autorise, false);
});
