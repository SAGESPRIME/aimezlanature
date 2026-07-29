/**
 * Email de confirmation de commande — contenu et mise en forme.
 *
 * Séparé de la route (`api/stripe-webhook.ts`) pour que le texte se modifie
 * sans toucher à la logique de paiement, et que la route reste courte.
 *
 * ⚠️ CONTRAINTES DES CLIENTS MAIL, différentes de celles du web :
 * - styles EN LIGNE uniquement (Gmail supprime les <style> dans <head>)
 * - mise en page en <table> (Outlook ignore flexbox et grid)
 * - largeur maximale 600 px
 * - toujours une version texte, sinon les filtres anti-spam pénalisent
 *
 * Les dosages viennent de `dosages.ts`, source unique de vérité : ils ne sont
 * pas recopiés ici, sinon l'email finirait par contredire le site.
 */
import { dosages } from './dosages';
import { SITE } from './products';
import { echapperHtml } from '../lib/email';

/** Un article de la commande, tel que renvoyé par Stripe. */
export interface LigneCommande {
  description: string;
  quantite: number;
  /** Montant total de la ligne, en centimes. */
  montant: number;
}

export interface Commande {
  lignes: LigneCommande[];
  /** Montant total payé, en centimes. */
  total: number;
  /** Prénom du client, quand Stripe l'a collecté. */
  nom?: string;
  /** Champs présents uniquement pour la notification au marchand. */
  nomComplet?: string;
  email?: string;
  telephone?: string;
  /** Adresse de livraison, déjà mise en forme ligne par ligne. */
  adresse?: string[];
  /** Identifiant Stripe de la commande, pour la retrouver au tableau de bord. */
  reference?: string;
}

/**
 * Adresse de base des liens contenus dans les emails.
 *
 * ⚠️ TEMPORAIRE. `SITE.url` vaut `aimezlanature.fr`, qui sert encore le site
 * WordPress : le lien « Voir tous les dosages » y renvoie donc un 404. Tant que
 * le domaine n'est pas basculé, définir `EMAIL_SITE_URL` dans Vercel avec
 * l'adresse du déploiement (https://aimezlanatureseo.vercel.app).
 *
 * À SUPPRIMER — la variable comme ce commentaire — le jour où aimezlanature.fr
 * sert ce site : `SITE.url` redeviendra alors la bonne réponse.
 */
function baseLiens(): string {
  return (process.env.EMAIL_SITE_URL ?? SITE.url).replace(/\/$/, '');
}

const VERT = '#166534';
const ENCRE = '#1A1A16';
const GRIS = '#57534e';
const SABLE = '#FDFBF7';
const BORDURE = '#EDE8E0';

/** Formate des centimes en euros, à la française : 3874 → « 38,74 € ». */
function euros(centimes: number): string {
  return `${(centimes / 100).toFixed(2).replace('.', ',')} €`;
}

/**
 * Les trois usages les plus courants, tirés de dosages.ts.
 *
 * Choisis parce qu'ils couvrent l'écrasante majorité des questions reçues
 * après achat : la carafe (usage principal), la bouilloire et la cafetière
 * (le tartre, deuxième motif d'achat).
 */
const USAGES_ESSENTIELS = ['Carafe ou fontaine 1 L', 'Bouilloire', 'Cafetière ou machine à thé'];

const conseils = USAGES_ESSENTIELS.map((usage) => {
  const trouve = dosages.find((d) => d.usage === usage);
  return trouve ? { usage: trouve.usage, nb: trouve.nb } : null;
}).filter((c): c is { usage: string; nb: string } => c !== null);

export function sujetCommande(): string {
  return 'Votre commande Aimez la Nature est confirmée';
}

export function texteCommande(commande: Commande): string {
  const salutation = commande.nom ? `Bonjour ${commande.nom},` : 'Bonjour,';
  return [
    salutation,
    '',
    'Merci pour votre commande, votre paiement est bien confirmé.',
    '',
    'VOTRE COMMANDE',
    ...commande.lignes.map((l) => `- ${l.description} x${l.quantite} — ${euros(l.montant)}`),
    `Total payé : ${euros(commande.total)}`,
    '',
    'LIVRAISON',
    'Votre colis part sous 24 à 48 h ouvrées, et vous parvient sous 2 à 5 jours.',
    '',
    'EN ATTENDANT VOTRE COLIS',
    `La règle est simple : ${
      dosages.length > 0 ? '15 perles par litre' : ''
    } pour l'eau de boisson.`,
    ...conseils.map((c) => `- ${c.usage} : ${c.nb}`),
    '',
    'Rincez les perles à l\'eau claire avant la première utilisation, puis laissez agir 30 minutes.',
    `Tous les dosages : ${baseLiens()}/comment-ca-marche/`,
    '',
    `Une question ? Répondez simplement à cet email.`,
    '',
    'Aimez la Nature',
  ].join('\n');
}

