/**
 * Vérification de la signature des webhooks Stripe.
 *
 * ⚠️ POURQUOI C'EST INDISPENSABLE
 * L'adresse /api/stripe-webhook est publique : n'importe qui peut lui envoyer
 * un message prétendant qu'une commande a été payée. Sans cette vérification,
 * un inconnu déclencherait des emails de confirmation à volonté, et demain
 * ferait entrer de faux clients dans le fichier de relance.
 *
 * Stripe signe chaque message avec un secret partagé (STRIPE_WEBHOOK_SECRET).
 * On recalcule la signature de notre côté et on compare.
 *
 * Écrit à la main plutôt qu'avec le SDK Stripe : le projet n'a aucune
 * dépendance de fournisseur (checkout.ts et avis.ts appellent l'API Stripe
 * avec `fetch`), et une trentaine de lignes évitent d'ajouter un paquet npm.
 */

/** Écart maximum toléré entre l'horodatage du message et maintenant. */
const TOLERANCE_SECONDES = 300;

/**
 * Comparaison à temps constant.
 *
 * Un `===` classique s'arrête au premier caractère différent : le temps de
 * réponse renseignerait alors un attaquant sur le nombre de caractères déjà
 * devinés, lui permettant de reconstituer la signature octet par octet.
 * Ici, toutes les positions sont toujours parcourues.
 */
function comparaisonConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return difference === 0;
}

/** Calcule la signature HMAC-SHA256 attendue, en hexadécimal. */
async function signer(charge: string, secret: string): Promise<string> {
  const encodeur = new TextEncoder();
  const cle = await crypto.subtle.importKey(
    'raw',
    encodeur.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cle, encodeur.encode(charge));
  return [...new Uint8Array(signature)]
    .map((octet) => octet.toString(16).padStart(2, '0'))
    .join('');
}

export type EchecSignature = 'entete-absente' | 'entete-illisible' | 'trop-ancienne' | 'invalide';

export type VerdictSignature = { valide: true } | { valide: false; raison: EchecSignature };

/**
 * Vérifie l'en-tête `stripe-signature`.
 *
 * @param corpsBrut Le corps de la requête EXACTEMENT tel que reçu. La signature
 *   porte sur les octets bruts : le passer par `JSON.parse` puis
 *   `JSON.stringify` réordonnerait les clés et invaliderait la vérification.
 *   L'appelant doit donc lire `await request.text()` AVANT toute analyse.
 */
export async function verifierSignature(
  corpsBrut: string,
  enteteSignature: string | null,
  secret: string
): Promise<VerdictSignature> {
  if (!enteteSignature) return { valide: false, raison: 'entete-absente' };

  // Format Stripe : « t=1699999999,v1=abc...,v0=def... »
  let horodatage = '';
  const signaturesV1: string[] = [];
  for (const partie of enteteSignature.split(',')) {
    const separateur = partie.indexOf('=');
    if (separateur === -1) continue;
    const cle = partie.slice(0, separateur).trim();
    const valeur = partie.slice(separateur + 1).trim();
    if (cle === 't') horodatage = valeur;
    else if (cle === 'v1') signaturesV1.push(valeur);
  }

  if (!horodatage || signaturesV1.length === 0) {
    return { valide: false, raison: 'entete-illisible' };
  }

  // Fenêtre temporelle : sans elle, un message intercepté resterait rejouable
  // indéfiniment, avec sa signature authentique.
  const secondes = Number(horodatage);
  if (!Number.isFinite(secondes)) return { valide: false, raison: 'entete-illisible' };
  const ecart = Math.abs(Date.now() / 1000 - secondes);
  if (ecart > TOLERANCE_SECONDES) return { valide: false, raison: 'trop-ancienne' };

  const attendue = await signer(`${horodatage}.${corpsBrut}`, secret);

  // Stripe peut envoyer plusieurs signatures v1 pendant une rotation de secret :
  // une seule correspondance suffit.
  const correspond = signaturesV1.some((candidate) => comparaisonConstante(candidate, attendue));

  return correspond ? { valide: true } : { valide: false, raison: 'invalide' };
}
