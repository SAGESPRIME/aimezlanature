/**
 * Fiche « commande » enregistrée dans Sanity à chaque paiement — logique pure.
 *
 * Utilisée par le webhook Stripe (src/pages/api/stripe-webhook.ts) et par
 * l'envoi des emails d'expédition (src/lib/commandes.ts). Sans dépendance :
 * testée par tests/commandes.test.mjs.
 *
 * L'identifiant « commandes.<id de session Stripe> » contient un POINT : le
 * document n'est lisible qu'avec un jeton, même dans un dataset public (les
 * coordonnées des clients restent privées), et un même paiement ne peut créer
 * qu'une seule fiche (createIfNotExists).
 */

import { idClient, refClient, normaliserEmail } from './client-doc.mjs';

/** Statuts de suivi, modifiés par le marchand dans le Studio. */
export const STATUTS_COMMANDE = ['a_expedier', 'expediee', 'annulee'];

/** @param {string} sessionId */
export function idCommande(sessionId) {
  if (!/^cs_[A-Za-z0-9_]{8,250}$/.test(String(sessionId))) throw new Error('Identifiant de session Stripe invalide.');
  return `commandes.${sessionId}`;
}

/** Numéro court lisible, ex. « ALN-QPXAYX9F » (fin de l'identifiant Stripe). */
export function numeroCommande(/** @type {string} */ sessionId) {
  return `ALN-${String(sessionId).slice(-8).toUpperCase()}`;
}

const euros = (/** @type {unknown} */ centimes) => Math.round(Number(centimes ?? 0)) / 100;

/**
 * Adresse de livraison ligne par ligne. Stripe l'a déplacée de
 * `shipping_details` vers `collected_information.shipping_details` : on lit
 * les deux.
 * @param {any} session
 * @returns {{ nom?: string, adresse?: string[] }}
 */
export function lireLivraison(session) {
  const livraison = session?.collected_information?.shipping_details ?? session?.shipping_details;
  const a = livraison?.address;
  if (!a) return {};
  const lignes = [a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(' '), a.state, a.country]
    .map((l) => (typeof l === 'string' ? l.trim() : ''))
    .filter((l) => l.length > 0);
  return { nom: livraison?.name ?? undefined, adresse: lignes.length > 0 ? lignes : undefined };
}

/**
 * Document Sanity d'une commande payée.
 * @param {any} session  objet `checkout.session` de l'événement Stripe (signé)
 * @param {{ description: string, quantite: number, montant: number }[]} articles  lignes Stripe (centimes)
 */
export function documentCommande(session, articles) {
  const livraison = lireLivraison(session);
  const fraisLivraison = session?.total_details?.amount_shipping ?? session?.shipping_cost?.amount_total ?? 0;
  const paiement = typeof session?.payment_intent === 'string' ? session.payment_intent : session?.payment_intent?.id;
  const test = session?.livemode === false;
  return {
    _id: idCommande(session?.id),
    _type: 'commande',
    numero: numeroCommande(session.id),
    date: new Date((Number(session?.created) || Date.now() / 1000) * 1000).toISOString(),
    statut: 'a_expedier',
    source: session?.metadata?.revendeur ? 'revendeur' : 'client',
    revendeurId: session?.metadata?.revendeur || undefined,
    modeTest: test,
    ficheClient: normaliserEmail(session?.customer_details?.email)
      ? refClient(idClient(session.customer_details.email, { test }))
      : undefined,
    client: {
      nom: session?.customer_details?.name ?? livraison.nom ?? undefined,
      email: session?.customer_details?.email ?? undefined,
      telephone: session?.customer_details?.phone ?? undefined,
    },
    livraison: { nom: livraison.nom, adresse: livraison.adresse },
    lignes: articles.map((a, i) => ({
      _key: `l${i}`,
      description: a.description,
      quantite: a.quantite,
      total: euros(a.montant),
    })),
    sousTotal: euros(session?.amount_subtotal),
    fraisLivraison: euros(fraisLivraison),
    total: euros(session?.amount_total),
    stripeSession: session.id,
    stripePaiement: paiement ?? undefined,
    lienStripe: paiement ? `https://dashboard.stripe.com/${test ? 'test/' : ''}payments/${paiement}` : undefined,
  };
}

/**
 * Numéro de suivi Colissimo nettoyé (espaces retirés, majuscules), ou null
 * s'il n'en a pas la forme (lettres et chiffres, 10 à 20 caractères).
 * @param {unknown} numero
 */
export function numeroSuiviPropre(numero) {
  const n = String(numero ?? '').replace(/\s+/g, '').toUpperCase();
  return /^[A-Z0-9]{10,20}$/.test(n) ? n : null;
}

/** Page publique de suivi La Poste / Colissimo pour ce numéro. */
export function lienSuivi(/** @type {string} */ numero) {
  return `https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(numero)}`;
}
