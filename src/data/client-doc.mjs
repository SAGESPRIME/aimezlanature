/**
 * Fiche « client » du Studio — logique pure (sans réseau), testée par
 * tests/clients.test.mjs.
 *
 * Une fiche par adresse email, identifiant « clients.<empreinte de l'email> » :
 *   - le POINT rend le document illisible sans jeton, même dans un dataset
 *     public (comme commandes.* et revendeurs.*) ;
 *   - l'email n'apparaît pas en clair dans l'identifiant ;
 *   - un même email donne toujours la même fiche (pas de doublon entre
 *     l'import WooCommerce et les nouvelles commandes du site).
 * Les paiements de TEST ont leur propre fiche (« clients.test.<empreinte> ») :
 * ils ne gonflent jamais les chiffres d'un vrai client.
 */
import { createHash } from 'node:crypto';

/** Statuts emailing, modifiables dans le Studio. */
export const STATUTS_EMAILS = ['client_existant', 'hors_delai', 'desinscrit'];

/**
 * Emails aux clients existants (CNIL, « soft opt-in ») : permis pendant 3 ans
 * après le dernier achat, pour des produits analogues, avec désinscription.
 */
export const DELAI_PROSPECTION_ANS = 3;

/** @param {unknown} email */
export function normaliserEmail(email) {
  const e = String(email ?? '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

/**
 * @param {string} email
 * @param {{ test?: boolean }} [options]
 */
export function idClient(email, options = {}) {
  const e = normaliserEmail(email);
  if (!e) throw new Error('Email client invalide.');
  const empreinte = createHash('sha256').update(e).digest('hex').slice(0, 24);
  return options.test ? `clients.test.${empreinte}` : `clients.${empreinte}`;
}

/** Référence (faible) d'une commande vers sa fiche client. */
export const refClient = (/** @type {string} */ id) => ({ _type: 'reference', _ref: id, _weak: true });

/**
 * Statut emailing d'après la date du dernier achat.
 * @param {string | undefined} derniereCommande  ISO
 * @param {Date} [maintenant]
 */
export function statutEmailsSelonDate(derniereCommande, maintenant = new Date()) {
  if (!derniereCommande) return 'hors_delai';
  const limite = new Date(maintenant);
  limite.setFullYear(limite.getFullYear() - DELAI_PROSPECTION_ANS);
  return new Date(derniereCommande) >= limite ? 'client_existant' : 'hors_delai';
}

/** Pays en code à deux lettres (« France » → « FR ») ; inconnu → texte tel quel. */
const PAYS = {
  france: 'FR', belgique: 'BE', suisse: 'CH', luxembourg: 'LU', italie: 'IT', espagne: 'ES', portugal: 'PT',
  allemagne: 'DE', 'pays-bas': 'NL', 'royaume-uni': 'GB', 'united kingdom': 'GB', canada: 'CA', 'états-unis': 'US',
  monaco: 'MC', irlande: 'IE', autriche: 'AT', 'la réunion': 'RE', martinique: 'MQ', guadeloupe: 'GP',
};
export function codePays(/** @type {unknown} */ pays) {
  const p = String(pays ?? '').trim();
  if (!p) return undefined;
  if (/^[A-Za-z]{2}$/.test(p)) return p.toUpperCase();
  return PAYS[/** @type {keyof typeof PAYS} */ (p.toLowerCase())] ?? p;
}

const arrondi = (/** @type {number} */ n) => Math.round(n * 100) / 100;

/** Ville et code postal depuis l'adresse de la commande (« 93260 Les Lilas »). */
export function villeDepuisAdresse(/** @type {string[] | undefined} */ adresse) {
  for (const ligne of adresse ?? []) {
    const m = /^(\d{4,5})\s+(.+)$/.exec(ligne.trim());
    if (m) return { codePostal: m[1], ville: m[2] };
  }
  return {};
}

/**
 * Ce qu'une commande payée du site change sur la fiche client :
 *   `base`  document créé s'il n'existe pas encore (createIfNotExists) ;
 *   `inc`, `set`, `setIfMissing`  patch appliqué ensuite.
 * Renvoie null pour une commande sans email.
 * @param {ReturnType<typeof import('./commande-doc.mjs').documentCommande>} commande
 */
export function majClientDepuisCommande(commande) {
  const email = normaliserEmail(commande?.client?.email);
  if (!email) return null;
  const test = commande.modeTest === true;
  const _id = idClient(email, { test });
  const lieu = villeDepuisAdresse(commande.livraison?.adresse);
  const pays = commande.livraison?.adresse?.at(-1);
  return {
    base: {
      _id,
      _type: 'client',
      email,
      origine: 'site',
      nbCommandes: 0,
      depense: 0,
      emails: 'client_existant',
      modeTest: test,
    },
    inc: { nbCommandes: 1, depense: arrondi(Number(commande.total ?? 0)) },
    set: {
      derniereCommande: commande.date,
      ...(commande.client?.nom ? { nom: commande.client.nom } : {}),
      ...lieu,
      ...(pays && /^[A-Z]{2}$/.test(pays) ? { pays } : {}),
      ...(commande.source === 'revendeur' ? { revendeur: true } : {}),
    },
    setIfMissing: { premiereCommande: commande.date },
  };
}

// ── Import des clients WooCommerce (une fois, scripts/clients/) ──────────

/**
 * Agrège les commandes WooCommerce PAYÉES par email.
 * @param {{ email: string, date: string, total: number, numero: string, nom?: string, ville?: string, codePostal?: string, pays?: string }[]} commandes
 */
export function agregerCommandes(commandes) {
  /** @type {Map<string, any>} */
  const parEmail = new Map();
  for (const c of [...commandes].sort((a, b) => a.date.localeCompare(b.date))) {
    const email = normaliserEmail(c.email);
    if (!email) continue;
    const f = parEmail.get(email) ?? { email, nbCommandes: 0, depense: 0, historique: [] };
    f.nbCommandes++;
    f.depense = arrondi(f.depense + c.total);
    f.premiereCommande ??= c.date;
    f.derniereCommande = c.date;
    // Coordonnées de la commande la plus récente.
    if (c.nom) f.nom = c.nom;
    if (c.ville) f.ville = c.ville;
    if (c.codePostal) f.codePostal = c.codePostal;
    if (c.pays) f.pays = c.pays;
    f.historique.push({ _key: `w${f.historique.length}`, date: c.date, numero: c.numero, total: arrondi(c.total) });
    parEmail.set(email, f);
  }
  return parEmail;
}

/**
 * Lignes du rapport clients WooCommerce dédoublonnées par email (l'export
 * contient des lignes en double identiques : on garde le maximum, sans somme).
 * @param {Record<string, string>[]} lignes
 */
export function agregerRapportClients(lignes) {
  /** @type {Map<string, any>} */
  const parEmail = new Map();
  for (const l of lignes) {
    const email = normaliserEmail(l['E-mail']);
    if (!email) continue;
    const n = Number.parseInt(l['Commandes'] || '0', 10) || 0;
    const d = Number.parseFloat(l['Dépense totale'] || '0') || 0;
    const prec = parEmail.get(email);
    if (prec && prec.nbCommandes >= n && prec.depense >= d) continue;
    parEmail.set(email, {
      email,
      nbCommandes: Math.max(n, prec?.nbCommandes ?? 0),
      depense: arrondi(Math.max(d, prec?.depense ?? 0)),
      nom: l['Nom']?.trim() || prec?.nom,
      ville: l['Ville']?.trim() || prec?.ville,
      codePostal: l['Code postal']?.trim() || prec?.codePostal,
      pays: l['Pays/région']?.trim() || prec?.pays,
      derniereActivite: l['Dernière activité']?.trim() || prec?.derniereActivite,
    });
  }
  return parEmail;
}

/**
 * Fiches à importer : tout email qui a PAYÉ au moins une commande, selon les
 * commandes (payées) de l'export WordPress ou le rapport clients. Les
 * commandes font foi pour les chiffres et les dates (elles incluent les
 * commandes reprises de l'ancienne boutique, absentes du rapport) ; le rapport
 * complète ce qui manque.
 * @param {Map<string, any>} rapport  agregerRapportClients()
 * @param {Map<string, any>} commandes  agregerCommandes()
 * @param {Date} [maintenant]
 */
export function fichesImport(rapport, commandes, maintenant = new Date()) {
  const emails = new Set([...commandes.keys(), ...[...rapport].filter(([, r]) => r.nbCommandes > 0).map(([e]) => e)]);
  const fiches = [];
  for (const email of [...emails].sort()) {
    const c = commandes.get(email);
    const r = rapport.get(email);
    const derniere = c?.derniereCommande ?? r?.derniereActivite;
    const pays = codePays(c?.pays || r?.pays);
    fiches.push({
      _id: idClient(email),
      _type: 'client',
      email,
      nom: c?.nom || r?.nom || undefined,
      ville: c?.ville || r?.ville || undefined,
      codePostal: c?.codePostal || r?.codePostal || undefined,
      pays,
      nbCommandes: c ? c.nbCommandes : r.nbCommandes,
      depense: c ? c.depense : r.depense,
      premiereCommande: c?.premiereCommande,
      derniereCommande: derniere,
      origine: 'woocommerce',
      emails: statutEmailsSelonDate(derniere, maintenant),
      historiqueWoo: c?.historique ?? [],
      modeTest: false,
    });
  }
  return fiches.map((f) => Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined)));
}
