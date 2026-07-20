# DESIGN-NOTES — corrections du 2026-07-20

Suite à l'audit `docs/audit/rapport-audit-2026-07-20.md`. Vérification : Lighthouse
accessibilité 95 → **100** (accueil mobile), menu mobile testé au navigateur en 375 px.

## 🔴 Critique corrigé
- **Menu mobile inexistant** → bouton hamburger accessible (aria-expanded, aria-controls,
  fermeture par Échap, icônes ouvrir/fermer) + panneau de 7 liens. JS dans
  `public/js/site.js` (externe, compatible CSP). Sans JS : liens toujours disponibles
  au footer.

## Corrections
- **Contraste** : brun `#8B6F47` (4,15:1 sur crème, échec AA) → `#75592F` (5,74:1),
  44 occurrences dans 14 fichiers. Numéros décoratifs `#C4B89A` (1,97:1) → `#9C8358`
  (3,62:1, seuil grand texte). Copyright footer `stone-500` → `stone-400` (3,16 → 6,01:1).
- **Focus clavier** : style `:focus-visible` global (outline vert 2 px) + lien
  d'évitement « Aller au contenu ».
- **Polices** : Inter 700 ajoutée (le `font-bold` omniprésent produisait un faux gras
  synthétisé). Passage à @fontsource auto-hébergé (Inter 400-700, Playfair 600-700).
- **Emojis-icônes** (🚚 🔄 💧 💡 🇯🇵) → composant `src/components/Icon.astro`
  (SVG trait style Lucide) : trust strip accueil, réassurance fiche produit, encarts astuce.
- **Animations** : apparition au défilement (`[data-reveal]` + IntersectionObserver)
  sur les cartes produits, témoignages et guides de l'accueil. Garde-fous :
  `@media (scripting: enabled)` (contenu visible sans JS) et
  `prefers-reduced-motion: no-preference`. opacity/transform uniquement → CLS 0 vérifié.

## Notes
- Le brief mentionnait « la cohérence GSAP déjà en place » : il n'y avait en réalité
  aucune animation ni GSAP. Le choix : IntersectionObserver natif (0 dépendance, 0 impact
  LCP) plutôt qu'une lib. Le MCP 21st.dev reste disponible si on veut des composants
  animés plus riches plus tard.
- Pour étendre le reveal à d'autres pages : ajouter `data-reveal` sur l'élément, rien d'autre.
