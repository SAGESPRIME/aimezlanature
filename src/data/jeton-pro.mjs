// @ts-check
/**
 * Jetons signés de l'espace revendeurs : lien de connexion (reçu par email)
 * et session (cookie). Module PUR, testé par tests/pro.test.mjs.
 *
 * Format : base64url(JSON) + "." + base64url(HMAC-SHA256). Le contenu n'est
 * pas secret (identifiant du revendeur, type, expiration) mais il est SIGNÉ :
 * impossible de le modifier ou d'en fabriquer un sans PRO_SECRET. Le statut du
 * revendeur est en plus revérifié dans Sanity à chaque usage : un revendeur
 * suspendu perd l'accès même avec un jeton encore valable.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

/** @param {string} texte */
const b64 = (texte) => Buffer.from(texte, 'utf8').toString('base64url');

/**
 * @param {string} corps
 * @param {string} secret
 */
const signature = (corps, secret) => createHmac('sha256', secret).update(corps).digest('base64url');

/**
 * @param {{ id: string, type: 'lien' | 'session' }} donnees
 * @param {string} secret
 * @param {number} dureeS durée de validité en secondes
 * @param {number} [maintenant]
 */
export function signerJeton(donnees, secret, dureeS, maintenant = Date.now()) {
  if (!secret || secret.length < 32) throw new Error('PRO_SECRET absent ou trop court (32 caractères minimum).');
  const corps = b64(JSON.stringify({ id: donnees.id, type: donnees.type, exp: Math.floor(maintenant / 1000) + dureeS }));
  return `${corps}.${signature(corps, secret)}`;
}

/**
 * @param {string | undefined | null} jeton
 * @param {string | undefined} secret
 * @param {'lien' | 'session'} typeAttendu
 * @param {number} [maintenant]
 * @returns {{ id: string } | null}
 */
export function verifierJeton(jeton, secret, typeAttendu, maintenant = Date.now()) {
  if (!jeton || !secret || secret.length < 32 || jeton.length > 1000) return null;
  const [corps, sig] = jeton.split('.');
  if (!corps || !sig) return null;
  const attendu = Buffer.from(signature(corps, secret));
  const recu = Buffer.from(sig);
  if (attendu.length !== recu.length || !timingSafeEqual(attendu, recu)) return null;
  try {
    const d = JSON.parse(Buffer.from(corps, 'base64url').toString('utf8'));
    if (d?.type !== typeAttendu || typeof d.id !== 'string' || !/^revendeurs\.[\w-]+$/.test(d.id)) return null;
    if (typeof d.exp !== 'number' || d.exp * 1000 < maintenant) return null;
    return { id: d.id };
  } catch {
    return null;
  }
}
