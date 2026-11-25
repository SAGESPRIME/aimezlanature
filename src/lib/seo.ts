import { SITE, type Product } from '../data/products';
import { reviewsFor } from '../data/reviews';
import { fraisLivraison } from '../data/livraison.mjs';

/**
 * Identité de la marque, référencée par `@id` dans tout le graphe : Google et
 * les moteurs d'IA relient ainsi produits, articles et pages à UNE entité.
 * Chaque page qui la cite redonne nom, URL et logo, car un `@id` n'est résolu
 * qu'à l'intérieur d'une même page.
 */
export const ID_ORGANISATION = `${SITE.url}/#organisation`;
export const ID_SITE_WEB = `${SITE.url}/#site`;

const CONTACT = {
  email: 'contact@aimezlanature.fr',
};

/** Référence courte à l'organisation, à placer dans publisher, seller, etc. */
export function organisationRef() {
  return { '@type': 'Organization', '@id': ID_ORGANISATION, name: SITE.name, url: SITE.url, logo: `${SITE.url}/logo.png` };
}

/** Description complète de l'organisation (accueil, À propos). */
export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    ...organisationRef(),
    legalName: 'SAS Naturalis Vert',
    description: SITE.description,
    // Création de la marque (source : le marchand), à ne pas confondre avec le
    // dépôt INPI n° 4664991 publié le 31/07/2020.
    foundingDate: String(SITE.foundingYear),
    address: {
      '@type': 'PostalAddress',
      streetAddress: '145 rue de Noisy-le-Sec',
      postalCode: '93260',
      addressLocality: 'Les Lilas',
      addressCountry: 'FR',
    },
    // Profils officiels (Studio → Réglages) : relient la fiche Amazon et les
    // réseaux à cette entité plutôt qu'à un revendeur tiers.
    sameAs: SITE.profiles,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      ...CONTACT,
      availableLanguage: 'French',
    },
  };
}

/**
 * Site web. Pas de `SearchAction` : le site n'a pas de moteur de recherche
 * interne, et l'ancienne déclaration pointait vers une recherche inexistante
 * (/perles-ceramique-em/?q=…).
 */
export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': ID_SITE_WEB,
    name: SITE.name,
    url: SITE.url,
    inLanguage: 'fr-FR',
    publisher: { '@id': ID_ORGANISATION },
  };
}

/**
 * Conditions de livraison et de retour, telles qu'écrites dans les CGV
 * (articles 4, 5 et 6). Toute modification des CGV doit se refléter ici :
 * Google affiche ces informations dans les résultats produits.
 */
function livraisonEtRetour(p: Product) {
  const livraison = fraisLivraison([{ poids: p.poids, qty: 1, offerte: p.livraisonOfferte }], SITE.livraison);
  return {
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'FR' },
      // Pour un article seul, avec la règle au poids du paiement.
      shippingRate: {
        '@type': 'MonetaryAmount',
        value: livraison.frais ?? SITE.shippingFee,
        currency: 'EUR',
      },
      // CGV art. 4 : « livrées sous 2 à 5 jours ouvrés à compter de la
      // confirmation du paiement » (préparation 0-1 j + acheminement 2-4 j).
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
        transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 4, unitCode: 'DAY' },
      },
    },
    // CGV art. 6 : garantie « satisfait ou remboursé » 30 jours ; art. 5 : frais
    // de retour à la charge du client.
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'FR',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 30,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
    },
  };
}

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
      itemCondition: 'https://schema.org/NewCondition',
      url: `${SITE.url}/perles-ceramique-em/${p.slug}/`,
      seller: organisationRef(),
      ...livraisonEtRetour(p),
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

/** Schema.org Article pour les guides et les articles du blog. */
export function buildArticleSchema(opts: {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  /** URL (absolue ou racine) d'une image réellement émise dans le build. */
  image?: string;
  /**
   * Auteur identifié (Sanity). Sans lui, l'article est signé par la marque :
   * mieux vaut une organisation réelle qu'une personne inventée.
   */
  author?: { nom: string; role: string; liens?: string[] | null };
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    inLanguage: 'fr-FR',
    author: opts.author
      ? {
          '@type': 'Person',
          name: opts.author.nom,
          jobTitle: opts.author.role,
          ...(opts.author.liens?.length ? { sameAs: opts.author.liens } : {}),
        }
      : organisationRef(),
    publisher: organisationRef(),
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    ...(opts.image ? { image: new URL(opts.image, SITE.url).href } : {}),
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
