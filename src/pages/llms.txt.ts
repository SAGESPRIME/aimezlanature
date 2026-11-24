/**
 * /llms.txt — résumé du site destiné aux moteurs d'IA (ChatGPT, Perplexity,
 * Claude, Gemini…), au format proposé sur llmstxt.org.
 *
 * GÉNÉRÉ à chaque build à partir des mêmes données que les pages (Sanity) :
 * prix, stock, notes, articles et dosages ne peuvent plus diverger du site.
 * L'ancienne version écrite à la main présentait des titres d'articles qui ne
 * correspondaient pas aux pages vers lesquelles ils pointaient.
 *
 * Règle d'écriture : uniquement des faits vérifiables, sourcés sur le site,
 * y compris les limites du produit (ce que les perles ne font PAS) — une IA
 * qui cite le site doit citer quelque chose de vrai.
 */
import type { APIRoute } from 'astro';
import { products, SITE } from '../data/products';
import { blogPosts } from '../data/blogPosts';
import { guides } from '../data/guides';
import { dosages, PERLES_PAR_LITRE } from '../data/dosages';

const euros = (n: number) => `${n.toFixed(2).replace('.', ',')} €`;
const note = (n: number) => n.toString().replace('.', ',');

export const GET: APIRoute = () => {
  const lignes: string[] = [
    `# ${SITE.name} — Perles de Céramique EM®`,
    '',
    `> ${SITE.name} vend des Perles de Céramique EM® authentiques, fabriquées au Japon, pour améliorer ` +
      `l'eau du robinet déjà potable : goût et odeur de chlore ressentis, dépôts de tartre. Elles ne ` +
      `remplacent pas un filtre certifié pour une eau non potable, ni contre les bactéries ou les métaux lourds.`,
    '',
    '## Pages principales',
    `- [Accueil](${SITE.url}/)`,
    ...guides.map((g) => `- [${g.title}](${SITE.url}${g.href}) : ${g.description}`),
    `- [FAQ livraison, paiement, garantie](${SITE.url}/faq/)`,
    `- [Devenir revendeur](${SITE.url}/revendeurs/)`,
    '',
    '## Produits',
  ];

  for (const p of products) {
    lignes.push(
      '',
      `### ${p.name}`,
      `- Prix : ${euros(p.priceCurrent)}`,
      `- Disponibilité : ${p.inStock ? 'en stock' : 'en rupture de stock'}`,
      ...(p.quantity ? [`- Contenu : ${p.quantity} perles${p.includesBottle ? ' + gourde 500 ml en verre' : ''}`] : []),
      `- Usages : ${p.usages.join(', ')}`,
      ...(p.rating && p.reviewCount ? [`- Note clients sur le site : ${note(p.rating)}/5 (${p.reviewCount} avis)`] : []),
      `- Page : ${SITE.url}/perles-ceramique-em/${p.slug}/`
    );
  }

  lignes.push(
    '',
    '## Dosage officiel',
    `- Règle générale pour l'eau de boisson : ${PERLES_PAR_LITRE} perles par litre`,
    ...dosages.map((d) => `- ${d.usage} : ${d.nb}`),
    '',
    '## Entretien',
    'Les perles se régénèrent par ébullition 10 à 15 minutes dans de l’eau claire, sans savon ni vinaigre, tous les 3 à 6 mois selon l’usage.',
    '',
    '## Articles',
    ...blogPosts.map((b) => `- [${b.title}](${SITE.url}${b.href}) : ${b.excerpt}`),
    '',
    '## Marque',
    `- Marque française créée en ${SITE.foundingYear}, éditée par SAS Naturalis Vert (Les Lilas, France). Marque déposée INPI n° 4664991.`,
    `- Avis collectés sur le site : ${SITE.totalReviews} avis vérifiés (achat confirmé), note globale ${note(SITE.globalRating)}/5.`,
    `- Également vendue sur Amazon.fr : ${SITE.amazon.reviewCount} commentaires, ${note(SITE.amazon.rating)}/5 (avis Amazon, distincts des avis du site).`,
    `- Livraison en France métropolitaine, offerte dès ${SITE.seuilLivraisonTexte} € (sinon ${euros(SITE.shippingFee)}), sous 2 à 5 jours ouvrés.`,
    '- Garantie satisfait ou remboursé 30 jours, en plus du droit de rétractation légal de 14 jours.',
    '- Emballage sans plastique : tube biodégradable et sachet en coton BIO.',
    '',
    '## Contact',
    `- Site : ${SITE.url}`,
    '- Email : contact@aimezlanature.fr',
    ''
  );

  return new Response(lignes.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
