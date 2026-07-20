import { SITE, type Product } from '../data/products';

/**
 * Schema.org Product avec offre, note et avis — utilisé sur chaque fiche produit.
 *
 * `imageUrl` doit être l'URL (absolue ou racine) d'une photo réellement servie.
 * Si aucune photo n'existe pour le produit, on omet la propriété : Google
 * préfère un champ absent à une URL en 404, qui déclenche une erreur dans
 * Search Console et supprime le rich result.
 */
export function buildProductSchema(p: Product, imageUrl?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: p.sku,
    brand: { '@type': 'Brand', name: SITE.name },
    description: p.metaDescription,
    url: `${SITE.url}/perles-ceramique-em/${p.slug}/`,
    ...(imageUrl ? { image: new URL(imageUrl, SITE.url).href } : {}),
    offers: {
      '@type': 'Offer',
      price: p.priceCurrent,
      priceCurrency: 'EUR',
      availability: p.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${SITE.url}/perles-ceramique-em/${p.slug}/`,
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'FR' },
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: p.rating,
      reviewCount: p.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
  };
}

/** Schema.org FAQPage à partir d'une liste question/réponse. */
export function buildFaqSchema(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((qa) => ({
      '@type': 'Question',
      name: qa.question,
      acceptedAnswer: { '@type': 'Answer', text: qa.answer },
    })),
  };
}

/** Schema.org Article pour les pages guide. */
export function buildArticleSchema(opts: {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    inLanguage: 'fr-FR',
    author: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    mainEntityOfPage: `${SITE.url}${opts.path}`,
  };
}

/** Schema.org ItemList des produits — utilisé sur la page collection. */
export function buildItemListSchema(products: Product[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.name,
      url: `${SITE.url}/perles-ceramique-em/${p.slug}/`,
    })),
  };
}
