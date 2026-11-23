/**
 * Reconstruction du site après une publication dans Sanity.
 *
 * Le site est construit AU BUILD à partir de Sanity : une modification dans le
 * Studio n'apparaît qu'après une reconstruction. Sanity prévient le site par un
 * webhook signé (src/pages/api/reconstruction.ts), qui appelle ce module ; ce
 * module demande ensuite le déploiement à Coolify.
 *
 * POURQUOI REGROUPER. Sanity envoie un webhook PAR document modifié : publier
 * dix avis d'affilée en enverrait dix, donc dix builds en file d'attente sur le
 * VPS. On attend un moment de calme (45 s sans nouvel événement) avant de
 * lancer UN déploiement, qui prend tout en compte ; et on ne retarde jamais
 * plus de 3 minutes, même si les publications s'enchaînent sans pause.
 *
 * Fiable parce que le site tourne dans UN seul processus Node (même raison que
 * le limiteur anti-abus, src/lib/rateLimit.ts). Si le processus redémarre
 * pendant l'attente — par exemple parce qu'un déploiement se termine —, la
 * demande en cours est perdue : la prochaine publication en refera une, et
 * Coolify peut toujours être relancé à la main.
 *
 * POURQUOI UN RELAIS plutôt que Sanity → Coolify en direct : le jeton Coolify
 * reste sur notre serveur. Sanity ne connaît qu'un secret de signature, qui ne
 * permet rien d'autre que de demander une reconstruction.
 */

/** Calme attendu après le dernier événement avant de déployer. */
export const ATTENTE_CALME_MS = 45_000;
/** Délai maximum entre le premier événement et le déploiement. */
export const ATTENTE_MAX_MS = 180_000;
/** Délai avant la seconde tentative si l'appel à Coolify échoue. */
export const NOUVEL_ESSAI_MS = 60_000;

export interface ConfigReconstruction {
  /** Ex. https://coolify.presencebusiness.com/api/v1 */
  apiUrl: string;
  /** Identifiant de l'application Coolify à redéployer. */
  uuidApplication: string;
  /** Jeton Coolify limité à la permission « deploy ». */
  jeton: string;
}

/** Lit la configuration dans l'environnement ; null si incomplète. */
export function configDepuisEnv(env: NodeJS.ProcessEnv = process.env): ConfigReconstruction | null {
  const apiUrl = env.COOLIFY_API_URL?.replace(/\/$/, '');
  const uuidApplication = env.COOLIFY_APP_UUID;
  const jeton = env.COOLIFY_DEPLOY_TOKEN;
  return apiUrl && uuidApplication && jeton ? { apiUrl, uuidApplication, jeton } : null;
}

type Minuterie = ReturnType<typeof setTimeout>;

/** Dépendances injectables, pour tester sans réseau ni attente réelle. */
export interface Outils {
  fetch: typeof fetch;
  maintenant: () => number;
  programmer: (fn: () => void, ms: number) => Minuterie;
  annuler: (m: Minuterie) => void;
  journal: Pick<Console, 'log' | 'error'>;
}

const outilsReels: Outils = {
  fetch: (...a) => fetch(...a),
  maintenant: () => Date.now(),
  programmer: (fn, ms) => setTimeout(fn, ms),
  annuler: (m) => clearTimeout(m),
  journal: console,
};

/** Crée un planificateur indépendant (un seul est utilisé par le site). */
export function creerPlanificateur(config: ConfigReconstruction, outils: Outils = outilsReels) {
  let minuterie: Minuterie | null = null;
  let premierEvenement: number | null = null;
  let evenements = 0;

  async function deployer(tentative = 1): Promise<void> {
    const url = `${config.apiUrl}/deploy?uuid=${encodeURIComponent(config.uuidApplication)}&force=false`;
    try {
      const res = await outils.fetch(url, { headers: { Authorization: `Bearer ${config.jeton}` } });
      if (!res.ok) throw new Error(`Coolify a répondu ${res.status}`);
      outils.journal.log(`[reconstruction] déploiement demandé à Coolify (${evenements} événement(s) regroupé(s))`);
      evenements = 0;
    } catch (e) {
      outils.journal.error(`[reconstruction] échec de la demande de déploiement (essai ${tentative}) :`, e);
      if (tentative < 2) outils.programmer(() => void deployer(tentative + 1), NOUVEL_ESSAI_MS);
    }
  }

  function declencher() {
    minuterie = null;
    premierEvenement = null;
    void deployer();
  }

  return {
    /** Signale une publication ; le déploiement partira au moment opportun. */
    signaler(): void {
      const t = outils.maintenant();
      evenements++;
      premierEvenement ??= t;
      if (minuterie) outils.annuler(minuterie);
      const restantAvantMax = premierEvenement + ATTENTE_MAX_MS - t;
      minuterie = outils.programmer(declencher, Math.max(0, Math.min(ATTENTE_CALME_MS, restantAvantMax)));
    },
    /** Un déploiement est-il en attente ? (pour les tests et la supervision) */
    enAttente: (): boolean => minuterie !== null,
  };
}

let planificateur: ReturnType<typeof creerPlanificateur> | null = null;

/** Planificateur du site, créé à la première utilisation ; null si non configuré. */
export function planificateurDuSite() {
  if (!planificateur) {
    const config = configDepuisEnv();
    if (config) planificateur = creerPlanificateur(config);
  }
  return planificateur;
}
