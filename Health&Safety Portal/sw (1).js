/* IFES / TSG Services Portal - service worker
   Caches the app shell so it opens offline once installed.
   Bump CACHE_VERSION whenever you change the HTML to push an update. */
const CACHE_VERSION = 'portal-v2';
const SHELL = [
  './',
  './index.html',
  './manifest-ifes.json',
  './manifest-tsg.json',
  './icon-ifes-192.png',
  './icon-ifes-512.png',
  './icon-tsg-192.png',
  './icon-tsg-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()).catch(() => {})
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (req.url.indexOf('script.google.com') !== -1) {
    e.respondWith(fetch(req).catch(() => new Response('{"ok":false,"offline":true}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((resp) => {
        caches.open(CACHE_VERSION).then((c) => c.put(req, resp.clone()));
        return resp;
      }).catch(() => cached || caches.match('./index.html'));
      return cached || network;
    })
  );
});
