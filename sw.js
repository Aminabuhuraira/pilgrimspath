// sw.js — Workbox-powered Service Worker for Pilgrim's Path
// Caches 360° panorama tiles, VR assets, and static resources
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');

workbox.setConfig({ debug: false });

const { registerRoute } = workbox.routing;
const { CacheFirst, StaleWhileRevalidate, NetworkFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { CacheableResponsePlugin } = workbox.cacheableResponse;
const { precacheAndRoute } = workbox.precaching;

// ─── 1. 360° Panorama tiles (largest assets — cache aggressively) ───
// Matches panorama_* directories containing multi-resolution tiles
registerRoute(
  ({ url }) => url.pathname.includes('/panorama_') || url.pathname.includes('/media/'),
  new CacheFirst({
    cacheName: 'panorama-tiles',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 2000,      // panoramas have many tile files
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// ─── 2. VR Runtime libraries (3DVista engine, polyfills) ───
registerRoute(
  ({ url }) => url.pathname.includes('/lib/') && 
    (url.pathname.endsWith('.js') || url.pathname.endsWith('.json') || url.pathname.endsWith('.wasm')),
  new CacheFirst({
    cacheName: 'vr-runtime',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days — these rarely change
      }),
    ],
  })
);

// ─── 3. VR scene definition files (script.js, script_general.js, locale) ───
registerRoute(
  ({ url }) => (url.pathname.endsWith('/script.js') || 
                url.pathname.endsWith('/script_general.js') ||
                url.pathname.includes('/locale/')) &&
               (url.pathname.includes('/pilgrimspath') || url.pathname.includes('/Tawaf')),
  new StaleWhileRevalidate({
    cacheName: 'vr-scenes',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// ─── 4. Images (logos, backgrounds, article images) ───
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// ─── 5. CSS & JS (site styles and scripts) ───
registerRoute(
  ({ request }) => request.destination === 'style' || request.destination === 'script',
  new StaleWhileRevalidate({
    cacheName: 'static-assets',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

// ─── 6. Google Fonts stylesheets (CSS — changes rarely) ───
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);

// ─── 6b. Google Fonts files (woff2 — use network-first to avoid CORS cache issues) ───
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);

// ─── 7. Font Awesome ───
registerRoute(
  ({ url }) => url.origin === 'https://cdnjs.cloudflare.com' && url.pathname.includes('font-awesome'),
  new CacheFirst({
    cacheName: 'font-awesome',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 365 * 24 * 60 * 60,
      }),
    ],
  })
);

// ─── 8. HTML pages (network-first for freshness) ───
registerRoute(
  ({ request }) => request.destination === 'document',
  new NetworkFirst({
    cacheName: 'pages',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

// ─── 9. Lottie animations ───
registerRoute(
  ({ url }) => url.pathname.endsWith('.lottie') || url.pathname.endsWith('.json'),
  new CacheFirst({
    cacheName: 'animations',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// ─── Skip waiting & claim clients immediately ───
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
