// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://aimezlanature.fr',
  output: 'static',
  // `imageService: 'compile'` optimise les images au build avec sharp au lieu de
  // les faire transiter par Cloudflare Images à l'exécution (défaut de l'adaptateur).
  // Le site étant 100 % statique, les variantes WebP deviennent de simples fichiers
  // servis par le CDN avec un cache immuable : aucune invocation de Worker ni
  // facturation de transformation à chaque affichage.
  adapter: cloudflare({ imageService: 'compile' }),
  build: {
    // CSS toujours en fichier externe (jamais inliné dans un <style>) :
    // condition nécessaire à la CSP stricte `style-src 'self'` de public/_headers.
    inlineStylesheets: 'never',
  },
  integrations: [
    sitemap({
      // Exclut les pages de tunnel en `noindex` : une URL noindex présente dans
      // le sitemap déclenche un avertissement dans la Search Console.
      // Le filtre visait auparavant `/succes`, une page qui n'existe plus —
      // `/commande-confirmee/` partait donc bel et bien à Google.
      filter: (page) =>
        !page.includes('/commande-confirmee') && !page.includes('/revendeurs/merci'),
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
