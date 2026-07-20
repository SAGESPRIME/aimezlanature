import type { ImageMetadata } from 'astro';
import pack55 from '../assets/products/pack-55-perles.jpg';
import pack100 from '../assets/products/pack-100-perles.jpg';
import packGourde from '../assets/products/pack-gourde-ceramique-em.jpg';

/**
 * Photo produit par slug — source unique de vérité pour l'affichage,
 * le schema Product et les balises Open Graph.
 *
 * Un slug absent d'ici retombe automatiquement sur le visuel de substitution
 * et voit son champ `image` omis du schema, plutôt que de pointer vers une
 * URL 404. Ajouter une photo = ajouter une ligne ici, rien d'autre.
 */
const productImages: Record<string, ImageMetadata> = {
  'pack-55-perles': pack55,
  'pack-100-perles': pack100,
  'pack-gourde-ceramique-em': packGourde,
};

export function getProductImage(slug: string): ImageMetadata | undefined {
  return productImages[slug];
}

/** Texte alternatif descriptif — évite un alt générique pour le SEO et les lecteurs d'écran. */
export function getProductImageAlt(name: string): string {
  return `${name} — tube biodégradable, sachet en coton BIO et perles de céramique`;
}
