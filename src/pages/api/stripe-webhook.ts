import type { APIRoute } from 'astro';
// Route à la demande (prerender = false), servie par server.mjs : les secrets
// sont lus dans process.env (variables d'environnement Coolify).
import { verifierSignature } from '../../lib/stripe-signature';
import { envoyerEmail, EMAIL_MARCHAND } from '../../lib/email';
import { reserver, marquerFait, liberer, enCours, etapeFaite, noterEtape } from '../../lib/evenements-traites';
import { MARQUE_SESSION } from '../../lib/marque-stripe';
import { enregistrerCommande } from '../../lib/commandes';
import { majClient } from '../../lib/clients';
import { documentCommande, lireLivraison, numeroCommande } from '../../data/commande-doc.mjs';
import {
  sujetCommande,
  texteCommande,
  htmlCommande,
  sujetMarchand,
  texteMarchand,
  htmlMarchand,
  type LigneCommande,
} from '../../data/email-commande';

// Route exécutée à la demande : le reste du site reste statique.
export const prerender = false;

/**
 * Réception des événements de paiement Stripe.
 *
 * POURQUOI ICI ET PAS DANS api/checkout.ts
 * `checkout.ts` s'exécute quand le client CLIQUE sur payer — une bonne part
 * abandonne ensuite sur la page bancaire. Seul ce webhook sait que l'argent
 * est réellement arrivé. Envoyer la confirmation depuis checkout.ts
 * remercierait des gens qui n'ont rien acheté.
 *
 * ORDRE DES OPÉRATIONS ET DOUBLONS
 * Stripe rejoue un événement tant qu'il ne reçoit pas de réponse 2xx. On
 * répond donc 200 dès que l'email est parti, et 500 si quoi que ce soit a
 * échoué avant. L'email étant la DERNIÈRE action, un rejeu ne peut pas en
 * envoyer deux : soit le premier essai a échoué avant l'envoi (rien n'est
 * parti), soit il a réussi et Stripe ne rejoue pas.
 */

/**
 * Événements qui signifient « l'argent est arrivé ».
 *
 * - `checkout.session.completed` : paiement immédiat (carte, Apple Pay…).
 * - `checkout.session.async_payment_succeeded` : paiement DIFFÉRÉ confirmé
 *   plus tard (prélèvement SEPA, virement…). Sans lui, une commande payée par
 *   un moyen différé n'aurait déclenché AUCUN email, ni au client ni au
 *   marchand : la session arrive d'abord `completed` mais `unpaid`, puis cet
 *   événement arrive quand l'argent est encaissé.
 *
 * Les autres événements sont acquittés sans rien faire.
 */
const EVENEMENTS_PAYES = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
]);

/** Paiement différé finalement refusé : rien à expédier, on le trace. */
const EVENEMENT_ECHEC_DIFFERE = 'checkout.session.async_payment_failed';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/**
 * Récupère les articles de la commande.
 *
 * L'événement ne les contient pas : Stripe impose un appel séparé. On lit les
 * descriptions telles que Stripe les a enregistrées à la création de la
 * session — elles viennent déjà de products.ts, jamais du navigateur.
 */
