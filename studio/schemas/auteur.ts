import { defineType, defineField } from 'sanity';
import { champImage } from './communs';

/**
 * Auteur des articles. Google et les moteurs d'IA accordent plus de crédit à
 * un contenu signé par une personne identifiable (critère E-E-A-T) qu'à un
 * texte anonyme.
 */
export const auteur = defineType({
  name: 'auteur',
  title: 'Auteur',
  type: 'document',
  fields: [
    defineField({ name: 'nom', title: 'Nom', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'role', title: 'Rôle', description: 'Ex. « Fondatrice d’Aimez la Nature, revendeuse agréée EM depuis 2019 »', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'bio', title: 'Présentation', type: 'text', rows: 4, validation: (r) => r.required().min(80) }),
    champImage('photo', 'Photo'),
    defineField({ name: 'liens', title: 'Profils publics (LinkedIn, etc.)', type: 'array', of: [{ type: 'url' }] }),
  ],
  preview: { select: { title: 'nom', subtitle: 'role', media: 'photo' } },
});
