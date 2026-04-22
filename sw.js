// v1.13.54: SW cache stratejisi degisti — HTML network-first, CSS/JS stale-while-revalidate
// Amac: yeni deploy'lar PWA kullanicilarina hemen gelsin (eski cache-first'te gelmiyordu)
const CACHE_NAME = 'noxara-v104'; // v1.14.1.04 Rahip revize — producible:false, tapinaktan spawn

// Relative paths — ./ olarak register edildi, subpath deploy uyumlu
const STATIC_ASSETS = [
  './',
  './index.html',
  './home.html',
  './offline.html',
  './manifest.json',
  './css/main.css',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

// ═══════════════════════════════════════════════════════════════
// INSTALL — kritik statik varliklari onden cache'le
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
// ACTIVATE — eski cache'leri sil + aktif claim
// ═══════════════════════════════════════════════════════════════
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('[SW] eski cache siliniyor:', k);
        return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

// ═══════════════════════════════════════════════════════════════
// FETCH — istek tipine gore strateji
// ═══════════════════════════════════════════════════════════════
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // 1) API isteklerini her zaman network'ten al (hiç cache)
  if (url.pathname.includes('/api/')) {
    event.respondWith(fetch(req));
    return;
  }

  // 2) Sadece same-origin GET — diğerleri pass-through
  if (req.method !== 'GET' || url.origin !== location.origin) {
    event.respondWith(fetch(req));
    return;
  }

  // 3) HTML sayfalar (document) → NETWORK-FIRST
  //    Yeni deploy anında kullanıcı hemen yeni HTML'i görür.
  //    Network yoksa cache'den düşer (offline fallback).
  const isHTML = req.destination === 'document' ||
                 req.headers.get('accept')?.includes('text/html') ||
                 url.pathname.endsWith('.html') ||
                 url.pathname === '/' ||
                 url.pathname.endsWith('/');
  if (isHTML) {
    event.respondWith(networkFirst(req));
    return;
  }

  // 4) Icon/image/font → CACHE-FIRST (statik, nadir değişir)
  const isAsset = /\.(png|jpg|jpeg|gif|svg|webp|woff2?|ttf|ico)$/.test(url.pathname);
  if (isAsset) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // 5) CSS/JS (ve diğer her şey) → STALE-WHILE-REVALIDATE
  //    Cache'den hemen döner, arkaplanda network'ten yeni halini çeker.
  //    Sonraki ziyarette yeni versiyon gelir.
  event.respondWith(staleWhileRevalidate(req));
});

// ═══════════════════════════════════════════════════════════════
// STRATEJI YARDIMCILARI
// ═══════════════════════════════════════════════════════════════

// Network-first: network'ten dene, başarısızsa cache'e düş
async function networkFirst(req) {
  try {
    const fresh = await fetch(req);
    if (fresh && fresh.status === 200 && fresh.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, fresh.clone());
    }
    return fresh;
  } catch (e) {
    const cached = await caches.match(req);
    if (cached) return cached;
    // Network yok + cache'de de yok → offline.html fallback (navigate için)
    if (req.destination === 'document' || req.headers.get('accept')?.includes('text/html')) {
      const offline = await caches.match('./offline.html');
      if (offline) return offline;
    }
    return new Response('Offline ve cache yok', { status: 503, statusText: 'Offline' });
  }
}

// Cache-first: cache'te varsa onu ver, yoksa network'ten al + cache'e yaz
async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const fresh = await fetch(req);
    if (fresh && fresh.status === 200 && fresh.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, fresh.clone());
    }
    return fresh;
  } catch {
    return new Response('Asset yok', { status: 404 });
  }
}

// Stale-while-revalidate: cache'ten hemen ver, arkaplanda network'ten güncelle
async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req).then(fresh => {
    if (fresh && fresh.status === 200 && fresh.type === 'basic') {
      cache.put(req, fresh.clone());
    }
    return fresh;
  }).catch(() => null);
  // Cached varsa onu dön, yoksa network'ü bekle
  return cached || fetchPromise || new Response('Offline', { status: 503 });
}
