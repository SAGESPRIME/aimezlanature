# Lessons — anti-patterns à éviter

[2026-07-20] | L'API DataForSEO renvoyait 40104 « verify your account » alors que l'email était confirmé | Un compte DataForSEO neuf exige email + SMS téléphone ; après validation, compter ~1 min de propagation et retenter (des 40104 sporadiques peuvent persister quelques minutes)
[2026-07-20] | `fetch` de Node échouait vers api.dataforseo.com alors que curl passait | Sur cette machine, faire les appels HTTP externes avec curl (Bash), pas avec fetch Node
[2026-07-20] | `npm run build` échouait en EPERM sur `dist/client` : des shells/node lancés en arrière-plan depuis `dist/client` gardaient le dossier verrouillé (Windows) | Lancer un serveur de preview depuis la racine du projet, et l'arrêter via PowerShell (`Get-Process python \| Stop-Process`) plutôt qu'en backgroundant `( ... & )` depuis un sous-dossier
[2026-07-20] | Le schema Product pointait vers `/images/{slug}.jpg` et og:image vers `og-default.jpg` — deux fichiers qui n'ont jamais existé | Après avoir écrit un chemin d'asset en dur, vérifier qu'il existe vraiment (`ls public/...` ou grep sur `dist/`) : un build qui passe ne prouve pas qu'une image référencée existe
