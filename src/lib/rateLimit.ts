/**
 * Limite anti-abus partagée par les routes /api/*.
 *
 * Pourquoi : /api/revendeur envoie un email à chaque appel et /api/checkout
 * crée une session Stripe. Sans garde-fou, un script peut inonder la boîte du
 * marchand ou créer des sessions en boucle. On s'appuie sur le limiteur natif
 * de Cloudflare (binding « ratelimit » déclaré dans wrangler.jsonc), keyé sur
 * l'adresse IP de l'appelant.
 *
 * Un seul fichier = une seule règle à maintenir : les deux routes appellent
 * `verifierLimite`, il n'y a pas de logique recopiée d'un endpoint à l'autre.
 */

/** Forme minimale d'un binding rate limit Cloudflare. */
export interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

/**
 * Renvoie `true` si la requête est autorisée, `false` si la limite est
 * dépassée. Si le binding est absent (dev local, preview sans binding), on
 * laisse passer : la protection réelle vit dans le Worker de production.
 *
 * @param limiter binding lu dans l'environnement Cloudflare, peut être `undefined`
 * @param request requête entrante (sert à lire l'IP `CF-Connecting-IP`)
 */
export async function verifierLimite(
  limiter: RateLimiter | undefined,
  request: Request
): Promise<boolean> {
  if (!limiter) return true;
  const ip = request.headers.get('CF-Connecting-IP') ?? 'anonyme';
  try {
    const { success } = await limiter.limit({ key: ip });
    return success;
  } catch {
    // Si le service de limitation est momentanément indisponible, on ne bloque
    // pas un vrai client : la disponibilité prime sur la protection anti-spam.
    return true;
  }
}
