// @ts-check
/**
 * Frais de livraison au POIDS — source de vérité côté serveur.
 *
 * Règle du marchand (2026-11-24) :
 *   - colis de `poidsMaxForfait` g ou moins (500 g) : livraison OFFERTE si le
 *     panier contient un produit « livraison offerte » (Pack 100, Pack Gourde),
 *     sinon forfait `forfait` (4,90 €) ;
 *   - au-delà : tarif Colissimo domicile de la `grille`, selon le poids total.
 * Toutes ces valeurs se règlent dans le Studio (Réglages + fiche produit).
 *
 * Utilisé par /api/checkout (montant réellement débité) et par le balisage
 * Google (src/lib/seo.ts). Le panier du navigateur applique la même règle avec
 * public/js/livraison.js ; tests/livraison.test.mjs vérifie que les deux
 * donnent exactement le même résultat.
 */

/**
 * @typedef {{ poids: number, qty: number, offerte?: boolean | null }} LigneColis
 * @typedef {{ poidsMax: number, prix: number }} TrancheColissimo
 * @typedef {{ forfait: number, poidsMaxForfait: number, grille: TrancheColissimo[] }} ReglesLivraison
 * @typedef {{ poids: number, frais: number | null, offerte: boolean }} ResultatLivraison
 */

/**
 * @param {LigneColis[]} lignes
 * @param {ReglesLivraison} regles
 * @returns {ResultatLivraison} `frais: null` = colis plus lourd que la grille (envoi impossible en ligne)
 */
export function fraisLivraison(lignes, regles) {
  const poids = lignes.reduce((s, l) => s + l.poids * l.qty, 0);
  if (poids === 0) return { poids: 0, frais: 0, offerte: false };
  if (poids > regles.poidsMaxForfait) {
    const tranche = [...regles.grille].sort((a, b) => a.poidsMax - b.poidsMax).find((t) => poids <= t.poidsMax);
    return { poids, frais: tranche ? tranche.prix : null, offerte: false };
  }
  if (lignes.some((l) => l.offerte && l.qty > 0)) return { poids, frais: 0, offerte: true };
  return { poids, frais: regles.forfait, offerte: false };
}
