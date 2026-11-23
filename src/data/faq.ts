/**
 * Questions fréquentes des pages du site — FAÇADE sur la collection `faq`
 * (Sanity). Chaque page appelle `faqPour('<page>')` et passe le résultat à la
 * fois au composant <Faq> (affichage) et à buildFaqSchema() (Google) : ce qui
 * est envoyé à Google est exactement ce qui est affiché, condition pour que
 * Google accepte la FAQ.
 */
import { getCollection } from 'astro:content';

export type PageFaq = 'faq' | 'accueil' | 'collection' | 'comment-ca-marche' | 'utilisations' | 'comparatif';

const toutes = (await getCollection('faq')).map((e) => e.data).sort((a, b) => a.ordre - b.ordre);

export function faqPour(page: PageFaq): { question: string; answer: string }[] {
  const items = toutes.filter((f) => f.page === page).map((f) => ({ question: f.question, answer: f.reponse }));
  if (items.length === 0) throw new Error(`Aucune question publiée pour la page « ${page} »`);
  return items;
}
