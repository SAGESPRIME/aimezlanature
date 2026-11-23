#!/usr/bin/env node
/**
 * Migration du contenu codé en dur vers Sanity — génère `contenu/seed.ndjson`.
 *
 * ⚠️ SCRIPT HISTORIQUE, exécuté UNE fois au commit 5db6381 (avant que le
 * contenu ne quitte le code). Il lit les anciens fichiers de données et le
 * HTML du build de l'époque. Pour le rejouer :
 *
 *   git worktree add /tmp/avant-sanity 5db6381
 *   cd /tmp/avant-sanity && npm ci && npx astro build
 *   node <ce-dépôt>/scripts/migration-sanity/generer-seed.mjs /tmp/avant-sanity
 *
 * Sources :
 *   - src/data/products.ts, reviews.ts, blogPosts.ts → produits, avis, réglages
 *   - le HTML construit (dist/client) → corps des 8 articles et FAQ des pages,
 *     lus dans le rendu final : c'est exactement ce que voyaient Google et les
 *     visiteurs, y compris les valeurs interpolées (seuil de livraison…).
 *
 * Le fichier produit est AUSSI la source de contenu du site en développement
 * et en CI (CONTENU_SOURCE=seed), interrogée avec les mêmes requêtes GROQ que
 * Sanity grâce à groq-js.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { parse } from 'node-html-parser';

const SOURCE = resolve(process.argv[2] ?? '.');
const SORTIE = resolve(import.meta.dirname, '..', '..', 'contenu', 'seed.ndjson');
const DIST = join(SOURCE, 'dist', 'client');

const { products, SITE } = await import(pathToFileURL(join(SOURCE, 'src/data/products.ts')).href);
const { reviewsByProduct } = await import(pathToFileURL(join(SOURCE, 'src/data/reviews.ts')).href);
const { blogPosts } = await import(pathToFileURL(join(SOURCE, 'src/data/blogPosts.ts')).href);

/** Clé stable (Sanity exige une `_key` dans chaque élément de tableau). */
const cle = (...parts) => createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 12);
const net = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
const html = (chemin) => parse(readFileSync(join(DIST, chemin, 'index.html'), 'utf8'));

const docs = [];

// ── Réglages ──────────────────────────────────────────────────────────────
docs.push({
  _id: 'reglages',
  _type: 'reglages',
  nom: SITE.name,
  url: SITE.url,
  description: SITE.description,
  fraisDePort: SITE.shippingFee,
  seuilLivraisonOfferte: SITE.freeShippingThreshold,
  noteGlobale: SITE.globalRating,
  anneeCreation: SITE.foundingYear,
  profils: [SITE.amazon.url],
  amazon: { note: SITE.amazon.rating, nbCommentaires: SITE.amazon.reviewCount, url: SITE.amazon.url },
});

// ── Produits ──────────────────────────────────────────────────────────────
// Les textes alternatifs des photos vivaient dans src/lib/productImages.ts.
const imagesSrc = readFileSync(join(SOURCE, 'src/lib/productImages.ts'), 'utf8');
const altDe = (slug) => imagesSrc.match(new RegExp(`'${slug}': \\{[\\s\\S]*?alt: '([^']+)'`))?.[1];

products.forEach((p, i) => {
  docs.push({
    _id: `produit-${p.slug}`,
    _type: 'produit',
    nom: p.name,
    nomCourt: p.shortName,
    slug: { _type: 'slug', current: p.slug },
    sku: p.sku,
    // L'ordre d'origine du fichier, sauf la meilleure vente en tête (c'était
    // le tri appliqué par la page collection).
    ordre: i + 1,
    prix: p.priceCurrent,
    prixBarre: p.priceOriginal,
    enStock: p.inStock,
    bestseller: Boolean(p.bestseller),
    ...(p.quantity ? { nombrePerles: p.quantity } : {}),
    avecGourde: p.includesBottle,
    image: {
      _type: 'image',
      _sanityAsset: `image@file://./src/assets/products/${p.slug}.jpg`,
      alt: altDe(p.slug),
    },
    description: p.description,
    usages: p.usages,
    questions: p.qa.map((q) => ({ _type: 'questionReponse', _key: cle(p.slug, q.question), question: q.question, reponse: q.answer })),
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
  });
});