export function htmlCommande(commande: Commande): string {
  const salutation = commande.nom
    ? `Bonjour ${echapperHtml(commande.nom)},`
    : 'Bonjour,';

  const lignes = commande.lignes
    .map(
      (l) => `<tr>
<td style="padding:10px 0;border-bottom:1px solid ${BORDURE};color:${ENCRE};font-size:15px;">
${echapperHtml(l.description)} <span style="color:${GRIS};">&times;${l.quantite}</span>
</td>
<td style="padding:10px 0;border-bottom:1px solid ${BORDURE};color:${ENCRE};font-size:15px;text-align:right;white-space:nowrap;">
${euros(l.montant)}
</td>
</tr>`
    )
    .join('');

  const listeConseils = conseils
    .map(
      (c) => `<tr>
<td style="padding:4px 0;color:${GRIS};font-size:14px;">${echapperHtml(c.usage)}</td>
<td style="padding:4px 0;color:${VERT};font-size:14px;font-weight:bold;text-align:right;white-space:nowrap;">${echapperHtml(c.nb)}</td>
</tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${sujetCommande()}</title></head>
<body style="margin:0;padding:0;background-color:${SABLE};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${SABLE};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid ${BORDURE};border-radius:16px;">

<tr><td style="padding:32px 32px 8px 32px;">
<p style="margin:0 0 4px 0;color:${VERT};font-size:13px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Commande confirmée</p>
<h1 style="margin:0;color:${ENCRE};font-size:26px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;">Merci pour votre commande</h1>
</td></tr>

<tr><td style="padding:16px 32px 0 32px;font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0 0 12px 0;color:${ENCRE};font-size:15px;">${salutation}</p>
<p style="margin:0;color:${GRIS};font-size:15px;line-height:1.6;">Votre paiement est bien confirmé. Votre colis part sous 24 à 48 h ouvrées et vous parvient sous 2 à 5 jours.</p>
</td></tr>

<tr><td style="padding:24px 32px 0 32px;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${lignes}
<tr>
<td style="padding:14px 0 0 0;color:${ENCRE};font-size:16px;font-weight:bold;">Total payé</td>
<td style="padding:14px 0 0 0;color:${ENCRE};font-size:18px;font-weight:bold;text-align:right;white-space:nowrap;">${euros(commande.total)}</td>
</tr>
</table>
</td></tr>

<tr><td style="padding:28px 32px 0 32px;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${SABLE};border-radius:12px;">
<tr><td style="padding:20px;">
<p style="margin:0 0 6px 0;color:${ENCRE};font-size:16px;font-weight:bold;">En attendant votre colis</p>
<p style="margin:0 0 14px 0;color:${GRIS};font-size:14px;line-height:1.6;">La règle de base : <strong style="color:${VERT};">15 perles par litre</strong> pour l'eau de boisson. Les usages les plus courants&nbsp;:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${listeConseils}</table>
<p style="margin:14px 0 0 0;color:${GRIS};font-size:13px;line-height:1.6;">Rincez les perles à l'eau claire avant la première utilisation, puis laissez agir 30 minutes.</p>
<p style="margin:10px 0 0 0;"><a href="${baseLiens()}/comment-ca-marche/" style="color:${VERT};font-size:14px;font-weight:bold;text-decoration:underline;">Voir tous les dosages &rarr;</a></p>
</td></tr>
</table>
</td></tr>

<tr><td style="padding:24px 32px 32px 32px;font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0;color:${GRIS};font-size:14px;line-height:1.6;">Une question&nbsp;? Répondez simplement à cet email, nous vous lisons.</p>
<p style="margin:16px 0 0 0;color:${ENCRE};font-size:14px;">Aimez la Nature</p>
</td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification au marchand : « une commande est à préparer »
//
// Objectif différent de l'email client : ce n'est pas un remerciement, c'est un
// bon de préparation. On veut voir en un coup d'œil QUOI mettre dans le colis
// et OÙ l'envoyer, sans avoir à ouvrir le tableau de bord Stripe.
// ─────────────────────────────────────────────────────────────────────────────

export function sujetMarchand(commande: Commande): string {
  const articles = commande.lignes.reduce((total, l) => total + l.quantite, 0);
  return `Nouvelle commande — ${articles} article${articles > 1 ? 's' : ''}, ${euros(commande.total)}`;
}

export function texteMarchand(commande: Commande): string {
  return [
    'À PRÉPARER',
    ...commande.lignes.map((l) => `- ${l.description} x${l.quantite}`),
    '',
    `Total payé : ${euros(commande.total)}`,
    '',
    'LIVRER À',
    commande.nomComplet ?? '(nom non communiqué)',
    ...(commande.adresse ?? ['(adresse non communiquée)']),
    '',
    'CLIENT',
    `Email : ${commande.email ?? '—'}`,
    `Téléphone : ${commande.telephone ?? '—'}`,
    '',
    `Référence Stripe : ${commande.reference ?? '—'}`,
  ].join('\n');
}

export function htmlMarchand(commande: Commande): string {
  const aPreparer = commande.lignes
    .map(
      (l) => `<tr>
<td style="padding:8px 0;border-bottom:1px solid ${BORDURE};color:${ENCRE};font-size:16px;font-weight:bold;">
${echapperHtml(l.description)}
</td>
<td style="padding:8px 0;border-bottom:1px solid ${BORDURE};color:${VERT};font-size:18px;font-weight:bold;text-align:right;white-space:nowrap;">
&times;${l.quantite}
</td>
</tr>`
    )
    .join('');

  const adresse = (commande.adresse ?? ['(adresse non communiquée)'])
    .map((ligne) => echapperHtml(ligne))
    .join('<br>');

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${sujetMarchand(commande)}</title></head>
<body style="margin:0;padding:0;background-color:${SABLE};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${SABLE};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid ${BORDURE};border-radius:16px;font-family:Arial,Helvetica,sans-serif;">

<tr><td style="padding:28px 28px 0 28px;">
<p style="margin:0 0 4px 0;color:${VERT};font-size:13px;letter-spacing:2px;text-transform:uppercase;">Nouvelle commande</p>
<h1 style="margin:0;color:${ENCRE};font-size:24px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;">Un colis à préparer</h1>
</td></tr>

<tr><td style="padding:22px 28px 0 28px;">
<p style="margin:0 0 8px 0;color:${GRIS};font-size:13px;text-transform:uppercase;letter-spacing:1px;">À mettre dans le colis</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${aPreparer}</table>
<p style="margin:12px 0 0 0;color:${GRIS};font-size:14px;">Total payé&nbsp;: <strong style="color:${ENCRE};">${euros(commande.total)}</strong></p>
</td></tr>

<tr><td style="padding:22px 28px 0 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${SABLE};border-radius:12px;">
<tr><td style="padding:18px;">
<p style="margin:0 0 8px 0;color:${GRIS};font-size:13px;text-transform:uppercase;letter-spacing:1px;">Livrer à</p>
<p style="margin:0;color:${ENCRE};font-size:15px;line-height:1.7;">
<strong>${echapperHtml(commande.nomComplet ?? '(nom non communiqué)')}</strong><br>${adresse}
</p>
</td></tr>
</table>
</td></tr>

<tr><td style="padding:22px 28px 28px 28px;">
<p style="margin:0 0 8px 0;color:${GRIS};font-size:13px;text-transform:uppercase;letter-spacing:1px;">Contact client</p>
<p style="margin:0;color:${GRIS};font-size:14px;line-height:1.7;">
Email&nbsp;: <a href="mailto:${echapperHtml(commande.email ?? '')}" style="color:${VERT};">${echapperHtml(commande.email ?? '—')}</a><br>
Téléphone&nbsp;: ${echapperHtml(commande.telephone ?? '—')}
</p>
<p style="margin:16px 0 0 0;color:#8A8378;font-size:12px;">Référence Stripe&nbsp;: ${echapperHtml(commande.reference ?? '—')}</p>
</td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}
