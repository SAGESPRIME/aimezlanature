// @ts-check
/**
 * Adresse IP du client : quelle source croire, et sous quelle clé la compter.
 *
 * Module PUR (aucune dépendance), partagé par server.mjs — qui décide de l'IP —
 * et par src/lib/rateLimit.ts — qui compte les appels. Testé par
 * tests/ip-client.test.mjs.
 *
 * ── POURQUOI UNE VÉRIFICATION DU PAIR ─────────────────────────────────────
 * Derrière Traefik, l'IP réelle arrive dans un en-tête (X-Real-IP). Mais un
 * en-tête, n'importe qui peut l'écrire : si une requête atteignait le serveur
 * SANS passer par Traefik (port publié sur l'hôte, proxy mal configuré), le
 * client choisirait librement l'IP sous laquelle il est compté, et
 * contournerait la limite anti-abus (audit de sécurité du 2026-11-24, piste
 * « client-ip-header-trusted-without-peer-check »).
 *
 * Règle : l'en-tête n'est cru QUE si la connexion TCP vient d'une adresse
 * privée — Traefik et le contrôle de santé sont dans le réseau Docker ou sur
 * la boucle locale. Une connexion venant d'Internet est comptée sous sa propre
 * adresse, que personne ne peut falsifier.
 *
 * ── POURQUOI REGROUPER L'IPv6 PAR /64 ─────────────────────────────────────
 * Un abonnement Internet reçoit en général un bloc IPv6 /64 entier : 2^64
 * adresses. Compter chaque adresse à part donnerait à une seule machine un
 * quota quasi illimité. On compte donc par /64, comme on compte une IPv4.
 */

/**
 * Ramène une adresse IPv4 « mappée » (::ffff:10.0.0.1) à sa forme IPv4.
 * @param {string} ip
 */
function sansMappage(ip) {
  const m = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  return m ? m[1] : ip;
}

/**
 * Retire les crochets et la zone (fe80::1%eth0) d'une adresse IPv6.
 * @param {string | undefined | null} ip
 */
function nettoyer(ip) {
  return sansMappage(String(ip ?? '').trim().replace(/^\[|\]$/g, '').replace(/%.*$/, ''));
}

/** @param {string} ip */
function octetsIPv4(ip) {
  const p = ip.split('.');
  if (p.length !== 4) return null;
  const n = p.map((x) => (/^\d{1,3}$/.test(x) ? Number(x) : NaN));
  return n.every((x) => x >= 0 && x <= 255) ? n : null;
}

/**
 * Développe une IPv6 en 8 groupes de 16 bits, ou null si invalide.
 * @param {string} ip
 * @returns {number[] | null}
 */
function groupesIPv6(ip) {
  if (!ip.includes(':')) return null;
  let s = ip.toLowerCase();
  // IPv4 en fin d'adresse (::ffff:1.2.3.4 non mappé, 64:ff9b::1.2.3.4…)
  const v4 = /(\d{1,3}(?:\.\d{1,3}){3})$/.exec(s);
  if (v4) {
    const o = octetsIPv4(v4[1]);
    if (!o) return null;
    s = s.slice(0, v4.index) + `${((o[0] << 8) | o[1]).toString(16)}:${((o[2] << 8) | o[3]).toString(16)}`;
  }
  const parties = s.split('::');
  if (parties.length > 2) return null;
  const tete = parties[0] ? parties[0].split(':') : [];
  const queue = parties.length === 2 && parties[1] ? parties[1].split(':') : [];
  const manquants = 8 - tete.length - queue.length;
  if (parties.length === 1 ? manquants !== 0 : manquants < 1) return null;
  const tous = [...tete, ...Array(parties.length === 2 ? manquants : 0).fill('0'), ...queue];
  const g = tous.map((x) => (/^[0-9a-f]{1,4}$/.test(x) ? parseInt(x, 16) : NaN));
  return g.length === 8 && g.every((x) => !Number.isNaN(x)) ? g : null;
}

/**
 * Vrai si l'adresse est privée ou locale : boucle, réseaux privés RFC 1918,
 * adresses uniques locales IPv6 (fc00::/7), lien local. Ce sont les seules
 * d'où peut venir Traefik (réseau Docker) ou le contrôle de santé.
 * @param {string | undefined | null} brute
 */
export function adressePrivee(brute) {
  const ip = nettoyer(brute);
  const v4 = octetsIPv4(ip);
  if (v4) {
    const [a, b] = v4;
    return a === 127 || a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
  }
  const g = groupesIPv6(ip);
  if (!g) return false;
  const boucle = g.slice(0, 7).every((x) => x === 0) && g[7] === 1;
  return boucle || (g[0] & 0xfe00) === 0xfc00 || (g[0] & 0xffc0) === 0xfe80;
}

/**
 * IP de confiance du client.
 *
 * @param {object} p
 * @param {string} p.source   « socket » ou nom d'en-tête en minuscules (x-real-ip…)
 * @param {string | string[] | undefined} p.enTete  valeur de cet en-tête
 * @param {string | undefined} p.pair   adresse TCP de la connexion (req.socket.remoteAddress)
 * @returns {string} jamais vide si le pair est connu
 */
export function ipClient({ source, enTete, pair }) {
  const adressePair = nettoyer(pair);
  if (source === 'socket' || !adressePrivee(adressePair)) return adressePair;
  // Si un proxy y concatène plusieurs adresses, la DERNIÈRE est celle qu'il a vue.
  const brut = Array.isArray(enTete) ? enTete.at(-1) : enTete;
  const valeur = nettoyer(String(brut ?? '').split(',').pop());
  return valeur || adressePair;
}

/**
 * Clé de comptage : l'IPv4 telle quelle, l'IPv6 réduite à son préfixe /64.
 * Une valeur illisible est comptée telle quelle (elle reste un seul compteur).
 * @param {string} brute
 */
export function cleDeLimite(brute) {
  const ip = nettoyer(brute);
  if (octetsIPv4(ip)) return ip;
  const g = groupesIPv6(ip);
  if (!g) return ip;
  return `${g.slice(0, 4).map((x) => x.toString(16)).join(':')}::/64`;
}
