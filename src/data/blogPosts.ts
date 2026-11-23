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
