const CACHE_NAME = 'thrilha-pwa-v1';

const BASE_PATH = (() => {
  const scope = self.registration?.scope;
  if (scope) {
    const { pathname } = new URL(scope);
    return pathname.endsWith('/') ? pathname : `${pathname}/`;
  }
  const path = self.location.pathname.replace(/service-worker\.js$/, '');
  if (!path) return '/';
  return path.endsWith('/') ? path : `${path}/`;
})();

const basePrefix = BASE_PATH === '/' ? '' : BASE_PATH.replace(/\/$/, '');
const withBase = (path) => {
  if (path === '/' || path === '') {
    return BASE_PATH;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${basePrefix}${normalized}`;
};

const OFFLINE_URL = withBase('offline.html');
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/iconfavi.png',
  '/LogoThrilhaOficial.png',
  '/trilhacapa.jpg',
  'offline.html',
].map(withBase);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return undefined;
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const requestURL = new URL(request.url);
  const isSameOrigin = requestURL.origin === self.location.origin;

  if (!isSameOrigin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
          })
          .catch(() => undefined);
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => caches.match(OFFLINE_URL));
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
