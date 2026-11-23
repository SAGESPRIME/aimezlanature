// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

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
  integrations: [
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
