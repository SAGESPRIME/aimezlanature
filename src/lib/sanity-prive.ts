/**
 * Client Sanity AVEC jeton d'écriture, côté serveur uniquement.
 *
 * Sert aux documents privés créés par le site (identifiant à point, illisibles
 * sans jeton) : candidatures revendeurs (src/lib/pro.ts) et commandes
 * (src/lib/commandes.ts). Jamais importé par une page prérendue.
 *
 *   SANITY_WRITE_TOKEN  jeton Sanity « Editor »
 *   SANITY_PROJECT_ID / SANITY_DATASET
 */
import { createClient, type SanityClient } from '@sanity/client';

let client: SanityClient | null = null;

export function sanityPrive(): SanityClient | null {
  const token = process.env.SANITY_WRITE_TOKEN;
  const projectId = process.env.SANITY_PROJECT_ID;
  if (!token || !projectId) return null;
  client ??= createClient({
    projectId,
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2025-02-19',
    token,
    useCdn: false,
    perspective: 'published',
  });
  return client;
}

/**
 * Envois automatiques (liens revendeurs, emails d'expédition) : sur UN SEUL
 * environnement, sinon recette et prod enverraient chacune leur email.
 * PRO_INVITATIONS=1 est l'ancien nom de ce réglage, encore accepté.
 */
export const envoisAutomatiques = (): boolean =>
  process.env.ENVOIS_AUTOMATIQUES === '1' || process.env.PRO_INVITATIONS === '1';
