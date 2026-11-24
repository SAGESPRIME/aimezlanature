import type { APIRoute } from 'astro';
// Route à la demande (prerender = false), servie par server.mjs : les secrets
// sont lus dans process.env (variables d'environnement Coolify).
import { CHAMPS_AVIS, LIMITES_AVIS, TEXTE_MINIMUM, EMAIL_AVIS } from '../../data/avis';
import { products } from '../../data/products';
import {
  CHAMP_PIEGE,
  CHAMP_HORODATAGE,
  envoiTropRapide,
  emailPlausible,
} from '../../lib/antispam';
import { verifierLimite, PLAFONDS } from '../../lib/rateLimit';
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

/** Résultat de la vérification d'achat. */
type Achat = 'produit' | 'autre-produit' | 'aucun' | null;

/**
 * Vérifie chez Stripe qu'une commande payée existe pour cet email ET qu'elle
 * contient le produit avisé.
 *
 * Retourne `'produit'` (achat de CE produit confirmé), `'autre-produit'`
 * (commande payée, mais pas de ce produit), `'aucun'` (aucune commande payée)
 * ou `null` (vérification impossible : Stripe injoignable, réponse inattendue).
 *
 * Le produit est reconnu par son nom : c'est le `name` que /api/checkout pose
 * sur chaque ligne Stripe, et que Stripe renvoie en `description`. Avant
 * l'audit du 2026-11-24, n'importe quelle commande payée suffisait, quel que
 * soit le produit avisé.
 *
 * ⚠️ Le `null` est traité comme un REFUS par l'appelant, jamais comme un
 * accord. Publier un avis sous le badge « Achat vérifié » sans avoir pu
 * vérifier l'achat serait une pratique commerciale trompeuse (L121-2 du code
 * de la consommation) et ferait sauter les étoiles Google sur tout le site.
 * En cas de panne, mieux vaut un client qui écrit un email qu'un badge faux.
 */
