// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { writeFileSync } from 'node:fs';

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
      const source = process.env.CONTENU_SOURCE || (process.env.SANITY_PROJECT_ID ? 'sanity' : 'seed');
      writeFileSync(new URL('../source-contenu.txt', dir), source);
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
  adapter: node({ mode: 'middleware' }),
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
  ],
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr'],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
