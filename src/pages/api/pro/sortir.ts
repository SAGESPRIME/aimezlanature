import type { APIRoute } from 'astro';
import { fermerSession } from '../../../lib/pro';

export const prerender = false;

/** Déconnexion de l'espace revendeurs. */
export const POST: APIRoute = async ({ cookies }) => {
  fermerSession(cookies);
  return new Response(null, { status: 303, headers: { Location: '/pro/connexion/?sortie=1' } });
};
