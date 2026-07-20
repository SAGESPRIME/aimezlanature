# Playbook — pratiques qui marchent

[2026-07-20] | Recherche SEO DataForSEO à petit budget : 1 appel search_volume (35 seeds) + keyword_suggestions + related_keywords + 5 SERP live + ranked_keywords du leader = 0,17 $ | Vision complète marché + concurrents pour moins de 20 centimes
[2026-07-20] | Pattern d'appel API : payload JSON dans un fichier scratchpad + curl -u "$(cat creds.txt)" + petit node -e pour extraire | Traçable (JSON bruts conservés), rejouable, identifiants jamais dans le projet
[2026-07-20] | Analyser les ranked_keywords du concurrent n°1 (lesvertsmoutons.com) plutôt que deviner | A révélé le modèle gagnant : 1 fiche produit forte + 4 guides blog qui verrouillent les requêtes confiance/usage
[2026-07-20] | Pages guide Astro : contenu (FAQ, tableaux, étapes) en tableaux d'objets dans le frontmatter + composants partagés Faq/CtaPacks + helpers lib/seo.ts | Fichiers < 300 lignes, schema JSON-LD généré depuis la même source que l'affichage (zéro divergence), vérifiable par grep sur dist/
[2026-07-20] | Avant de rédiger des mentions légales/CGV, vérifier via WebFetch si un site déjà en ligne pour la marque existe (ex. aimezlanature.fr) plutôt que d'inventer ou de mettre un placeholder | Récupère les vraies infos légales (raison sociale, SIRET, hébergeur) sans halluciner ni bloquer sur une question à l'utilisateur
