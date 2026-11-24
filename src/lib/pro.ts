/**
 * Espace revendeurs — côté serveur (routes /api/pro/*, pages /pro/*).
 *
 * Parcours :
 *   1. /revendeurs/ : candidature → document Sanity « revendeurs.<uuid> »
 *      (statut « en attente »), PRIVÉ (identifiant à point = illisible sans
 *      jeton) + email au marchand.
 *   2. Le marchand passe le statut à « Validé » dans le Studio. Toutes les
 *      5 minutes, server.mjs appelle /api/taches : chaque revendeur
 *      validé sans lien envoyé reçoit son LIEN DE CONNEXION (signé, 7 jours).
 *      Il peut en redemander un sur /pro/connexion/.
 *   3. Le lien ouvre une session (cookie signé, 30 jours) → /pro/ : commande à
 *      −30 %, minimum 300 €, Colissimo au poids (src/data/commande-pro.mjs).
 *   À chaque page et à chaque paiement, le statut est relu dans Sanity (cache
 *   60 s) : « Suspendu » ou « Refusé » coupe l'accès sans attendre.
 *
 * Variables d'environnement :
 *   SANITY_WRITE_TOKEN  jeton Sanity « Editor » (création des candidatures,
 *                       lecture des documents privés, date d'envoi du lien)
 *   PRO_SECRET          ≥ 32 caractères : signature des liens et sessions
 *   ENVOIS_AUTOMATIQUES=1  sur UN SEUL environnement : envoie les liens
 *                       (ancien nom PRO_INVITATIONS=1, voir sanity-prive.ts)
 */
import { randomUUID } from 'node:crypto';
import { sanityPrive, envoisAutomatiques } from './sanity-prive';
import type { AstroCookies } from 'astro';
import { signerJeton, verifierJeton } from '../data/jeton-pro.mjs';
import { envoyerEmail, echapperHtml, EMAIL_MARCHAND } from './email';
import { origineSite } from './origine';

export const COOKIE_PRO = 'aln_pro';
const DUREE_LIEN_S = 7 * 24 * 3600;
const DUREE_SESSION_S = 30 * 24 * 3600;
const CACHE_STATUT_MS = 60_000;

export interface Revendeur {
  _id: string;
  statut: 'en_attente' | 'valide' | 'refuse' | 'suspendu';
  boutique?: string;
  contact?: string;
  email?: string;
  accesEnvoyeLe?: string;
}

export const espaceProConfigure = (): boolean =>
  Boolean(sanityPrive() && (process.env.PRO_SECRET ?? '').length >= 32);

const CHAMPS = '{_id, statut, boutique, contact, email, accesEnvoyeLe}';

/** Enregistre une candidature (statut « en attente »). Renvoie l'identifiant, ou null. */
export async function creerCandidature(d: Record<string, string>): Promise<string | null> {
  const sanity = sanityPrive();
  if (!sanity) return null;
  const _id = `revendeurs.${randomUUID()}`;
  await sanity.create({
    _id,
    _type: 'revendeur',
    statut: 'en_attente',
    dateCandidature: new Date().toISOString(),
    boutique: d.boutique,
    contact: d.contact,
    email: d.email.toLowerCase(),
    telephone: d.telephone,
    siret: d.siret,
    activite: d.activite,
    volume: d.volume,
    message: d.message,
  });
  return _id;
}

const cache = new Map<string, { r: Revendeur | null; t: number }>();

/** Revendeur par identifiant, statut à jour (cache 60 s). */
export async function revendeur(id: string): Promise<Revendeur | null> {
  const enCache = cache.get(id);
  if (enCache && Date.now() - enCache.t < CACHE_STATUT_MS) return enCache.r;
  const sanity = sanityPrive();
  if (!sanity) return null;
  const r = await sanity.fetch<Revendeur | null>(`*[_id == $id][0]${CHAMPS}`, { id });
  if (cache.size > 2000) cache.clear();
  cache.set(id, { r, t: Date.now() });
  return r;
}

