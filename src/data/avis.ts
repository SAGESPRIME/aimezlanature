/**
 * Dépôt d'avis client — configuration partagée entre le formulaire
 * (src/components/AvisForm.astro) et la route qui le reçoit
 * (src/pages/api/avis.ts).
 *
 * ⚠️ RAPPEL DE LA RÈGLE DE reviews.ts : un avis publié doit être authentique.
 * C'est pour ça que ce formulaire ne publie RIEN automatiquement. Le parcours
 * est volontairement :
 *
 *   client → vérification de l'achat chez Stripe → email au marchand →
 *   relecture humaine → ajout dans reviews.ts → redéploiement
 *
 * Aucune base de données, donc aucune donnée personnelle stockée côté site :
 * l'email de l'acheteur sert à vérifier l'achat pendant la requête, part dans
 * la notification au marchand, et n'est écrit nulle part.
 */

/** Adresse qui reçoit les avis à modérer — boîte unique du marchand. */
export { EMAIL_MARCHAND as EMAIL_AVIS } from '../lib/email';

/** Champs attendus par /api/avis. */
export const CHAMPS_AVIS = {
  produit: { name: 'produit', label: 'Produit concerné' },
  note: { name: 'note', label: 'Votre note' },
  titre: { name: 'titre', label: 'Titre de votre avis' },
  texte: { name: 'texte', label: 'Votre avis' },
  auteur: { name: 'auteur', label: 'Nom affiché avec votre avis' },
  email: { name: 'email', label: 'Email utilisé lors de votre commande' },
  consentement: { name: 'consentement', label: 'Autorisation de publication' },
} as const;

/**
 * Longueurs maximales, appliquées côté serveur par troncature (jamais par
 * rejet) : un `maxlength` HTML se contourne en deux clics dans la console, il
 * n'est là que pour le confort de saisie.
 */
export const LIMITES_AVIS: Record<string, number> = {
  produit: 60,
  note: 2,
  titre: 90,
  texte: 1500,
  auteur: 60,
  email: 120,
  consentement: 10,
};

/**
 * Longueur minimale de l'avis. Un « super » de 5 caractères n'apprend rien à
 * un futur acheteur et fait baisser la qualité perçue de la page.
 */
export const TEXTE_MINIMUM = 30;

/** Notes proposées, de la meilleure à la moins bonne (ordre d'affichage). */
export const NOTES = [5, 4, 3, 2, 1] as const;

/** Libellé accessible d'une note, lu par les lecteurs d'écran. */
export function libelleNote(note: number): string {
  return note === 1 ? '1 étoile sur 5' : `${note} étoiles sur 5`;
}
