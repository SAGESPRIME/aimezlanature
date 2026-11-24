/**
 * Commandes dans le Studio — côté serveur.
 *
 *   1. Paiement reçu (webhook Stripe) → fiche « commandes.<session> » dans
 *      Sanity, statut « À expédier » (privée : identifiant à point).
 *   2. Le marchand prépare le colis, passe la fiche à « Expédiée » et saisit
 *      le numéro Colissimo dans le Studio.
 *   3. Toutes les 5 minutes (server.mjs → /api/taches), le client de chaque
 *      commande expédiée avec un numéro de suivi reçoit son lien de suivi,
 *      une seule fois (date notée dans « suiviEnvoyeLe »).
 *
 * Variables : SANITY_WRITE_TOKEN (sanity-prive.ts) ; ENVOIS_AUTOMATIQUES=1 sur
 * un seul environnement pour l'étape 3.
 */
import { sanityPrive, envoisAutomatiques } from './sanity-prive';
import { envoyerEmail, EMAIL_MARCHAND } from './email';
import { lienSuivi, numeroSuiviPropre } from '../data/commande-doc.mjs';
import { sujetExpedition, texteExpedition, htmlExpedition } from '../data/email-commande';

/**
 * Enregistre la fiche (sans effet si elle existe déjà : rejeu Stripe).
 * Renvoie false si Sanity n'est pas configuré ou refuse — la commande reste
 * dans Stripe et dans l'email au marchand.
 */
export async function enregistrerCommande(doc: { _id: string; _type: string } & Record<string, unknown>): Promise<boolean> {
  const sanity = sanityPrive();
  if (!sanity) {
    console.error('[commandes] SANITY_WRITE_TOKEN absent : commande non enregistrée dans le Studio', doc._id);
    return false;
  }
  try {
    await sanity.createIfNotExists(doc);
    return true;
  } catch (e: any) {
    console.error('[commandes] enregistrement refusé pour', doc._id, '-', e?.message ?? e);
    return false;
  }
}

interface ACommuniquer {
  _id: string;
  numero: string;
  numeroSuivi?: string;
  client?: { nom?: string; email?: string };
  lignes?: { description: string; quantite: number }[];
}

/** Envoie le lien de suivi des commandes expédiées (au plus 20 par passage). */
export async function envoyerSuivis(): Promise<number> {
  const sanity = sanityPrive();
  if (!sanity || !envoisAutomatiques()) return 0;
  const aPrevenir = await sanity.fetch<ACommuniquer[]>(
    `*[_type == "commande" && _id in path("commandes.**") && statut == "expediee"
       && defined(numeroSuivi) && !defined(suiviEnvoyeLe)][0...20]{_id, numero, numeroSuivi, client, lignes}`
  );
  let envoyes = 0;
  for (const c of aPrevenir) {
    const numero = numeroSuiviPropre(c.numeroSuivi);
    if (!numero || !c.client?.email) {
      console.error(`[commandes] ${c.numero} : numéro de suivi invalide ou email absent, email non envoyé`);
      continue;
    }
    const e = {
      prenom: c.client.nom?.trim().split(/\s+/)[0],
      numeroCommande: c.numero,
      numeroSuivi: numero,
      lienSuivi: lienSuivi(numero),
      lignes: c.lignes ?? [],
    };
    const envoi = await envoyerEmail({
      to: c.client.email,
      replyTo: EMAIL_MARCHAND,
      subject: sujetExpedition(e),
      text: texteExpedition(e),
      html: htmlExpedition(e),
    });
    if (envoi.ok) {
      await sanity.patch(c._id).set({ suiviEnvoyeLe: new Date().toISOString() }).setIfMissing({ expedieeLe: new Date().toISOString() }).commit();
      envoyes++;
    } else {
      console.error(`[commandes] email d'expédition non envoyé pour ${c.numero}`);
    }
  }
  return envoyes;
}
