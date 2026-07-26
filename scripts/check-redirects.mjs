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
const PROD = 'https://aimezlanature.fr';
const cibleExplicite = Boolean(process.argv[2] || process.env.BASE_URL);
const BASE = (process.argv[2] || process.env.BASE_URL || PROD).replace(/\/$/, '');

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
 * Joue une règle en quatre contrôles :
 *   1. l'URL source renvoie bien le code attendu (301) avec un en-tête Location ;
 *   2. la redirection reste sur le même domaine (une redirection cross-domaine
 *      avec le bon chemin est suspecte et passerait sinon inaperçue) ;
 *   3. le chemin de destination correspond à celui de la règle ;
 *   4. la cible existe réellement : on suit la redirection et on exige un 200,
 *      sinon une destination mal orthographiée donnerait un 301 correct… vers
 *      une 404, tout en étant comptée comme réussie.
 * @param {{source: string, destination: string, code: number}} rule
 */
async function checkRule(rule) {
  const isWildcard = rule.source.endsWith('*');
  const requestPath = isWildcard ? sampleForWildcard(rule.source) : rule.source;
  const url = BASE + requestPath;
  const baseHost = new URL(BASE).host;
  const headers = { 'user-agent': 'redirect-check/1.0' };

  try {
    const res = await fetch(url, { redirect: 'manual', headers });

    const location = res.headers.get('location');
    if (!location) {
      return { ok: false, rule, requestPath, got: `statut ${res.status} sans en-tête Location` };
    }

    // Résout Location (absolu ou relatif) contre le domaine testé.
    const target = new URL(location, BASE + '/');

    if (res.status !== rule.code) {
      return { ok: false, rule, requestPath, got: `statut ${res.status} au lieu de ${rule.code} (→ ${location})` };
    }
    if (target.host !== baseHost) {
      return { ok: false, rule, requestPath, got: `redirige vers un autre domaine : ${target.host}` };
    }
    if (target.pathname !== pathOf(rule.destination)) {
      return { ok: false, rule, requestPath, got: `redirige vers ${target.pathname} au lieu de ${pathOf(rule.destination)}` };
    }

    // La cible répond-elle réellement 200 ? On suit la chaîne de redirections.
    const finalRes = await fetch(target, { redirect: 'follow', headers });
    if (!finalRes.ok) {
      return { ok: false, rule, requestPath, got: `301 correct mais la cible ${target.pathname} renvoie ${finalRes.status}` };
    }

    return { ok: true, rule, requestPath, got: `${res.status} → ${target.pathname} (${finalRes.status})` };
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

  // Tant que le basculement WordPress → Astro n'est pas fait, la prod sert
  // encore l'ancien site : les nouvelles pages y répondent 200 (et non 301),
  // donc le test échouera « normalement ». On prévient pour éviter la fausse
  // panique. Après le basculement, ce test doit passer au vert.
  if (BASE === PROD && !cibleExplicite) {
    console.log(
      'ℹ️  Cible = production par défaut. Avant le basculement, des échecs sont\n' +
      '   attendus (l\'ancien site répond 200). Pour tester la nouvelle version,\n' +
      '   passez l\'URL de preview : node scripts/check-redirects.mjs https://preview.url\n'
    );
  }

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
