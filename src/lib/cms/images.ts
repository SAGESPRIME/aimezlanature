/**
 * Images venant du contenu (Sanity ou seed) → propriétés prêtes pour le
 * composant <Image> d'Astro.
 *
 * - Image Sanity : URL de cdn.sanity.io. Astro la
 *   télécharge et l'optimise AU BUILD (WebP/AVIF, plusieurs largeurs), puis la
 *   sert depuis /_astro : le navigateur ne contacte jamais Sanity et la CSP
 *   `img-src 'self'` reste intacte.
 * - Image du seed : fichier local de src/assets, importé par Vite.
 */
import type { ImageMetadata } from 'astro';

export interface ImageCms {
  alt: string;
  url?: string | null;
  largeur?: number | null;
  hauteur?: number | null;
  /** Seed uniquement : `image@file://./src/assets/...`. */
  fichier?: string | null;
}

/** Ce qu'attend <Image> : métadonnées locales, ou URL distante + dimensions. */
export type SourceImage =
  | { src: ImageMetadata; alt: string }
  | { src: string; inferSize: true; alt: string };

const locales = import.meta.glob<{ default: ImageMetadata }>('/src/assets/**/*.{jpg,jpeg,png,webp}', {
  eager: true,
});

export function sourceImage(image: ImageCms | null | undefined): SourceImage | undefined {
  if (!image) return undefined;
  if (image.url) {
    // `inferSize` : Astro lit les dimensions réelles au build. Le composant
    // appelant peut alors ne donner qu'une largeur, la hauteur suit le ratio.
    return { src: image.url, inferSize: true, alt: image.alt };
  }
  if (image.fichier) {
    const chemin = image.fichier.replace(/^image@file:\/\/\./, '');
    const module = locales[chemin];
    if (!module) throw new Error(`Image du seed introuvable : ${chemin}`);
    return { src: module.default, alt: image.alt };
  }
  return undefined;
}
