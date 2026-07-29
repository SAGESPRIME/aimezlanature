/**
 * Envoi d'email transactionnel — point de passage unique du site.
 *
 * Les routes /api/revendeur, /api/avis et /api/stripe-webhook passent toutes
 * par ici. Avant, chacune recopiait le même appel `fetch` vers Emailit : trois
 * copies à corriger le jour d'un changement, et la certitude qu'une finirait
 * par diverger.
 *
 * Changer de fournisseur (Resend, Brevo…) ne demande donc plus qu'à modifier
 * `envoyerEmail` : l'API de Resend attend exactement les mêmes champs
 * (`from`, `to`, `subject`, `html`, `text`, `reply_to`), la bascule tiendrait
 * en quelques lignes.
 */

/** Expéditeur. DOIT appartenir au domaine vérifié dans le workspace Emailit. */
const EXPEDITEUR_DEFAUT = 'Aimez la Nature <notifications@aimezlanature.fr>';

/**
 * Boîte du marchand : demandes revendeur, avis à modérer, nouvelles commandes.
 * Définie ici plutôt que dans chaque fichier de données — elle y figurait déjà
 * en double, et une troisième copie arrivait avec les commandes.
 */
export const EMAIL_MARCHAND = 'contact@aimezlanature.fr';

const ENDPOINT = 'https://api.emailit.com/v2/emails';

export interface Email {
  to: string;
  subject: string;
  /** Corps HTML. Styles EN LIGNE uniquement : les clients mail ignorent les feuilles externes. */
  html: string;
  /** Version texte, obligatoire : sans elle, les filtres anti-spam pénalisent le message. */
  text: string;
  /** Adresse à laquelle répondre, quand elle diffère de l'expéditeur. */
  replyTo?: string;
}

/**
 * Résultat explicite plutôt qu'une exception : chaque appelant doit décider
 * quoi répondre au visiteur, et les trois cas n'appellent pas la même réponse.
 *
 * - `config`      : clé absente → 503, le service n'est pas activé
 * - `refus`       : Emailit a répondu une erreur → 502
 * - `injoignable` : réseau indisponible → 502
 */
export type ResultatEnvoi =
  | { ok: true }
  | { ok: false; raison: 'config' | 'refus' | 'injoignable' };

/**
 * Échappe le HTML d'une valeur venant d'un formulaire public ou d'un tiers,
 * avant de l'insérer dans un email.
 */
export function echapperHtml(texte: string): string {
  return texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function envoyerEmail(email: Email): Promise<ResultatEnvoi> {
  const cle: string | undefined = process.env.EMAILIT_API_KEY;
  if (!cle) {
    console.error('EMAILIT_API_KEY absente : email non transmis.');
    return { ok: false, raison: 'config' };
  }

  const expediteur = process.env.EMAILIT_FROM ?? EXPEDITEUR_DEFAUT;

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cle}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: expediteur,
        to: [email.to],
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
        subject: email.subject,
        text: email.text,
        html: email.html,
      }),
    });

    if (!res.ok) {
      // Le message brut d'Emailit peut détailler la configuration du compte :
      // il reste dans les logs, il ne part jamais dans la réponse au visiteur.
      console.error('Emailit:', res.status, await res.text());
      return { ok: false, raison: 'refus' };
    }
  } catch (e) {
    console.error('Emailit injoignable:', e);
    return { ok: false, raison: 'injoignable' };
  }

  return { ok: true };
}
