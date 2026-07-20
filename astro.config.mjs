// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.aimezlanature.fr',
  output: 'static',
  // `imageService: 'compile'` optimise les images au build avec sharp au lieu de
  // les faire transiter par Cloudflare Images à l'exécution (défaut de l'adaptateur).
  // Le site étant 100 % statique, les variantes WebP deviennent de simples fichiers
  // servis par le CDN avec un cache immuable : aucune invocation de Worker ni
  // facturation de transformation à chaque affichage.
  adapter: cloudflare({ imageService: 'compile' }),
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/succes'),
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
