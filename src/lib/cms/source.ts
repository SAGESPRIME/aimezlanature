/**
 * Lecture du contenu du site — Sanity en production, seed local sinon.
 *
 * Appelé UNIQUEMENT au build, par les loaders de src/content.config.ts. Les
 * données sont ensuite figées dans le site construit et dans le serveur : les
 * pages comme le paiement (/api/checkout) les lisent sans aucun appel réseau.
 * Conséquence voulue : Sanity peut être en panne sans que la vente s'arrête,
 * et un prix ne peut changer qu'à la reconstruction du site.
 *
 * Deux sources, UNE seule requête GROQ :
 *   - `sanity` : le dataset publié (perspective « published », jamais les
 *     brouillons), avec un jeton en LECTURE SEULE ;
 *   - `seed`   : contenu/seed.ndjson, interrogé en mémoire par groq-js avec
 *     exactement la même requête. Sert au développement et à la CI, et à la
 *     recette tant que le projet Sanity n'existe pas.
 *
 * Choix de la source (variable CONTENU_SOURCE) :
 *   - absente : `sanity` si SANITY_PROJECT_ID est défini, sinon `seed` ;
 *   - `sanity` : exige SANITY_PROJECT_ID, sinon le build ÉCHOUE (le Dockerfile
 *     de production l'impose : on ne met jamais en ligne un site construit
 *     sur des données de développement sans l'avoir demandé).
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@sanity/client';
import { parse, evaluate } from 'groq-js';

export type SourceContenu = 'sanity' | 'seed';

export function sourceContenu(): SourceContenu {
  const demandee = process.env.CONTENU_SOURCE?.trim();
  if (demandee === 'seed' || demandee === 'sanity') return demandee;
  if (demandee) throw new Error(`CONTENU_SOURCE inconnue : « ${demandee} » (attendu : sanity ou seed)`);
  return process.env.SANITY_PROJECT_ID ? 'sanity' : 'seed';
}

/** Projection d'une image : marche pour Sanity (asset) comme pour le seed (fichier local). */
const IMAGE = `{
  alt,
  "url": asset->url,
  "largeur": asset->metadata.dimensions.width,
  "hauteur": asset->metadata.dimensions.height,
  "fichier": _sanityAsset
}`;

/**
 * Tout le contenu en une requête (quelques dizaines de Ko) : un seul aller-retour
 * vers Sanity par build, et des données cohérentes entre elles (même instant).
 */
export const REQUETE = `{
  "reglages": *[_id == "reglages"][0]{
    nom, url, description, fraisDePort, seuilLivraisonOfferte, noteGlobale,
    anneeCreation, profils, amazon{note, nbCommentaires, url}, _updatedAt
  },
  "produits": *[_type == "produit" && defined(slug.current)] | order(ordre asc){
    "id": slug.current, nom, nomCourt, sku, ordre, prix, prixBarre, enStock,
    bestseller, nombrePerles, avecGourde, "image": image${IMAGE},
    description, usages, "questions": questions[]{question, reponse},
    metaTitle, metaDescription, _updatedAt
  },
  "avis": *[_type == "avis" && defined(produit->slug.current)] | order(date desc, _id asc){
    "id": _id, "produit": produit->slug.current, auteur, date, note, titre, texte
  },
  "articles": *[_type == "article" && defined(slug.current)] | order(datePublication desc){
    "id": slug.current, titre, libelleCourt, titreCarte, categorie, tempsLecture,
    datePublication, dateMiseAJour, extrait, chapo, reponseCourte,
    "sections": sections[]{titre, contenu},
    "faq": faq[]{question, reponse},
    "sources": sources[]{titre, editeur, url},
    "auteur": auteur->{nom, role, bio, liens, "photo": photo${IMAGE}},
    "image": image${IMAGE},
    metaTitle, metaDescription, _updatedAt
  },
  "faq": *[_type == "faq"] | order(page asc, ordre asc){
    "id": _id, question, reponse, page, ordre
  }
}`;

export interface ContenuBrut {
  reglages: Record<string, unknown> | null;
  produits: Record<string, unknown>[];
  avis: Record<string, unknown>[];
  articles: Record<string, unknown>[];
  faq: Record<string, unknown>[];
}

async function depuisSanity(): Promise<ContenuBrut> {
  const projectId = process.env.SANITY_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      'CONTENU_SOURCE=sanity mais SANITY_PROJECT_ID est absent. Renseigner les variables de build ' +
        'SANITY_PROJECT_ID / SANITY_DATASET / SANITY_READ_TOKEN, ou CONTENU_SOURCE=seed pour une recette sans Sanity.'
    );
  }
  const client = createClient({
    projectId,
    dataset: process.env.SANITY_DATASET ?? 'production',
    apiVersion: '2025-02-19',
    // Pas de CDN : au build on veut l'état publié EXACT, pas une copie en cache.
    useCdn: false,
    perspective: 'published',
    token: process.env.SANITY_READ_TOKEN,
  });
  return client.fetch<ContenuBrut>(REQUETE);
}

/** Évalue la requête sur un fichier NDJSON, brouillons exclus (comme « published »). */
export async function depuisFichier(chemin: string): Promise<ContenuBrut> {
  const documents = readFileSync(chemin, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l))
    .filter((d) => !String(d._id).startsWith('drafts.'));
  const resultat = await evaluate(parse(REQUETE), { dataset: documents });
  return (await resultat.get()) as ContenuBrut;
}

let enCours: Promise<ContenuBrut> | null = null;

/** Contenu complet, chargé une seule fois par build quel que soit le nombre de collections. */
export function chargerContenu(): Promise<ContenuBrut> {
  if (!enCours) {
    const source = sourceContenu();
    console.log(`[contenu] source : ${source}`);
    enCours =
      source === 'sanity'
        ? depuisSanity()
        : depuisFichier(new URL('../../../contenu/seed.ndjson', import.meta.url).pathname);
  }
  return enCours;
}
