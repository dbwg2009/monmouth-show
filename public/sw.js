// Band Stand — offline-first service worker.
// Shell is cache-first; API GETs are network-first with a cache fallback so the
// app keeps working with no signal. Mutations are NOT intercepted — the app's
// own outbox queues them and replays when back online.

const CACHE = 'bandstand-v2';
const SHELL = [
  '/', '/app.js', '/styles.css', '/manifest.json',
  '/icon.svg', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return; // let mutations hit the network directly
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // ignore cross-origin (fonts etc.)

  // App navigations: serve the cached shell when offline.
  if (request.mode === 'navigate') {
    e.respondWith(fetch(request).catch(() => caches.match('/').then((r) => r || fetch(request))));
    return;
  }

  // API GETs: network-first, cache the result, fall back to cache offline.
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) { const clone = res.clone(); caches.open(CACHE).then((c) => c.put(request, clone)); }
          return res;
        })
        .catch(() => caches.match(request).then((cached) =>
          cached || new Response('{"ok":false,"error":"offline"}', { status: 503, headers: { 'Content-Type': 'application/json' } }))),
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  e.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((res) => {
        if (res.ok) { const clone = res.clone(); caches.open(CACHE).then((c) => c.put(request, clone)); }
        return res;
      }).catch(() => cached);
      return cached || network;
    }),
  );
});
