import type { APIRoute } from 'astro';
// Variables d'environnement Cloudflare — même accès que api/checkout.ts.
// `Astro.locals.runtime.env` a été supprimé depuis Astro v6.
import { env } from 'cloudflare:workers';
import {
  CHAMPS,
  CHAMP_PIEGE,
  CHAMP_HORODATAGE,
  EMAIL_REVENDEUR,
} from '../../data/revendeur';

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

/** Expéditeur. DOIT appartenir au domaine vérifié dans le workspace Emailit. */
const EXPEDITEUR_DEFAUT = 'Aimez la Nature <notifications@aimezlanature.fr>';

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

/** Échappe le HTML : le contenu vient d'un formulaire public. */
function echapper(texte: string): string {
  return texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

  const cle: string | undefined = (env as Record<string, string | undefined>)?.EMAILIT_API_KEY;
  if (!cle) {
    console.error('EMAILIT_API_KEY absente : demande revendeur non transmise.');
    return echec(
      "Notre service d'envoi n'est pas encore activé.",
      503
    );
  }
  const expediteur =
    (env as Record<string, string | undefined>)?.EMAILIT_FROM ?? EXPEDITEUR_DEFAUT;

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

  try {
    const res = await fetch('https://api.emailit.com/v2/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cle}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: expediteur,
        to: [EMAIL_REVENDEUR],
        // `reply_to` = le professionnel : le marchand répond directement
        // depuis sa boîte, sans recopier l'adresse.
        reply_to: donnees.email,
        subject: `Demande revendeur — ${donnees.boutique}`,
        text: texte,
        html,
      }),
    });

    if (!res.ok) {
      // Le message brut d'Emailit peut détailler la configuration du compte :
      // il reste dans les logs, il ne part pas dans la réponse.
      console.error('Emailit:', res.status, await res.text());
      return echec("L'envoi a échoué.", 502);
    }
  } catch (e) {
    console.error('Emailit injoignable:', e);
    return echec("L'envoi a échoué.", 502);
  }

  return veutJson
    ? new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    : Response.redirect(new URL('/revendeurs/merci/', url.origin), 303);
};
