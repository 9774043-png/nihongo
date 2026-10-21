/* =============================================================================
   日語特訓所 Service Worker
   -----------------------------------------------------------------------------
   策略：
   - 本地檔案（index.html / manifest / icons）在安裝時預先快取 → 離線可開。
   - 外部 CDN（Tailwind、Font Awesome、Google Fonts、confetti）採「快取優先」，
     第一次連網載入後就被存起來，之後離線也能用。
   - 導覽請求（網址列直接開啟）一律回傳快取的 index.html，避免離線時出現
     瀏覽器的恐龍頁。
   改版時只要修改 CACHE_VERSION，舊快取就會在 activate 階段被清掉。
   ========================================================================== */

const CACHE_VERSION = 'v7';
const SHELL_CACHE = `nihongo-shell-${CACHE_VERSION}`;
const CDN_CACHE = `nihongo-cdn-${CACHE_VERSION}`;

// 相對路徑：換成子目錄部署（例如 GitHub Pages 的 /repo/）也不必修改
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

// 允許快取的外部來源
const CDN_HOSTS = [
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // 個別 add，單一檔案失敗不會讓整個安裝失敗
    await Promise.all(SHELL_ASSETS.map(async (url) => {
      try {
        await cache.add(new Request(url, { cache: 'reload' }));
      } catch (e) {
        console.warn('[SW] 預快取略過:', url, e);
      }
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k !== SHELL_CACHE && k !== CDN_CACHE)
          .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1) 導覽請求：先試網路，失敗就回快取的 index.html
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(SHELL_CACHE);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match('./index.html', { ignoreSearch: true });
        return cached || Response.error();
      }
    })());
    return;
  }

  // 2) 外部 CDN：快取優先，背景補抓
  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CDN_CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        // opaque 回應（no-cors 的字型等）也存，離線才有東西可用
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      } catch (e) {
        return cached || Response.error();
      }
    })());
    return;
  }

  // 3) 同源其他資源：快取優先
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && res.ok) {
          const cache = await caches.open(SHELL_CACHE);
          cache.put(req, res.clone());
        }
        return res;
      } catch (e) {
        return Response.error();
      }
    })());
  }
});
