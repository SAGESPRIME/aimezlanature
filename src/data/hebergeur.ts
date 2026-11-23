/**
 * Hébergeur du site — mention OBLIGATOIRE des mentions légales (article 6 III
 * de la LCEN) : nom, adresse et téléphone de l'hébergeur.
 *
 * Depuis la migration, le site tourne sur un VPS administré avec Coolify.
 * L'hébergeur légal est le FOURNISSEUR DU VPS (ex. OVHcloud, Hetzner,
 * Scaleway…), pas Coolify, qui n'est qu'un logiciel.
 *
 * Fournisseur confirmé par le marchand le 2026-11-23 : Hetzner (VPS qui porte
 * l'instance Coolify coolify.presencebusiness.com). Si le site change un jour
 * de fournisseur, mettre `aCompleter: true` le temps de corriger : la page
 * affiche alors un marqueur et server.mjs REFUSE de démarrer en production.
 */
export const HEBERGEUR = {
  aCompleter: false,
  nom: 'Hetzner Online GmbH',
  adresse: 'Industriestr. 25, 91710 Gunzenhausen, Allemagne',
  telephone: '+49 9831 505-0',
  site: 'https://www.hetzner.com',
};
