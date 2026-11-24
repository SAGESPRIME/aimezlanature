/**
 * Limite anti-abus partagée par les routes /api/* qui coûtent quelque chose.
 *
 * Pourquoi : `/api/checkout` crée une session Stripe à chaque appel et n'a
 * AUCUN garde-fou aujourd'hui (un POST JSON sans en-tête `Origin` est accepté).
 * `/api/avis` et `/api/revendeur` envoient un email au marchand ; ils ont déjà
 * le piège + le délai de `antispam.ts`, cette limite est une seconde barrière.
 *
 * ⚠️ `/api/stripe-webhook` N'EST PAS LIMITÉ, volontairement. Stripe ne suit pas
 * les redirections et considère toute réponse non-2xx comme un échec de
 * livraison : un 429 déclencherait des rejeux en boucle et casserait les emails
 * de confirmation de commande. Sa protection est ailleurs — signature HMAC et
 * fenêtre anti-rejeu de 5 minutes (`lib/stripe-signature.ts`).
 *
 * ── PORTÉE RÉELLE SUR LE VPS (depuis la migration Vercel → Coolify) ──────────
 * Le compteur vit en MÉMOIRE. Sur Vercel, chaque instance de fonction avait son
 * propre compteur : mesuré le 2026-07-30, 30 appels PARALLÈLES depuis une seule
 * IP passaient à 27 (≈ 3 instances × 10), la limite ne servait à rien.
 *
 * Sur le VPS, le site tourne dans UN SEUL processus Node (server.mjs) : un seul
 * compteur voit tous les appels, la rafale parallèle est donc bien plafonnée.
 * C'est le critère de `npm run check:ratelimit`, qui doit passer au vert sur la
 * recette. ⚠️ Cette garantie tombe si l'on lance plusieurs répliques du
 * conteneur : garder 1 réplique, ou passer à un compteur partagé.
 *
 * Seconde barrière, devant l'application : le middleware `ratelimit` de Traefik
 * (labels Coolify, voir docs/deploiement-coolify.md). Un appel bloqué à l'une
 * ou l'autre ne consomme PAS de budget d'API Stripe.
 *
 * POURQUOI C'EST IMPORTANT. Les limites d'API de Stripe sont comptées PAR
 * COMPTE (25 req/s en test, 100 req/s en réel). Une rafale non freinée
 * consommerait ce budget : les VRAIS clients ne pourraient plus payer pendant
 * qu'elle dure. Le risque est la disponibilité de la vente, pas le coût.
 */

import { cleDeLimite } from '../data/ip-client.mjs';

/** Fenêtre glissante simple : compteur + instant de réinitialisation. */
interface Compteur {
  nb: number;
  reinitialiseA: number;
}

const compteurs = new Map<string, Compteur>();

/**
 * Plafond du nombre de clés gardées en mémoire. Sans lui, une attaque répartie
 * sur des milliers d'IP ferait grossir la Map jusqu'à saturer la fonction —
 * la protection deviendrait elle-même le déni de service.
 */
const MAX_CLES = 5000;

/**
 * Retire les entrées expirées ; si le plafond est encore dépassé, évince les
 * plus ANCIENNES (une Map garde l'ordre d'insertion).
 *
 * Avant l'audit du 2026-11-24, on vidait TOUT au-delà du plafond : il suffisait
 * de créer 5 001 clés pour remettre à zéro la limite de tout le monde, y
 * compris celle d'un appelant déjà bloqué. L'éviction ne touche que les
 * compteurs les plus vieux, et on libère 10 % d'un coup pour ne pas refaire ce
 * travail à chaque appel.
 */
function nettoyer(maintenant: number): void {
  for (const [cle, c] of compteurs) {
    if (c.reinitialiseA <= maintenant) compteurs.delete(cle);
  }
  if (compteurs.size <= MAX_CLES) return;
  let aRetirer = compteurs.size - Math.floor(MAX_CLES * 0.9);
  for (const cle of compteurs.keys()) {
    if (aRetirer-- <= 0) break;
    compteurs.delete(cle);
  }
}

