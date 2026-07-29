import type { APIRoute } from 'astro';
// Route serverless Vercel (prerender = false) : l'environnement est lu via
// process.env — même accès que api/checkout.ts et api/revendeur.ts.
import { CHAMPS_AVIS, LIMITES_AVIS, TEXTE_MINIMUM, EMAIL_AVIS } from '../../data/avis';
import { products } from '../../data/products';
import {
  CHAMP_PIEGE,
  CHAMP_HORODATAGE,
  envoiTropRapide,
  emailPlausible,
} from '../../lib/antispam';
import { envoyerEmail, echapperHtml } from '../../lib/email';

// Route exécutée à la demande : le reste du site reste statique.
export const prerender = false;

/**
 * Réception d'un avis client déposé depuis une fiche produit.
 *
 * Rien n'est publié par cette route. Elle vérifie, puis notifie le marchand ;
 * la publication reste une décision humaine (cf. src/data/avis.ts).
 *
 * Comme /api/revendeur, elle répond correctement à un navigateur SANS
 * JavaScript (redirection 303) autant qu'à un envoi `fetch` (JSON). Le
 * discriminant est l'en-tête `Accept` envoyé par public/js/avis.js.
 */

function lire(form: FormData, nom: string): string {
  const brut = form.get(nom);
  if (typeof brut !== 'string') return '';
  return brut.trim().slice(0, LIMITES_AVIS[nom] ?? 200);
}

/**
 * Page d'erreur servie au navigateur sans JavaScript.
 * Sans CSS volontairement : `style-src 'self'` interdit le style en ligne et le
 * nom du fichier CSS du site est haché au build. L'essentiel est que le client
 * reparte avec une adresse où écrire — aucun avis perdu.
 */
function pageErreur(message: string, status: number): Response {
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Avis non envoyé</title></head>
<body><h1>Votre avis n'a pas pu être envoyé</h1>
<p>${echapperHtml(message)}</p>
<p>Écrivez-nous à <a href="mailto:${EMAIL_AVIS}?subject=Mon%20avis">${EMAIL_AVIS}</a>, nous publierons votre avis de la même façon.</p>
<p><a href="/perles-ceramique-em/">Revenir aux produits</a></p></body></html>`;
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

/**
 * Vérifie chez Stripe qu'une commande payée existe pour cet email.
 *
 * Retourne `true` (achat confirmé), `false` (aucune commande payée) ou `null`
 * (vérification impossible : clé absente, Stripe injoignable, réponse
 * inattendue).
 *
 * ⚠️ Le `null` est traité comme un REFUS par l'appelant, jamais comme un
 * accord. Publier un avis sous le badge « Achat vérifié » sans avoir pu
 * vérifier l'achat serait une pratique commerciale trompeuse (L121-2 du code
 * de la consommation) et ferait sauter les étoiles Google sur tout le site.
 * En cas de panne, mieux vaut un client qui écrit un email qu'un badge faux.
 */
async function achatConfirme(email: string, cle: string): Promise<boolean | null> {
  // Filtre officiel de l'API « List Checkout Sessions ». `status=complete`
  // écarte les paniers abandonnés ; `payment_status` est revérifié ensuite car
  // une session complète peut rester impayée (paiement différé).
  const params = new URLSearchParams({
    'customer_details[email]': email,
    status: 'complete',
    limit: '100',
  });

  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions?${params}`, {
      headers: { Authorization: `Bearer ${cle}` },
    });

    if (!res.ok) {
      // Le message brut de Stripe peut détailler la configuration du compte :
      // il reste dans les logs, il ne part jamais dans la réponse.
      console.error('Stripe (vérification avis):', res.status, await res.text());
      return null;
    }

    const data: any = await res.json();
    if (!Array.isArray(data?.data)) {
      console.error('Stripe : réponse inattendue à la vérification d\'achat.');
      return null;
    }
    return data.data.some((s: any) => s?.payment_status === 'paid');
  } catch (e) {
    console.error('Stripe injoignable (vérification avis):', e);
    return null;
  }
}

