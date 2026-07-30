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
 * ── PORTÉE RÉELLE, MESURÉE LE 2026-07-30 — À LIRE AVANT D'Y COMPTER ──────────
 * Le compteur vit en MÉMOIRE, donc par instance de fonction. Mesuré sur la
 * production, 30 appels, même IP, même région (cdg1) :
 *
 *   en série     → 10 passent, 20 bloqués en 429.  La limite tient.
 *   en parallèle → 27 passent,  0 bloqué.          La limite ne sert à RIEN.
 *
 * Vercel démarre autant d'instances que nécessaire pour absorber la charge, et
 * chacune a son propre compteur qui repart de `max` : les 27 passages
 * correspondent à ~3 instances × 10. D'où une propriété perverse — plus
 * l'attaque est forte, plus il y a d'instances, donc plus le plafond effectif
 * monte. La protection grandit avec l'attaquant.
 *
 * Il n'y a donc PAS besoin de se répartir sur plusieurs IP ni plusieurs régions
 * pour passer : le parallélisme depuis une seule machine suffit. Ce fichier
 * affirmait le contraire avant que ce soit mesuré.
 *
 * CE QU'UNE RAFALE CASSE VRAIMENT. Les limites d'API de Stripe sont comptées
 * PAR COMPTE (25 req/s en test, 100 req/s en réel, 25 req/s par endpoint par
 * défaut). Sur les 30 appels parallèles, 3 ont reçu « Stripe: Request rate limit
 * exceeded » et sont ressortis en 502. Après la bascule, une rafale suffisante
 * consommerait donc le budget Stripe du compte : les VRAIS clients ne
 * pourraient plus payer pendant qu'elle dure. Le risque est la disponibilité de
 * la vente, pas seulement le coût.
 *
 * Ce que ce limiteur arrête réellement : une boucle séquentielle. C'est tout.
 * Il reste utile — zéro dépendance, indépendant du plan, et un appel bloqué ici
 * ne consomme PAS de budget d'API Stripe — mais il ne peut pas être la seule
 * protection.
 *
 * Le mur, c'est une règle de rate limiting du pare-feu Vercel : elle compte
 * côté plateforme (par région, non par instance) et agit AVANT le démarrage de
 * la fonction. Vérifié dans la doc : disponible dès le plan Hobby — 1 règle par
 * projet, clé IP, fenêtre de 10 s à 10 min, 1 000 000 de requêtes incluses, et
 * le trafic bloqué n'est pas facturé. Le plan n'est donc PAS l'obstacle qu'on
 * croyait (c'est lui qui avait tué la version Cloudflare). Mode opératoire dans
 * `docs/audit/rapport-pre-bascule-2026-07-29.md`, section « Le mur ».
 * Les deux se cumulent : garder celui-ci comme filet, il survit à la
 * suppression accidentelle de la règle de pare-feu.
 *
 * Version précédente : `dcccb08` s'appuyait sur le binding Cloudflare
 * `ratelimits`, reverté en `04dc9fd` faute de plan confirmé, puis rendu
 * inutilisable par la migration vers Vercel. La logique (clé = IP, fail-open si
 * indisponible) est reprise ici ; seul le mécanisme change.
 */

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

/** Retire les entrées expirées, et vide tout si le plafond est atteint. */
function nettoyer(maintenant: number): void {
  for (const [cle, c] of compteurs) {
    if (c.reinitialiseA <= maintenant) compteurs.delete(cle);
  }
  // Toujours au-dessus du plafond après nettoyage : on repart de zéro plutôt
  // que de grossir indéfiniment. Fail-open assumé, cf. en-tête du fichier.
  if (compteurs.size > MAX_CLES) compteurs.clear();
}

/**
 * IP de l'appelant. Sur Vercel, `x-forwarded-for` est réécrit par la plateforme
 * et les valeurs fournies par le client ne sont PAS transmises (documenté :
 * « Vercel overwrites this header and does not forward external IPs to prevent
 * spoofing »). La clé n'est donc pas falsifiable par l'appelant.
 *
 * Une IP absente renvoie `null` : l'appelant n'est pas identifiable, on ne peut
 * pas compter, on laisse passer (cf. fail-open).
 */
function ipDe(request: Request): string | null {
  const brut = request.headers.get('x-forwarded-for');
  if (!brut) return null;
  const premiere = brut.split(',')[0]?.trim();
  return premiere && premiere.length > 0 ? premiere : null;
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
    const ip = ipDe(request);
    if (!ip) return { autorise: true, attendreS: 0 };

    const maintenant = Date.now();
    nettoyer(maintenant);

    const cle = `${nom}:${ip}`;
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
