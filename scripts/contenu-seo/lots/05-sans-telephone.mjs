/**
 * Lot 5 (25/11/2026) — le marchand n'a pas de numéro de téléphone :
 * la FAQ « Comment vous contacter ? » ne cite plus que l'email et l'adresse.
 * Publié directement (correction factuelle).
 */
export const patches = [
  {
    id: 'faq-faq-04',
    avant: { reponse: 'Par email à contact@aimezlanature.fr ou au +33 1 84 80 15 22. Nous répondons sous 24 h ouvrées.' },
    set: { reponse: 'Par email à contact@aimezlanature.fr : nous répondons sous 24 h ouvrées. Par courrier : SAS Naturalis Vert, 145 rue de Noisy-le-Sec, CS 20008, 93260 Les Lilas cedex.' },
  },
];
