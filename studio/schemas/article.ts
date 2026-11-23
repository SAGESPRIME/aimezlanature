import { defineType, defineField, defineArrayMember } from 'sanity';
import { champImage, champMetaDescription, champMetaTitle, champQuestions, regles, texteRiche } from './communs';

/**
 * Article du blog.
 *
 * La structure suit ce qui rend un article CITABLE par Google et par les
 * moteurs d’IA (ChatGPT, Perplexity, Google AI Overviews) :
 *   1. une « réponse courte » en tête, qui répond à la question du titre en
 *      2-3 phrases — c’est le passage que les IA reprennent ;
 *   2. des sections à intertitres clairs ;
 *   3. une FAQ (envoyée à Google en données structurées) ;
 *   4. des SOURCES vérifiables pour chaque chiffre avancé ;
 *   5. un auteur identifié et des dates visibles.
 *
 * ⚠️ Pas de chiffre sans source : « dure 10 ans », « économisez 2 000 € »…
 * Soit on cite la source dans « Sources », soit on retire le chiffre.
 */
export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  groups: [
    { name: 'contenu', title: 'Contenu', default: true },
    { name: 'geo', title: 'Réponse courte, FAQ & sources' },
    { name: 'seo', title: 'Google' },
    { name: 'publication', title: 'Publication' },
  ],
  fields: [
    defineField({ name: 'titre', title: 'Titre (H1)', type: 'string', group: 'contenu', validation: (r) => r.required().max(110) }),
    defineField({
      name: 'slug',
      title: 'Adresse de la page',
      description: '⚠️ NE PLUS MODIFIER une fois publié : l’adresse est indexée par Google. Préfixe automatique : /blog/',
      type: 'slug',
      group: 'publication',
      options: { source: 'titre', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'libelleCourt',
      title: 'Libellé court (fil d’Ariane)',
      description: 'Ex. « L’eau, source de vie ». 40 caractères max.',
      type: 'string',
      group: 'publication',
      validation: (r) => r.required().max(40),
    }),
    defineField({
      name: 'titreCarte',
      title: 'Titre sur les cartes du blog',
      description: 'Version courte du titre, affichée sur la page /blog/ et en « À lire aussi ».',
      type: 'string',
      group: 'publication',
      validation: (r) => r.required().max(70),
    }),
    defineField({
      name: 'categorie',
      title: 'Catégorie',
      type: 'string',
      group: 'publication',
      options: { list: ['Comparatifs', 'Général', 'Guides', 'Usages', 'Science'] },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'tempsLecture', title: 'Temps de lecture (minutes)', type: 'number', group: 'publication', validation: (r) => r.required().integer().min(1).max(60) }),
    defineField({ name: 'datePublication', title: 'Date de publication', type: 'date', group: 'publication', validation: (r) => r.required() }),
    defineField({
      name: 'dateMiseAJour',
      title: 'Date de dernière mise à jour importante',
      description: 'À remplir quand le fond de l’article change (pas pour une coquille). Affichée et envoyée à Google.',
      type: 'date',
      group: 'publication',
    }),
    defineField({ name: 'auteur', title: 'Auteur', type: 'reference', to: [{ type: 'auteur' }], group: 'publication' }),
    defineField({
      name: 'extrait',
      title: 'Extrait (cartes du blog)',
      type: 'text',
      rows: 3,
      group: 'publication',
      validation: (r) => r.required().max(200),
    }),
    defineField({ name: 'chapo', title: 'Chapô (intro sous le titre)', type: 'text', rows: 3, group: 'contenu', validation: (r) => r.required() }),
    champImage('image', 'Image de partage (réseaux sociaux)'),
    defineField({
      name: 'reponseCourte',
      title: 'Réponse courte',
      description: `Répond à la question du titre en 2-3 phrases autonomes (${regles.reponseCourteMax} caractères max). C’est le passage que Google et les IA citent : factuel, sans formule commerciale.`,
      type: 'text',
      rows: 4,
      group: 'geo',
      validation: (r) => r.max(regles.reponseCourteMax),
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      group: 'contenu',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'section',
          fields: [
            defineField({ name: 'titre', title: 'Intertitre (H2)', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'contenu', title: 'Contenu', type: 'array', of: texteRiche, validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'titre' } },
        }),
      ],
      validation: (r) => r.required().min(1),
    }),
    { ...champQuestions('faq', 'FAQ de l’article', 'Questions que se posent les lecteurs. Affichées en bas de l’article et envoyées à Google.'), group: 'geo' },
    defineField({
      name: 'sources',
      title: 'Sources',
      description: 'Une entrée par chiffre ou affirmation scientifique avancée dans l’article.',
      type: 'array',
      group: 'geo',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'source',
          fields: [
            defineField({ name: 'titre', title: 'Titre du document', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'editeur', title: 'Organisme / éditeur', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'url', title: 'Lien', type: 'url', validation: (r) => r.required().uri({ scheme: ['https'] }) }),
          ],
          preview: { select: { title: 'titre', subtitle: 'editeur' } },
        }),
      ],
    }),
    champMetaTitle('seo'),
    champMetaDescription('seo'),
  ],
  orderings: [{ title: 'Plus récents', name: 'date', by: [{ field: 'datePublication', direction: 'desc' }] }],
  preview: { select: { title: 'titre', subtitle: 'categorie', media: 'image' } },
});
