/**
 * Mémoire des événements Stripe déjà traités, pour ne jamais envoyer deux fois
 * le même email de commande.
 *
 * Pourquoi : Stripe le dit lui-même, un endpoint « peut occasionnellement
 * recevoir le même événement plus d'une fois », même après avoir répondu 200.
 * Sans cette mémoire, le client recevrait deux confirmations.
 *
 * Pourquoi en mémoire suffit ici : sur le VPS, le site tourne dans UN SEUL
 * processus Node, qui voit donc tous les événements. La mémoire est perdue à
 * un redémarrage (un déploiement) : un doublon reste alors possible dans la
 * minute qui suit, ce qui est rare et sans gravité (un email en double). Une
 * base de données pour ce seul cas serait disproportionnée.
 *
 * Trois états :
 *   - absent   : jamais vu, on traite ;
 *   - en cours : un premier appel est en train de le traiter, un second appel
 *                simultané ne doit pas le traiter aussi ;
 *   - fait     : déjà traité avec succès.
 */

/** Stripe rejoue pendant 3 jours au plus : au-delà, inutile de se souvenir. */
const DUREE_MS = 3 * 24 * 60 * 60 * 1000;
/** Plafond de sécurité : la mémoire ne peut pas grossir sans limite. */
const MAX_ENTREES = 10_000;

const memoire = new Map<string, { etat: 'en-cours' | 'fait'; depuis: number }>();

function purger(maintenant: number) {
  for (const [id, v] of memoire) {
    if (maintenant - v.depuis > DUREE_MS) memoire.delete(id);
  }
  // Map garde l'ordre d'insertion : on retire les plus anciens en premier.
  while (memoire.size > MAX_ENTREES) {
    const plusAncien = memoire.keys().next().value;
    if (plusAncien === undefined) break;
    memoire.delete(plusAncien);
  }
}

/**
 * Réserve un événement. Renvoie `false` s'il est déjà traité ou en cours :
 * l'appelant doit alors répondre 200 sans rien faire.
 */
export function reserver(id: string, maintenant = Date.now()): boolean {
  purger(maintenant);
  if (memoire.has(id)) return false;
  memoire.set(id, { etat: 'en-cours', depuis: maintenant });
  return true;
}

/** Le traitement a réussi : l'événement ne sera plus jamais retraité. */
export function marquerFait(id: string, maintenant = Date.now()): void {
  memoire.set(id, { etat: 'fait', depuis: maintenant });
}

/** Le traitement a échoué : libérer l'événement pour que le rejeu de Stripe le retraite. */
export function liberer(id: string): void {
  memoire.delete(id);
}
