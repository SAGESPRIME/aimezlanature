/**
 * Articles du blog pour les listes (hub /blog/, « À lire aussi ») — FAÇADE
 * sur la collection `articles` (Sanity).
 *
 * `href` se termine TOUJOURS par un slash : c'est la forme canonique des
 * pages. Sans lui, chaque lien interne coûtait une redirection 301.
 */
import { getCollection } from 'astro:content';

export interface BlogPost {
  title: string;
  excerpt: string;
  href: string;
  category: string;
  /** Temps de lecture affiché, ex. « 7 min ». */
  readingTime: string;
  /** Date ISO de publication, ex. « 2025-04-18 ». */
  date: string;
  /** Date ISO de dernière mise à jour importante, si renseignée. */
  updated?: string;
}

export const blogPosts: BlogPost[] = (await getCollection('articles'))
  .map(({ id, data: a }) => ({
    title: a.titreCarte,
    excerpt: a.extrait,
    href: `/blog/${id}/`,
    category: a.categorie,
    readingTime: `${a.tempsLecture} min`,
    date: a.datePublication,
    ...(a.dateMiseAJour ? { updated: a.dateMiseAJour } : {}),
  }))
  .sort((a, b) => b.date.localeCompare(a.date));

/**
 * Lien vers un article s'il est PUBLIÉ, sinon vers une page de repli.
 * Permet d'écrire dès maintenant le lien vers un article encore en brouillon :
 * il pointe vers le repli jusqu'à sa publication, puis vers l'article au
 * build suivant (jamais de lien cassé, jamais de redirection).
 */
export function lienArticle(slug: string, repli: string): string {
  const href = `/blog/${slug}/`;
  return blogPosts.some((p) => p.href === href) ? href : repli;
}
