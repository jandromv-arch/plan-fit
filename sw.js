const CACHE = 'planfit-v24';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192-v2.png', './icon-512-v2.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache primero: abre al instante aunque el gimnasio no tenga cobertura,
// y actualiza por detrás para que la próxima vez veas la versión nueva.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const red = fetch(e.request).then(r => {
        if (r && r.status === 200) {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return r;
      }).catch(() => cached || caches.match('./index.html'));
      return cached || red;
    })
  );
});

self.addEventListener('push', e => {
  let d = { title: 'Plan Fit', body: 'Toca para abrir tu plan de hoy.' };
  try { if (e.data) d = Object.assign(d, e.data.json()); } catch (err) {}
  e.waitUntil(self.registration.showNotification(d.title, {
    body: d.body, icon: './icon-192-v2.png', badge: './icon-192-v2.png', data: { url: './index.html' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow((e.notification.data && e.notification.data.url) || './index.html'));
});
