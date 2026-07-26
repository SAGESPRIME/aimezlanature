#!/usr/bin/env node
// @ts-check
/**
 * Vérifie, sur le site en ligne, que chaque redirection de public/_redirects
 * renvoie bien le bon code (301 par défaut) vers la bonne page.
 *
 * Pourquoi : au basculement WordPress → Astro, une seule redirection cassée =
 * une 404 sur une URL déjà indexée par Google. Ce script rejoue toutes les
 * règles du fichier pour prouver qu'elles fonctionnent réellement en prod.
 *
 * Il LIT public/_redirects : aucune liste à maintenir en double. Ajoutez une
 * règle au fichier, elle est testée automatiquement.
 *
 * Usage :
 *   node scripts/check-redirects.mjs                       (teste https://aimezlanature.fr)
 *   node scripts/check-redirects.mjs https://preview.url   (teste une preview)
 *   BASE_URL=https://aimezlanature.fr node scripts/check-redirects.mjs
 *
 * Code de sortie 0 si tout passe, 1 s'il reste au moins un échec (utilisable en CI).
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REDIRECTS_FILE = join(__dirname, '..', 'public', '_redirects');

// Cible : argument de ligne de commande, sinon variable d'env, sinon la prod.
const BASE = (process.argv[2] || process.env.BASE_URL || 'https://aimezlanature.fr').replace(/\/$/, '');

// Combien de requêtes en parallèle (rester poli avec le serveur).
const CONCURRENCY = 8;

/**
 * Transforme une ligne « source destination [code] » en règle testable.
 * Les lignes de commentaire (#) et vides sont ignorées par l'appelant.
 * @param {string} line
 */
function parseRule(line) {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const [source, destination, codeRaw] = parts;
  const code = Number(codeRaw ?? '301');
  return { source, destination, code: Number.isFinite(code) ? code : 301 };
}

/**
 * Une règle joker se termine par « * ». On la teste avec un chemin d'exemple
 * pour vérifier que le joker attrape bien tout ce qui est en dessous.
 * @param {string} source
 */
function sampleForWildcard(source) {
  // /product-category/*  ->  /product-category/exemple-test-redirection/
  return source.replace(/\*$/, 'exemple-test-redirection/');
}

/** Chemin (pathname) d'une URL absolue ou relative, résolu contre BASE. */
function pathOf(urlOrPath) {
  return new URL(urlOrPath, BASE + '/').pathname;
}

/**
 * Joue une règle : appelle l'URL source sans suivre la redirection et compare
 * le statut + la destination (Location) à ce qui est attendu.
 * @param {{source: string, destination: string, code: number}} rule
 */
async function checkRule(rule) {
  const isWildcard = rule.source.endsWith('*');
  const requestPath = isWildcard ? sampleForWildcard(rule.source) : rule.source;
  const url = BASE + requestPath;

  try {
    const res = await fetch(url, { redirect: 'manual', headers: { 'user-agent': 'redirect-check/1.0' } });

    // 3xx attendu → on lit l'en-tête Location.
    const location = res.headers.get('location');
    const statusOk = res.status === rule.code;
    const destOk = location ? pathOf(location) === pathOf(rule.destination) : false;

    if (statusOk && destOk) {
      return { ok: true, rule, requestPath, got: `${res.status} → ${location}` };
    }
    const reason = !location
      ? `statut ${res.status} sans en-tête Location`
      : !statusOk
        ? `statut ${res.status} au lieu de ${rule.code} (→ ${location})`
        : `redirige vers ${pathOf(location)} au lieu de ${pathOf(rule.destination)}`;
    return { ok: false, rule, requestPath, got: reason };
  } catch (err) {
    return { ok: false, rule, requestPath, got: `erreur réseau : ${err instanceof Error ? err.message : String(err)}` };
  }
}

/** Exécute les tâches par lots pour limiter la charge sur le serveur. */
async function runPooled(items, worker, size) {
  const results = [];
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    results.push(...(await Promise.all(batch.map(worker))));
  }
  return results;
}

async function main() {
  const raw = await readFile(REDIRECTS_FILE, 'utf8');
  const rules = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map(parseRule)
    .filter((r) => r !== null);

  console.log(`\nTest de ${rules.length} redirections sur ${BASE}\n`);

  const results = await runPooled(rules, checkRule, CONCURRENCY);

  const failures = results.filter((r) => !r.ok);
  for (const r of results) {
    const mark = r.ok ? '✅' : '❌';
    console.log(`${mark} ${r.requestPath}`);
    if (!r.ok) console.log(`     ${r.got}`);
  }

  console.log(`\n${results.length - failures.length}/${results.length} OK`);
  if (failures.length > 0) {
    console.log(`\n${failures.length} redirection(s) à corriger ⬆️`);
    process.exit(1);
  }
  console.log('Toutes les redirections fonctionnent 🎉\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
