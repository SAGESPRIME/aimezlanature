import type { APIRoute } from 'astro';
// Route à la demande (prerender = false), servie par server.mjs.
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook';
import { planificateurDuSite } from '../../lib/reconstruction';

export const prerender = false;

/**
 * Webhook Sanity → reconstruction du site (voir src/lib/reconstruction.ts).
 *
 * Sanity appelle cette adresse à chaque publication. La requête est SIGNÉE avec
 * un secret partagé (SANITY_WEBHOOK_SECRET) : sans signature valide, rien ne
 * se passe. Même valide, la requête ne fait que demander une reconstruction —
 * elle ne transporte aucune donnée utilisée par le site (le contenu est relu
 * dans Sanity par le build lui-même).
 *
 * Réponse immédiate (202) : Sanity n'attend jamais la fin d'un build.
 * Pas de limite de débit ici : Sanity rejoue les livraisons en échec, et une
 * requête non signée est rejetée avant tout travail.
 */

/** Ancienneté maximale d'un message signé, contre le rejeu d'un vieux message. */
const TOLERANCE_MS = 5 * 60 * 1000;

const json = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  const planificateur = planificateurDuSite();
  if (!secret || !planificateur) {
    console.error('[reconstruction] non configurée (SANITY_WEBHOOK_SECRET ou COOLIFY_* absent).');
    return json({ error: 'Reconstruction non configurée.' }, 503);
  }

  // Corps BRUT : la signature porte sur ces octets exacts.
  const corps = await request.text();
  const signature = request.headers.get(SIGNATURE_HEADER_NAME) ?? '';
  const horodatage = Number(signature.match(/^t=(\d+)/)?.[1]);

  let valide = false;
  try {
    valide =
      Number.isFinite(horodatage) &&
      Math.abs(Date.now() - horodatage) <= TOLERANCE_MS &&
      (await isValidSignature(corps, signature, secret));
  } catch {
    valide = false;
  }
  if (!valide) return json({ error: 'Signature invalide.' }, 401);

  planificateur.signaler();
  return json({ recu: true }, 202);
};
