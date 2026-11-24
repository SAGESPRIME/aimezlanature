/**
 * Collections de contenu — le contrat entre Sanity et le site.
 *
 * Chaque collection est chargée AU BUILD (src/lib/cms/source.ts) puis validée
 * par les schémas zod ci-dessous. Une donnée invalide (prix négatif, title
 * trop long, avis sans texte…) fait ÉCHOUER le build : le site en ligne reste
 * alors celui d'avant. On ne publie jamais un site cassé « à moitié ».
 *
 * Les limites viennent de contenu/regles.json, le même fichier que lit le
 * Studio Sanity pour valider la saisie : les deux ne peuvent pas diverger.
 */
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import regles from '../contenu/regles.json';
import photosSite from '../contenu/photos-site.json';
import { chargerContenu } from './lib/cms/source';

/** Montant en euros, au centime près, dans des bornes raisonnables. */
const montant = z
  .number()
  .min(regles.prixMin)
  .max(regles.prixMax)
  .refine((n) => Math.round(n * 100) === Number((n * 100).toFixed(6)), 'au centime près');

const metaTitle = z.string().min(10).max(regles.metaTitleMax);
const metaDescription = z.string().min(regles.metaDescriptionMin).max(regles.metaDescriptionMax);

/** Image : URL Sanity (avec dimensions) OU fichier local du seed. Alt obligatoire. */
/**
 * Adresses rendues en lien sur le site : HTTPS uniquement. Le Studio impose
 * déjà cette règle, mais une écriture directe par l'API Sanity la contourne :
 * on la revérifie au build, qui échoue plutôt que de publier un lien
 * `javascript:` (audit du 2026-11-24 ; la CSP reste la seconde barrière).
 */
const urlHttps = z.url({ protocol: /^https$/ });

/** Lien d'un texte riche : https, mailto ou chemin interne (« /… », pas « //… »). */
const lienTexte = z
  .string()
  // Pas d'espace ni de caractère de contrôle, et « / » suivi d'autre chose que
  // « / » ou « \\ » : les navigateurs lisent « /\\hote » comme « //hote ».
  .refine((h) => !/[\s\x00-\x1f\x7f]/.test(h) && /^(https:\/\/|mailto:|\/(?![\/\\])|#)/i.test(h), {
    message: 'Lien refusé : seuls https://, mailto: et les chemins internes sont autorisés.',
  });

const image = z
  .object({
    alt: z.string().min(5),
    url: urlHttps.nullish(),
    largeur: z.number().int().positive().nullish(),
    hauteur: z.number().int().positive().nullish(),
    fichier: z.string().nullish(),
  })
  .refine((i) => (i.url && i.largeur && i.hauteur) || i.fichier, 'image sans fichier ni URL');

/**
 * Photo d'ambiance (Réglages → Photos du site). Tout est facultatif : un
 * emplacement vide, ou rempli d'un texte sans fichier, garde la photo de
 * secours (src/data/photosSite.ts).
 */
const photoSite = z
  .object({
    alt: z.string().min(5).max(160).nullish(),
    credit: z.string().max(200).nullish(),
    url: urlHttps.nullish(),
    largeur: z.number().int().positive().nullish(),
    hauteur: z.number().int().positive().nullish(),
  })
  .nullish();

const questionReponse = z.object({ question: z.string().min(5), reponse: z.string().min(5) });

const produits = defineCollection({
  loader: async () => (await chargerContenu()).produits.map((p) => ({ ...p, id: String(p.id) })),
  schema: z
    .object({
      nom: z.string().min(3),
      nomCourt: z.string().min(3).max(40),
      sku: z.string().min(1),
      ordre: z.number().int(),
      prix: montant,
      prixBarre: montant.nullish(),
      enStock: z.boolean(),
      bestseller: z.boolean().nullish(),
      nombrePerles: z.number().int().positive().nullish(),
      avecGourde: z.boolean().nullish(),
      image,
      description: z.string().min(200),
      usages: z.array(z.string().min(2)).min(1),
      questions: z.array(questionReponse).nullish(),
      metaTitle,
      metaDescription,
      _updatedAt: z.string().nullish(),
    })
    .refine((p) => p.prixBarre == null || p.prixBarre > p.prix, {
      message: 'le prix barré doit être supérieur au prix de vente',
    }),
});

