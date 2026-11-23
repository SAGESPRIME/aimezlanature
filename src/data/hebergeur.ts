/**
 * Hébergeur du site — mention OBLIGATOIRE des mentions légales (article 6 III
 * de la LCEN) : nom, adresse et téléphone de l'hébergeur.
 *
 * Depuis la migration, le site tourne sur un VPS administré avec Coolify.
 * L'hébergeur légal est le FOURNISSEUR DU VPS (ex. OVHcloud, Hetzner,
 * Scaleway…), pas Coolify, qui n'est qu'un logiciel.
 *
 * ⚠️ À COMPLÉTER avec les coordonnées réelles du fournisseur. Tant que
 * `aCompleter` vaut true, la page affiche un marqueur et server.mjs REFUSE de
 * démarrer en production (la recette, elle, fonctionne) : publier une mention
 * légale fausse ou vide n'est pas une option.
 */
export const HEBERGEUR = {
  aCompleter: true,
  nom: 'À COMPLÉTER — fournisseur du VPS',
  adresse: 'À COMPLÉTER — adresse postale du fournisseur',
  telephone: 'À COMPLÉTER',
  site: '',
};
