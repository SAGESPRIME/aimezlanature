/**
 * Avis clients — FAÇADE sur la collection `avis` (Sanity).
 *
 * ⚠️ Ce sont de VRAIS avis publiés par de vrais clients : ne jamais en
 * ajouter, en reformuler ni en inventer. Un avis non authentique est une
 * pratique commerciale trompeuse (art. L121-2 du Code de la consommation) et
 * viole les règles de Google sur les avis structurés.
 */
import { getCollection } from 'astro:content';

export interface Review {
  author: string;
  /** Date ISO de publication. */
  date: string | null;
  rating: number | null;
  /** Titre court laissé par le client, absent sur certains avis. */
  title: string | null;
  text: string;
}

const tous = (await getCollection('avis')).map((e) => e.data);

/** Avis d'un produit, du plus récent au plus ancien. */
export function reviewsFor(slug: string): Review[] {
  return tous
    .filter((a) => a.produit === slug)
    .map((a) => ({
      author: a.auteur,
      date: a.date,
      rating: a.note ?? null,
      title: a.titre ?? null,
      text: a.texte,
    }));
}
