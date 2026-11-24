// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/**
 * Trace, dans le build, la source du contenu (sanity ou seed). server.mjs la
 * lit au démarrage et REFUSE de servir la production à partir du seed de
 * développement : un site construit par erreur sans Sanity remettrait en
 * ligne d'anciens prix et d'anciens textes.
 */
const traceSourceContenu = {
  name: 'trace-source-contenu',
  hooks: {
    /** @param {{ dir: URL }} options */
    'astro:build:done': ({ dir }) => {
      const source =
        (process.env.CONTENU_SOURCE || (process.env.SANITY_PROJECT_ID ? 'sanity' : 'seed')) +
        (process.env.CONTENU_BROUILLONS === '1' ? '+brouillons' : '');
      writeFileSync(new URL('../source-contenu.txt', dir), source);
    },
  },
};

/**
 * Ajoute <lastmod> au sitemap pour les pages qui déclarent une date de
 * modification (og:updated_time : fiches produit, articles). Google n'utilise
 * lastmod que s'il est fiable : on ne l'émet donc QUE pour les pages dont la
 * date vient réellement du contenu, jamais « date du build » pour tout le site.
 */
const lastmodSitemap = {
  name: 'lastmod-sitemap',
  hooks: {
    /** @param {{ dir: URL }} options */
    'astro:build:done': ({ dir }) => {
      const racine = fileURLToPath(dir);
      const fichier = join(racine, 'sitemap-0.xml');
      if (!existsSync(fichier)) return;
      const xml = readFileSync(fichier, 'utf8').replace(/<url><loc>([^<]+)<\/loc>/g, (bloc, loc) => {
        const chemin = new URL(loc).pathname;
        const html = join(racine, chemin, 'index.html');
        if (!existsSync(html)) return bloc;
        const date = readFileSync(html, 'utf8').match(/property="og:updated_time" content="([^"]+)"/)?.[1];
        return date ? `${bloc}<lastmod>${date}</lastmod>` : bloc;
      });
      writeFileSync(fichier, xml);
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: 'https://aimezlanature.fr',
  output: 'static',
  // Site statique servi par notre propre serveur Node (server.mjs) sur le VPS
  // Coolify. L'adaptateur Node en mode « middleware » ne produit que le
  // handler des routes à la demande (`prerender = false` : /api/checkout,
  // /api/avis, /api/revendeur, /api/stripe-webhook) ; server.mjs s'occupe du
  // reste (fichiers statiques, redirections, en-têtes de sécurité).
  // Les images sont optimisées au build par sharp.
  // bodySizeLimit : 256 Kio au lieu de 1 Gio par défaut. Les corps légitimes font
  // quelques Kio ; un corps énorme était lu en mémoire avant même la
  // vérification de signature des webhooks (audit du 2026-11-24). server.mjs
  // refuse déjà en 413 tout Content-Length supérieur ; cette limite couvre les
  // envois sans longueur annoncée.
  adapter: node({ mode: 'middleware', bodySizeLimit: 256 * 1024 }),
  build: {
    // CSS toujours en fichier externe (jamais inliné dans un <style>) :
    // condition nécessaire à la CSP stricte `style-src 'self'` (src/data/securite.mjs).
    inlineStylesheets: 'never',
  },
  image: {
    // Photos saisies dans Sanity : téléchargées et optimisées AU BUILD, puis
    // servies depuis /_astro. Le navigateur ne contacte jamais cdn.sanity.io.
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
  integrations: [
    traceSourceContenu,
    sitemap({
      // Exclut les pages de tunnel en `noindex` : une URL noindex présente dans
      // le sitemap déclenche un avertissement dans la Search Console.
      filter: (page) =>
        !page.includes('/commande-confirmee') &&
        !page.includes('/revendeurs/merci') &&
        !page.includes('/avis/merci') &&
        !page.includes('/panier'),
    }),
    lastmodSitemap,
  ],
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr'],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
