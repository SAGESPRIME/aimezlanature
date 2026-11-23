import { defineType, defineField } from 'sanity';

/** Pages du site qui affichent une FAQ gérée ici. */
export const PAGES_FAQ = [
  { title: 'Page FAQ (/faq/)', value: 'faq' },
  { title: 'Accueil', value: 'accueil' },
  { title: 'Catalogue (/perles-ceramique-em/)', value: 'collection' },
  { title: 'Comment ça marche', value: 'comment-ca-marche' },
  { title: '16 utilisations', value: 'utilisations' },
  { title: 'Comparatif purification', value: 'comparatif' },
];

/**
 * Question fréquente affichée sur une page du site et envoyée à Google en
 * données structurées (FAQPage).
 *
 * ⚠️ Une question doit apparaître sur UNE seule page : Google ignore les FAQ
 * dupliquées d’une page à l’autre.
 */
export const faq = defineType({
  name: 'faq',
  title: 'Question fréquente',
  type: 'document',
  fields: [
    defineField({ name: 'question', title: 'Question', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'reponse', title: 'Réponse', type: 'text', rows: 5, validation: (r) => r.required() }),
    defineField({
      name: 'page',
      title: 'Page',
      type: 'string',
      options: { list: PAGES_FAQ, layout: 'radio' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'ordre', title: 'Ordre sur la page', type: 'number', validation: (r) => r.required().integer().min(1) }),
  ],
  orderings: [{ title: 'Page puis ordre', name: 'pageOrdre', by: [{ field: 'page', direction: 'asc' }, { field: 'ordre', direction: 'asc' }] }],
  preview: { select: { title: 'question', subtitle: 'page' } },
});