/**
 * IP de l'appelant, telle que décidée par `server.mjs` et transmise dans
 * l'en-tête interne `x-aln-client-ip`.
 *
 * Toute la logique de confiance (quel proxy croire, Traefik ou Cloudflare) vit
 * dans server.mjs, réglée par la variable CLIENT_IP_HEADER, et le serveur
 * efface cet en-tête s'il arrive du client. ⚠️ NE PAS revenir à la première
 * entrée de `x-forwarded-for` : sur un VPS, c'est le client qui l'écrit, et un
 * attaquant n'aurait qu'à changer de valeur à chaque appel pour échapper à la
 * limite. Contrôle : `npm run check:ratelimit` (rafale à IP falsifiées).
 *
 * Clé de comptage : l'IPv4 telle quelle, l'IPv6 réduite à son /64 (voir
 * src/data/ip-client.mjs). Une IP ABSENTE — ce qui n'arrive plus derrière
 * server.mjs, qui retombe sur l'adresse de la connexion — est comptée dans un
 * compteur commun « inconnue » : avant l'audit du 2026-11-24, elle laissait
 * tout passer, sans limite.
 */
function cleAppelant(request: Request): string {
  const ip = request.headers.get('x-aln-client-ip')?.trim();
  return ip ? cleDeLimite(ip) : 'inconnue';
}

export interface Verdict {
  /** Faux si la limite est dépassée. */
  autorise: boolean;
  /** Secondes à attendre avant de réessayer (pour l'en-tête `Retry-After`). */
  attendreS: number;
}

/**
 * Compte un appel et dit s'il est autorisé.
 *
 * @param request  requête entrante, pour en lire l'IP
 * @param nom      identifiant de la limite (une limite par route, pas de
 *                 compteur partagé : un flot sur le formulaire revendeur ne doit
 *                 pas bloquer les paiements)
 * @param max      nombre d'appels autorisés dans la fenêtre
 * @param fenetreS durée de la fenêtre, en secondes
 */
export function verifierLimite(
  request: Request,
  nom: string,
  max: number,
  fenetreS: number
): Verdict {
  try {
    const maintenant = Date.now();
    nettoyer(maintenant);

    const cle = `${nom}:${cleAppelant(request)}`;
    const actuel = compteurs.get(cle);

    if (!actuel || actuel.reinitialiseA <= maintenant) {
      compteurs.set(cle, { nb: 1, reinitialiseA: maintenant + fenetreS * 1000 });
      return { autorise: true, attendreS: 0 };
    }

    actuel.nb += 1;
    if (actuel.nb > max) {
      return {
        autorise: false,
        attendreS: Math.max(1, Math.ceil((actuel.reinitialiseA - maintenant) / 1000)),
      };
    }
    return { autorise: true, attendreS: 0 };
  } catch {
    // Un bug ici ne doit jamais empêcher un vrai client de payer : la
    // disponibilité de la vente primait déjà dans la version Cloudflare.
    return { autorise: true, attendreS: 0 };
  }
}

/** Réponse 429 normalisée, pour ne pas la réécrire dans chaque route. */
export function reponseTropDAppels(attendreS: number): Response {
  return new Response(
    JSON.stringify({ error: 'Trop de tentatives. Merci de réessayer dans un instant.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(attendreS),
      },
    }
  );
}

/**
 * Plafonds. Volontairement larges : ils doivent arrêter un script, jamais un
 * client. Un acheteur qui hésite et reclique « Payer » quelques fois reste très
 * en dessous de 10 appels par minute.
 */
export const PLAFONDS = {
  /** Création de session Stripe. */
  checkout: { max: 10, fenetreS: 60 },
  /** Formulaires qui envoient un email au marchand. */
  formulaire: { max: 5, fenetreS: 60 },
} as const;
