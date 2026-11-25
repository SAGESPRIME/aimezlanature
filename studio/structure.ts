import type { StructureResolver } from 'sanity/structure';
import { TableauClients } from './tableaux/TableauClients';
import { TableauCommandes } from './tableaux/TableauCommandes';

/** Types à document unique (pas de liste, un seul formulaire). */
export const TYPES_UNIQUES = new Set(['reglages']);

/** Types créés uniquement par le site (jamais depuis le menu « Créer »). */
export const TYPES_CREES_PAR_LE_SITE = new Set(['revendeur', 'commande', 'client']);

/** Menu de gauche du Studio, dans l'ordre où le marchand en a besoin. */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Contenu')
    .items([
      S.listItem()
        .title('Commandes')
        .id('commandes')
        .child(
          S.list()
            .title('Commandes')
            .items([
              S.listItem()
                .title('Tableau des commandes')
                .id('commandes-tableau')
                .child(S.component(TableauCommandes).id('tableau-commandes').title('Tableau des commandes')),
              S.divider(),
              ...[
                ['a_expedier', 'À expédier'],
                ['expediee', 'Expédiées'],
                ['annulee', 'Annulées / remboursées'],
              ].map(([statut, titre]) =>
                S.listItem()
                  .title(titre)
                  .id(`commandes-${statut}`)
                  .child(
                    S.documentList()
                      .title(titre)
                      .schemaType('commande')
                      .filter('_type == "commande" && statut == $statut')
                      .params({ statut })
                      .defaultOrdering([{ field: 'date', direction: statut === 'a_expedier' ? 'asc' : 'desc' }])
                  )
              ),
              S.divider(),
              S.listItem()
                .title('Commandes revendeurs')
                .id('commandes-revendeurs')
                .child(
                  S.documentList()
                    .title('Commandes revendeurs')
                    .schemaType('commande')
                    .filter('_type == "commande" && source == "revendeur"')
                    .defaultOrdering([{ field: 'date', direction: 'desc' }])
                ),
              S.documentTypeListItem('commande').title('Toutes les commandes'),
            ])
        ),
      S.listItem()
        .title('Clients')
        .id('clients')
        .child(
          S.list()
            .title('Clients')
            .items([
              S.listItem()
                .title('Tableau des clients')
                .id('clients-tableau')
                .child(S.component(TableauClients).id('tableau-clients').title('Tableau des clients')),
              S.divider(),
              ...(
                [
                  ['fideles', 'Clients fidèles (2 commandes et plus)', '_type == "client" && !modeTest && nbCommandes >= 2', 'depense'],
                  ['tous', 'Tous les clients', '_type == "client" && !modeTest', 'derniereCommande'],
                  ['emails', 'Emails autorisés', '_type == "client" && !modeTest && emails == "client_existant"', 'derniereCommande'],
                  ['desinscrits', 'Désinscrits', '_type == "client" && emails == "desinscrit"', 'derniereCommande'],
                  ['test', 'Clients de test', '_type == "client" && modeTest == true', 'derniereCommande'],
                ] as const
              ).map(([id, titre, filtre, tri]) =>
                S.listItem()
                  .title(titre)
                  .id(`clients-${id}`)
                  .child(
                    S.documentList()
                      .title(titre)
                      .schemaType('client')
                      .filter(filtre)
                      .defaultOrdering([{ field: tri, direction: 'desc' }])
                      .child((clientId) =>
                        S.list()
                          .title('Client')
                          .items([
                            S.listItem()
                              .title('Fiche')
                              .id('fiche')
                              .child(S.document().schemaType('client').documentId(clientId)),
                            S.listItem()
                              .title('Commandes sur le nouveau site')
                              .id('commandes')
                              .child(
                                S.documentList()
                                  .title('Commandes')
                                  .schemaType('commande')
                                  .filter('_type == "commande" && ficheClient._ref == $clientId')
                                  .params({ clientId })
                                  .defaultOrdering([{ field: 'date', direction: 'desc' }])
                              ),
                          ])
                      )
                  )
              ),
            ])
        ),
      S.divider(),
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
