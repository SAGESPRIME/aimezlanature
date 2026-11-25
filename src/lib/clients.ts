/**
 * Fiches clients du Studio — mise à jour automatique à chaque commande payée.
 *
 * Appelé par le webhook Stripe juste après la fiche commande : crée la fiche
 * « clients.<empreinte de l'email> » si elle n'existe pas, puis ajoute la
 * commande (nombre, dépense, dates, ville).
 * Comptée UNE seule fois, même si Stripe rejoue l'événement après un
 * redémarrage : la fiche commande reçoit « compteeClient » dans la MÊME
 * transaction que la fiche client, protégée par sa révision (deux traitements
 * simultanés ne peuvent pas réussir tous les deux).
 * Échec Sanity → journal seulement : la commande reste dans Stripe, dans la
 * fiche commande et dans l'email au marchand.
 */
import { sanityPrive } from './sanity-prive';
import { majClientDepuisCommande } from '../data/client-doc.mjs';
import type { documentCommande } from '../data/commande-doc.mjs';

export async function majClient(commande: ReturnType<typeof documentCommande>): Promise<boolean> {
  const maj = majClientDepuisCommande(commande);
  if (!maj) return false;
  const sanity = sanityPrive();
  if (!sanity) {
    console.error('[clients] SANITY_WRITE_TOKEN absent : fiche client non mise à jour', commande._id);
    return false;
  }
  try {
    const fiche = await sanity.fetch<{ _rev: string; compteeClient?: boolean } | null>(
      '*[_id == $id][0]{_rev, compteeClient}',
      { id: commande._id }
    );
    if (!fiche) {
      console.error('[clients] fiche commande absente, client non mis à jour', commande._id);
      return false;
    }
    if (fiche.compteeClient) return true;
    await sanity
      .transaction()
      .patch(commande._id, (p) => p.ifRevisionId(fiche._rev).set({ compteeClient: true }))
      .createIfNotExists(maj.base)
      .patch(maj.base._id, (p) => p.setIfMissing(maj.setIfMissing).set(maj.set).inc(maj.inc))
      .commit();
    return true;
  } catch (e: any) {
    console.error('[clients] mise à jour refusée pour', commande._id, '-', e?.message ?? e);
    return false;
  }
}
