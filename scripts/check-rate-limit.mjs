#!/usr/bin/env node
// @ts-check
/**
 * Vérifie, sur le site en ligne, que la limite de débit de /api/checkout arrête
 * une rafale RÉALISTE — c'est-à-dire parallèle, pas séquentielle.
 *
 * Pourquoi ce script existe. Le 2026-07-30, le limiteur applicatif
 * (`src/lib/rateLimit.ts`) avait été déclaré « vérifié en production » sur la
 * preuve « 10 appels passent, le 11e renvoie 429 » — obtenue avec une boucle
 * séquentielle. Rejoué en parallèle : 27 appels sur 30 passent, AUCUN bloqué.
 * Le compteur vit en mémoire, donc par instance de fonction, et Vercel en
 * démarre autant que la charge l'exige. Personne n'attaque en série : le cas de
 * test doit ressembler à la réalité qu'on redoute, pas à celle qu'on sait
 * traiter (cf. tasks/lessons.md, même date).
 *
 * CE SCRIPT ÉCHOUE TANT QUE LE MUR N'EST PAS POSÉ, et c'est voulu : il est le
 * critère d'acceptation de la règle de rate limiting du pare-feu Vercel décrite
 * dans docs/audit/rapport-pre-bascule-2026-07-29.md, section « Le mur ». Le jour
 * où cette règle est publiée, il doit passer au vert sans qu'on y touche.
 *
 * ⚠️ Chaque appel autorisé crée une VRAIE session Stripe Checkout. Le script
 * refuse donc de tourner si le site répond en mode live, sauf `--live` explicite :
 * une rafale sur une boutique en production épuiserait le budget d'API Stripe du
 * compte, et les vrais clients ne pourraient plus payer pendant ce temps.
 *
 * Usage :
 *   node scripts/check-rate-limit.mjs https://aimezlanatureseo.vercel.app
 *   node scripts/check-rate-limit.mjs https://aimezlanature.fr --live   (à vos risques)
 *
 * Code de sortie 0 si la rafale parallèle est freinée, 1 sinon.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const AUTORISE_LIVE = args.includes('--live');
const BASE = (args.find((a) => !a.startsWith('--')) || process.env.BASE_URL || '')
  .replace(/\/$/, '');

if (!BASE) {
  console.error('Usage : node scripts/check-rate-limit.mjs <url-du-site> [--live]');
  process.exit(2);
}

/** Nombre d'appels par rafale. Au-delà du plafond applicatif (10) pour que le manque se voie. */
const N = 30;
const CHEMIN = '/api/checkout';

/**
 * Panier d'essai construit depuis le VRAI catalogue : un slug inventé serait
 * rejeté en 400 et le script testerait la validation, pas la limite de débit.
 * @returns {Promise<string>} corps JSON à envoyer
 */
async function corpsDEssai() {
  const src = await readFile(join(__dirname, '..', 'src', 'data', 'products.ts'), 'utf8');
  // Les deux styles de guillemets sont acceptés : le fichier utilise des
  // guillemets doubles, mais une reformatation ne doit pas casser ce script.
  // La première occurrence est `slug: string;` dans le type — on l'écarte en
  // exigeant une valeur entre guillemets.
  const slug = src.match(/slug:\s*["']([^"']+)["']/)?.[1];
  if (!slug) throw new Error("aucun slug trouvé dans src/data/products.ts");
  console.log(`Panier d'essai : ${slug} ×1`);
  return JSON.stringify({ items: [{ slug, qty: 1 }] });
}

/**
 * Un appel à /api/checkout.
 * @param {string} corps
 * @returns {Promise<{code: number, live: boolean, retryAfter: string}>}
 */
async function appel(corps) {
  try {
    const res = await fetch(BASE + CHEMIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: BASE },
      body: corps,
    });
    const txt = await res.text();
    return {
      code: res.status,
      live: txt.includes('cs_live_'),
      retryAfter: res.headers.get('retry-after') || '',
    };
  } catch (e) {
    return { code: 0, live: false, retryAfter: '' };
  }
}

/**
 * @param {string} titre
 * @param {{code: number, retryAfter: string}[]} r
 */
function resume(titre, r) {
  const passes = r.filter((x) => x.code === 200).length;
  const bloques = r.filter((x) => x.code === 429).length;
  const autres = r.filter((x) => x.code !== 200 && x.code !== 429).map((x) => x.code);
  console.log(`\n── ${titre} ──`);
  console.log(`   passés (session créée) : ${passes}`);
  console.log(`   bloqués (429)          : ${bloques}`);
  if (autres.length) console.log(`   autres codes           : ${autres.join(', ')}`);
  const ra = [...new Set(r.map((x) => x.retryAfter).filter(Boolean))];
  if (ra.length) console.log(`   Retry-After            : ${ra.join(', ')} s`);
  return { passes, bloques };
}

const corps = await corpsDEssai();
console.log(`Cible : ${BASE}${CHEMIN}`);

// Garde-fou : un seul appel pour savoir si on parle à une boutique en vrai.
const sonde = await appel(corps);
if (sonde.live && !AUTORISE_LIVE) {
  console.error(
    `\n⛔ ARRÊT : le site répond une session Stripe LIVE (cs_live_…).\n` +
      `   Une rafale de ${N} appels épuiserait le budget d'API Stripe du compte et\n` +
      `   empêcherait vos clients de payer. Relancez avec --live si c'est voulu,\n` +
      `   idéalement hors des heures de commande.`
  );
  process.exit(2);
}

// 1) Rafale parallèle : le cas réaliste. C'est celui qui doit être freiné.
const paralleles = await Promise.all(Array.from({ length: N }, () => appel(corps)));
const rP = resume(`RAFALE PARALLÈLE — ${N} appels simultanés`, paralleles);

// 2) Rafale séquentielle : le cas facile, que le limiteur applicatif traite déjà.
//    On attend que la fenêtre de 60 s se referme pour ne pas mesurer les restes.
console.log(`\n(attente de 65 s : la fenêtre du limiteur applicatif est de 60 s…)`);
await new Promise((r) => setTimeout(r, 65_000));

const sequentielles = [];
for (let i = 0; i < N; i++) sequentielles.push(await appel(corps));
const rS = resume(`RAFALE SÉQUENTIELLE — ${N} appels l'un après l'autre`, sequentielles);

console.log(`\n═══ VERDICT ═══`);
console.log(`  parallèle  : ${rP.passes} passés / ${rP.bloques} bloqués`);
console.log(`  séquentiel : ${rS.passes} passés / ${rS.bloques} bloqués`);

if (rP.bloques === 0) {
  console.error(
    `\n❌ La rafale PARALLÈLE n'est pas freinée : aucun 429 sur ${N} appels simultanés.\n` +
      `   Le limiteur applicatif compte par instance de fonction, il ne peut pas voir\n` +
      `   cette rafale. Il faut la règle de rate limiting du pare-feu Vercel :\n` +
      `   docs/audit/rapport-pre-bascule-2026-07-29.md, section « Le mur ».`
  );
  process.exit(1);
}

console.log(`\n✅ La rafale parallèle est freinée (${rP.bloques} appels bloqués sur ${N}).`);
