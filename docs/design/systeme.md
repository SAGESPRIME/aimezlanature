# Système de design — « éditorial chaleureux », couleurs historiques

Validé par le marchand le 2026-11-24 (planche envoyée en conversation).
Mise en page inspirée du modèle MotionSites « luxury editorial ecommerce » ;
**couleurs reprises du site WordPress historique** (demande du marchand).
Jetons : `src/styles/global.css` (`@theme`). Classes : `bg-foret`, `text-encre`…

## Couleurs

| Jeton | Hex | Rôle | Contraste |
|---|---|---|---|
| `anis` | #BBE12C | bande d'annonce, surlignage, pastilles | encre dessus : 9,9:1 |
| `anis-clair` / `anis-pale` | #E3F1B0 / #F2F8DD | fonds de section | — |
| `foret` | #237F2C | titres de section, boutons principaux | blanc : 5,1:1 |
| `foret-fonce` | #1B6623 | survol des boutons | blanc : 6,6:1 |
| `olive` | #4E6A10 | sur-titres, petits accents | sur anis-pâle : 5,7:1 |
| `encre` | #322846 | texte, logo (prune) | sur blanc : 13,8:1 |
| `nuit` | #2B2240 | pied de page, bandeaux sombres | anis dessus : 9,9:1 |
| `brume` | #D9D4E6 | texte sur nuit | 10,3:1 |
| `gris` | #5E5A66 | texte secondaire | sur blanc : 6,7:1 |
| `ambre` | #DC9814 | **étoiles uniquement** | 2,5:1 → jamais du texte |
| `coquille` / `ligne` / `pierre` | #FAFAF5 / #E4E8DA / #CFD6C0 | fond, bordures | — |

Règle absolue : **jamais de texte blanc sur l'anis** (1,5:1, défaut du site
WordPress) — sur l'anis, le texte est en encre.

## Typographie

- Titres : **Cormorant Garamond** 600 (500 italique pour le mot surligné),
  `font-size-adjust` aligne sa hauteur d'x sur l'ancienne Playfair.
- Texte, boutons, prix : **Instrument Sans** (variable 400–700).
- Chiffres alignés partout (`lining-nums`), tabulaires pour les prix.
- Auto-hébergées (@fontsource), 3 fichiers préchargés (BaseLayout).

## Motifs

- `.surligne` : coup de pinceau anis sous un mot de titre (repris du logo).
- Boutons : pilule (`rounded-full`), forêt plein ou contour forêt.
- Photos : arche (hero, histoire), tuiles plein cadre avec dégradé encre.
- Cartes produit : fond blanc, photo produit, badge forêt.
- `.lien-nav` : trait anis qui se déploie au survol.

## Anti-modèles (UI UX Pro Max + projet)

Greenwashing et chiffres invérifiables ; avis rédigés (seuls des avis réels) ;
texte blanc sur anis ; emojis en guise d'icônes ; styles ou scripts en ligne
(CSP stricte) ; image externe à l'exécution.
