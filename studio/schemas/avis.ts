import { defineType, defineField } from 'sanity';
import { regles } from './communs';

/**
 * Avis client.
 *
 * ⚠️ UNIQUEMENT de vrais avis, recopiés tels quels depuis l’email reçu via le
 * formulaire du site (dont l’achat a été vérifié chez Stripe). Ne jamais
 * reformuler, inventer ou « améliorer » un avis : c’est une pratique
 * commerciale trompeuse (art. L121-2 du Code de la consommation) et Google
 * retire les étoiles des résultats.
 *
 * La note moyenne et le nombre d’avis de chaque produit sont CALCULÉS à partir
 * des avis publiés ici : il n’y a rien d’autre à mettre à jour.
 *
 * Aucune adresse email n’est stockée ici (minimisation RGPD).
 */
export const avis = defineType({
  name: 'avis',
  title: 'Avis client',
  type: 'document',
  fields: [
    defineField({ name: 'produit', title: 'Produit', type: 'reference', to: [{ type: 'produit' }], validation: (r) => r.required() }),
    defineField({
      name: 'auteur',
      title: 'Nom affiché',
      description: 'Prénom et initiale, tel que le client l’a saisi. Ex. « Marie D. »',
      type: 'string',
      validation: (r) => r.required().max(60),
    }),
    defineField({ name: 'date', title: 'Date de l’avis', type: 'date', validation: (r) => r.required() }),
    defineField({
      name: 'note',
      title: 'Note (1 à 5)',
      description: 'Laisser vide uniquement si le client n’a pas donné de note.',
      type: 'number',
      options: { list: [5, 4, 3, 2, 1] },
      validation: (r) => r.integer().min(regles.noteMin).max(regles.noteMax),
    }),
    defineField({ name: 'titre', title: 'Titre', type: 'string', validation: (r) => r.max(120) }),
    defineField({ name: 'texte', title: 'Texte de l’avis', type: 'text', rows: 5, validation: (r) => r.required().min(2) }),
  ],
  orderings: [{ title: 'Plus récents', name: 'date', by: [{ field: 'date', direction: 'desc' }] }],
  preview: {
    select: { auteur: 'auteur', note: 'note', produit: 'produit.nomCourt', titre: 'titre' },
    prepare: ({ auteur, note, produit, titre }) => ({
      title: `${note ? '★'.repeat(note) : '—'} ${auteur}`,
      subtitle: [produit, titre].filter(Boolean).join(' · '),
    }),
  },
});
