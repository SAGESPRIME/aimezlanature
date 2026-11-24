import type { APIRoute } from 'astro';
import { createHash, timingSafeEqual } from 'node:crypto';
import { envoyerInvitations } from '../../../lib/pro';

export const prerender = false;

/**
 * Envoi des liens de connexion aux revendeurs que le marchand vient de valider.
 * Appelé toutes les 5 minutes par server.mjs (en interne, avec PRO_SECRET dans
 * l'en-tête x-aln-interne) — jamais par un visiteur.
 */
const empreinte = (v: string) => createHash('sha256').update(v).digest();

export const POST: APIRoute = async ({ request }) => {
  const secret = process.env.PRO_SECRET ?? '';
  const recu = request.headers.get('x-aln-interne') ?? '';
  if (secret.length < 32 || !timingSafeEqual(empreinte(recu), empreinte(secret))) {
    return new Response(null, { status: 404 });
  }
  try {
    const envoyes = await envoyerInvitations();
    return new Response(JSON.stringify({ envoyes }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('[pro] invitations :', e?.message ?? e);
    return new Response(JSON.stringify({ error: 'échec' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
};
