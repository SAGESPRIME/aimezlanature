import { defineType, defineField } from 'sanity';
import { regles } from './communs';

/**
 * Réglages généraux — document UNIQUE.
 *
 * Tout ce qui sert à calculer un montant (frais de port, seuil de gratuité)
 * est lu AU BUILD et embarqué dans le serveur : le montant débité par Stripe
 * vient toujours de ces valeurs publiées, jamais du navigateur.
 */
export const reglages = defineType({
  name: 'reglages',
  title: 'Réglages du site',
  type: 'document',
  groups: [
    { name: 'commerce', title: 'Livraison & avis', default: true },
    { name: 'marque', title: 'Marque' },
    { name: 'amazon', title: 'Preuve Amazon' },
  ],
  fields: [
    defineField({
      name: 'fraisDePort',
      title: 'Frais de port (€)',
      description: 'Appliqués sous le seuil de livraison offerte. Utilisés tels quels par le paiement Stripe.',
      type: 'number',
      group: 'commerce',
      validation: (r) => r.required().min(0).max(50).precision(2),
    }),
    defineField({
      name: 'seuilLivraisonOfferte',
      title: 'Livraison offerte à partir de (€)',
      type: 'number',
      group: 'commerce',
      validation: (r) => r.required().min(0).max(regles.prixMax).precision(2),
    }),
    defineField({
      name: 'noteGlobale',
      title: 'Note globale affichée (sur 5)',
      description:
        "Note affichée dans le bandeau et le pied de page. Le NOMBRE d'avis, lui, est calculé automatiquement à partir des avis publiés. Ne jamais saisir une note qui ne correspond pas aux avis réels (pratique commerciale trompeuse).",
      type: 'number',
      group: 'commerce',
      validation: (r) => r.required().min(regles.noteMin).max(regles.noteMax).precision(2),
    }),
    defineField({ name: 'nom', title: 'Nom de la marque', type: 'string', group: 'marque', validation: (r) => r.required() }),
    defineField({
      name: 'url',
      title: 'Adresse du site',
      type: 'url',
      group: 'marque',
      validation: (r) => r.required().uri({ scheme: ['https'] }),
    }),
    defineField({ name: 'description', title: 'Description courte de la marque', type: 'text', rows: 2, group: 'marque', validation: (r) => r.required() }),
    defineField({ name: 'anneeCreation', title: 'Année de création', type: 'number', group: 'marque', validation: (r) => r.required().min(1990).max(2100) }),
    defineField({
      name: 'profils',
      title: 'Profils officiels (réseaux, places de marché)',
      description: 'Utilisés par Google et les IA pour relier la marque à ses comptes (schema sameAs).',
      type: 'array',
      of: [{ type: 'url' }],
      group: 'marque',
    }),
    defineField({
      name: 'amazon',
      title: 'Avis Amazon',
      description: 'Toujours affichés avec la mention « sur Amazon » et JAMAIS mélangés aux avis du site.',
      type: 'object',
      group: 'amazon',
      fields: [
        defineField({ name: 'note', title: 'Note (sur 5)', type: 'number', validation: (r) => r.required().min(1).max(5) }),
        defineField({ name: 'nbCommentaires', title: 'Nombre de commentaires', type: 'number', validation: (r) => r.required().integer().min(0) }),
        defineField({ name: 'url', title: 'Lien de la fiche Amazon', type: 'url', validation: (r) => r.required() }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Réglages du site' }) },
});
