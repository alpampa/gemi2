/**
 * VAPUR PWA SERVICE WORKER — v10 "WEAK-NETWORK RESILIENT"
 *
 * SORUN (v9): Tüm same-origin GET'ler network-first işleniyordu ve fetch'in
 * zaman aşımı yoktu. Vapurda/tünelde bağlantı "var ama ölü" olunca sayfa uzun
 * süre takılı kalıyor, çevrimdışı kabuğa hiç düşmüyordu — tam da hedef senaryo.
 *
 * v10 STRATEJİLERİ:
 *  1. Navigasyon (mode === 'navigate'): 3000 ms zaman aşımı; süre aşılırsa
 *     önbellekteki kabuk (/) hemen döner, ağ güncellemesi arka planda devam eder.
 *  2. /_next/static/ (hash'li, içerik değişmez): cache-first.
 *  3. Diğer statik varlıklar: stale-while-revalidate.
 *  4. Harici domainler ASLA yakalanmaz (harita karoları/CSP sorunu).
 *  5. /api/* ASLA SW'den geçmez (özel/admin verisi Cache Storage'a girmez).
 *  6. Runtime cache en fazla 60 giriş tutar; en eski girişler atılır.
 */

const CACHE_NAME = 'vapur-cache-v10';
const RUNTIME_MAX_ENTRIES = 60;
const NAVIGATION_TIMEOUT_MS = 3000;

const STATIC_FALLBACK_ASSETS = [
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/images/pasabahce-hero.jpg',
  '/images/adalar-aerial.jpg',
  '/logos/operator-dentur.png',
  '/logos/operator-ido.png',
  '/logos/operator-mavimarmara.png',
  '/logos/operator-prenstur.png',
  '/logos/operator-sehirhatlari.png',
  '/logos/operator-turyol.png'
];

/** Runtime cache büyümesini sınırla: en eski (ilk) girişleri at. */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const excess = keys.length - maxEntries;
  for (let i = 0; i < excess; i++) {
    await cache.delete(keys[i]);
  }
}

function isImmutableAsset(url) {
  return url.pathname.startsWith('/_next/static/');
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_FALLBACK_ASSETS);
    }).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

/**
 * Önbellekten dönen kabuk yanıtına kaynak işareti ekler.
 *
 * NEDEN: "yavaş ağda kabuk döndü" sözleşmesi süre ölçümüyle doğrulanınca
 * CPU/commit gürültüsü testi kararsız yapıyordu. İşaret, yanıtın ağdan mı
 * yoksa SW önbelleğinden mi geldiğini kesin olarak ayırt eder.
 */
function withShellMarker(response) {
  const headers = new Headers(response.headers);
  headers.set('X-Vapur-Shell', 'cached');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Çevrimdışı kabuk: istenen belge, sonra kök, sonra minimal HTML. */
async function navigationFallback(req) {
  const cached = await caches.match(req, { ignoreVary: true });
  if (cached) return withShellMarker(cached);

  const rootFallback =
    (await caches.match('/', { ignoreVary: true })) ||
    (await caches.match(new URL('/', req.url).href, { ignoreVary: true }));
  if (rootFallback) return withShellMarker(rootFallback);

  return new Response(
    '<!doctype html><html lang="tr"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>Çevrimdışı — Vapur Seferleri</title></head>' +
      '<body style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
      'background:#070e1e;color:#fff;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center">' +
      '<main style="padding:24px;max-width:420px">' +
      '<div style="font-size:40px">⛴️</div>' +
      '<h1 style="font-size:18px;margin:12px 0 6px">Çevrimdışısınız</h1>' +
      '<p style="color:#94a3b8;font-size:13px;line-height:1.6">İnternet bağlantınız geri geldiğinde seferler ve harita yeniden yüklenecektir.</p>' +
      '</main></body></html>',
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Vapur-Shell': 'offline' },
    }
  );
}

/** Navigasyon: 3 sn içinde ağ; aksi halde kabuk + arka plan güncellemesi. */
async function handleNavigation(event) {
  const req = event.request;

  const networkPromise = fetch(req)
    .then(async (response) => {
      if (response && response.status === 200) {
        const cacheControl = response.headers.get('Cache-Control') || '';
        // Kabuk no-store olsa bile çevrimdışı yedek olarak saklanır.
        if (!/\bno-store\b/i.test(cacheControl) || new URL(req.url).pathname === '/') {
          const copy = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(req, copy))
            .then(() => trimCache(CACHE_NAME, RUNTIME_MAX_ENTRIES))
            .catch(() => {});
        }
      }
      return response;
    })
    .catch(() => null);

  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), NAVIGATION_TIMEOUT_MS));
  const winner = await Promise.race([networkPromise, timeout]);
  if (winner) return winner;

  // Ağ yavaş/ölü: önce önbellekten sun, ağ isteğini arka planda sürdür.
  event.waitUntil(networkPromise.catch(() => {}));
  return navigationFallback(req);
}

/** Hash'li Next.js varlıkları: cache-first (içerik değişmez). */
async function handleImmutable(req) {
  const cached = await caches.match(req, { ignoreVary: true });
  if (cached) return cached;

  try {
    const response = await fetch(req);
    if (response && response.status === 200) {
      const copy = response.clone();
      caches.open(CACHE_NAME)
        .then((cache) => cache.put(req, copy))
        .then(() => trimCache(CACHE_NAME, RUNTIME_MAX_ENTRIES))
        .catch(() => {});
    }
    return response;
  } catch {
    return new Response('Çevrimdışı', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

/** Diğer statik varlıklar: stale-while-revalidate. */
async function handleStaleWhileRevalidate(event) {
  const req = event.request;
  const cached = await caches.match(req, { ignoreVary: true });

  const revalidate = fetch(req)
    .then(async (response) => {
      if (response && response.status === 200) {
        const cacheControl = response.headers.get('Cache-Control') || '';
        if (!/\bno-store\b/i.test(cacheControl)) {
          const copy = response.clone();
          await caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          await trimCache(CACHE_NAME, RUNTIME_MAX_ENTRIES);
        }
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(revalidate);
    return cached;
  }

  const fresh = await revalidate;
  if (fresh) return fresh;

  return new Response('Çevrimdışı', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;
  if (!req.url.startsWith('http')) return;

  let url;
  try {
    url = new URL(req.url);
    // Harici karolar/CSP: doğrudan tarayıcıya bırak.
    if (url.origin !== self.location.origin) return;
    // API verisi Cache Storage'a asla girmez.
    if (url.pathname.startsWith('/api/')) return;
  } catch {
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(handleNavigation(event));
    return;
  }

  if (isImmutableAsset(url)) {
    event.respondWith(handleImmutable(req));
    return;
  }

  event.respondWith(handleStaleWhileRevalidate(event));
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data === 'CLEAR_ALL_CACHES') {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => caches.delete(key)));
      }).then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ cleared: true });
        }
      })
    );
  }
});
