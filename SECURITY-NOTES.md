# SECURITY-NOTES — corrections du 2026-07-20

Suite à l'audit `docs/audit/rapport-audit-2026-07-20.md`.

## État des lieux (audit)
- `npm audit` : 0 vulnérabilité (avant comme après corrections).
- Aucun secret dans le code, aucun `.env` (grep vérifié).
- Site 100 % statique : pas de formulaire, pas de cookie, pas d'API, pas de route admin.
- Paiement prévu via Stripe Payment Links : les données carte ne transitent jamais par
  le site (périmètre PCI SAQ-A, le plus léger).

## Corrections
- **`public/_headers` créé** — servi par Cloudflare sur toutes les pages :
  - `Content-Security-Policy` stricte (`default-src 'self'`, pas d'unsafe-inline)
  - `Strict-Transport-Security` (1 an, includeSubDomains, preload)
  - `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimale
- **Conditions de la CSP stricte** (à maintenir) :
  - `build.inlineStylesheets: 'never'` dans `astro.config.mjs` (CSS toujours externe)
  - JS du site dans `public/js/site.js` (jamais de `<script>` inline)
  - Polices auto-hébergées (@fontsource) → aucun domaine tiers à autoriser
  - Les blocs JSON-LD inline ne sont pas concernés par la CSP (non exécutables)
- Vérifié dans `dist/client/_headers` : la ligne de cache de l'adaptateur Cloudflare
  et nos en-têtes cohabitent.

## À faire au moment de l'intégration Stripe
- Ajouter les domaines Stripe à la CSP si un script/iframe Stripe est intégré
  (Payment Links en redirection simple : aucun changement nécessaire).
- Configurer le rate limiting Cloudflare sur la future page de checkout/succès.
- Mettre à jour l'hébergeur dans les mentions légales si la prod passe sur Cloudflare
  (actuellement : Hostinger).
