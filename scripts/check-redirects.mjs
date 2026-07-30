#!/usr/bin/env node
// @ts-check
/**
 * Vérifie, sur le site en ligne, que chaque redirection de vercel.json
 * renvoie bien le bon code (301 par défaut) vers la bonne page.
 *
 * Pourquoi : au basculement WordPress → Astro, une seule redirection cassée =
 * une 404 sur une URL déjà indexée par Google. Ce script rejoue toutes les
 * règles du fichier pour prouver qu'elles fonctionnent réellement en prod.
 *
 * Il LIT vercel.json (tableau `redirects`) : aucune liste à maintenir en
 * double. Ajoutez une règle au fichier, elle est testée automatiquement.
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
const VERCEL_JSON = join(__dirname, '..', 'vercel.json');

// Cible : argument de ligne de commande, sinon variable d'env, sinon la prod.
const PROD = 'https://aimezlanature.fr';
const cibleExplicite = Boolean(process.argv[2] || process.env.BASE_URL);
const BASE = (process.argv[2] || process.env.BASE_URL || PROD).replace(/\/$/, '');

// Combien de requêtes en parallèle (rester poli avec le serveur).
const CONCURRENCY = 8;

/**
 * Charge les règles de redirection depuis vercel.json (tableau `redirects`).
 * @param {string} file chemin du vercel.json
 * @returns {Promise<{source: string, destination: string, code: number}[]>}
 */
async function loadRules(file) {
  const config = JSON.parse(await readFile(file, 'utf8'));
  return (config.redirects ?? []).map((r) => ({
    source: r.source,
    destination: r.destination,
    // `permanent: true` = 301 (défaut) ; `permanent: false` = 302.
    code: r.permanent === false ? 302 : 301,
  }));
}

/**
 * Une règle joker Vercel contient un paramètre (`:path*`) ou un groupe (`(.*)`).
 * On la teste avec un chemin d'exemple pour vérifier que le joker attrape bien
 * tout ce qui est en dessous. Ex. /product-category/(.*) ->
 * /product-category/exemple-test-redirection.
 * @param {string} source
 */
function sampleForWildcard(source) {
  return source
    .replace(/\([^)]*\)/g, 'exemple-test-redirection')
    .replace(/:[A-Za-z_][A-Za-z0-9_]*\*?/g, 'exemple-test-redirection');
}

/** Une source contient-elle un joker ? */
function isWildcard(source) {
  return source.includes('(') || source.includes(':');
}

/**
 * Les DEUX formes à tester pour une règle : avec et sans slash final.
 *
 * Pourquoi les deux : le joker `:path*` de Vercel ne capture PAS le slash final.
 * La règle `/product-category/:path*` répondait donc 308 sur
 * `/product-category/x` mais 404 sur `/product-category/x/` — or les URLs du
 * sitemap WordPress ont TOUTES un slash final. Le script ne testait que la
 * forme sans slash et affichait « 53/53 OK » pendant que 6 URLs réellement
 * indexées tombaient en 404. Ne jamais tester une seule forme.
 *
 * @param {string} source
 * @returns {string[]}
 */
function variantsFor(source) {
  const base = isWildcard(source) ? sampleForWildcard(source) : source;
  const sansSlash = base.endsWith('/') ? base.slice(0, -1) : base;
  const avecSlash = base.endsWith('/') ? base : base + '/';
  // Cas limite : la source est « / » — une seule forme possible.
  return sansSlash === '' ? [avecSlash] : [avecSlash, sansSlash];
}

/**
 * Suit une chaîne de redirections à la main (au lieu de `redirect: 'follow'`)
 * pour pouvoir compter les sauts et voir chaque étape.
 *
 * Nécessaire depuis l'ajout de `"trailingSlash": true` dans vercel.json : une
 * URL sans slash final fait désormais 2 sauts (`/x` -> `/x/` -> cible) au lieu
 * de tomber en 404. C'est voulu, mais il faut comparer la destination FINALE et
 * non celle du premier saut.
 *
 * @param {string} startUrl
 * @param {Record<string,string>} headers
 */
