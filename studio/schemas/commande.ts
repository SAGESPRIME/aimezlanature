import { defineType, defineField } from 'sanity';

/**
 * Commande payée — créée par le site à chaque paiement Stripe (webhook), avec
 * un identifiant « commandes.<session Stripe> » : un document dont
 * l'identifiant contient un point n'est PAS lisible sans authentification, même
 * dans un dataset public — les coordonnées des clients restent privées.
 *
 * Le marchand ne change que le STATUT, le NUMÉRO DE SUIVI et ses notes :
 *   « Expédiée » + numéro Colissimo → dans les 5 minutes, le client reçoit un
 *   email « votre colis est en route » avec son lien de suivi (une seule fois).
 * Le reste vient de Stripe et n'est pas modifiable (la référence reste Stripe).
 */
const lectureSeule = { readOnly: true };

export const commande = defineType({
  name: 'commande',
  title: 'Commande',
  type: 'document',
  groups: [
    { name: 'suivi', title: 'Suivi', default: true },
    { name: 'details', title: 'Détail de la commande' },
  ],
  fields: [
    defineField({
      name: 'statut',
      title: 'Statut',
      group: 'suivi',
      description:
        '« Expédiée » avec un numéro de suivi : le client reçoit son lien de suivi Colissimo par email dans les 5 minutes.',
      type: 'string',
      options: {
        list: [
          { title: 'À expédier', value: 'a_expedier' },
          { title: 'Expédiée', value: 'expediee' },
          { title: 'Annulée / remboursée', value: 'annulee' },
        ],
        layout: 'radio',
      },
      initialValue: 'a_expedier',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'numeroSuivi',
      title: 'Numéro de suivi Colissimo',
      group: 'suivi',
      description: 'Ex. 6A12345678901 (sur le bordereau). Lettres et chiffres, 10 à 20 caractères.',
      type: 'string',
      readOnly: ({ document }) => Boolean(document?.suiviEnvoyeLe),
      validation: (r) => [
        r.custom((v) => {
          const n = String(v ?? '').replace(/\s+/g, '');
          return !n || /^[A-Za-z0-9]{10,20}$/.test(n) || 'Numéro de suivi invalide (lettres et chiffres, 10 à 20 caractères).';
        }),
        r
          .custom((v, ctx) =>
            (ctx.document as { statut?: string } | undefined)?.statut === 'expediee' && !String(v ?? '').trim()
              ? 'Sans numéro de suivi, le client ne reçoit pas son lien de suivi.'
              : true
          )
          .warning(),
      ],
    }),
    defineField({ name: 'notes', title: 'Notes internes', group: 'suivi', type: 'text', rows: 3, description: 'Jamais montrées au client.' }),
    defineField({ name: 'suiviEnvoyeLe', title: 'Email de suivi envoyé le', group: 'suivi', type: 'datetime', ...lectureSeule }),

    defineField({ name: 'numero', title: 'Numéro de commande', group: 'details', type: 'string', ...lectureSeule }),
    defineField({ name: 'date', title: 'Payée le', group: 'details', type: 'datetime', ...lectureSeule }),
    defineField({
      name: 'source',
      title: 'Origine',
      group: 'details',
      type: 'string',
      options: { list: [{ title: 'Client (boutique)', value: 'client' }, { title: 'Revendeur (−30 %)', value: 'revendeur' }] },
      ...lectureSeule,
    }),
    defineField({ name: 'modeTest', title: 'Paiement de TEST (aucun argent réel)', group: 'details', type: 'boolean', ...lectureSeule }),
    defineField({
      name: 'lignes',
      title: 'Articles',
      group: 'details',
      type: 'array',
      ...lectureSeule,
      of: [
        {
          type: 'object',
          name: 'ligne',
          fields: [
            { name: 'description', title: 'Article', type: 'string' },
            { name: 'quantite', title: 'Quantité', type: 'number' },
            { name: 'total', title: 'Total (€)', type: 'number' },
          ],
          preview: {
            select: { title: 'description', q: 'quantite', t: 'total' },
            prepare: ({ title, q, t }) => ({ title: `${title} × ${q}`, subtitle: `${Number(t ?? 0).toFixed(2).replace('.', ',')} €` }),
          },
        },
      ],
    }),
    defineField({ name: 'sousTotal', title: 'Sous-total produits (€)', group: 'details', type: 'number', ...lectureSeule }),
    defineField({ name: 'fraisLivraison', title: 'Livraison (€)', group: 'details', type: 'number', ...lectureSeule }),
    defineField({ name: 'total', title: 'Total payé (€)', group: 'details', type: 'number', ...lectureSeule }),
    defineField({
      name: 'client',
      title: 'Client',
      group: 'details',
      type: 'object',
      ...lectureSeule,
      fields: [
        { name: 'nom', title: 'Nom', type: 'string' },
        { name: 'email', title: 'Email', type: 'string' },
        { name: 'telephone', title: 'Téléphone', type: 'string' },
      ],
    }),
    defineField({
      name: 'livraison',
      title: 'Livrer à',
      group: 'details',
      type: 'object',
      ...lectureSeule,
      fields: [
        { name: 'nom', title: 'Nom', type: 'string' },
        { name: 'adresse', title: 'Adresse', type: 'array', of: [{ type: 'string' }] },
      ],
    }),
    defineField({ name: 'revendeurId', title: 'Fiche revendeur', group: 'details', type: 'string', ...lectureSeule }),
    defineField({ name: 'lienStripe', title: 'Voir le paiement dans Stripe', group: 'details', type: 'url', ...lectureSeule }),
    defineField({ name: 'stripeSession', title: 'Référence Stripe', group: 'details', type: 'string', ...lectureSeule }),
    defineField({ name: 'stripePaiement', title: 'Paiement Stripe', group: 'details', type: 'string', ...lectureSeule }),
    defineField({ name: 'expedieeLe', title: 'Expédiée le', group: 'details', type: 'datetime', ...lectureSeule }),
  ],
  orderings: [{ title: 'Plus récentes', name: 'date', by: [{ field: 'date', direction: 'desc' }] }],
  preview: {
    select: { numero: 'numero', nom: 'client.nom', total: 'total', statut: 'statut', source: 'source', test: 'modeTest', date: 'date' },
    prepare: ({ numero, nom, total, statut, source, test, date }) => ({
      title: `${source === 'revendeur' ? 'REVENDEUR · ' : ''}${nom ?? '(sans nom)'} — ${Number(total ?? 0).toFixed(2).replace('.', ',')} €`,
      subtitle: `${{ a_expedier: '📦 À expédier', expediee: '🚚 Expédiée', annulee: '✖ Annulée' }[statut as string] ?? statut} · ${numero ?? ''}${date ? ' · ' + new Date(date).toLocaleDateString('fr-FR') : ''}${test ? ' · TEST' : ''}`,
    }),
  },
});
