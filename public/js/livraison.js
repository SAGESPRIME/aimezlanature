/**
 * Frais de livraison au poids — version navigateur (chargée avant cart.js).
 *
 * MÊME règle que src/data/livraison.mjs (source de vérité côté serveur, qui
 * calcule le montant réellement débité) : tests/livraison.test.mjs exécute les
 * deux sur les mêmes paniers et échoue au moindre écart. Ne modifier l'une
 * qu'avec l'autre.
 */
(function (racine) {
  'use strict';

  function fraisLivraison(lignes, regles) {
    var poids = lignes.reduce(function (s, l) { return s + l.poids * l.qty; }, 0);
    if (poids === 0) return { poids: 0, frais: 0, offerte: false };
    if (poids > regles.poidsMaxForfait) {
      var grille = regles.grille.slice().sort(function (a, b) { return a.poidsMax - b.poidsMax; });
      var tranche = grille.filter(function (t) { return poids <= t.poidsMax; })[0];
      return { poids: poids, frais: tranche ? tranche.prix : null, offerte: false };
    }
    if (lignes.some(function (l) { return l.offerte && l.qty > 0; })) return { poids: poids, frais: 0, offerte: true };
    return { poids: poids, frais: regles.forfait, offerte: false };
  }

  racine.alnFraisLivraison = fraisLivraison;
})(typeof window !== 'undefined' ? window : globalThis);
