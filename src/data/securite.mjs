// @ts-check
/**
 * En-têtes de sécurité HTTP — SOURCE UNIQUE.
 *
 * Appliqués par `server.mjs` à TOUTES les réponses (pages, fichiers, API) et
 * vérifiés par `scripts/check-headers.mjs`. Ils vivaient auparavant dans
 * `vercel.json` ; le site quitte Vercel pour un VPS (Coolify), c'est donc
 * désormais notre propre serveur qui les pose, sans dépendre de la plateforme.
 *
 * ⚠️ RÈGLE DU PROJET : la CSP interdit tout script et tout style en ligne
 * (`script-src 'self'`, `style-src 'self'`). Ne jamais ajouter `'unsafe-inline'`
 * pour « faire marcher » un composant : porter le code dans un fichier externe.
 */

/**
 * Domaines Google autorisés — UNIQUEMENT pour Google Ads, chargé après
 * acceptation du bandeau (public/js/consentement.js). Liste officielle :
 * developers.google.com/tag-platform/security/guides/csp
 */
const GOOGLE_SCRIPTS = [
  'https://www.googletagmanager.com',
  'https://www.googleadservices.com',
  'https://www.google.com',
  'https://pagead2.googlesyndication.com',
  'https://googleads.g.doubleclick.net',
];
const GOOGLE_IMAGES = [
  'https://www.googletagmanager.com',
  'https://googleads.g.doubleclick.net',
  'https://www.google.com',
  'https://www.google.fr',
  'https://google.com',
  'https://pagead2.googlesyndication.com',
  'https://www.googleadservices.com',
];
const GOOGLE_CONNEXIONS = [
  'https://pagead2.googlesyndication.com',
  'https://www.googleadservices.com',
  'https://googleads.g.doubleclick.net',
  'https://ad.doubleclick.net',
  'https://www.google.com',
  'https://www.google.fr',
  'https://google.com',
];

/** Directives CSP, lisibles une par une plutôt qu'en une ligne illisible. */
const directives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", ...GOOGLE_SCRIPTS],
  'style-src': ["'self'"],
  // Les images Sanity sont téléchargées et optimisées AU BUILD puis servies
  // depuis /_astro : cdn.sanity.io n'a donc pas à figurer ici.
  'img-src': ["'self'", 'data:', ...GOOGLE_IMAGES],
  'font-src': ["'self'"],
  'connect-src': ["'self'", ...GOOGLE_CONNEXIONS],
  'frame-src': ['https://www.googletagmanager.com'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'frame-ancestors': ["'none'"],
  'form-action': ["'self'"],
  'upgrade-insecure-requests': [],
};

export const CSP = Object.entries(directives)
  .map(([nom, valeurs]) => [nom, ...valeurs].join(' '))
  .join('; ');

/**
 * En-têtes posés sur chaque réponse.
 *
 * HSTS : `includeSubDomains` et `preload` ont été RETIRÉS volontairement par
 * rapport à la version Vercel. Sur Vercel ils ne s'appliquaient qu'à
 * `*.vercel.app` ; sur `aimezlanature.fr` ils forceraient le HTTPS sur TOUS
 * les sous-domaines, y compris ceux de l'envoi d'emails (Emailit, liens de
 * suivi) dont on ne maîtrise pas la configuration — et `preload` est
 * quasi irréversible (des mois pour sortir de la liste des navigateurs).
 * À réactiver seulement après avoir vérifié chaque sous-domaine en HTTPS.
 */
export const ENTETES_SECURITE = {
  'Content-Security-Policy': CSP,
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};
