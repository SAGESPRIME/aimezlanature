# Lessons — anti-patterns à éviter

[2026-07-20] | L'API DataForSEO renvoyait 40104 « verify your account » alors que l'email était confirmé | Un compte DataForSEO neuf exige email + SMS téléphone ; après validation, compter ~1 min de propagation et retenter (des 40104 sporadiques peuvent persister quelques minutes)
[2026-07-20] | `fetch` de Node échouait vers api.dataforseo.com alors que curl passait | Sur cette machine, faire les appels HTTP externes avec curl (Bash), pas avec fetch Node
