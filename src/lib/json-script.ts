/**
 * Sérialise une valeur en JSON utilisable SANS RISQUE dans une balise
 * `<script>` (JSON-LD, catalogue du panier).
 *
 * Pourquoi `JSON.stringify` ne suffit pas : il laisse passer `</script>` tel
 * quel. Un texte saisi dans le CMS (titre d'article, avis client, nom de
 * produit) contenant `</script><img src=x onerror=…>` fermerait la balise et
 * injecterait du HTML dans la page. La CSP `script-src 'self'` empêcherait
 * l'exécution, mais la page serait cassée — et la CSP n'est qu'une seconde
 * barrière, pas une raison de laisser la première ouverte.
 *
 * Les caractères `<`, `>` et `&` deviennent des échappements Unicode, que
 * tout lecteur JSON (Google, `JSON.parse`) relit à l'identique. U+2028 et
 * U+2029 sont valides en JSON mais cassent certains anciens moteurs JS.
 */
export function jsonPourScript(valeur: unknown): string {
  return JSON.stringify(valeur)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/[\u2028]/g, '\\u2028')
    .replace(/[\u2029]/g, '\\u2029');
}
