# COPY-NOTES — corrections du 2026-07-20

Suite à l'audit `docs/audit/rapport-audit-2026-07-20.md`.

## 🔴 Critiques corrigés
- **Témoignages inventés remplacés par de vrais avis.** Les 3 témoignages de l'accueil
  (« Marie L. », « Thomas G. », « Sophie M. ») ne correspondaient à aucun avis réel.
  Remplacés par des extraits mot pour mot du JSON-LD des fiches d'aimezlanature.fr
  (relevé 2026-07-20) : Amine B. (Pack 55), Corine M. et Patrick D. (Pack 100), tous 5/5.
  Mention de source ajoutée sous le titre de la section. Règle : un avis affiché doit
  être vérifiable (art. L121-2 Code conso).
- **Don 2,5 % unifié.** Trois formulations coexistaient (« bénéfices » / « chaque
  commande » / « votre achat »). Unifié partout sur « 2,5 % de nos bénéfices » — la
  formulation la plus prudente juridiquement. ⚠️ **À faire confirmer par le marchand** :
  aucune trace de cet engagement sur le site en ligne actuel (vérifié accueil, fiches,
  qui-sommes-nous). Si l'engagement réel est différent (ou inexistant), ajuster
  `SITE.donationClaim` dans `src/data/products.ts` — tout le site suivra.
- **Prix barrés** : les remises -18/-23/-30 % correspondent bien aux prix affichés sur
  le site en ligne. ⚠️ Conformité Omnibus (prix le plus bas des 30 derniers jours) à
  confirmer par le marchand — note ajoutée dans `products.ts`.

## Corrections
- Hero accueil : CTA « Découvrir nos packs » → « Purifier mon eau — dès 19,90 € »
  (bénéfice + ancrage prix).
- Collection : « Voir le pack » → « Choisir ce pack » (possession).
- Badge hero « Certification EM® Japon 🇯🇵 » → « Procédé EM® original / Fabriqué au
  Japon » (le terme « certification » n'était pas sourcé).
- Emojis-icônes remplacés par des SVG (composant `Icon.astro`).

## Variantes A/B en réserve (logique psychologique dans le rapport d'audit)
- Hero V1 (coût) : « Ne rachetez plus jamais d'eau. 19,90 € une fois. »
- Hero V2 (ennemi commun) : « Le goût du chlore s'arrête ici. »
- Hero V3 (preuve sociale) : « 96 foyers ont dit adieu aux bouteilles. »
- CTA post-Stripe : « Purifier mon eau — 19,90 € » / « J'essaie 30 jours sans risque » /
  « Commander mon Pack 55 ».

## Restant
- Friction n°1 : « Commander par email » — attend les liens Stripe Payment Links (utilisateur).
- Nommer l'association des puits sur /a-propos/ (info à demander au marchand).
- Rapatrier les avis détaillés sur chaque fiche produit (les textes existent sur le site actuel).