async function followChain(startUrl, headers) {
  const MAX_SAUTS = 5;
  const chain = [];
  let current = startUrl;

  for (let i = 0; i < MAX_SAUTS; i++) {
    const res = await fetch(current, { redirect: 'manual', headers });
    const location = res.headers.get('location');
    chain.push({ url: current, status: res.status, location });
    if (!location) return { chain, finalUrl: current, finalStatus: res.status };
    current = new URL(location, current).href;
  }
  return { chain, finalUrl: current, finalStatus: null, tropDeSauts: true };
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
  const baseHost = new URL(BASE).host;
  const headers = { 'user-agent': 'redirect-check/1.0' };
  const attendu = pathOf(rule.destination);

  // 301 et 308 sont deux redirections permanentes équivalentes (Vercel sert
  // du 308, Cloudflare du 301) ; 302 et 307 sont les temporaires. On compare
  // la CLASSE de redirection, pas le code exact, pour rester agnostique.
  const attendus = rule.code === 301 ? [301, 308] : [302, 307];

  /** @param {string} requestPath */
  const testerUneForme = async (requestPath) => {
    try {
      const { chain, finalUrl, finalStatus, tropDeSauts } = await followChain(
        BASE + requestPath,
        headers
      );

      if (tropDeSauts) {
        return { ok: false, rule, requestPath, got: 'boucle de redirection (plus de 5 sauts)' };
      }

      const premier = chain[0];
      if (!premier.location) {
        return { ok: false, rule, requestPath, got: `statut ${premier.status} sans en-tête Location` };
      }
      if (!attendus.includes(premier.status)) {
        return {
          ok: false, rule, requestPath,
          got: `statut ${premier.status} (attendu ${attendus.join(' ou ')}) (→ ${premier.location})`,
        };
      }

      const cible = new URL(finalUrl);
      if (cible.host !== baseHost) {
        return { ok: false, rule, requestPath, got: `redirige vers un autre domaine : ${cible.host}` };
      }
      if (cible.pathname !== attendu) {
        return {
          ok: false, rule, requestPath,
          got: `aboutit à ${cible.pathname} au lieu de ${attendu}`,
        };
      }
      if (finalStatus !== 200) {
        return {
          ok: false, rule, requestPath,
          got: `redirection correcte mais la cible ${cible.pathname} renvoie ${finalStatus}`,
        };
      }

      // Nombre de sauts = nombre de réponses de redirection (hors la 200 finale).
      const sauts = chain.length - 1;
      const codes = chain.filter((c) => c.location).map((c) => c.status).join('→');
      // 2 sauts est normal pour la forme sans slash final (trailingSlash: true) ;
      // au-delà, la règle mérite d'être réécrite pour pointer directement.
      const alerte = sauts > 2 ? `  ⚠️ ${sauts} sauts` : '';
      return { ok: true, rule, requestPath, got: `${codes} → ${cible.pathname} (200)${alerte}` };
    } catch (err) {
      return {
        ok: false, rule, requestPath,
        got: `erreur réseau : ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  };

  // Les deux formes (avec et sans slash final) sont testées : c'est ce contrôle
  // qui manquait et qui laissait passer 6 URLs en 404.
  const results = [];
  for (const forme of variantsFor(rule.source)) {
    results.push(await testerUneForme(forme));
  }
  return results;
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
  const rules = await loadRules(VERCEL_JSON);

  const nbFormes = rules.reduce((n, r) => n + variantsFor(r.source).length, 0);
  console.log(
    `\nTest de ${rules.length} redirections sur ${BASE}\n` +
    `${nbFormes} requêtes : chaque règle est testée AVEC et SANS slash final.\n`
  );

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

  // checkRule renvoie un résultat PAR FORME testée : on aplatit.
  const results = (await runPooled(rules, checkRule, CONCURRENCY)).flat();

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
