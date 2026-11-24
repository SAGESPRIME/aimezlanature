import { defineType, defineField } from 'sanity';
import { champImage, champMetaDescription, champMetaTitle, champQuestions, regles } from './communs';

/**
 * Produit vendu sur le site.
 *
 * ⚠️ SÉCURITÉ DU PAIEMENT : le prix saisi ici est lu AU BUILD et embarqué dans
 * le serveur. Le navigateur n'envoie que « quel produit, combien » ; le
 * montant débité est toujours recalculé côté serveur à partir de ces valeurs
 * publiées. Une modification ne prend effet qu'après la reconstruction du site
 * (2-3 minutes après « Publier »).
 */
export const produit = defineType({
  name: 'produit',
  title: 'Produit',
  type: 'document',
  groups: [
    { name: 'vente', title: 'Prix & stock', default: true },
    { name: 'fiche', title: 'Fiche produit' },
    { name: 'seo', title: 'Google' },
  ],
  fields: [
    defineField({ name: 'nom', title: 'Nom complet', type: 'string', group: 'fiche', validation: (r) => r.required() }),
    defineField({
      name: 'nomCourt',
      title: 'Nom court',
      description: 'Utilisé dans le panier, le fil d’Ariane et le reçu Stripe. Ex. « Pack 55 Perles ».',
      type: 'string',
      group: 'fiche',
      validation: (r) => r.required().max(40),
    }),
    defineField({
      name: 'slug',
      title: 'Adresse de la page',
      description:
        '⚠️ NE PLUS MODIFIER une fois le produit publié : l’adresse est indexée par Google et mémorisée dans les paniers des clients. Changer de nom ne demande pas de changer l’adresse.',
      type: 'slug',
      group: 'fiche',
      options: { source: 'nomCourt', maxLength: 60 },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'sku', title: 'Référence (SKU)', type: 'string', group: 'fiche', validation: (r) => r.required() }),
    defineField({
      name: 'ordre',
      title: 'Ordre d’affichage',
      description: '1 = affiché en premier.',
      type: 'number',
      group: 'fiche',
      validation: (r) => r.required().integer().min(1),
    }),
    defineField({
      name: 'prix',
      title: 'Prix de vente (€ TTC)',
      type: 'number',
      group: 'vente',
      validation: (r) => r.required().min(regles.prixMin).max(regles.prixMax).precision(2),
    }),
    defineField({
      name: 'prixBarre',
      title: 'Prix barré (€) — optionnel',
      description:
        'Directive Omnibus (art. L112-1-1 du Code de la consommation) : un prix barré doit être le prix LE PLUS BAS pratiqué dans les 30 jours précédant la réduction. Une « promotion » permanente est interdite. Laisser vide s’il n’y a pas de vraie réduction en cours. Le pourcentage affiché est calculé automatiquement.',
      type: 'number',
      group: 'vente',
      validation: (r) =>
        r
          .min(regles.prixMin)
          .max(regles.prixMax)
          .precision(2)
          .custom((valeur, ctx) => {
            if (valeur === undefined || valeur === null) return true;
            const prix = (ctx.document as { prix?: number } | undefined)?.prix;
            return typeof prix === 'number' && valeur > prix ? true : 'Le prix barré doit être supérieur au prix de vente.';
          }),
    }),
    defineField({
      name: 'enStock',
      title: 'En stock',
      description: 'Décoché : la fiche reste en ligne mais le produit ne peut plus être commandé, et Google est informé de la rupture.',
      type: 'boolean',
      group: 'vente',
      initialValue: true,
    }),
    defineField({
      name: 'poids',
      title: 'Poids du colis (g)',
      description:
        "Poids emballage compris, en grammes. Sert à calculer les frais de livraison (forfait jusqu'au seuil de poids des Réglages, puis tarif Colissimo).",
      type: 'number',
      group: 'vente',
      validation: (r) => r.required().integer().min(1).max(30000),
    }),
    defineField({
      name: 'livraisonOfferte',
      title: 'Ouvre la livraison offerte',
      description:
        "Coché : un panier qui contient ce produit est livré gratuitement, tant que le colis ne dépasse pas le seuil de poids des Réglages (500 g). Au-delà, le tarif Colissimo s'applique.",
      type: 'boolean',
      group: 'vente',
      initialValue: false,
    }),
    defineField({
      name: 'bestseller',
      title: 'Meilleure vente',
      description: 'Un seul produit à la fois.',
      type: 'boolean',
      group: 'vente',
      initialValue: false,
    }),
    defineField({ name: 'nombrePerles', title: 'Nombre de perles fournies', type: 'number', group: 'fiche', validation: (r) => r.integer().min(1) }),
    defineField({ name: 'avecGourde', title: 'Gourde incluse', type: 'boolean', group: 'fiche', initialValue: false }),
    champImage('image', 'Photo principale', true),
    defineField({
      name: 'description',
      title: 'Description',
      description: 'Séparer les paragraphes par une ligne vide. Le premier paragraphe sert d’accroche.',
      type: 'text',
      rows: 14,
      group: 'fiche',
      validation: (r) => r.required().min(200),
    }),
    defineField({
      name: 'usages',
      title: 'Usages (étiquettes)',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'fiche',
      validation: (r) => r.required().min(1),
    }),
    { ...champQuestions('questions', 'Questions sur ce produit', 'Affichées sur la fiche et envoyées à Google (FAQ).'), group: 'fiche' },
    champMetaTitle('seo'),
    champMetaDescription('seo'),
  ],
  orderings: [{ title: 'Ordre d’affichage', name: 'ordre', by: [{ field: 'ordre', direction: 'asc' }] }],
  preview: {
    select: { title: 'nom', prix: 'prix', enStock: 'enStock', media: 'image' },
    prepare: ({ title, prix, enStock, media }) => ({
      title,
      subtitle: `${typeof prix === 'number' ? prix.toFixed(2).replace('.', ',') : '?'} €${enStock === false ? ' · RUPTURE' : ''}`,
      media,
    }),
  },
});
