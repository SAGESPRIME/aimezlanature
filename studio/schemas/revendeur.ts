import { defineType, defineField } from 'sanity';

/**
 * Candidature revendeur (magasins bio, vendeurs professionnels).
 *
 * Créée par le site quand un professionnel remplit le formulaire de
 * /revendeurs/, avec un identifiant « revendeurs.<uuid> » : un document dont
 * l'identifiant contient un point n'est PAS lisible sans authentification,
 * même dans un dataset public — les coordonnées des candidats restent
 * privées. Ne pas créer de revendeur à la main (identifiant public).
 *
 * Le marchand ne change que le STATUT (et ses notes) :
 *   « Validé » → le site envoie au revendeur son lien de connexion à
 *   l'espace pro (/pro/) dans les 5 minutes ; il commande à −30 %, minimum
 *   300 €. « Suspendu » ou « Refusé » coupe l'accès immédiatement.
 */
const lectureSeule = { readOnly: true };

export const revendeur = defineType({
  name: 'revendeur',
  title: 'Revendeur',
  type: 'document',
  fields: [
    defineField({
      name: 'statut',
      title: 'Statut',
      description:
        '« Validé » : le revendeur reçoit son lien de connexion dans les 5 minutes et peut commander à −30 %. « Suspendu » ou « Refusé » coupe l’accès immédiatement.',
      type: 'string',
      options: {
        list: [
          { title: 'En attente', value: 'en_attente' },
          { title: 'Validé', value: 'valide' },
          { title: 'Refusé', value: 'refuse' },
          { title: 'Suspendu', value: 'suspendu' },
        ],
        layout: 'radio',
      },
      initialValue: 'en_attente',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'notes', title: 'Notes internes', type: 'text', rows: 3, description: 'Jamais montrées au revendeur.' }),
    defineField({ name: 'boutique', title: 'Boutique / société', type: 'string', ...lectureSeule }),
    defineField({ name: 'contact', title: 'Contact', type: 'string', ...lectureSeule }),
    defineField({ name: 'email', title: 'Email', type: 'string', ...lectureSeule }),
    defineField({ name: 'telephone', title: 'Téléphone', type: 'string', ...lectureSeule }),
    defineField({ name: 'siret', title: 'SIRET', type: 'string', ...lectureSeule }),
    defineField({ name: 'activite', title: 'Activité', type: 'string', ...lectureSeule }),
    defineField({ name: 'volume', title: 'Volume envisagé', type: 'string', ...lectureSeule }),
    defineField({ name: 'message', title: 'Message', type: 'text', rows: 4, ...lectureSeule }),
    defineField({ name: 'dateCandidature', title: 'Candidature reçue le', type: 'datetime', ...lectureSeule }),
    defineField({ name: 'accesEnvoyeLe', title: 'Lien d’accès envoyé le', type: 'datetime', ...lectureSeule }),
  ],
  orderings: [{ title: 'Plus récentes', name: 'date', by: [{ field: 'dateCandidature', direction: 'desc' }] }],
  preview: {
    select: { title: 'boutique', contact: 'contact', statut: 'statut' },
    prepare: ({ title, contact, statut }) => ({
      title: title ?? '(sans nom)',
      subtitle: `${{ en_attente: '⏳ En attente', valide: '✅ Validé', refuse: '⛔ Refusé', suspendu: '⏸ Suspendu' }[statut as string] ?? statut} — ${contact ?? ''}`,
    }),
  },
});
