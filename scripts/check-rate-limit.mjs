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
 * Depuis la migration sur le VPS (un seul processus Node), le limiteur
 * applicatif voit toute la rafale : ce script doit passer au VERT sur la recette
 * Coolify. Il rejoue aussi une rafale où chaque appel annonce une IP différente
 * dans `X-Forwarded-For`, `X-Real-IP` ET `CF-Connecting-IP` : elle doit être
 * freinée de la même façon, sinon un attaquant contournerait la limite en
 * mentant sur son adresse. `X-Real-IP` est l'en-tête que le serveur CROIT
 * derrière Traefik : jusqu'à l'audit du 2026-11-24, le script ne falsifiait
 * que `X-Forwarded-For`, et n'aurait pas vu un proxy qui laisse passer la
 * valeur envoyée par le client.
 *
 * ⚠️ Lancer depuis une machine qui sort par UNE seule IP (poste, CI). Derrière
 * un proxy qui répartit les connexions simultanées sur plusieurs IP (ex.
 * l'environnement cloud de Claude), les rafales parallèles semblent « non
 * freinées » à tort — voir tasks/lessons.md (2026-11-23) pour la contre-épreuve
 * sur une seule connexion.
 *
 * ⚠️ Chaque appel autorisé crée une VRAIE session Stripe Checkout. Le script
 * refuse donc de tourner si le site répond en mode live, sauf `--live` explicite :
 * une rafale sur une boutique en production épuiserait le budget d'API Stripe du
 * compte, et les vrais clients ne pourraient plus payer pendant ce temps.
 *
 * Usage :
 *   node scripts/check-rate-limit.mjs https://recette.aimezlanature.fr
 *   node scripts/check-rate-limit.mjs http://127.0.0.1:4321
 *   node scripts/check-rate-limit.mjs https://aimezlanature.fr --live   (à vos risques)
 *
 * Code de sortie 0 si la rafale parallèle est freinée, 1 sinon.
 */


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
 * Panier d'essai construit depuis le VRAI catalogue, lu sur le site lui-même
 * (bloc `<script id="catalogue">` du panier) : un slug inventé serait rejeté
 * en 400 et le script testerait la validation, pas la limite de débit. Lire le
 * site plutôt que le code source garde le script juste quand les produits
 * viennent du CMS.
 * @returns {Promise<string>} corps JSON à envoyer
 */
async function corpsDEssai() {
  const html = await (await fetch(BASE + '/panier/')).text();
  const json = html.match(/<script type="application\/json" id="catalogue">([\s\S]*?)<\/script>/)?.[1];
  const slug = json ? JSON.parse(json).products?.[0]?.slug : undefined;
  if (!slug) throw new Error(`aucun produit trouvé dans le catalogue de ${BASE}/panier/`);
  console.log(`Panier d'essai : ${slug} ×1`);
  return JSON.stringify({ items: [{ slug, qty: 1 }] });
}

/**
 * Un appel à /api/checkout.
 * @param {string} corps
 * @param {string} [ipMensongere] IP à annoncer dans tous les en-têtes d'IP usuels
 * @returns {Promise<{code: number, live: boolean, retryAfter: string}>}
 */
async function appel(corps, ipMensongere = '') {
  try {
    /** @type {Record<string, string>} */
    const entetes = { 'Content-Type': 'application/json', Origin: BASE };
    if (ipMensongere) {
      entetes['X-Forwarded-For'] = ipMensongere;
      entetes['X-Real-IP'] = ipMensongere;
      entetes['CF-Connecting-IP'] = ipMensongere;
    }
    const res = await fetch(BASE + CHEMIN, {
      method: 'POST',
      headers: entetes,
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

// 3) Rafale parallèle avec une fausse IP différente à chaque appel.
console.log(`\n(attente de 65 s avant la rafale à IP falsifiées…)`);
await new Promise((r) => setTimeout(r, 65_000));
const falsifiees = await Promise.all(
  Array.from({ length: N }, (_, i) => appel(corps, `203.0.113.${i + 1}`))
);
const rF = resume(`RAFALE PARALLÈLE, X-Forwarded-For / X-Real-IP / CF-Connecting-IP falsifiés`, falsifiees);

console.log(`\n═══ VERDICT ═══`);
console.log(`  parallèle          : ${rP.passes} passés / ${rP.bloques} bloqués`);
console.log(`  séquentiel         : ${rS.passes} passés / ${rS.bloques} bloqués`);
console.log(`  IP falsifiées      : ${rF.passes} passés / ${rF.bloques} bloqués`);

let echec = false;
if (rP.bloques === 0) {
  echec = true;
  console.error(
    `\n❌ La rafale PARALLÈLE n'est pas freinée : aucun 429 sur ${N} appels simultanés.\n` +
      `   Plusieurs répliques du conteneur tournent-elles ? Le compteur est en mémoire :\n` +
      `   il faut UNE seule réplique (voir src/lib/rateLimit.ts).`
  );
}
if (rF.bloques === 0) {
  echec = true;
  console.error(
    `\n❌ Les fausses IP contournent la limite : le serveur lit une adresse que le\n` +
      `   client choisit. Vérifier CLIENT_IP_HEADER (x-real-ip derrière Traefik,\n` +
      `   cf-connecting-ip derrière Cloudflare) et la config forwardedHeaders de Traefik.`
  );
}
if (echec) process.exit(1);

console.log(`\n✅ Rafales freinées : ${rP.bloques}/${N} en parallèle, ${rF.bloques}/${N} avec IP falsifiées.`);
