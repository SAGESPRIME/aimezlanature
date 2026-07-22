import { SITE, type Product } from '../data/products';
import { reviewsFor } from '../data/reviews';

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
    // Omis tant que le produit n'a aucun avis : publier une note inventée
    // violerait les règles Google sur les avis et tromperait l'acheteur.
    ...(p.rating && p.reviewCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: p.rating,
            reviewCount: p.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    // Avis individuels réels (src/data/reviews.ts). Limités à 5 : Google n'en
    // exploite qu'un échantillon et les envoyer tous alourdirait chaque page
    // de plusieurs dizaines de kilo-octets pour rien.
    ...(() => {
      const list = reviewsFor(p.slug)
        .filter((r) => r.rating !== null)
        .slice(0, 5);
      return list.length > 0
        ? {
            review: list.map((r) => ({
              '@type': 'Review',
              author: { '@type': 'Person', name: r.author },
              ...(r.date ? { datePublished: r.date } : {}),
              ...(r.title ? { name: r.title } : {}),
              reviewBody: r.text,
              reviewRating: {
                '@type': 'Rating',
                ratingValue: r.rating,
                bestRating: 5,
                worstRating: 1,
              },
            })),
          }
        : {};
    })(),
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
