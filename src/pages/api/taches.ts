import type { APIRoute } from 'astro';
import { createHash, timingSafeEqual } from 'node:crypto';
import { envoyerInvitations } from '../../lib/pro';
import { envoyerSuivis } from '../../lib/commandes';

export const prerender = false;

/**
 * Envois automatiques, appelés toutes les 5 minutes par server.mjs (en
 * interne, avec PRO_SECRET dans l'en-tête x-aln-interne) — jamais par un
 * visiteur (404 sinon) :
 *   - liens de connexion des revendeurs que le marchand vient de valider ;
 *   - emails « votre colis est en route » des commandes passées à
 *     « Expédiée » avec un numéro Colissimo.
 */
const empreinte = (v: string) => createHash('sha256').update(v).digest();

export const POST: APIRoute = async ({ request }) => {
  const secret = process.env.PRO_SECRET ?? '';
  const recu = request.headers.get('x-aln-interne') ?? '';
  if (secret.length < 32 || !timingSafeEqual(empreinte(recu), empreinte(secret))) {
    return new Response(null, { status: 404 });
  }
  const resultat: Record<string, number | string> = {};
  // Chaque tâche indépendamment : une panne de l'une ne bloque pas l'autre.
  for (const [nom, tache] of [['liens', envoyerInvitations], ['suivis', envoyerSuivis]] as const) {
    try {
      resultat[nom] = await tache();
    } catch (e: any) {
      console.error(`[taches] ${nom} :`, e?.message ?? e);
      resultat[nom] = 'échec';
    }
  }
  return new Response(JSON.stringify(resultat), { headers: { 'Content-Type': 'application/json' } });
};
