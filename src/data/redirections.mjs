// @ts-check
/**
 * Redirections permanentes des anciennes URLs (WordPress/WooCommerce/Shopify)
 * — lecture et correspondance.
 *
 * La liste elle-même est dans `redirections.json` (110 règles, chaque URL
 * dans ses deux formes avec et sans slash final). Elle est lue à la fois par
 * `server.mjs` (qui redirige) et par `scripts/check-redirects.mjs` (qui
 * prouve que chaque règle fonctionne) : une seule liste, jamais de copie.
 *
 * Syntaxe d'une source :
 *   - chemin exact : `/qui-sommes-nous/`
 *   - joker final  : `/product-category/(.*)` — attrape tout ce qui suit,
 *     slash final compris (c'est ce que le joker `:path*` de Vercel ratait).
 *
 * Correspondance insensible à la casse, comme sur Vercel : `/Qui-Sommes-Nous/`
 * est redirigée aussi.
 */
import { readFileSync } from 'node:fs';

/** @typedef {{ source: string, destination: string }} Regle */

/** @returns {Regle[]} */
export function chargerRegles() {
  const url = new URL('./redirections.json', import.meta.url);
  return JSON.parse(readFileSync(url, 'utf8'));
}

/** Une source se termine-t-elle par le joker `(.*)` ? */
export const estJoker = (/** @type {string} */ source) => source.endsWith('(.*)');

/**
 * Prépare une fonction de recherche rapide : table exacte + liste de jokers.
 * @param {Regle[]} regles
 * @returns {(chemin: string) => string | null} destination, ou null
 */
export function creerResolveur(regles) {
  /** @type {Map<string, string>} */
  const exactes = new Map();
  /** @type {{ prefixe: string, destination: string }[]} */
  const jokers = [];
  for (const r of regles) {
    if (estJoker(r.source)) {
      jokers.push({ prefixe: r.source.slice(0, -'(.*)'.length).toLowerCase(), destination: r.destination });
    } else {
      exactes.set(r.source.toLowerCase(), r.destination);
    }
  }
  return (chemin) => {
    const c = chemin.toLowerCase();
    const exacte = exactes.get(c);
    if (exacte) return exacte;
    for (const j of jokers) if (c.startsWith(j.prefixe)) return j.destination;
    return null;
  };
}
