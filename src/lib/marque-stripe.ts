/**
 * Marque posée par /api/checkout sur chaque session Stripe (`metadata.source`),
 * et relue par /api/stripe-webhook pour reconnaître les commandes du site
 * parmi tout ce qui passe sur le même compte Stripe (liens de paiement,
 * factures…). Voir l'audit de sécurité du 2026-11-24.
 */
export const MARQUE_SESSION = 'aimezlanature';
