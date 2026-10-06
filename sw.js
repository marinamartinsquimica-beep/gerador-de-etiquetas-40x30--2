const CACHE_NAME = 'etiquetas-offline-v1.1.31';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css?v=131',
  './app.js?v=131',
  './calibracao.js?v=131',
  './manifest.webmanifest',
  'https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of APP_SHELL) {
        try { await cache.add(url); } catch (_) { /* não impede instalação; fetch online completa o cache */ }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith((async () => {
    try {
      const networkResponse = await fetch(event.request);
      if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, networkResponse.clone()).catch(() => {});
      }
      return networkResponse;
    } catch (_) {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') {
        const home = await caches.match('./');
        if (home) return home;
      }
      return Response.error();
    }
  })());
});
