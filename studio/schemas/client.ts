import { defineType, defineField } from 'sanity';

/**
 * Client — une fiche par adresse email. Identifiant « clients.<empreinte> » :
 * un document dont l'identifiant contient un point n'est PAS lisible sans
 * authentification, même dans un dataset public (données personnelles).
 *
 * Créées par l'import des anciens clients WooCommerce (origine
 * « WooCommerce »), puis par le site à chaque commande payée (origine
 * « Site »), qui met aussi à jour le nombre de commandes, la dépense et les
 * dates. Le marchand ne change que le statut des emails et ses notes.
 */
const lectureSeule = { readOnly: true };
const euros = (n: unknown) => `${Number(n ?? 0).toFixed(2).replace('.', ',')} €`;

export const client = defineType({
  name: 'client',
  title: 'Client',
  type: 'document',
  groups: [
    { name: 'fiche', title: 'Fiche', default: true },
    { name: 'historique', title: 'Historique WooCommerce' },
  ],
  fields: [
    defineField({
      name: 'emails',
      title: 'Emails commerciaux',
      group: 'fiche',
      description:
        'Règle CNIL : un client peut recevoir des emails sur des produits analogues pendant 3 ans après son dernier achat, ' +
        'avec un lien de désinscription dans chaque email. « Désinscrit » : ne plus jamais lui écrire (sauf pour une commande).',
      type: 'string',
      options: {
        list: [
          { title: 'Client — emails autorisés (désinscription possible)', value: 'client_existant' },
          { title: 'Dernier achat il y a plus de 3 ans — ne pas écrire', value: 'hors_delai' },
          { title: 'Désinscrit — ne plus écrire', value: 'desinscrit' },
        ],
        layout: 'radio',
      },
      initialValue: 'client_existant',
    }),
    defineField({ name: 'notes', title: 'Notes internes', group: 'fiche', type: 'text', rows: 3 }),
    defineField({ name: 'email', title: 'Email', group: 'fiche', type: 'string', ...lectureSeule }),
    defineField({ name: 'nom', title: 'Nom', group: 'fiche', type: 'string', ...lectureSeule }),
    defineField({ name: 'ville', title: 'Ville', group: 'fiche', type: 'string', ...lectureSeule }),
    defineField({ name: 'codePostal', title: 'Code postal', group: 'fiche', type: 'string', ...lectureSeule }),
    defineField({ name: 'pays', title: 'Pays', group: 'fiche', type: 'string', ...lectureSeule }),
    defineField({ name: 'nbCommandes', title: 'Nombre de commandes payées', group: 'fiche', type: 'number', ...lectureSeule }),
    defineField({ name: 'depense', title: 'Dépense totale (€ TTC)', group: 'fiche', type: 'number', ...lectureSeule }),
    defineField({ name: 'premiereCommande', title: 'Première commande', group: 'fiche', type: 'datetime', ...lectureSeule }),
    defineField({ name: 'derniereCommande', title: 'Dernière commande', group: 'fiche', type: 'datetime', ...lectureSeule }),
    defineField({
      name: 'origine',
      title: 'Origine',
      group: 'fiche',
      type: 'string',
      options: { list: [{ title: 'Ancien site (WooCommerce)', value: 'woocommerce' }, { title: 'Nouveau site', value: 'site' }] },
      ...lectureSeule,
    }),
    defineField({ name: 'revendeur', title: 'A commandé en tant que revendeur', group: 'fiche', type: 'boolean', ...lectureSeule }),
    defineField({ name: 'modeTest', title: 'Client de TEST (paiements de test)', group: 'fiche', type: 'boolean', ...lectureSeule }),
    defineField({
      name: 'historiqueWoo',
      title: 'Commandes sur l’ancien site',
      group: 'historique',
      description: 'Commandes payées sur l’ancien site (date, numéro, montant). Le détail des articles n’existe pas dans l’export WordPress.',
      type: 'array',
      ...lectureSeule,
      of: [
        {
          type: 'object',
          name: 'commandeWoo',
          fields: [
            { name: 'date', title: 'Date', type: 'datetime' },
            { name: 'numero', title: 'Numéro', type: 'string' },
            { name: 'total', title: 'Total (€)', type: 'number' },
          ],
          preview: {
            select: { d: 'date', n: 'numero', t: 'total' },
            prepare: ({ d, n, t }) => ({
              title: `${d ? new Date(d).toLocaleDateString('fr-FR') : '?'} — ${euros(t)}`,
              subtitle: n ? `Commande n° ${n}` : undefined,
            }),
          },
        },
      ],
    }),
  ],
  orderings: [
    { title: 'Dernière commande', name: 'derniere', by: [{ field: 'derniereCommande', direction: 'desc' }] },
    { title: 'Dépense totale', name: 'depense', by: [{ field: 'depense', direction: 'desc' }] },
    { title: 'Nombre de commandes', name: 'nb', by: [{ field: 'nbCommandes', direction: 'desc' }] },
  ],
  preview: {
    select: { nom: 'nom', email: 'email', nb: 'nbCommandes', depense: 'depense', derniere: 'derniereCommande', emails: 'emails', test: 'modeTest' },
    prepare: ({ nom, email, nb, depense, derniere, emails, test }) => ({
      title: `${(nb ?? 0) >= 2 ? '★ ' : ''}${nom || email || '(sans nom)'}`,
      subtitle: [
        `${nb ?? 0} commande${(nb ?? 0) > 1 ? 's' : ''} · ${euros(depense)}`,
        derniere ? `dernière le ${new Date(derniere).toLocaleDateString('fr-FR')}` : null,
        emails === 'desinscrit' ? 'désinscrit' : null,
        test ? 'TEST' : null,
      ]
        .filter(Boolean)
        .join(' · '),
    }),
  },
});
