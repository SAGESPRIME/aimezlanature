import type { StructureResolver } from 'sanity/structure';

/** Types à document unique (pas de liste, un seul formulaire). */
export const TYPES_UNIQUES = new Set(['reglages']);

/** Types créés uniquement par le site (jamais depuis le menu « Créer »). */
export const TYPES_CREES_PAR_LE_SITE = new Set(['revendeur']);

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
        .title('Revendeurs')
        .id('revendeurs')
        .child(
          S.list()
            .title('Revendeurs')
            .items([
              ...[
                ['en_attente', 'En attente de validation'],
                ['valide', 'Validés'],
                ['suspendu', 'Suspendus'],
                ['refuse', 'Refusés'],
              ].map(([statut, titre]) =>
                S.listItem()
                  .title(titre)
                  .id(`revendeurs-${statut}`)
                  .child(
                    S.documentList()
                      .title(titre)
                      .schemaType('revendeur')
                      .filter('_type == "revendeur" && statut == $statut')
                      .params({ statut })
                      .defaultOrdering([{ field: 'dateCandidature', direction: 'desc' }])
                  )
              ),
              S.divider(),
              S.documentTypeListItem('revendeur').title('Toutes les candidatures'),
            ])
        ),
      S.divider(),
      S.listItem()
        .title('Réglages du site')
        .id('reglages')
        .child(S.document().schemaType('reglages').documentId('reglages')),
    ]);
