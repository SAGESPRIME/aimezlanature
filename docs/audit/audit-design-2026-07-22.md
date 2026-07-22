# Audit design & conversion — 2026-07-22

Build audité : commit `fe81b54` · `npm run build` OK · **25 pages générées**
Mesures faites au navigateur sur le **build réel** (`dist/client` servi en statique), pas sur le serveur de dev.

---

## 0. État de MCP 21st — à lire avant tout

Deux constats qui changent la façon d'utiliser l'outil :

**a) Les endpoints « composants » sont cassés côté serveur.**
`logo_search` répond normalement. En revanche `21st_magic_component_inspiration` et
`21st_magic_component_builder` renvoient une réponse malformée (contenu vide) — testé 2 fois,
même erreur. La clé `TWENTY_FIRST_API_KEY` est bien définie : le problème vient du serveur 21st,
pas de la configuration locale.

**b) Incompatibilité de fond avec ce projet.**
21st.dev génère du **React / TSX**. Or ce site est :

| | |
|---|---|
| Framework UI | **aucun** — Astro pur, zéro React/Vue/Svelte |
| CSP | `default-src 'self'; script-src 'self'; style-src 'self'` — pas d'`unsafe-inline` |
| JS total | 3 fichiers dans `public/js/` |

Coller un composant 21st tel quel imposerait d'ajouter React au projet, ce qui casserait le modèle
performance + CSP stricte construit lors des sessions précédentes.

> **Recommandation : utiliser 21st comme banque d'inspiration visuelle, et porter à la main en
> `.astro` + Tailwind.** C'est de toute façon peu de travail : les composants ci-dessous sont
> tous réalisables en HTML/CSS sans JS, ou avec quelques lignes dans `public/js/`.

---

## 1. Ce qui fonctionne déjà — à ne pas casser

Le site n'a pas de problème de goût. La direction artistique est cohérente et se démarque :

- **Palette assumée** : crème `#F5F0E8`, vert forêt `#166534`, bronze `#75592F`, vert nuit `#0D2818`.
  Chaude, naturelle, cohérente avec le produit. Rien de générique.
- **Typographie** : Playfair Display (titres) + Inter (texte). Contraste display/serif bien tenu.
- **Grille bento asymétrique** de l'accueil (3/5 + 2/5) avec les chiffres géants en filigrane —
  c'est du vrai design, pas un template.
- **Preuve sociale honnête et forte** : avis réels, barres de répartition des notes, badges
  « Achat vérifié », dates. C'est au-dessus du standard du marché.
- **BuyBox à paliers dégressifs** avec vrai `role="radiogroup"` accessible au clavier.
- **Accessibilité** : sur toute l'accueil, **1 seul écart de contraste** mesuré (4,48 vs 4,5 requis).
- **Performance** : CSP stricte, polices auto-hébergées, images WebP, CLS 0.

L'audit qui suit porte donc sur la **conversion** et la **finition**, pas sur une refonte.

---

## 2. Priorité 1 — Conversion critique

### P1.1 — Le hero mobile n'a aucune image produit

`src/pages/index.astro:173` — la colonne visuelle est en `hidden lg:flex`.

Sur mobile, le visiteur arrive sur un bloc de **90 vh de texte pur**, sans voir le produit.
C'est la majorité du trafic e-commerce français.

**À faire** : afficher une version compacte de l'image au-dessus ou sous le titre en mobile,
et réduire le `min-h-[90vh]` pour que le premier CTA et le produit tiennent dans le premier écran.

### P1.2 — Aucune barre d'achat collante (sticky add-to-cart)

La fiche produit mobile fait **6 951 px de haut**. Passé le BuyBox (vers 1 200 px), il n'existe
plus aucun moyen d'acheter sans remonter toute la page — pendant les avis, la FAQ, le cross-sell.

**À faire** : barre fixe en bas d'écran (mobile) apparaissant après le scroll du BuyBox :
miniature + nom + prix + bouton. Faisable en CSS `position: sticky` + ~15 lignes de JS.

### P1.3 — Les cartes produits de l'accueil sont en `opacity: 0` par défaut

`src/styles/global.css:33` — `[data-reveal] { opacity: 0 }` sous `@media (scripting: enabled)`.

Mesuré au navigateur : les 4 cartes produits sortent à `opacity: "0"`, `transform: translateY(14px)`
tant que l'`IntersectionObserver` n'a pas tourné.

Le garde-fou `@media (scripting: enabled)` couvre le cas « JS désactivé ». Il ne couvre **pas** le cas
« JS activé mais `site.js` n'a pas chargé » (coupure réseau, extension, erreur CSP future) : la
section qui vend reste alors **invisible définitivement**.

**À faire** : filet de sécurité — révéler automatiquement au bout de ~1,5 s, ou retirer `data-reveal`
de la grille produits. Le confort d'animation ne vaut pas le risque sur la section la plus rentable.

### P1.4 — Images floues sur la page collection

`src/pages/perles-ceramique-em/index.astro:94` — `sizes="(max-width: 768px) 100vw, 380px"`

Mesuré à 1440 px de large :

| Rendu réel | Plus grand fichier généré | Requis en retina |
|---|---|---|
| **509 px** | **380 px** | 1 017 px |

L'image est donc déjà agrandie de **34 % en DPR 1**, et environ **2,7×** sur écran retina.
Sur une page dont le seul rôle est de faire cliquer sur un produit, ce sont les 4 visuels qui sont mous.

