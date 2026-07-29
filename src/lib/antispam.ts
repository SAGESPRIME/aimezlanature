/**
 * Filtres anti-robot partagés par TOUS les formulaires publics du site
 * (demande revendeur, dépôt d'avis, et ceux à venir).
 *
 * Source unique de vérité : ces noms de champs doivent être identiques dans le
 * HTML du formulaire et dans la route qui le reçoit. Les dupliquer par
 * formulaire, c'est garantir qu'un jour l'un des deux change seul et que le
 * filtre se met à rejeter de vrais clients sans que personne ne le voie.
 *
 * Pourquoi pas un captcha ? La CSP du site impose `script-src 'self'` : un
 * reCAPTCHA ou un Turnstile obligerait à autoriser un domaine tiers à exécuter
 * du script sur toutes les pages. Le couple piège + délai attrape les robots de
 * formulaire courants sans rien relâcher et sans imposer d'épreuve au client.
 */

/**
 * Champ piège (« honeypot ») : invisible et hors du parcours clavier, donc
 * toujours vide chez un humain. Un robot qui remplit automatiquement tous les
 * champs le remplit aussi et se trahit.
 */
export const CHAMP_PIEGE = 'site_web';

/** Horodatage d'ouverture du formulaire, posé par le script d'amélioration progressive. */
export const CHAMP_HORODATAGE = 'ouvert_a';

/** En dessous de ce délai de remplissage, l'envoi vient d'un script. */
export const DELAI_MINIMUM_MS = 3000;

/**
 * Vrai si le formulaire a été renvoyé trop vite pour avoir été rempli à la main.
 *
 * Un horodatage absent ou illisible renvoie FAUX (on laisse passer) : c'est le
 * cas d'un navigateur sans JavaScript, et il est hors de question d'exclure un
 * vrai client parce qu'un script n'a pas chargé.
 */
export function envoiTropRapide(horodatageBrut: string): boolean {
  const ouvertA = Number(horodatageBrut);
  if (!Number.isFinite(ouvertA) || ouvertA <= 0) return false;
  return Date.now() - ouvertA < DELAI_MINIMUM_MS;
}

/**
 * Validation d'email volontairement permissive : elle écarte les saisies
 * manifestement fausses sans prétendre valider la RFC 5322. Pour le dépôt
 * d'avis, la vraie vérification est faite par Stripe de toute façon.
 */
export function emailPlausible(email: string): boolean {
  return /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email);
}
