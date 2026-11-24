/**
 * Service worker du site (PWA), généré AU BUILD : sa version change à chaque
 * déploiement, ce qui purge les anciens caches.
 *
 * Stratégie, volontairement prudente pour une boutique :
 *  - pages HTML : RÉSEAU D'ABORD (prix et stock toujours à jour), repli sur la
 *    dernière version vue, puis sur /hors-ligne/ ;
 *  - /_astro/* (fichiers à empreinte : CSS, JS, images, polices) et icônes :
 *    cache d'abord, ils ne changent jamais ;
 *  - JAMAIS mis en cache : /api/ (paiement, avis, formulaires), /pro/ (espace
 *    revendeurs, données personnelles), et tout autre domaine (Stripe…).
 * Sert le fichier /sw.js (portée : tout le site). Enregistré par public/js/site.js.
 */
export const prerender = true;

const VERSION = `aln-${Date.now().toString(36)}`;

const code = `'use strict';
const VERSION = '${VERSION}';
const PRECACHE = ['/hors-ligne/', '/favicon.svg', '/icons/icone-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/pro/')) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((rep) => {
          if (rep.ok && rep.type === 'basic') {
            const copie = rep.clone();
            caches.open(VERSION).then((c) => c.put(req, copie));
          }
          return rep;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/hors-ligne/')))
    );
    return;
  }

  if (url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/icons/')) {
    e.respondWith(
      caches.match(req).then((r) =>
        r || fetch(req).then((rep) => {
          if (rep.ok) { const copie = rep.clone(); caches.open(VERSION).then((c) => c.put(req, copie)); }
          return rep;
        })
      )
    );
  }
});
`;

export function GET() {
  return new Response(code, { headers: { 'Content-Type': 'application/javascript; charset=utf-8' } });
}