export const POST: APIRoute = async ({ request, url }) => {
  const veutJson = (request.headers.get('accept') ?? '').includes('application/json');

  const succes = () =>
    veutJson
      ? new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      : Response.redirect(new URL('/avis/merci/', url.origin), 303);

  const echec = (message: string, status: number) =>
    veutJson
      ? new Response(JSON.stringify({ error: message }), {
          status,
          headers: { 'Content-Type': 'application/json' },
        })
      : pageErreur(message, status);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return echec('Formulaire illisible.', 400);
  }

  // Piège anti-robot : rempli = envoi automatisé. On répond « envoyé » sans
  // rien envoyer, pour ne pas renseigner le robot sur la détection.
  if (lire(form, CHAMP_PIEGE)) return succes();

  if (envoiTropRapide(lire(form, CHAMP_HORODATAGE))) {
    return echec('Formulaire envoyé trop vite. Merci de réessayer.', 400);
  }

  const donnees = {
    produit: lire(form, CHAMPS_AVIS.produit.name),
    note: lire(form, CHAMPS_AVIS.note.name),
    titre: lire(form, CHAMPS_AVIS.titre.name),
    texte: lire(form, CHAMPS_AVIS.texte.name),
    auteur: lire(form, CHAMPS_AVIS.auteur.name),
    email: lire(form, CHAMPS_AVIS.email.name).toLowerCase(),
    consentement: lire(form, CHAMPS_AVIS.consentement.name),
  };

  // Validation serveur : les attributs `required` du HTML ne prouvent rien.
  const produit = products.find((p) => p.slug === donnees.produit);
  if (!produit) return echec('Produit inconnu.', 400);

  const note = Number(donnees.note);
  if (!Number.isInteger(note) || note < 1 || note > 5) {
    return echec('Merci de choisir une note de 1 à 5 étoiles.', 400);
  }
  if (!donnees.auteur) return echec('Merci d\'indiquer le nom à afficher.', 400);
  if (!emailPlausible(donnees.email)) return echec('Adresse email invalide.', 400);
  if (donnees.texte.length < TEXTE_MINIMUM) {
    return echec(
      `Merci de détailler un peu votre avis (${TEXTE_MINIMUM} caractères minimum).`,
      400
    );
  }
  if (!donnees.consentement) {
    return echec('Merci d\'autoriser la publication de votre avis.', 400);
  }

  // ── Vérification de l'achat ────────────────────────────────────────────
  const cleStripe: string | undefined = process.env.STRIPE_SECRET_KEY;
  if (!cleStripe) {
    console.error('STRIPE_SECRET_KEY absente : avis non vérifiable, donc refusé.');
    return echec(
      "La vérification des commandes est momentanément indisponible. Réessayez plus tard.",
      503
    );
  }

  const verifie = await achatConfirme(donnees.email, cleStripe);
  if (verifie === null) {
    return echec(
      "Nous n'avons pas pu vérifier votre commande pour le moment. Réessayez dans quelques minutes.",
      503
    );
  }
  if (verifie === false) {
    return echec(
      "Aucune commande payée n'est associée à cette adresse email. Utilisez l'adresse saisie lors de votre achat — les avis de ce site sont réservés aux clients vérifiés.",
      403
    );
  }

  // ── Notification du marchand ───────────────────────────────────────────
  const aujourdhui = new Date().toISOString().slice(0, 10);

  // Ligne prête à coller dans src/data/reviews.ts après relecture.
  // `JSON.stringify` gère seul les apostrophes, guillemets et retours à la
  // ligne : pas d'échappement à la main, donc pas de fichier cassé au collage.
  const ligneReviews =
    `    { author: ${JSON.stringify(donnees.auteur)}, ` +
    `date: ${JSON.stringify(aujourdhui)}, ` +
    `rating: ${note}, ` +
    `title: ${donnees.titre ? JSON.stringify(donnees.titre) : 'null'}, ` +
    `text: ${JSON.stringify(donnees.texte)} },`;

  const lignes: [string, string][] = [
    ['Produit', `${produit.name} (${produit.slug})`],
    ['Note', `${note}/5`],
    ['Titre', donnees.titre || '—'],
    ['Avis', donnees.texte],
    ['Nom affiché', donnees.auteur],
    ['Email (NE PAS publier)', donnees.email],
    ['Achat', 'Vérifié via Stripe — commande payée trouvée pour cet email'],
  ];

  const texte = [
    ...lignes.map(([k, v]) => `${k} : ${v}`),
    '',
    `À coller dans src/data/reviews.ts, tableau '${produit.slug}' :`,
    ligneReviews,
  ].join('\n');

  const html =
    `<h2>Nouvel avis à modérer — ${echapperHtml(produit.name)}</h2>` +
    `<table cellpadding="6">${lignes
      .map(
        ([k, v]) =>
          `<tr><td valign="top"><strong>${echapperHtml(k)}</strong></td><td>${echapperHtml(v).replace(/\n/g, '<br>')}</td></tr>`
      )
      .join('')}</table>` +
    `<p><strong>Si vous publiez cet avis</strong>, collez cette ligne dans ` +
    `<code>src/data/reviews.ts</code>, tableau <code>${echapperHtml(produit.slug)}</code> :</p>` +
    `<pre>${echapperHtml(ligneReviews)}</pre>` +
    `<p>Pensez à mettre à jour <code>rating</code> et <code>reviewCount</code> du produit ` +
    `dans <code>products.ts</code>, ainsi que <code>totalReviews</code> dans <code>SITE</code>.</p>`;

  const envoi = await envoyerEmail({
    to: EMAIL_AVIS,
    // `replyTo` = le client : le marchand peut lui répondre directement,
    // par exemple pour un avis négatif à traiter avant publication.
    replyTo: donnees.email,
    subject: `Avis ${note}/5 à modérer — ${produit.shortName}`,
    text: texte,
    html,
  });

  if (!envoi.ok) {
    return envoi.raison === 'config'
      ? echec("Notre service d'envoi n'est pas encore activé.", 503)
      : echec("L'envoi a échoué.", 502);
  }

  return succes();
};