async function lireArticles(sessionId: string, cle: string): Promise<LigneCommande[] | null> {
  try {
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}/line_items?limit=100`,
      { headers: { Authorization: `Bearer ${cle}` }, signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) {
      console.error('Stripe (articles):', res.status, await res.text());
      return null;
    }
    const data: any = await res.json();
    if (!Array.isArray(data?.data)) return null;
    return data.data.map((article: any) => ({
      description: String(article?.description ?? 'Article'),
      quantite: Number(article?.quantity ?? 1),
      montant: Number(article?.amount_total ?? 0),
    }));
  } catch (e) {
    console.error('Stripe injoignable (articles):', e);
    return null;
  }
}

export const POST: APIRoute = async ({ request }) => {
  const secret: string | undefined = process.env.STRIPE_WEBHOOK_SECRET;
  const cleStripe: string | undefined = process.env.STRIPE_SECRET_KEY;

  if (!secret || !cleStripe) {
    console.error('STRIPE_WEBHOOK_SECRET ou STRIPE_SECRET_KEY absente : webhook inopérant.');
    // 500 : Stripe réessaiera, et l'événement ne sera pas perdu si la
    // configuration est complétée dans les heures qui suivent.
    return json({ error: 'Webhook non configuré.' }, 500);
  }

  // Corps BRUT, avant toute analyse : la signature porte sur ces octets exacts.
  // La lecture échoue au-delà de `bodySizeLimit` (astro.config.mjs).
  let corpsBrut: string;
  try {
    corpsBrut = await request.text();
  } catch {
    return json({ error: 'Requête trop volumineuse.' }, 413);
  }

  const verdict = await verifierSignature(corpsBrut, request.headers.get('stripe-signature'), secret);
  if (!verdict.valide) {
    // 400 et non 500 : la requête est illégitime, Stripe ne doit pas la rejouer.
    // Le détail reste dans les logs, la réponse n'apprend rien à un attaquant.
    console.error('Signature Stripe refusée:', verdict.raison);
    return json({ error: 'Signature invalide.' }, 400);
  }

  let evenement: any;
  try {
    evenement = JSON.parse(corpsBrut);
  } catch {
    return json({ error: 'Corps illisible.' }, 400);
  }

  // Tout autre événement est acquitté sans traitement : renvoyer une erreur
  // ferait rejouer Stripe indéfiniment pour rien, et il finirait par
  // désactiver l'endpoint.
  if (evenement?.type === EVENEMENT_ECHEC_DIFFERE) {
    console.warn('Paiement différé refusé pour la session', evenement?.data?.object?.id);
    return json({ recu: true, ignore: 'paiement différé refusé' });
  }
  if (!EVENEMENTS_PAYES.has(evenement?.type)) {
    return json({ recu: true, ignore: evenement?.type ?? 'inconnu' });
  }

  const session = evenement?.data?.object;

  // Événement d'un autre MODE que la clé du serveur (test reçu par la prod ou
  // l'inverse) : la session est introuvable avec cette clé, la lecture des
  // articles échouerait et Stripe rejouerait pour rien pendant trois jours.
  const cleEnLigne = /^(sk|rk)_live_/.test(cleStripe);
  if (typeof evenement?.livemode === 'boolean' && evenement.livemode !== cleEnLigne) {
    console.warn('Événement Stripe ignoré : mode', evenement.livemode ? 'live' : 'test', 'différent de la clé.');
    return json({ recu: true, ignore: 'mode différent' });
  }

  // Session créée par CE site ? /api/checkout pose la marque `metadata.source`.
  // Une session sans marque (lien de paiement, facture, autre outil branché
  // sur le même compte Stripe) déclencherait sinon un email « commande
  // confirmée » du site. TRANSITOIRE : on ne fait que le signaler, pour ne pas
  // perdre les commandes en cours au moment de la bascule (sessions créées par
  // l'ancien site, valables 24 h). À passer en refus un mois après le jour J
  // (tasks/todo.md).
  if (session?.metadata?.source !== MARQUE_SESSION) {
    console.warn('Session Stripe sans marque du site :', session?.id);
  }

  // Une session peut être « complète » sans être payée (paiement différé) :
  // l'email partira alors à la réception de `async_payment_succeeded`.
  if (session?.payment_status !== 'paid') {
    return json({ recu: true, ignore: 'paiement non abouti' });
  }

  // Anti-doublon : Stripe peut livrer deux fois le même événement.
  const idEvenement = String(evenement?.id ?? '');
  if (idEvenement && !reserver(idEvenement)) {
    // Encore EN COURS (Stripe a relancé avant notre réponse) : surtout pas de
    // 200, sinon Stripe tiendrait l'événement pour livré alors que le premier
    // essai peut encore échouer — et la confirmation serait perdue. 409 :
    // Stripe réessaiera plus tard (ré-audit du 2026-11-24).
    if (enCours(idEvenement)) return json({ error: 'Traitement en cours.' }, 409);
    return json({ recu: true, ignore: 'déjà traité' });
  }
  try {
    const reponse = await traiterCommande(session, cleStripe);
    if (idEvenement) {
      if (reponse.ok) marquerFait(idEvenement);
      else liberer(idEvenement);
    }
    return reponse;
  } catch (e) {
    if (idEvenement) liberer(idEvenement);
    throw e;
  }
};

/** Envoie les emails d'une commande payée. Renvoie la réponse à faire à Stripe. */
async function traiterCommande(session: any, cleStripe: string): Promise<Response> {

  const email: string | undefined = session?.customer_details?.email;
  if (!email) {
    // Sans adresse, rien à envoyer. On acquitte : ce n'est pas une panne.
    console.error('Session payée sans email client:', session?.id);
    return json({ recu: true, ignore: 'email absent' });
  }

  const articles = await lireArticles(String(session.id), cleStripe);
  if (articles === null) {
    // Échec temporaire côté Stripe : on laisse rejouer, aucun email n'est parti.
    return json({ error: 'Articles illisibles.' }, 500);
  }

  // Prénom seul : « Bonjour Marie » est plus juste que « Bonjour Marie Dupont ».
  const nomFacturation: string | undefined = session?.customer_details?.name ?? undefined;
  const livraison = lireLivraison(session);
  const nomComplet = livraison.nom ?? nomFacturation;
  const prenom = nomComplet?.trim().split(/\s+/)[0];

  const commande = {
    lignes: articles,
    total: Number(session?.amount_total ?? 0),
    nom: prenom,
    nomComplet,
    email,
    telephone: session?.customer_details?.phone ?? undefined,
    adresse: livraison.adresse,
    reference: String(session.id),
    revendeur: Boolean(session?.metadata?.revendeur),
    numero: numeroCommande(String(session.id)),
  };

  // ── 0. La fiche « Commandes » du Studio (statut « À expédier ») ────────
  // createIfNotExists : un rejeu ne crée pas de doublon. Un échec n'arrête
  // rien (journal seulement) : la commande reste dans Stripe et dans l'email
  // au marchand.
  const cleFiche = `fiche:${session.id}`;
  if (!etapeFaite(cleFiche)) {
    let fiche: ReturnType<typeof documentCommande> | null = null;
    try {
      fiche = documentCommande(session, articles);
    } catch (e: any) {
      console.error('[commandes] fiche impossible pour', session.id, '-', e?.message ?? e);
    }
    if (fiche && (await enregistrerCommande(fiche))) noterEtape(cleFiche);
  }

  // ── 0 bis. La fiche « Clients » (créée ou complétée) ──────────────────
  // Notée comme faite pour ne pas compter deux fois la commande si Stripe
  // rejoue l'événement. Échec → journal seulement.
  const cleClient = `client:${session.id}`;
  if (!etapeFaite(cleClient)) {
    try {
      if (await majClient(documentCommande(session, articles))) noterEtape(cleClient);
    } catch (e: any) {
      console.error('[clients] fiche client impossible pour', session.id, '-', e?.message ?? e);
    }
  }

  // ── 1. Le marchand, pour qu'il prépare le colis ────────────────────────
  // Un échec ici n'interrompt PAS le traitement et ne renvoie pas d'erreur :
  // sinon Stripe rejouerait et le client recevrait deux confirmations. La
  // commande reste de toute façon visible dans le tableau de bord Stripe,
  // et l'incident est tracé dans les logs. Une fois partie, la notification
  // n'est plus renvoyée lors des rejeux (voir `etapeFaite`).
  const cleMarchand = `marchand:${session.id}`;
  if (!etapeFaite(cleMarchand)) {
    const versMarchand = await envoyerEmail({
      to: EMAIL_MARCHAND,
      replyTo: email,
      subject: sujetMarchand(commande),
      text: texteMarchand(commande),
      html: htmlMarchand(commande),
    });
    if (versMarchand.ok) {
      noterEtape(cleMarchand);
    } else {
      console.error(
        'Notification marchand NON envoyée pour la session',
        session.id,
        '- raison:',
        versMarchand.raison
      );
    }
  }

  // ── 2. Le client, en DERNIER ───────────────────────────────────────────
  // Voir l'en-tête du fichier : c'est ce qui rend les rejeux de Stripe sûrs.
  const versClient = await envoyerEmail({
    to: email,
    subject: sujetCommande(),
    text: texteCommande(commande),
    html: htmlCommande(commande),
  });

  if (!versClient.ok) {
    // 500 : Stripe rejouera, et l'email partira au prochain essai. La
    // notification marchand, déjà partie, ne sera pas renvoyée.
    return json({ error: "Envoi de la confirmation échoué." }, 500);
  }

  console.log('Confirmation de commande envoyée pour la session', session.id);
  return json({ recu: true });
}