**À faire** : `sizes` ≈ `560px` et `widths={[300, 600, 1120]}`.

---

## 3. Priorité 2 — Copywriting & marketing

### P2.1 — Deux notes concurrentes qui s'annulent

Fiche produit, l'une sous l'autre :

```
★★★★★ 4,91/5 · 45 avis vérifiés
★★★★★ 4,6/5 · 816 commentaires sur Amazon
```

Juxtaposées sans hiérarchie, le visiteur retient **la plus basse**. La règle en copywriting :
un seul chiffre dominant, le reste en appui.

**À faire** : garder `4,91/5` en principal, transformer Amazon en preuve de volume plutôt qu'en
note concurrente — par ex. « Déjà **861 avis** au total, dont 816 sur Amazon ».

### P2.2 — Les CTA ne disent pas ce qu'on obtient

Actuels : « Commander », « Choisir ce pack », « Ajouter au panier », « Commander maintenant ».
C'est du vocabulaire de marchand, pas de bénéfice client. Seul le hero fait exception
(« Purifier mon eau — dès 19,90 € ») et c'est le bon modèle.

**À faire** : aligner sur le bénéfice + lever le risque, ex. « Ajouter au panier — garanti 30 jours ».

### P2.3 — Aucune urgence ni délai concret

Il manque les trois leviers standards de fiche produit :
- date de livraison estimée (« commandé aujourd'hui, chez vous le X »)
- indication de stock
- rappel du seuil de livraison offerte **au moment du choix du palier**
  (aujourd'hui il n'apparaît qu'en petit sous le bouton)

### P2.4 — L'argument économique est enterré

Le bénéfice le plus fort de ce produit — **arrêter d'acheter de l'eau en bouteille** — n'apparaît
qu'en bas de page, dans la section Mission. Le hero parle de chlore, de goût et de tartre :
des bénéfices sensoriels, plus difficiles à se représenter qu'une économie chiffrée.

**À faire** : remonter un comparatif chiffré (coût annuel bouteilles vs un pack de perles) juste
après le hero. ⚠️ Le chiffre doit être sourcé et vérifiable — cf. `tasks/lessons.md`, aucune
allégation non sourcée sur ce site.

### P2.5 — Aucune preuve visuelle

Le produit se vend sur le **goût** et l'**odeur**, deux choses invisibles, uniquement décrites
en texte. Il n'y a ni schéma « avant / après », ni visuel d'usage (perles dans une carafe,
dans une bouilloire), ni illustration du dosage 15 perles/litre.

---

## 4. Priorité 3 — Finition

| # | Constat | Fichier |
|---|---|---|
| 4.1 | Le logo « Aimez la Nature » passe **sur 2 lignes** en mobile (390 px) | `BaseLayout.astro:152` |
| 4.2 | Header mobile surchargé : logo + panier + « Commander » + burger sur une ligne | `BaseLayout.astro:162` |
| 4.3 | Le tiroir panier apparaît **sans aucune animation** (pas de glissement) | `CartDrawer.astro:41` |
| 4.4 | Cross-sell « Les autres packs » **sans images**, grille 3 colonnes avec 2 items → trou visuel | `[slug].astro:142` |
| 4.5 | **Une seule photo** par produit, pas de galerie ni de vue détail/usage | `[slug].astro:49` |
| 4.6 | Description produit = 4 paragraphes de texte brut, aucun rythme visuel | `[slug].astro:121` |
| 4.7 | Prix barré 12 px à **4,48** de contraste (seuil 4,5) | `index.astro:272` |
| 4.8 | Aucun `<title>`/`aria` sur le fil d'Ariane visible (`<ol>` sans `<nav aria-label>`) | `BaseLayout.astro:217` |

---

## 5. Plan d'action proposé

Ordonné par rapport impact / effort.

**Lot A — Conversion (le plus rentable)**
1. Sticky add-to-cart mobile — P1.2
2. Hero mobile avec visuel produit — P1.1
3. Filet de sécurité sur `data-reveal` — P1.3
4. Correction `sizes`/`widths` collection — P1.4

**Lot B — Copywriting**
5. Hiérarchiser les deux notes — P2.1
6. Réécrire les CTA en bénéfice — P2.2
7. Délai de livraison + rappel seuil dans le BuyBox — P2.3

**Lot C — Finition**
8. Logo + header mobile — 4.1 / 4.2
9. Animation du tiroir panier — 4.3
10. Cross-sell avec images — 4.4
11. Rythme visuel de la description — 4.6

**Hors lot, à valider par le marchand avant affichage** (règle `lessons.md`) :
- P2.4 — le comparatif chiffré « bouteilles vs perles » exige une source réelle
- P2.3 — la date de livraison estimée exige un délai transporteur confirmé
- Les prix barrés (25,90 / 42,90 / 39,90 / 72,80 €) : conformité Omnibus toujours en attente
  de confirmation (déjà signalé dans `tasks/todo.md`)

---

## 6. Méthode de vérification utilisée

- `npm run build` → 25 pages, 0 erreur
- Rendu inspecté au navigateur (Playwright) en **1440 px** et **390 px**, sur le build statique
- Contraste : calcul WCAG sur tous les nœuds texte, couleurs converties via canvas
  (les `oklch()` de Tailwind v4 ne sont pas lisibles par simple regex — un premier passage
  a produit 22 faux positifs avant correction)
- Dimensions d'images : `naturalWidth` vs `getBoundingClientRect()` réel
- CSP et dépendances lues dans `public/_headers` et `package.json`
