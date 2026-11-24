/**
 * Configuration du Studio Sanity — l'interface où le marchand modifie
 * produits, prix, avis, articles et FAQ.
 *
 * Le Studio est une application statique (React) déployée à part, sur
 * studio.aimezlanature.fr (Coolify). Il ne contient AUCUN secret : la
 * connexion se fait avec le compte Sanity de chaque éditeur.
 *
 * Après chaque publication, un webhook Sanity relance le build du site sur
 * Coolify (voir docs/sanity.md) : le site en ligne est mis à jour en 2 à 3
 * minutes. Si une donnée est invalide, le build échoue et le site en ligne
 * reste tel quel.
 */
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemas';
import { structure, TYPES_UNIQUES, TYPES_CREES_PAR_LE_SITE } from './structure';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET ?? 'production';
if (!projectId) {
  throw new Error('SANITY_STUDIO_PROJECT_ID manquant (voir studio/.env.example).');
}

export default defineConfig({
  name: 'aimezlanature',
  title: 'Aimez la Nature',
  projectId,
  dataset,
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: '2025-02-19' })],
  schema: {
    types: schemaTypes,
    // Les réglages du site sont uniques : on ne peut ni en créer un second, ni
    // le dupliquer depuis le menu « Créer ».
    // Les revendeurs sont créés par le formulaire du site, avec un identifiant
    // privé ; un revendeur créé ici aurait un identifiant public.
    templates: (modeles) =>
      modeles.filter(({ schemaType }) => !TYPES_UNIQUES.has(schemaType) && !TYPES_CREES_PAR_LE_SITE.has(schemaType)),
  },
  document: {
    actions: (actions, { schemaType }) =>
      TYPES_UNIQUES.has(schemaType)
        ? actions.filter(({ action }) => action && ['publish', 'discardChanges', 'restore'].includes(action))
        : actions,
  },
});
