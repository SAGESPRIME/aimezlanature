# Photos d'ambiance — provenance et licences

Photos provisoires, choisies le 2026-11-24 en attendant les photos du marchand
(remplacement : déposer le nouveau fichier sous le même nom dans
`src/assets/ambiance/`, puis mettre à jour ou retirer sa ligne dans
`src/data/creditsPhotos.ts`).

- **Source** : recherche Openverse (`source=wikimedia`, licences `cc0,pdm,by`),
  fichiers téléchargés depuis `upload.wikimedia.org` puis **auto-hébergés**
  (optimisés au build par Astro) : aucun appel à Wikimedia depuis le navigateur.
- **Licences admises** : CC0 / domaine public, CC BY (usage commercial et
  modification autorisés, **attribution obligatoire**). Refusées : BY-SA, NC, ND.
- **Attribution** : `/mentions-legales/#credits-photos`, lien « Crédits photos »
  dans le pied de page, généré depuis `src/data/creditsPhotos.ts`.

| Fichier | Titre (Commons) | Auteur | Licence | Vérif. Commons |
|---|---|---|---|---|
| verre-eau-table.jpg | Woman with a glass of water sits at a table… | Shixart1985 | CC BY 2.0 | via Openverse |
| galets-eau.jpg | Hard stone, soft water | Zoltán Vörös | CC BY 2.0 | via Openverse |
| fenetre-cuisine.jpg | Kitchen window | Ruth Hartnup | CC BY 2.0 | via Openverse |
| source-montagne.jpg | Mountain Spring | Raita Futo | CC BY 2.0 | via Openverse |
| argile-tour.jpg | The Wheel | Stephanie Pakrul | CC BY 3.0 | confirmée (API Commons) |
| pierre-eau.jpg | Serenity in stone and water | Deshna Subramanian | CC0 | confirmée (API Commons) |

« via Openverse » : licence lue dans l'index Openverse ; l'API Commons a refusé
la vérification croisée (limite de débit). À contrôler une fois sur la page
Commons (liens dans `creditsPhotos.ts`) avant la mise en production.

## Droit à l'image

`verre-eau-table.jpg` montre une personne : la licence CC couvre le droit
d'auteur du photographe, **pas** le droit à l'image de la personne. La photo est
donc **recadrée sur la main et le verre** (visage exclu, personne non
identifiable). Ne pas réutiliser l'original non recadré.
