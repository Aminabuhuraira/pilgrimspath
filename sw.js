// sw.js — Workbox-powered Service Worker for Pilgrim's Path
// Caches 360° panorama tiles, VR assets, and static resources
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');

workbox.setConfig({ debug: false });

const { registerRoute } = workbox.routing;
const { CacheFirst, StaleWhileRevalidate, NetworkFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { CacheableResponsePlugin } = workbox.cacheableResponse;
const { precacheAndRoute } = workbox.precaching;

// ─── 0. Skip admin pages entirely — always go to network ───
registerRoute(
  ({ url }) => url.pathname.includes('admin'),
  new NetworkFirst({ cacheName: 'admin-bypass' })
);

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

// ─── 5. CSS & JS (site styles and scripts — same-origin only) ───
// NetworkFirst so that version-bumped files always load fresh.
// Cache is used only as an offline fallback.
registerRoute(
  ({ request, url }) => (request.destination === 'style' || request.destination === 'script') &&
    url.origin === self.location.origin,
  new NetworkFirst({
    cacheName: 'static-assets-v2',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

// ─── 6. Google Fonts — skip entirely, let the browser handle CORS natively ───
// (Workbox intercepts break cross-origin font fetches)

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
  // Delete stale caches from previous SW versions
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k === 'static-assets').map(k => caches.delete(k))
      )
    ).then(() => clients.claim())
  );
});

// ─── Cache-name helper (must mirror sw.js routing strategies) ───
function swCacheFor(url) {
  if (/\/panorama_|\/media\//.test(url))             return 'panorama-tiles';
  if (/\/locale\/|script(_general)?\.js/.test(url)) return 'vr-scenes';
  if (/\.html?($|\?)/.test(url))                    return 'pages';
  if (/\.js($|\?)/.test(url))                       return 'static-assets';
  if (/\.(webp|png|jpg|jpeg|gif|svg)($|\?)/.test(url)) return 'images';
  return 'pp-prefetch';
}

// ─── Pre-fetch on demand (Dashboard "Download Experience" button) ───
// Dashboard sends: { type:'PREFETCH_SCENE', urls:[url1, url2, ...] }
// SW fetches each URL and stores it in the correct Workbox cache so that
// CacheFirst / StaleWhileRevalidate routes serve it on the next real visit.
self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'PREFETCH_SCENE') return;
  const urls = Array.isArray(event.data.urls) ? event.data.urls : [];
  let done = 0;
  const total = urls.length;
  if (!total) return;

  const notify = () => {
    self.clients.matchAll().then(clients => {
      clients.forEach(c => c.postMessage({
        type: done >= total ? 'PREFETCH_DONE' : 'PREFETCH_PROGRESS',
        done, total,
      }));
    });
  };

  Promise.allSettled(
    urls.map(url =>
      caches.match(url).then(hit => {
        if (hit) { done++; notify(); return; }
        return fetch(url, { credentials: 'same-origin' })
          .then(res => {
            if (res.ok) {
              return caches.open(swCacheFor(url)).then(c => c.put(url, res));
            }
          })
          .catch(() => {})
          .finally(() => { done++; notify(); });
      })
    )
  );
});
