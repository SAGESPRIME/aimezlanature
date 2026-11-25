/**
 * Crédits des photos d'ambiance (src/assets/ambiance/), affichés sur
 * /mentions-legales/#credits-photos.
 *
 * Photos libres trouvées via Openverse sur Wikimedia Commons, choix du
 * marchand (2026-11-24) en attendant ses propres photos. Seules des licences
 * permettant l'usage COMMERCIAL et la MODIFICATION (recadrage) sont admises :
 * CC0 / domaine public, ou CC BY (attribution obligatoire, c'est l'objet de
 * cette liste). Jamais de CC BY-SA, NC ou ND.
 *
 * ⚠️ Retirer une photo du site = retirer sa ligne ici (et inversement : toute
 * nouvelle photo CC BY doit y figurer). Détails et vérifications :
 * docs/design/photos.md.
 */
export interface CreditPhoto {
  fichier: string;
  titre: string;
  auteur: string;
  licence: 'CC0 1.0' | 'CC BY 2.0' | 'CC BY 3.0' | 'CC BY 4.0';
  urlLicence: string;
  source: string;
  modifiee: boolean;
}

const BY2 = 'https://creativecommons.org/licenses/by/2.0/deed.fr';

export const creditsPhotos: CreditPhoto[] = [
  {
    fichier: 'verre-eau-table.jpg',
    titre: 'Woman with a glass of water sits at a table in a relaxed cafe setting',
    auteur: 'Shixart1985',
    licence: 'CC BY 2.0',
    urlLicence: BY2,
    source: 'https://commons.wikimedia.org/w/index.php?curid=192298950',
    modifiee: true,
  },
  {
    fichier: 'galets-eau.jpg',
    titre: 'Hard stone, soft water',
    auteur: 'Zoltán Vörös',
    licence: 'CC BY 2.0',
    urlLicence: BY2,
    source: 'https://commons.wikimedia.org/w/index.php?curid=92860273',
    modifiee: false,
  },
  {
    fichier: 'fenetre-cuisine.jpg',
    titre: 'Kitchen window',
    auteur: 'Ruth Hartnup',
    licence: 'CC BY 2.0',
    urlLicence: BY2,
    source: 'https://commons.wikimedia.org/w/index.php?curid=180506660',
    modifiee: false,
  },
  {
    fichier: 'source-montagne.jpg',
    titre: 'Mountain Spring',
    auteur: 'Raita Futo',
    licence: 'CC BY 2.0',
    urlLicence: BY2,
    source: 'https://commons.wikimedia.org/w/index.php?curid=143679727',
    modifiee: false,
  },
  {
    fichier: 'argile-tour.jpg',
    titre: 'The Wheel',
    auteur: 'Stephanie Pakrul',
    licence: 'CC BY 3.0',
    urlLicence: 'https://creativecommons.org/licenses/by/3.0/deed.fr',
    source: 'https://commons.wikimedia.org/wiki/File:The_Wheel_(135616779).jpeg',
    modifiee: false,
  },
  {
    fichier: 'pierre-eau.jpg',
    titre: 'Serenity in stone and water',
    auteur: 'Deshna Subramanian',
    licence: 'CC0 1.0',
    urlLicence: 'https://creativecommons.org/publicdomain/zero/1.0/deed.fr',
    source: 'https://commons.wikimedia.org/wiki/File:Serenity_in_stone_and_water.jpg',
    modifiee: false,
  },
];
