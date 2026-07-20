import type { ImageMetadata } from 'astro';
import pack55 from '../assets/products/pack-55-perles.jpg';
import pack100 from '../assets/products/pack-100-perles.jpg';
import packGourde from '../assets/products/pack-gourde-ceramique-em.jpg';
import gourde from '../assets/products/gourde-ecologique.jpg';

/**
 * Visuel produit par slug — source unique de vérité pour l'affichage,
 * le schema Product et les balises Open Graph.
 *
 * Un slug absent d'ici retombe automatiquement sur le visuel de substitution
 * et voit son champ `image` omis du schema, plutôt que de pointer vers une
 * URL 404. Ajouter une photo = ajouter une entrée ici, rien d'autre.
 *
 * L'alt décrit ce qu'on voit réellement sur la photo : les packs montrent les
 * tubes et le sachet coton, la gourde montre la bouteille en verre et sa boîte.
 */
interface ProductVisual {
  image: ImageMetadata;
  alt: string;
}

const productVisuals: Record<string, ProductVisual> = {
  'pack-55-perles': {
    image: pack55,
    alt: 'Pack 55 Perles de Céramique EM® : tubes en carton biodégradable, sachet en coton BIO et perles de céramique',
  },
  'pack-100-perles': {
    image: pack100,
    alt: 'Pack 100 Perles de Céramique EM® : tubes en carton biodégradable, sachet en coton BIO et perles de céramique',
  },
  'pack-gourde-ceramique-em': {
    image: packGourde,
    alt: 'Pack Gourde : boîte de 100 Perles de Céramique EM® et gourde écologique 500 ml en verre remplie de perles',
  },
  'gourde-ecologique': {
    image: gourde,
    alt: 'Gourde Écologique 500 ml en verre double paroi avec son compartiment à Perles de Céramique EM® et son coffret',
  },
};

export function getProductImage(slug: string): ImageMetadata | undefined {
  return productVisuals[slug]?.image;
}

export function getProductImageAlt(slug: string): string {
  return productVisuals[slug]?.alt ?? '';
}
