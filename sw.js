// v1.13.49.2: relative path (GitHub Pages subpath /palantis-frontend/)
const CACHE_NAME = 'noxara-v2';

// Relative paths — self.registration.scope base'dir (./ olarak register edildi)
const STATIC_ASSETS = [
  './',
  './index.html',
  './home.html',
  './manifest.json',
  './css/main.css',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      // addAll tek bir fail olunca hepsi fail eder; per-item bekle
      Promise.all(STATIC_ASSETS.map(url =>
        cache.add(url).catch(e => console.log('[SW] cache miss:', url, e.message))
      ))
    )
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API isteklerini her zaman network'ten al
  if (url.pathname.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Only same-origin GET
  if (event.request.method !== 'GET' || url.origin !== location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Statik dosyalar: once cache, yoksa network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
