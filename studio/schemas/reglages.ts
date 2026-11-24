import { defineType, defineField } from 'sanity';
import { regles } from './communs';
import photosSite from '../../contenu/photos-site.json';

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
    { name: 'photos', title: 'Photos du site' },
  ],
  fields: [
    defineField({
      name: 'fraisDePort',
      title: 'Livraison des petits colis (€)',
      description:
        "Forfait payé par le client pour un colis jusqu'au seuil de poids ci-dessous, sauf si le panier contient un produit « Ouvre la livraison offerte ». Utilisé tel quel par le paiement Stripe.",
      type: 'number',
      group: 'commerce',
      validation: (r) => r.required().min(0).max(50).precision(2),
    }),
    defineField({
      name: 'poidsMaxForfait',
      title: 'Seuil de poids du forfait (g)',
      description: 'Jusqu’à ce poids : forfait ou livraison offerte. Au-delà : tarif Colissimo de la grille, selon le poids total.',
      type: 'number',
      group: 'commerce',
      initialValue: 500,
      validation: (r) => r.required().integer().min(1).max(30000),
    }),
    defineField({
      name: 'grilleColissimo',
      title: 'Tarif Colissimo au-delà du seuil',
      description: 'Une ligne par tranche : « jusqu’à X g → Y € ». Le site prend la première tranche qui contient le poids du colis.',
      type: 'array',
      group: 'commerce',
      of: [
        {
          type: 'object',
          name: 'tranche',
          fields: [
            defineField({ name: 'poidsMax', title: 'Jusqu’à (g)', type: 'number', validation: (r) => r.required().integer().min(1).max(30000) }),
            defineField({ name: 'prix', title: 'Prix (€)', type: 'number', validation: (r) => r.required().min(0).max(regles.prixMax).precision(2) }),
          ],
          preview: {
            select: { poidsMax: 'poidsMax', prix: 'prix' },
            prepare: ({ poidsMax, prix }) => ({ title: `Jusqu’à ${poidsMax ?? '?'} g → ${prix ?? '?'} €` }),
          },
        },
      ],
      validation: (r) =>
        r.required().min(1).custom((tranches) => {
          const p = ((tranches ?? []) as { poidsMax?: number }[]).map((t) => t.poidsMax ?? 0);
          return p.every((v, i) => i === 0 || v > p[i - 1]) ? true : 'Classer les tranches par poids croissant, sans doublon.';
        }),
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
    defineField({
      name: 'photos',
      title: 'Photos du site',
      description:
        "Photos d'ambiance de l'accueil et des en-têtes de pages. Un emplacement laissé vide garde la photo actuelle. Après publication, le site se reconstruit tout seul (environ 2 minutes).",
      type: 'object',
      group: 'photos',
      options: { collapsible: false },
      fields: photosSite.emplacements.map((e) =>
        defineField({
          name: e.cle,
          title: e.titre,
          description: e.ou,
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Texte alternatif',
              description: "Décrit la photo pour les personnes aveugles et pour Google. Ex. : « Carafe d'eau sur une table en bois ».",
              type: 'string',
              validation: (r) => r.required().min(5).max(160),
            }),
            defineField({
              name: 'credit',
              title: 'Crédit (si la photo n\'est pas la vôtre)',
              description: "Obligatoire pour une photo sous licence CC BY : « Titre, Auteur, CC BY 2.0 ». Affiché dans les mentions légales. Laisser vide pour vos propres photos.",
              type: 'string',
              validation: (r) => r.max(200),
            }),
          ],
        })
      ),
    }),
  ],
  preview: { prepare: () => ({ title: 'Réglages du site' }) },
});
