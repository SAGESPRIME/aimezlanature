# Stratégie SEO — Aimez la Nature

> Données : API DataForSEO, Google France (location 2250, langue fr), juillet 2026.
> Coût de la recherche : ~0,17 $. Fichiers bruts : scratchpad de session (r1 à r5 *.json).

## 1. Le marché en chiffres (volumes mensuels France)

### Mots-clés « produit » (notre cœur)
| Mot-clé | Volume/mois | Concurrence | Cible |
|---|---|---|---|
| perles de céramique (+ perle de céramique, perles céramiques…) | ~1 000 + variantes ≈ 3 000 cumulés | HIGH | Collection |
| perle céramique eau / perles céramique eau | 880 | HIGH | Collection |
| bille céramique eau / billes céramique | 590 + 390 | — | Collection (inclure le mot « billes ») |
| perles de céramique danger | **480 (concurrence FAIBLE)** | LOW | Guide avis/science |
| perles de céramique avis scientifique | 390 | — | Guide avis/science |
| billes anti calcaire | 390 | — | Fiche Pack 55 (bouilloire) |
| perles de céramique pour purifier l'eau | 260-320 | — | Collection |
| perles de céramique ufc que choisir (2 graphies) | 2 × 260 | — | Guide avis/science |
| perles de céramique eau avis | 260 | — | Guide avis/science |
| perles de céramique em | 140 + 70 | HIGH | Accueil + Collection |
| combien de perles de céramique par litre d'eau | 110 | — | Comment ça marche (FAQ) |
| faire bouillir les perles de céramique | 50 | — | Comment ça marche |
| perles céramique bouilloire | 40 | — | Fiche Pack 55 |
| nettoyer / entretenir / utiliser les perles | 40+40+20+20 | — | Comment ça marche |

### Mots-clés « problème » et concurrence indirecte
| Mot-clé | Volume/mois | Commentaire |
|---|---|---|
| filtre eau robinet | 18 100 | Trop concurrentiel en direct — visé via le guide comparatif |
| carafe filtrante | 14 800 | Idem |
| gourde filtrante | 12 100 | Angle pour le Pack Gourde au retour en stock |
| charbon binchotan / charbon actif eau | 1 000 + 1 300 | Comparatif « perles vs charbon » |
| purifier eau du robinet | 320 | Guide comparatif |
| anti calcaire naturel | 320 (MEDIUM) | Pack 100 + guide |
| alternative carafe filtrante | 110 | Guide comparatif (SERP faible : Reddit ranke #3 !) |

## 2. Concurrents (top 10 Google FR sur 5 requêtes)

- **lesvertsmoutons.com — présent sur 5/5 SERP.** Leur recette : UNE fiche produit `/products/perles-ceramique-carafe` qui ranke #1-2 sur tous les mots-clés tête, plus 4 articles de blog qui verrouillent les requêtes de confiance et d'usage (`produit-miracle` → avis scientifique/UFC, `se-servir-des-perles` → danger, `purifier-eau-du-robinet`, `fonctionnement-des-perles`). **C'est le modèle à répliquer.**
- sans-bpa.com (4/5), chamarrel.com (4/5, page « Toutes les réponses » = FAQ géante), orinko.org (3/5).
- dur-a-avaler.com ranke sur « danger » avec un article **critique** (« Miracle ou Arnaque ») → les requêtes de confiance méritent une réponse honnête et sourcée, pas du marketing.
- Sur « alternative carafe filtrante » : SERP faible (Reddit #3, articles génériques) → opportunité réelle.

## 3. Mapping pages ↔ mots-clés

### Pages déjà prévues
1. **`/perles-ceramique-em/` (collection) — LA page money.**
   - Cible : perles de céramique + toutes variantes (perle/perles, céramique/céramiques, billes), perles céramique eau, perles de céramique pour purifier l'eau, perles de céramique em.
   - Title proposé : `Perles de Céramique EM® pour Purifier l'Eau du Robinet | Aimez la Nature`
   - H1 : `Perles de céramique EM® : purifiez l'eau du robinet naturellement`
   - Inclure le mot « billes de céramique » dans le texte (980 recherches cumulées).
   - FAQ (schema FAQPage) avec les PAA : bienfaits ? durée de vie ? comment activer ? défaut majeur ?
2. **Fiches produits** (données déjà dans `src/data/products.ts`) :
   - Pack 35 → perles céramique carafe, combien de perles par litre (renvoi FAQ)
   - Pack 55 → perles céramique bouilloire (40), **billes anti calcaire (390)** — à ajouter au texte
   - Pack 100 → perles céramique lave vaisselle / machine à laver, anti calcaire naturel
   - Pack Gourde → perles céramique gourde + angle « gourde filtrante » (12 100 !) au retour en stock
3. **`/comment-ca-marche/`** — cluster usage/entretien (~350 cumulés) :
   - combien de perles par litre (110), faire bouillir (50), nettoyer (40), entretien (40), utilisation (40+20), activer, première utilisation.
   - Title : `Comment utiliser les perles de céramique ? Guide complet | Aimez la Nature`
   - Structure en questions H2 = les PAA (activer ? première utilisation ? effets sur l'eau ?).
4. **`/a-propos/`** — pas d'enjeu SEO direct. Brand + E-E-A-T (qui sommes-nous, mission puits).

### Nouvelles pages recommandées par les données
5. **`/perles-de-ceramique-avis/` — guide « Avis, dangers : ce que dit la science ». PRIORITÉ #1 contenu.**
   - Cible cumulée ~1 700/mois en concurrence faible : danger (480, LOW), avis scientifique (390), ufc que choisir (520), eau avis (260), efficacité, pesticides.
   - Ton : honnête et sourcé (ce que la science dit et ne dit pas, ce que les perles font et ne font pas — cohérent avec la FAQ produit déjà écrite qui précise que les perles ne filtrent pas métaux lourds/bactéries).
6. **`/purifier-eau-robinet-comparatif/` — guide « Perles, charbon, carafe, osmoseur : que choisir ? »**
   - Cible : purifier eau du robinet (320), alternative carafe filtrante (110, SERP faible), perles de céramique ou charbon actif (30), + capte une part de charbon binchotan (1 000) et carafe filtrante (14 800) en longue traîne.
   - Tableau comparatif prix/durée de vie/déchets → CTA vers les packs.

### Maillage interne
Accueil → Collection → Fiches ; chaque guide → Collection + fiche pertinente ; footer : les 2 guides + comment-ça-marche sur toutes les pages.

## 4. Ce que la recherche NE change PAS
Les metaTitle/metaDescription actuels de `src/data/products.ts` sont cohérents avec les données. Seul ajustement recommandé : glisser « billes anti calcaire » (Pack 55) et « anti-calcaire naturel » (Pack 100) dans les descriptions.

## 5. Ordre de construction proposé
1. Collection `/perles-ceramique-em/` + 4 fiches produits (le socle commercial)
2. `/comment-ca-marche/` (FAQ schema, cluster usage)
3. Guide avis/science (opportunité #1)
4. Guide comparatif
5. `/a-propos/`
