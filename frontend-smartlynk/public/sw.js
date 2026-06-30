const CACHE_NAME = 'smartlynk-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Solo cachear peticiones GET, e ignorar peticiones a la API del backend
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retornar de la caché si existe, sino, ir a la red
        return response || fetch(event.request).then((fetchRes) => {
          return caches.open(CACHE_NAME).then((cache) => {
            // Guardar en caché dinámicamente si es un recurso de origen local
            if (event.request.url.startsWith(self.location.origin)) {
              cache.put(event.request, fetchRes.clone());
            }
            return fetchRes;
          });
        });
      }).catch(() => {
        // En caso de estar offline y no tener el recurso, si es navegación html devolver el index.html (SPA)
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});
