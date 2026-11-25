import type { APIRoute } from 'astro';
import { verifierJeton } from '../../../data/jeton-pro.mjs';
import { ouvrirSession, revendeur } from '../../../lib/pro';

export const prerender = false;

/**
 * Lien de connexion reçu par email → session revendeur (cookie signé) → /pro/.
 * Le statut est revérifié ici : un lien envoyé à un revendeur depuis suspendu
 * n'ouvre rien.
 */
export const GET: APIRoute = async ({ url, cookies }) => {
  const echec = new Response(null, { status: 303, headers: { Location: '/pro/connexion/?lien=invalide' } });
  const jeton = verifierJeton(url.searchParams.get('jeton'), process.env.PRO_SECRET, 'lien');
  if (!jeton) return echec;
  const r = await revendeur(jeton.id).catch(() => null);
  if (r?.statut !== 'valide') return echec;
  ouvrirSession(cookies, r._id);
  return new Response(null, { status: 303, headers: { Location: '/pro/', 'Cache-Control': 'no-store' } });
};
