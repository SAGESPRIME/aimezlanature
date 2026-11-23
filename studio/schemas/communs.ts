import { defineField, defineArrayMember } from 'sanity';
import regles from '../../contenu/regles.json';

export { regles };

/** Champ « titre pour Google » avec la limite de longueur du site. */
export const champMetaTitle = (group?: string) =>
  defineField({
    name: 'metaTitle',
    title: 'Titre pour Google (balise title)',
    description: `Affiché en bleu dans les résultats de recherche. ${regles.metaTitleMax} caractères maximum, sinon Google le coupe. Mettre le mot-clé principal au début.`,
    type: 'string',
    group,
    validation: (r) => r.required().max(regles.metaTitleMax),
  });

/** Champ « description pour Google » avec ses limites. */
export const champMetaDescription = (group?: string) =>
  defineField({
    name: 'metaDescription',
    title: 'Description pour Google (meta description)',
    description: `Le texte gris sous le titre dans Google. Entre ${regles.metaDescriptionMin} et ${regles.metaDescriptionMax} caractères.`,
    type: 'text',
    rows: 3,
    group,
    validation: (r) => r.required().min(regles.metaDescriptionMin).max(regles.metaDescriptionMax),
  });

/** Image avec texte alternatif OBLIGATOIRE (accessibilité + SEO). */
export const champImage = (name: string, title: string, obligatoire = false) =>
  defineField({
    name,
    title,
    type: 'image',
    options: { hotspot: true },
    fields: [
      defineField({
        name: 'alt',
        title: 'Texte alternatif',
        description: "Décrit l'image pour les personnes aveugles et pour Google. Ex. : « Perles de céramique blanches dans une carafe d'eau ».",
        type: 'string',
        validation: (r) => r.required().min(5),
      }),
    ],
    validation: obligatoire ? (r) => r.required() : undefined,
  });

/** Liste de questions/réponses (FAQ d'une fiche produit ou d'un article). */
export const champQuestions = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    description,
    type: 'array',
    of: [
      defineArrayMember({
        type: 'object',
        name: 'questionReponse',
        fields: [
          defineField({ name: 'question', title: 'Question', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'reponse', title: 'Réponse', type: 'text', rows: 4, validation: (r) => r.required() }),
        ],
        preview: { select: { title: 'question', subtitle: 'reponse' } },
      }),
    ],
  });

/**
 * Texte riche volontairement SOBRE : paragraphes, intertitres h3, listes,
 * gras, italique et liens. Pas de couleurs ni de tailles libres — la mise en
 * forme est celle du site, pas celle de l'éditeur.
 */
export const texteRiche = [
  defineArrayMember({
    type: 'block',
    styles: [
      { title: 'Paragraphe', value: 'normal' },
      { title: 'Intertitre', value: 'h3' },
    ],
    lists: [
      { title: 'Liste à puces', value: 'bullet' },
      { title: 'Liste numérotée', value: 'number' },
    ],
    marks: {
      decorators: [
        { title: 'Gras', value: 'strong' },
        { title: 'Italique', value: 'em' },
      ],
      annotations: [
        {
          name: 'link',
          type: 'object',
          title: 'Lien',
          fields: [
            {
              name: 'href',
              type: 'url',
              title: 'Adresse',
              description: 'Lien interne : commencer par « / » (ex. /comment-ca-marche/). Lien externe : adresse complète en https://',
              validation: (r) => r.required().uri({ allowRelative: true, scheme: ['https', 'mailto'] }),
            },
          ],
        },
      ],
    },
  }),
];
