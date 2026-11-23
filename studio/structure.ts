import type { StructureResolver } from 'sanity/structure';

/** Types à document unique (pas de liste, un seul formulaire). */
export const TYPES_UNIQUES = new Set(['reglages']);

/** Menu de gauche du Studio, dans l'ordre où le marchand en a besoin. */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Contenu')
    .items([
      S.documentTypeListItem('produit').title('Produits'),
      S.documentTypeListItem('avis').title('Avis clients'),
      S.divider(),
      S.documentTypeListItem('article').title('Articles du blog'),
      S.documentTypeListItem('faq').title('Questions fréquentes'),
      S.documentTypeListItem('auteur').title('Auteurs'),
      S.divider(),
      S.listItem()
        .title('Réglages du site')
        .id('reglages')
        .child(S.document().schemaType('reglages').documentId('reglages')),
    ]);