async function achatConfirme(email: string, nomProduit: string, cle: string): Promise<Achat> {
  // Filtre officiel de l'API « List Checkout Sessions ». `status=complete`
  // écarte les paniers abandonnés ; `payment_status` est revérifié ensuite car
  // une session complète peut rester impayée (paiement différé).
  const params = new URLSearchParams({
    'customer_details[email]': email,
    status: 'complete',
    limit: '100',
    'expand[]': 'data.line_items',
  });

  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions?${params}`, {
      headers: { Authorization: `Bearer ${cle}` },
      signal: AbortSignal.timeout(10_000),
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
    const payees = data.data.filter((s: any) => s?.payment_status === 'paid');
    if (payees.length === 0) return 'aucun';
    const contientProduit = payees.some((s: any) =>
      (s?.line_items?.data ?? []).some((l: any) => l?.description === nomProduit)
    );
    return contientProduit ? 'produit' : 'autre-produit';
  } catch (e) {
    console.error('Stripe injoignable (vérification avis):', e);
    return null;
  }
}

export const POST: APIRoute = async ({ request }) => {
  const veutJson = (request.headers.get('accept') ?? '').includes('application/json');

  const succes = () =>
    veutJson
      ? new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      : new Response(null, { status: 303, headers: { Location: '/avis/merci/' } });

  const echec = (message: string, status: number) =>
    veutJson
      ? new Response(JSON.stringify({ error: message }), {
          status,
          headers: { 'Content-Type': 'application/json' },
        })
      : pageErreur(message, status);

  // Limite anti-abus, en plus du piège et du délai : cette route envoie un email
  // au marchand. On passe par `echec()` et non par la réponse 429 générique de
  // lib/rateLimit, pour qu'un visiteur SANS JavaScript reçoive la page d'erreur
  // du site et non du JSON brut.
  const limite = verifierLimite(request, 'avis', PLAFONDS.formulaire.max, PLAFONDS.formulaire.fenetreS);
  if (!limite.autorise) {
    return echec('Trop de tentatives. Merci de réessayer dans un instant.', 429);
  }

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

  const verifie = await achatConfirme(donnees.email, produit.name, cleStripe);
  if (verifie === null) {
    // Panne de Stripe : ne dépend pas de l'email saisi, ne révèle donc rien.
    return echec(
      "Nous n'avons pas pu vérifier votre commande pour le moment. Réessayez dans quelques minutes.",
      503
    );
  }
  // ⚠️ MÊME RÉPONSE que l'achat soit vérifié ou non. Avant l'audit du
  // 2026-11-24, un 403 « aucune commande payée pour cet email » permettait à
  // n'importe qui de savoir si une personne était cliente. Un avis non vérifié
  // n'est simplement pas transmis ; la page de remerciement invite le client
  // qui s'est trompé d'adresse à écrire au marchand. Le journal ne garde pas
  // l'email (donnée personnelle).
  if (verifie !== 'produit') {
    console.log(`Avis non transmis (${verifie}) pour le produit ${produit.slug}.`);
    return succes();
  }

  // ── Notification du marchand ───────────────────────────────────────────
  const aujourdhui = new Date().toISOString().slice(0, 10);

  const lignes: [string, string][] = [
    ['Produit', `${produit.name} (${produit.slug})`],
    ['Note', `${note}/5`],
    ['Titre', donnees.titre || '—'],
    ['Avis', donnees.texte],
    ['Nom affiché', donnees.auteur],
    ['Date', aujourdhui],
    ['Email (NE PAS publier)', donnees.email],
    ['Achat', 'Commande payée de CE produit trouvée chez Stripe pour cet email'],
    [
      'À savoir',
      "Le site ne prouve pas que l'auteur possède cette adresse. En cas de doute (avis " +
        "très négatif, nom sans rapport avec la commande), répondre à ce message avant de publier.",
    ],
  ];

  // Marche à suivre : l'avis se publie dans le Studio Sanity. La note moyenne
  // et le nombre d'avis du produit se recalculent seuls à la reconstruction.
  const consigne =
    `Pour le publier : Studio Sanity → Avis clients → Créer, puis recopier ` +
    `TEL QUEL produit, nom affiché, date, note, titre et texte (jamais l'email), ` +
    `et cliquer « Publier ». La note du produit se met à jour automatiquement.`;

  const texte = [...lignes.map(([k, v]) => `${k} : ${v}`), '', consigne].join('\n');

  const html =
    `<h2>Nouvel avis à modérer — ${echapperHtml(produit.name)}</h2>` +
    `<table cellpadding="6">${lignes
      .map(
        ([k, v]) =>
          `<tr><td valign="top"><strong>${echapperHtml(k)}</strong></td><td>${echapperHtml(v).replace(/\n/g, '<br>')}</td></tr>`
      )
      .join('')}</table>` +
    `<p><strong>Si vous publiez cet avis</strong> : ${echapperHtml(consigne)}</p>`;

  // Envoi EN ARRIÈRE-PLAN, et même réponse quoi qu'il arrive. Attendre l'envoi
  // puis répondre 502/503 en cas d'échec ne pouvait se produire que pour un
  // email ayant acheté le produit : pendant une panne d'Emailit, un inconnu
  // savait donc qui est client — et le temps de réponse le trahissait aussi
  // (ré-audit du 2026-11-24). Le serveur est un processus Node durable : la
  // promesse aboutit après la réponse. En cas d'échec, l'avis reste dans le
  // journal (sans l'email du client) pour être recopié à la main.
  void envoyerEmail({
    to: EMAIL_AVIS,
    // `replyTo` = le client : le marchand peut lui répondre directement,
    // par exemple pour un avis négatif à traiter avant publication.
    replyTo: donnees.email,
    subject: `Avis ${note}/5 à modérer — ${produit.shortName}`,
    text: texte,
    html,
  })
    .then((envoi) => {
      if (!envoi.ok) {
        console.error(
          `Avis vérifié NON transmis au marchand (${envoi.raison}) — à recopier :`,
          JSON.stringify({ produit: produit.slug, note, titre: donnees.titre, texte: donnees.texte, auteur: donnees.auteur, date: aujourdhui })
        );
      }
    })
    .catch((e) => console.error('Avis : échec inattendu de la notification marchand', e));

  return succes();
};
