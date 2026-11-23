/**
 * Produits et réglages du site — FAÇADE sur le contenu Sanity.
 *
 * Les données vivent dans Sanity (Studio : studio.aimezlanature.fr) et sont
 * chargées AU BUILD par src/content.config.ts, qui les valide. Ce module les
 * expose sous la forme que tout le site utilisait déjà (`products`, `SITE`,
 * `getProduct`) : les composants n'ont pas eu à changer.
 *
 * ⚠️ SÉCURITÉ DU PAIEMENT : /api/checkout lit les prix ICI. Ils ont été figés
 * au build — aucun appel à Sanity pendant un paiement, et aucun prix ne vient
 * jamais du navigateur.
 *
 * ⚠️ Ne PAS réintroduire de « don 2,5 % / puits » : cet engagement n'existe
 * pas (confirmé par le marchand le 2026-07-20) et avait été inventé.
 */
import { getCollection, getEntry } from 'astro:content';
import type { ImageCms } from '../lib/cms/images';

export interface Product {
  slug: string;
  name: string;
  shortName: string;
  sku: string;
  priceCurrent: number;
  /**
   * Prix barré, ABSENT s'il n'y a pas de vraie réduction en cours.
   * ⚠️ Directive Omnibus (L112-1-1 Code conso) : un prix barré doit être le
   * prix le plus bas pratiqué dans les 30 jours précédant la réduction.
   */
  priceOriginal?: number;
  /** Calculé à partir du prix barré (0 sans prix barré) — jamais saisi à la main. */
  discountPercent: number;
  inStock: boolean;
  /** Nombre de perles fournies. Absent quand le produit n'est pas vendu au nombre de perles. */
  quantity?: number;
  includesBottle: boolean;
  /**
   * Note et nombre d'avis, CALCULÉS à partir des avis publiés dans Sanity.
   * Absents tant qu'un produit n'a reçu aucun avis : pas d'étoiles affichées,
   * et le schema omet `aggregateRating` plutôt que d'inventer une note.
   */
  rating?: number;
  reviewCount?: number;
  /** Best-seller de la gamme — badge « Bestseller » et mise en avant. */
  bestseller?: boolean;
  description: string;
  usages: string[];
  qa: { question: string; answer: string }[];
  metaTitle: string;
  metaDescription: string;
  image: ImageCms;
  /** Dernière modification dans Sanity (sitemap). */
  updatedAt?: string;
}

const arrondi2 = (n: number) => Math.round(n * 100) / 100;

const avisPublies = (await getCollection('avis')).map((e) => e.data);

/** Note moyenne (au centième) et nombre d'avis d'un produit. */
function noteDe(slug: string): { rating?: number; reviewCount?: number } {
  const liste = avisPublies.filter((a) => a.produit === slug);
  const notes = liste.map((a) => a.note).filter((n): n is number => typeof n === 'number');
  if (liste.length === 0 || notes.length === 0) return {};
  return { rating: arrondi2(notes.reduce((s, n) => s + n, 0) / notes.length), reviewCount: liste.length };
}

export const products: Product[] = (await getCollection('produits'))
  .map(({ id, data: p }) => ({
    slug: id,
    name: p.nom,
    shortName: p.nomCourt,
    sku: p.sku,
    priceCurrent: p.prix,
    ...(p.prixBarre ? { priceOriginal: p.prixBarre } : {}),
    discountPercent: p.prixBarre ? Math.round((1 - p.prix / p.prixBarre) * 100) : 0,
    inStock: p.enStock,
    ...(p.nombrePerles ? { quantity: p.nombrePerles } : {}),
    includesBottle: Boolean(p.avecGourde),
    ...noteDe(id),
    bestseller: Boolean(p.bestseller),
    description: p.description,
    usages: p.usages,
    qa: (p.questions ?? []).map((q) => ({ question: q.question, answer: q.reponse })),
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    image: p.image,
    ...(p._updatedAt ? { updatedAt: p._updatedAt } : {}),
    ordre: p.ordre,
  }))
  .sort((a, b) => a.ordre - b.ordre)
  .map(({ ordre: _ordre, ...p }) => p);

/** Prix d'entrée de gamme (produits en stock), formaté « 19,90 € ». Pour les « dès … ». */
export const prixDEntree = (): string => {
  const enVente = products.filter((p) => p.inStock).map((p) => p.priceCurrent);
  return `${Math.min(...enVente).toFixed(2).replace('.', ',')} €`;
};

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

const reglages = (await getEntry('reglages', 'reglages'))!.data;

export const SITE = {
  name: reglages.nom,
  url: reglages.url.replace(/\/$/, ''),
  description: reglages.description,
  /** Nombre d'avis publiés sur le site — calculé, jamais saisi à la main. */
  totalReviews: avisPublies.length,
  /** Note globale affichée — réglage du Studio, à garder fidèle aux avis réels. */
  globalRating: reglages.noteGlobale,
  freeShippingThreshold: reglages.seuilLivraisonOfferte,
  /**
   * Frais de port sous le seuil de gratuité, en euros. Source UNIQUE : lue par
   * le tunnel Stripe (api/checkout.ts) et par le panier (CartDrawer).
   */
  shippingFee: reglages.fraisDePort,
  /** Année de création de la marque. */
  foundingYear: reglages.anneeCreation,
  /** Profils officiels de la marque (schema sameAs). */
  profiles: reglages.profils ?? [],
  /**
   * Preuve sociale Amazon. ⚠️ Ces avis sont collectés par Amazon, PAS sur ce
   * site : toujours affichés avec la mention « sur Amazon » et jamais injectés
   * dans l'aggregateRating des fiches produit (règle Google).
   */
  amazon: {
    rating: reglages.amazon.note,
    reviewCount: reglages.amazon.nbCommentaires,
    url: reglages.amazon.url,
  },
};
