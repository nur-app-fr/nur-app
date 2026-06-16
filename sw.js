/* ==========================================================================
   NÛR — Service Worker (cache offline)
   ========================================================================== */

const CACHE = 'nur-v1';
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/prayer.js',
  './js/quran-data.js',
  './js/quran.js',
  './js/dua-data.js',
  './js/adhkar-data.js',
  './js/janaza-data.js',
  './js/content.js',
  './js/app.js',
  './assets/logo-nur.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/adhan@4.4.3/dist/adhan.min.js',
  'https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Cormorant+Garamond:wght@500;600;700&family=Work+Sans:wght@400;500;600;700&display=swap',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Audio everyayah.com → réseau seulement (trop volumineux pour le cache)
  if (url.hostname === 'everyayah.com') return;

  // API alquran.cloud → réseau puis cache (pour le texte du Coran)
  if (url.hostname === 'api.alquran.cloud') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Tout le reste → cache d'abord, puis réseau
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