const avis = defineCollection({
  loader: async () => (await chargerContenu()).avis.map((a) => ({ ...a, id: String(a.id) })),
  schema: z.object({
    produit: z.string(),
    auteur: z.string().min(1).max(60),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    note: z.number().int().min(regles.noteMin).max(regles.noteMax).nullish(),
    titre: z.string().nullish(),
    texte: z.string().min(2),
  }),
});

/** Bloc de texte Portable Text, limité à ce que le Studio permet de saisir. */
const blocTexte = z
  .looseObject({
    _type: z.string(),
    _key: z.string().optional(),
    style: z.enum(['normal', 'h3']).optional(),
    listItem: z.enum(['bullet', 'number']).optional(),
    level: z.number().optional(),
    markDefs: z.array(z.object({ _key: z.string(), _type: z.string(), href: lienTexte.optional() })).optional(),
    children: z.array(z.object({ _type: z.string(), text: z.string().optional(), marks: z.array(z.string()).optional() })).optional(),
  });

const auteur = z.object({
  nom: z.string(),
  role: z.string(),
  bio: z.string(),
  liens: z.array(urlHttps).nullish(),
  photo: image.nullish(),
});

const articles = defineCollection({
  loader: async () => (await chargerContenu()).articles.map((a) => ({ ...a, id: String(a.id) })),
  schema: z.object({
    titre: z.string().min(10),
    libelleCourt: z.string().max(40),
    titreCarte: z.string().max(70),
    categorie: z.string(),
    tempsLecture: z.number().int().positive(),
    datePublication: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dateMiseAJour: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
    extrait: z.string().max(200),
    chapo: z.string().min(20),
    reponseCourte: z.string().max(regles.reponseCourteMax).nullish(),
    sections: z.array(z.object({ titre: z.string().min(3), contenu: z.array(blocTexte).min(1) })).min(1),
    faq: z.array(questionReponse).nullish(),
    sources: z.array(z.object({ titre: z.string(), editeur: z.string(), url: urlHttps })).nullish(),
    auteur: auteur.nullish(),
    image: image.nullish(),
    metaTitle,
    metaDescription,
    _updatedAt: z.string().nullish(),
  }),
});

const faq = defineCollection({
  loader: async () => (await chargerContenu()).faq.map((f) => ({ ...f, id: String(f.id) })),
  schema: z.object({
    question: z.string().min(5),
    reponse: z.string().min(5),
    page: z.enum(['faq', 'accueil', 'collection', 'comment-ca-marche', 'utilisations', 'comparatif']),
    ordre: z.number().int(),
  }),
});

const reglages = defineCollection({
  loader: async () => {
    const r = (await chargerContenu()).reglages;
    if (!r) throw new Error('Document « reglages » introuvable : le site ne peut pas être construit sans lui.');
    return [{ ...r, id: 'reglages' }];
  },
  schema: z.object({
    nom: z.string(),
    url: urlHttps,
    description: z.string(),
    fraisDePort: z.number().min(0).max(50),
    seuilLivraisonOfferte: z.number().min(0).max(regles.prixMax),
    noteGlobale: z.number().min(regles.noteMin).max(regles.noteMax),
    anneeCreation: z.number().int(),
    profils: z.array(urlHttps).nullish(),
    amazon: z.object({ note: z.number().min(1).max(5), nbCommentaires: z.number().int().min(0), url: urlHttps }),
    photos: z
      .object(Object.fromEntries(photosSite.emplacements.map((e) => [e.cle, photoSite])))
      .nullish(),
  }),
});

export const collections = { produits, avis, articles, faq, reglages };
