/**
 * Photos d'ambiance du site — modifiables par le marchand dans le Studio
 * (Réglages du site → Photos du site), avec une photo de SECOURS locale pour
 * chaque emplacement laissé vide.
 *
 * Les emplacements sont déclarés une seule fois, dans contenu/photos-site.json
 * (lu aussi par le Studio et par la requête de contenu). Ce module ajoute la
 * photo de secours de chacun et décide laquelle afficher.
 *
 * Une photo saisie dans Sanity est téléchargée et optimisée AU BUILD (comme
 * les photos produit) : le navigateur ne contacte jamais Sanity.
 */
import type { ImageMetadata } from 'astro';
import { getEntry } from 'astro:content';
import photosSite from '../../contenu/photos-site.json';
import { creditsPhotos, type CreditPhoto } from './creditsPhotos';
import type { SourceImage } from '../lib/cms/images';
import verreEau from '../assets/ambiance/verre-eau-table.jpg';
import galetsEau from '../assets/ambiance/galets-eau.jpg';
import fenetreCuisine from '../assets/ambiance/fenetre-cuisine.jpg';
import sourceMontagne from '../assets/ambiance/source-montagne.jpg';
import argileTour from '../assets/ambiance/argile-tour.jpg';
import pierreEau from '../assets/ambiance/pierre-eau.jpg';

export type Emplacement =
  | 'accueil'
  | 'commentCaMarche'
  | 'maison'
  | 'balade'
  | 'mission'
  | 'modeEmploi'
  | 'guides'
  | 'comparatif';

interface Secours {
  src: ImageMetadata;
  fichier: string;
  alt: string;
}

const SECOURS: Record<Emplacement, Secours> = {
  accueil: { src: verreEau, fichier: 'verre-eau-table.jpg', alt: "Main tenant un verre d'eau fraîche posé sur une table" },
  commentCaMarche: { src: galetsEau, fichier: 'galets-eau.jpg', alt: "Galets lisses affleurant à la surface d'une eau calme" },
  maison: { src: fenetreCuisine, fichier: 'fenetre-cuisine.jpg', alt: 'Fenêtre de cuisine ouverte sur un jardin, une orchidée sur le rebord' },
  balade: { src: sourceMontagne, fichier: 'source-montagne.jpg', alt: 'Source de montagne coulant entre des rochers moussus' },
  mission: { src: argileTour, fichier: 'argile-tour.jpg', alt: "Mains de potier façonnant l'argile sur le tour" },
  modeEmploi: { src: pierreEau, fichier: 'pierre-eau.jpg', alt: "Roche lisse au bord d'une eau calme" },
  guides: { src: pierreEau, fichier: 'pierre-eau.jpg', alt: "Roche lisse au bord d'une eau calme" },
  comparatif: { src: sourceMontagne, fichier: 'source-montagne.jpg', alt: 'Source de montagne coulant entre des rochers moussus' },
};

// Garde-fou : tout emplacement déclaré dans le JSON a sa photo de secours.
for (const e of photosSite.emplacements) {
  if (!(e.cle in SECOURS)) throw new Error(`photosSite : pas de photo de secours pour l'emplacement « ${e.cle} »`);
}

const saisies = (await getEntry('reglages', 'reglages'))?.data.photos ?? {};

interface PhotoSaisie {
  alt?: string | null;
  credit?: string | null;
  url?: string | null;
  largeur?: number | null;
  hauteur?: number | null;
  hotspot?: { x: number; y: number } | null;
}

/** Photo saisie dans le Studio, seulement si elle a un fichier ET un texte alternatif. */
function saisie(cle: Emplacement): (PhotoSaisie & { url: string; alt: string }) | undefined {
  const p = (saisies as Record<string, PhotoSaisie | null | undefined>)[cle];
  return p?.url && p.alt ? (p as PhotoSaisie & { url: string; alt: string }) : undefined;
}

/** Ce qu'il faut passer à <Image> pour un emplacement. */
export function photoSite(
  cle: Emplacement
): SourceImage | { src: string; width: number; height: number; alt: string } {
  const p = saisie(cle);
  // Dimensions fournies par Sanity : Astro n'a pas à télécharger l'image une
  // fois de plus juste pour les mesurer.
  if (p?.largeur && p.hauteur) return { src: p.url, width: p.largeur, height: p.hauteur, alt: p.alt.trim() };
  if (p) return { src: p.url, inferSize: true, alt: p.alt.trim() };
  const s = SECOURS[cle];
  return { src: s.src, alt: s.alt };
}

/**
 * Cadrage d'une photo recadrée (object-fit: cover) : suit le « point
 * d'intérêt » réglé dans le Studio, au pas de 10 %. Classes CSS (et non un
 * style en ligne, interdit par la CSP) : `.focal .fpx-NN .fpy-NN` dans
 * global.css. Sans point d'intérêt : centré.
 */
export function cadrage(cle: Emplacement): string {
  const h = saisie(cle)?.hotspot;
  if (!h) return 'focal';
  const pas = (v: number) => Math.min(100, Math.max(0, Math.round(v * 10) * 10));
  return `focal fpx-${pas(h.x)} fpy-${pas(h.y)}`;
}

/**
 * Crédits à afficher dans les mentions légales : ceux des photos de secours
 * ENCORE affichées quelque part, puis ceux saisis dans le Studio.
 */
export function creditsAffiches(): { libres: CreditPhoto[]; studio: string[] } {
  const cles = Object.keys(SECOURS) as Emplacement[];
  const fichiersUtilises = new Set(cles.filter((c) => !saisie(c)).map((c) => SECOURS[c].fichier));
  const studio = [...new Set(cles.map((c) => saisie(c)?.credit?.trim()).filter((c): c is string => Boolean(c)))];
  return { libres: creditsPhotos.filter((c) => fichiersUtilises.has(c.fichier)), studio };
}
