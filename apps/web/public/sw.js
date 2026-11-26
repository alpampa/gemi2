/**
 * VAPUR PWA SERVICE WORKER — v10 "WEAK-NETWORK RESILIENT"
 *
 * SORUN (v9): Tüm same-origin GET'ler network-first işleniyordu ve fetch'in
 * zaman aşımı yoktu. Vapurda/tünelde bağlantı "var ama ölü" olunca sayfa uzun
 * süre takılı kalıyor, çevrimdışı kabuğa hiç düşmüyordu — tam da hedef senaryo.
 *
 * İlk ziyarette kabuk ısısı, install sırasında "/" fetch edilerek DEĞİL,
 * istemci tarafında (`ServiceWorkerRegister.warmShell`) yapılır. Install'da
 * tam SSR fetch etmek her yeni context'te ek yük üretir ve SW aktivasyonunu o
 * yanıta bağlar (ölçüldü: E2E matrisinde 30 sn+ timeout'lar).
 *
 * STRATEJİLER:
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
/**
 * Önbellekte kabuk YOKKEN ağ için tanınan ek süre.
 *
 * `NAVIGATION_TIMEOUT_MS` yalnızca "hızlı kabuk" sözleşmesidir; bu süre
 * dolduğunda çevrimdışı olduğumuz anlamına GELMEZ. Sunucu yavaş ama
 * sağlıklıyken "Çevrimdışısınız" göstermemek için ağ sonucu bu süre kadar
 * daha beklenir.
 */
const LATE_NETWORK_GRACE_MS = 15000;

/**
 * TEST KANCASI — yapay ağ gecikmesi (ms).
 *
 * NEDEN: "yavaş ağda kabuk önbellekten döner" sözleşmesi, ağ gecikmesi
 * gerçekten uygulanmadan ölçülemez. Playwright'ın `context.route` katmanı
 * Service Worker'ın kendi `fetch()` isteğini görmez (belgelenmiş kısıt), bu
 * yüzden gecikme testten ağ katmanına enjekte edilemiyor. Bu kanca, gecikmeyi
 * SW'nin fetch yoluna ekleyerek 3000 ms'lik GERÇEK zaman aşımı yarışını
 *  (Promise.race + önbellek yedeği) deterministik biçimde test edilebilir
 * kılar. Üretimde hiçbir istemci bu mesajı göndermez; varsayılan 0'dır.
 */
let testNetworkDelayMs = 0;

self.addEventListener('message', (event) => {
  const data = event.data || {};
  // ÜRETİMDE ETKİSİZ: kanca yalnızca yerel/testere ortamında kabul edilir.
  const isLocal =
    self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
  if (
    isLocal &&
    data.type === 'VAPUR_TEST_NETWORK_DELAY' &&
    typeof data.ms === 'number'
  ) {
    testNetworkDelayMs = Math.max(0, Math.min(data.ms, 30_000));
    // Onay: test, gecikmenin SW tarafında gerçekten kurulduğunu ölçer.
    if (event.source && typeof event.source.postMessage === 'function') {
      event.source.postMessage({ type: 'VAPUR_TEST_NETWORK_DELAY_ACK', ms: testNetworkDelayMs });
    }
  }
});

/** Test gecikmesi varsa fetch'i geciktirir; yoksa doğrudan fetch. */
function fetchWithTestDelay(req) {
  if (testNetworkDelayMs <= 0) return fetch(req);
  return new Promise((resolve) => setTimeout(resolve, testNetworkDelayMs)).then(() =>
    fetch(req),
  );
}

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

/**
 * Önbellekteki kabuk: istenen belge, sonra kök. Yoksa `null` döner.
 *
 * ÖNEMLİ: `null` "çevrimdışı" demek DEĞİLDİR. Yalnızca "hızlı sunacak
 * önbelleklenmiş kabuk yok" demektir; karar `handleNavigation` verir.
 */
async function cachedShellResponse(req) {
  const cached = await caches.match(req, { ignoreVary: true });
  if (cached) return withShellMarker(cached);

  const rootFallback =
    (await caches.match('/', { ignoreVary: true })) ||
    (await caches.match(new URL('/', req.url).href, { ignoreVary: true }));
  if (rootFallback) return withShellMarker(rootFallback);

  return null;
}

/** Son çare: gerçekten çevrimdışıyken gösterilen minimal sayfa (503). */
function offlinePageResponse() {
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

  const networkPromise = fetchWithTestDelay(req)
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

  // 3 sn doldu: yavaş ağ. Önce önbellekteki kabuk sunulur (sözleşme).
  event.waitUntil(networkPromise.catch(() => {}));
  const cachedShell = await cachedShellResponse(req);
  if (cachedShell) return cachedShell;

  /**
   * Önbellekte kabuk YOK. Burada "çevrimdışısınız" demek için kanıt gerekir:
   * sunucu yavaş ama SAĞLIKLI olabilir (ana sayfa SSR'ı ~3.8 MB; yük altında
   * 3 sn'yi aşması normal). Eski davranış bu durumda doğrudan 503 çevrimdışı
   * sayfası döndürüyordu — çalışan bağlantıda "Çevrimdışısınız" yalanı ve
   * hidrasyonu hiç çalışmayan boş bir belge. Ağ sonucu ek bir süre beklenir;
   * çevrimdışı sayfası yalnızca ağ GERÇEKTEN başarısızsa gösterilir.
   */
  const late = await Promise.race([
    networkPromise,
    new Promise((resolve) => setTimeout(() => resolve(null), LATE_NETWORK_GRACE_MS)),
  ]);
  if (late) return late;
  return offlinePageResponse();
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

  /**
   * Kabuk ("/") no-store yanıtla gelir (force-dynamic sayfa). Çevrimdışı yedek
   * olarak yine de saklanmalıdır — handleNavigation'daki aynı kural. Bu satır
   * olmadan `ServiceWorkerRegister.warmShell` fetch'i hiçbir şey önbelleğe
   * almıyordu ve ilk ziyaret sonrası çevrimdışı yenileme 503'e düşüyordu.
   */
  const isShell = new URL(req.url).pathname === '/';

  const revalidate = fetch(req)
    .then(async (response) => {
      if (response && response.status === 200) {
        const cacheControl = response.headers.get('Cache-Control') || '';
        if (!/\bno-store\b/i.test(cacheControl) || isShell) {
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
