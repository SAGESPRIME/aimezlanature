import type { Product } from '../data/products';

/**
 * Paliers de remise par quantité — le levier de conversion principal des
 * fiches produit (repris de la boutique de référence : -15 % à 2 unités,
 * -20 % à 3).
 *
 * Source unique : les fiches produit, le panier et le tunnel Stripe calculent
 * tous le prix ici. Une remise ne peut donc pas différer entre l'affichage et
 * le montant réellement débité.
 */
export interface Tier {
  /** Nombre d'unités du palier. */
  qty: number;
  /** Remise appliquée, en pourcentage entier. */
  discountPercent: number;
  /** Mis en avant visuellement (« Le plus populaire »). */
  highlight: boolean;
  label: string;
}

export const TIERS: Tier[] = [
  { qty: 1, discountPercent: 0, highlight: false, label: 'Achetez 1' },
  { qty: 2, discountPercent: 15, highlight: true, label: 'Achetez 2 & économisez' },
  { qty: 3, discountPercent: 20, highlight: false, label: 'Achetez 3 & économisez' },
];

/** Arrondi au centime — évite les écarts d'un centime entre affichage et paiement. */
const round2 = (n: number) => Math.round(n * 100) / 100;

export interface TierPrice {
  qty: number;
  discountPercent: number;
  highlight: boolean;
  label: string;
  /** Prix unitaire remisé. */
  unitPrice: number;
  /** Total du palier. */
  total: number;
  /** Total sans remise, pour l'affichage barré. */
  totalBeforeDiscount: number;
  /** Montant économisé par rapport au prix unitaire courant. */
  saving: number;
}

export function tierPrices(product: Product): TierPrice[] {
  return TIERS.map((t) => {
    const unitPrice = round2(product.priceCurrent * (1 - t.discountPercent / 100));
    const totalBeforeDiscount = round2(product.priceCurrent * t.qty);
    const total = round2(unitPrice * t.qty);
    return {
      ...t,
      unitPrice,
      total,
      totalBeforeDiscount,
      saving: round2(totalBeforeDiscount - total),
    };
  });
}

/**
 * Prix unitaire appliqué pour une quantité donnée : on prend le meilleur
 * palier atteint. Au-delà de 3 unités, la remise maximale reste acquise.
 */
export function unitPriceFor(product: Product, qty: number): number {
  const best = [...TIERS]
    .filter((t) => qty >= t.qty)
    .sort((a, b) => b.discountPercent - a.discountPercent)[0];
  return round2(product.priceCurrent * (1 - (best?.discountPercent ?? 0) / 100));
}

export const fmtPrice = (n: number) => n.toFixed(2).replace('.', ',');

/**
 * Palier suivant non encore atteint, pour la relance « Ajoutez encore N
 * produit(s) pour passer à -X % ». Renvoie null au palier maximum.
 */
export function nextTier(qty: number): { missing: number; discountPercent: number } | null {
  const next = TIERS.filter((t) => t.qty > qty).sort((a, b) => a.qty - b.qty)[0];
  return next ? { missing: next.qty - qty, discountPercent: next.discountPercent } : null;
}
