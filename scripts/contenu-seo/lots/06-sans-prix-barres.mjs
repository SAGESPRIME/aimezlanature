/**
 * Lot 6 (25/11/2026) — prix barrés retirés des 4 produits (décision du
 * marchand). Directive Omnibus / Code de la consommation L112-1-1 : un prix
 * barré doit être le plus bas prix pratiqué dans les 30 jours avant la
 * réduction ; ces prix n'avaient pas été pratiqués. Les remises par quantité
 * (−15 %, −20 %) restent. Publié directement ; `--annuler` remet les valeurs.
 */
export const patches = [
  ['produit-pack-55-perles', 25.9],
  ['produit-pack-100-perles', 42.9],
  ['produit-pack-gourde-ceramique-em', 72.8],
  ['produit-gourde-ecologique', 39.9],
].map(([id, ancien]) => ({ id, avant: { prixBarre: ancien }, set: { prixBarre: null } }));
