// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://aimezlanature.fr',
  output: 'static',
  // Site 100 % statique : les images sont optimisées au build par sharp
  // (comportement par défaut d'Astro) et servies comme simples fichiers par le
  // CDN Vercel. Les 3 routes en `prerender = false` (/api/checkout,
  // /api/revendeur, /api/avis) deviennent automatiquement des fonctions
  // serverless Vercel.
  adapter: vercel(),
  build: {
    // CSS toujours en fichier externe (jamais inliné dans un <style>) :
    // condition nécessaire à la CSP stricte `style-src 'self'` de vercel.json.
    inlineStylesheets: 'never',
  },
  integrations: [
    sitemap({
      // Exclut les pages de tunnel en `noindex` : une URL noindex présente dans
      // le sitemap déclenche un avertissement dans la Search Console.
      // Le filtre visait auparavant `/succes`, une page qui n'existe plus —
      // `/commande-confirmee/` partait donc bel et bien à Google.
      // `/panier/` est aussi en noindex (src/pages/panier.astro) : sans ce filtre
      // il partait au sitemap et déclenchait pile cet avertissement.
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
