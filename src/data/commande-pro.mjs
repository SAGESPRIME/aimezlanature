// @ts-check
/**
 * Commande revendeur : prix, minimum, livraison. Module PUR (testé par
 * tests/pro.test.mjs), utilisé par /api/pro/checkout — c'est lui qui fixe le
 * montant débité. La page /pro/ affiche les mêmes chiffres (public/js/pro.js).
 *
 * Conditions validées par le marchand (2026-11-24) :
 *   - −30 % sur les prix publics TTC ;
 *   - minimum 300 € de produits, après remise, hors livraison ;
 *   - livraison : tarif Colissimo selon le poids total (ni forfait ni gratuité).
 */
import { fraisLivraison } from './livraison.mjs';

export const REMISE_PRO = 0.3;
export const MINIMUM_PRO = 300;
/** Quantité maximale par produit dans une commande en ligne. */
export const QTE_MAX_PRO = 500;

const arrondi = (/** @type {number} */ n) => Math.round(n * 100) / 100;

/** Prix revendeur d'un produit, au centime. @param {number} prixPublic */
export const prixPro = (prixPublic) => arrondi(prixPublic * (1 - REMISE_PRO));

/**
 * @typedef {{ slug: string, name: string, shortName: string, priceCurrent: number, poids: number, inStock: boolean }} ProduitPro
 * @typedef {import('./livraison.mjs').ReglesLivraison} ReglesLivraison
 */

/**
 * @param {unknown} items panier reçu du navigateur : [{ slug, qty }]
 * @param {ProduitPro[]} catalogue
 * @param {ReglesLivraison} regles grille Colissimo des Réglages
 */
export function calculerCommandePro(items, catalogue, regles) {
  if (!Array.isArray(items) || items.length === 0) return { ok: false, erreur: 'Votre commande est vide.' };
  if (items.length > catalogue.length) return { ok: false, erreur: 'Commande invalide.' };
  const vus = new Set();
  const lignes = [];
  for (const item of items) {
    const slug = /** @type {any} */ (item)?.slug;
    const produit = catalogue.find((p) => p.slug === slug);
    if (!produit || vus.has(slug)) return { ok: false, erreur: 'Produit inconnu dans la commande.' };
    vus.add(slug);
    if (!produit.inStock) return { ok: false, erreur: `${produit.shortName} est en rupture de stock.` };
    const qty = Math.floor(Number(/** @type {any} */ (item)?.qty));
    if (!Number.isFinite(qty) || qty < 1 || qty > QTE_MAX_PRO) return { ok: false, erreur: 'Quantité invalide.' };
    const unit = prixPro(produit.priceCurrent);
    lignes.push({ slug, nom: produit.name, nomCourt: produit.shortName, qty, unit, total: arrondi(unit * qty), poids: produit.poids });
  }
  const sousTotal = arrondi(lignes.reduce((s, l) => s + l.total, 0));
  if (sousTotal < MINIMUM_PRO) {
    const manque = (MINIMUM_PRO - sousTotal).toFixed(2).replace('.', ',');
    return { ok: false, erreur: `Minimum de commande : ${MINIMUM_PRO} € de produits (il manque ${manque} €).` };
  }
  // Grille Colissimo dès le premier gramme : seuil du forfait à 0.
  const livraison = fraisLivraison(
    lignes.map((l) => ({ poids: l.poids, qty: l.qty, offerte: false })),
    { ...regles, poidsMaxForfait: 0 }
  );
  if (livraison.frais === null) {
    return { ok: false, erreur: 'Colis trop lourd pour un envoi en ligne (plus de 30 kg) : contactez-nous pour cette commande.' };
  }
  return { ok: true, lignes, sousTotal, poids: livraison.poids, livraison: livraison.frais, total: arrondi(sousTotal + livraison.frais) };
}
