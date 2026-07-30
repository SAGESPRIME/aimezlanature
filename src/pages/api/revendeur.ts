import type { APIRoute } from 'astro';
// Route serverless Vercel (prerender = false) : l'environnement est lu via
// process.env — même accès que api/checkout.ts.
import {
  CHAMPS,
  CHAMP_PIEGE,
  CHAMP_HORODATAGE,
  EMAIL_REVENDEUR,
} from '../../data/revendeur';
// `echapperHtml` importé sous le nom `echapper` : même fonction, désormais
// partagée avec les autres routes, sans avoir à renommer chaque appel ici.
import { verifierLimite, PLAFONDS } from '../../lib/rateLimit';
import { envoyerEmail, echapperHtml as echapper } from '../../lib/email';

// Route exécutée à la demande : le reste du site reste statique.
export const prerender = false;

/**
 * Réception du formulaire revendeur (/revendeurs/) et notification du marchand.
 *
 * Le formulaire est un `<form method="post">` natif : cette route doit donc
 * répondre correctement à un navigateur SANS JavaScript (redirection 303 vers
 * la page de remerciement) autant qu'à un envoi `fetch` (réponse JSON).
 * Le discriminant est l'en-tête `Accept` envoyé par public/js/revendeur.js.
 *
 * L'email part vers la boîte du marchand, jamais vers le professionnel :
 * aucune donnée saisie n'est renvoyée à un tiers.
 */

/** Délai minimum de remplissage. En dessous, c'est un robot. */
const DELAI_MINIMUM_MS = 3000;

const LIMITES: Record<string, number> = {
  boutique: 120,
  contact: 80,
  email: 120,
  telephone: 30,
  siret: 20,
  activite: 80,
  volume: 60,
  message: 1500,
};

function lire(form: FormData, nom: string): string {
  const brut = form.get(nom);
  if (typeof brut !== 'string') return '';
  return brut.trim().slice(0, LIMITES[nom] ?? 200);
}

/**
 * Page d'erreur servie au navigateur sans JavaScript.
 * Volontairement sans CSS : `style-src 'self'` interdit le style en ligne et
 * le nom du fichier CSS du site est haché au build. L'essentiel est que le
 * professionnel reparte avec une adresse où écrire — aucune demande perdue.
 */
function pageErreur(message: string, status: number): Response {
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Demande non envoyée</title></head>
<body><h1>Votre demande n'a pas pu être envoyée</h1>
<p>${echapper(message)}</p>
<p>Écrivez-nous directement à <a href="mailto:${EMAIL_REVENDEUR}?subject=Demande%20revendeur">${EMAIL_REVENDEUR}</a>, nous traiterons votre demande de la même façon.</p>
<p><a href="/revendeurs/">Revenir au formulaire</a></p></body></html>`;
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export const POST: APIRoute = async ({ request, url }) => {
  const veutJson = (request.headers.get('accept') ?? '').includes('application/json');

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
  const limite = verifierLimite(request, 'revendeur', PLAFONDS.formulaire.max, PLAFONDS.formulaire.fenetreS);
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
  if (lire(form, CHAMP_PIEGE)) {
    return veutJson
      ? new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      : Response.redirect(new URL('/revendeurs/merci/', url.origin), 303);
  }

  // Délai de remplissage. Absent = navigateur sans JavaScript : on laisse passer,
  // hors de question d'exclure un vrai professionnel pour un script non chargé.
  const ouvertA = Number(lire(form, CHAMP_HORODATAGE));
  if (Number.isFinite(ouvertA) && ouvertA > 0 && Date.now() - ouvertA < DELAI_MINIMUM_MS) {
    return echec('Formulaire envoyé trop vite. Merci de réessayer.', 400);
  }

  const donnees = {
    boutique: lire(form, CHAMPS.boutique.name),
    contact: lire(form, CHAMPS.contact.name),
    email: lire(form, CHAMPS.email.name),
    telephone: lire(form, CHAMPS.telephone.name),
    siret: lire(form, CHAMPS.siret.name),
    activite: lire(form, CHAMPS.activite.name),
    volume: lire(form, CHAMPS.volume.name),
    message: lire(form, CHAMPS.message.name),
  };

  // Validation serveur : les attributs `required` du HTML se contournent en
  // deux clics dans la console, ils ne prouvent rien.
  if (!donnees.boutique || !donnees.contact || !donnees.email || !donnees.siret || !donnees.activite) {
    return echec('Merci de remplir tous les champs obligatoires.', 400);
  }
  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(donnees.email)) {
    return echec('Adresse email invalide.', 400);
  }
  const siretChiffres = donnees.siret.replace(/\D/g, '');
  if (siretChiffres.length < 9 || siretChiffres.length > 14) {
    return echec('Le SIRET doit comporter 14 chiffres (9 pour un SIREN).', 400);
  }

  const lignes: [string, string][] = [
    ['Boutique', donnees.boutique],
    ['Contact', donnees.contact],
    ['Email', donnees.email],
    ['Téléphone', donnees.telephone || '—'],
    ['SIRET', donnees.siret],
    ['Activité', donnees.activite],
    ['Volume envisagé', donnees.volume || '—'],
    ['Message', donnees.message || '—'],
  ];

  const texte = lignes.map(([k, v]) => `${k} : ${v}`).join('\n');
  const html = `<h2>Nouvelle demande revendeur</h2><table cellpadding="6">${lignes
    .map(
      ([k, v]) =>
        `<tr><td><strong>${echapper(k)}</strong></td><td>${echapper(v).replace(/\n/g, '<br>')}</td></tr>`
    )
    .join('')}</table>`;

  const envoi = await envoyerEmail({
    to: EMAIL_REVENDEUR,
    // `replyTo` = le professionnel : le marchand répond directement
    // depuis sa boîte, sans recopier l'adresse.
    replyTo: donnees.email,
    subject: `Demande revendeur — ${donnees.boutique}`,
    text: texte,
    html,
  });

  if (!envoi.ok) {
    return envoi.raison === 'config'
      ? echec("Notre service d'envoi n'est pas encore activé.", 503)
      : echec("L'envoi a échoué.", 502);
  }

  return veutJson
    ? new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    : Response.redirect(new URL('/revendeurs/merci/', url.origin), 303);
};
