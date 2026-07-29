import type { APIRoute } from 'astro';
// Route serverless Vercel (prerender = false) : l'environnement est lu via
// process.env — même accès que api/checkout.ts.
import { verifierSignature } from '../../lib/stripe-signature';
import { envoyerEmail } from '../../lib/email';
import { sujetCommande, texteCommande, htmlCommande, type LigneCommande } from '../../data/email-commande';

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

/** Événement traité. Les autres sont acquittés sans rien faire. */
const EVENEMENT_ATTENDU = 'checkout.session.completed';

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
      { headers: { Authorization: `Bearer ${cle}` } }
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
  const corpsBrut = await request.text();

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
  if (evenement?.type !== EVENEMENT_ATTENDU) {
    return json({ recu: true, ignore: evenement?.type ?? 'inconnu' });
  }

  const session = evenement?.data?.object;

  // Une session peut être « complète » sans être payée (paiement différé).
  if (session?.payment_status !== 'paid') {
    return json({ recu: true, ignore: 'paiement non abouti' });
  }

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
  const nomComplet: string | undefined = session?.customer_details?.name ?? undefined;
  const prenom = nomComplet?.trim().split(/\s+/)[0];

  const commande = {
    lignes: articles,
    total: Number(session?.amount_total ?? 0),
    nom: prenom,
  };

  const envoi = await envoyerEmail({
    to: email,
    subject: sujetCommande(),
    text: texteCommande(commande),
    html: htmlCommande(commande),
  });

  if (!envoi.ok) {
    // 500 : Stripe rejouera, et l'email partira au prochain essai.
    return json({ error: "Envoi de la confirmation échoué." }, 500);
  }

  console.log('Confirmation de commande envoyée pour la session', session.id);
  return json({ recu: true });
};
