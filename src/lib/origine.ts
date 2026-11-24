import { SITE } from '../data/products';

/**
 * Adresse publique du site (« https://aimezlanature.fr », sans « / » final),
 * pour toute URL ABSOLUE fabriquée par le serveur : retour après paiement
 * Stripe (`success_url`, `cancel_url`), liens des emails.
 *
 * ⚠️ NE PAS utiliser `url.origin` dans une route : sans `security.allowedDomains`,
 * Astro ne fait pas confiance à l'en-tête Host et renvoie
 * « http://localhost:4321 ». Constaté le 2026-11-24 sur la recette : après
 * paiement, Stripe renvoyait le client vers localhost (signalé par l'audit du
 * même jour). L'adresse vient donc de la configuration, jamais de la requête.
 *
 * Par défaut `SITE.url` (réglages Sanity) ; sur la recette, `SITE_URL` (ou
 * l'ancien nom `EMAIL_SITE_URL`) = https://recette.aimezlanature.fr.
 */
export function origineSite(): string {
  return (process.env.SITE_URL ?? process.env.EMAIL_SITE_URL ?? SITE.url).replace(/\/$/, '');
}
