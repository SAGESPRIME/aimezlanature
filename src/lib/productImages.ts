/**
 * Visuel d'un produit — prêt pour <Image> (`<Image {...photo} />`).
 *
 * La photo et son texte alternatif sont saisis dans Sanity (champ « Photo
 * principale », alt obligatoire). Un produit sans photo renvoie `undefined` :
 * les pages affichent alors leur visuel de substitution et le schema Product
 * omet son champ `image` plutôt que de pointer vers une URL en 404.
 */
import { getProduct } from '../data/products';
import { sourceImage, type SourceImage } from './cms/images';

export function getProductPhoto(slug: string): SourceImage | undefined {
  return sourceImage(getProduct(slug)?.image);
}