// ── Avis ──────────────────────────────────────────────────────────────────
for (const [slug, liste] of Object.entries(reviewsByProduct)) {
  liste.forEach((r, i) => {
    docs.push({
      _id: `avis-${slug}-${String(i + 1).padStart(3, '0')}`,
      _type: 'avis',
      produit: { _type: 'reference', _ref: `produit-${slug}` },
      auteur: r.author,
      date: r.date,
      ...(r.rating !== null ? { note: r.rating } : {}),
      ...(r.title ? { titre: r.title } : {}),
      texte: r.text,
    });
  });
}

// ── Articles ──────────────────────────────────────────────────────────────
const layout = readFileSync(join(SOURCE, 'src/layouts/BaseLayout.astro'), 'utf8');
const libelleDe = (slug) =>
  layout.match(new RegExp(`'${slug}': '((?:[^'\\\\]|\\\\.)+)'`))?.[1]?.replace(/\\'/g, "'");

/** Convertit le contenu d'une section HTML en Portable Text. */
function versPortableText(noeuds, graine) {
  const blocs = [];
  let n = 0;
  const bloc = (texte, extra = {}) => ({
    _type: 'block',
    _key: cle(graine, String(n++)),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: cle(graine, String(n++)), text: texte, marks: [] }],
    ...extra,
  });
  for (const el of noeuds) {
    const tag = el.tagName?.toLowerCase();
    if (tag === 'p') blocs.push(bloc(net(el.textContent)));
    else if (tag === 'h3') blocs.push(bloc(net(el.textContent), { style: 'h3' }));
    else if (tag === 'ul' || tag === 'ol') {
      for (const li of el.querySelectorAll('li')) {
        blocs.push(bloc(net(li.textContent), { listItem: tag === 'ul' ? 'bullet' : 'number', level: 1 }));
      }
    } else if (tag) throw new Error(`Balise non prévue dans un article : <${tag}> (${graine})`);
  }
  return blocs;
}

for (const post of blogPosts) {
  const slug = post.href.replace(/^\/blog\//, '').replace(/\/$/, '');
  const doc = html(`blog/${slug}`);
  const hero = doc.querySelector('main section');
  const sections = doc
    .querySelectorAll('main section[aria-labelledby^="sec-"]')
    .map((s) => {
      const h2 = s.querySelector('h2');
      const conteneur = h2.parentNode;
      const contenu = conteneur.childNodes.filter((c) => c.nodeType === 1 && c !== h2);
      return {
        _type: 'section',
        _key: cle(slug, h2.textContent),
        titre: net(h2.textContent),
        contenu: versPortableText(contenu, `${slug}|${h2.textContent}`),
      };
    });
  docs.push({
    _id: `article-${slug}`,
    _type: 'article',
    titre: net(doc.querySelector('h1').textContent),
    slug: { _type: 'slug', current: slug },
    libelleCourt: libelleDe(slug),
    titreCarte: post.title,
    categorie: post.category,
    tempsLecture: Number.parseInt(post.readingTime, 10),
    datePublication: post.date,
    extrait: post.excerpt,
    chapo: net(hero.querySelector('h1').nextElementSibling.textContent),
    sections,
    metaTitle: net(doc.querySelector('title').textContent),
    metaDescription: doc.querySelector('meta[name="description"]').getAttribute('content'),
  });
}

// ── FAQ des pages ─────────────────────────────────────────────────────────
const PAGES_FAQ = {
  faq: 'faq',
  accueil: '',
  collection: 'perles-ceramique-em',
  'comment-ca-marche': 'comment-ca-marche',
  utilisations: 'utilisations',
  comparatif: 'purifier-eau-robinet-comparatif',
};
for (const [page, chemin] of Object.entries(PAGES_FAQ)) {
  const doc = html(chemin);
  const faqPage = doc
    .querySelectorAll('script[type="application/ld+json"]')
    .map((s) => JSON.parse(s.textContent))
    .find((j) => j['@type'] === 'FAQPage');
  if (!faqPage) throw new Error(`Pas de FAQPage sur /${chemin}`);
  faqPage.mainEntity.forEach((q, i) => {
    docs.push({
      _id: `faq-${page}-${String(i + 1).padStart(2, '0')}`,
      _type: 'faq',
      question: q.name,
      reponse: q.acceptedAnswer.text,
      page,
      ordre: i + 1,
    });
  });
}

writeFileSync(SORTIE, docs.map((d) => JSON.stringify(d)).join('\n') + '\n');
const parType = docs.reduce((a, d) => ({ ...a, [d._type]: (a[d._type] ?? 0) + 1 }), {});
console.log(`${docs.length} documents écrits dans ${SORTIE}`, parType);