/** Revendeur VALIDÉ dont c'est l'email, ou null. */
export async function revendeurValideParEmail(email: string): Promise<Revendeur | null> {
  const sanity = sanityPrive();
  if (!sanity) return null;
  return sanity.fetch<Revendeur | null>(
    `*[_type == "revendeur" && _id in path("revendeurs.**") && email == $email && statut == "valide"][0]${CHAMPS}`,
    { email: email.trim().toLowerCase() }
  );
}

/** Session revendeur valide (cookie signé ET statut « validé » en direct), ou null. */
export async function sessionPro(cookies: AstroCookies): Promise<Revendeur | null> {
  const jeton = verifierJeton(cookies.get(COOKIE_PRO)?.value, process.env.PRO_SECRET, 'session');
  if (!jeton) return null;
  const r = await revendeur(jeton.id);
  return r?.statut === 'valide' ? r : null;
}

export function ouvrirSession(cookies: AstroCookies, id: string): void {
  cookies.set(COOKIE_PRO, signerJeton({ id, type: 'session' }, process.env.PRO_SECRET ?? '', DUREE_SESSION_S), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: DUREE_SESSION_S,
  });
}

export function fermerSession(cookies: AstroCookies): void {
  cookies.delete(COOKIE_PRO, { path: '/' });
}

/** Envoie au revendeur son lien de connexion (valable 7 jours). */
export async function envoyerLien(r: Revendeur): Promise<boolean> {
  if (!r.email) return false;
  const jeton = signerJeton({ id: r._id, type: 'lien' }, process.env.PRO_SECRET ?? '', DUREE_LIEN_S);
  const lien = `${origineSite()}/api/pro/entrer?jeton=${encodeURIComponent(jeton)}`;
  const nom = r.contact?.split(/\s+/)[0] ?? '';
  const envoi = await envoyerEmail({
    to: r.email,
    replyTo: EMAIL_MARCHAND,
    subject: 'Votre accès revendeur Aimez la Nature',
    text: `Bonjour ${nom},\n\nVotre compte revendeur est validé. Vos conditions : −30 % sur nos prix publics, minimum 300 € de produits par commande, livraison Colissimo selon le poids.\n\nAccédez à votre espace pour commander (lien valable 7 jours) :\n${lien}\n\nPassé ce délai, demandez un nouveau lien sur ${origineSite()}/pro/connexion/\n\nAimez la Nature`,
    html: `<p>Bonjour ${echapperHtml(nom)},</p>
<p>Votre compte revendeur est <strong>validé</strong>. Vos conditions : <strong>−30 %</strong> sur nos prix publics, minimum <strong>300 €</strong> de produits par commande, livraison Colissimo selon le poids.</p>
<p><a href="${echapperHtml(lien)}" style="display:inline-block;background:#237F2C;color:#ffffff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600;">Accéder à mon espace revendeur</a></p>
<p style="color:#5E5A66;font-size:14px;">Lien valable 7 jours. Passé ce délai, demandez-en un nouveau sur <a href="${origineSite()}/pro/connexion/">${origineSite()}/pro/connexion/</a>.</p>
<p>Aimez la Nature</p>`,
  });
  return envoi.ok;
}

/**
 * Envoie le lien à chaque revendeur validé qui ne l'a pas encore reçu, et note
 * la date d'envoi (au plus 20 par passage). Appelé par /api/taches.
 */
export async function envoyerInvitations(): Promise<number> {
  const sanity = sanityPrive();
  if (!sanity || !envoisAutomatiques()) return 0;
  const aInviter = await sanity.fetch<Revendeur[]>(
    `*[_type == "revendeur" && _id in path("revendeurs.**") && statut == "valide" && !defined(accesEnvoyeLe)][0...20]${CHAMPS}`
  );
  let envoyes = 0;
  for (const r of aInviter) {
    if (await envoyerLien(r)) {
      await sanity.patch(r._id).set({ accesEnvoyeLe: new Date().toISOString() }).commit();
      envoyes++;
    } else {
      console.error(`[pro] lien non envoyé à ${r._id}`);
    }
  }
  return envoyes;
}
