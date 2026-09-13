import { precacheAndRoute } from 'workbox-precaching';

// Precache built assets. Ito rin ang injection point para sa vite-plugin-pwa (huwag alisin).
precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch { data = { body: event.data && event.data.text() }; }
  const options = {
    body: data.body || '',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: { url: data.url || '/portal' },
  };
  event.waitUntil(self.registration.showNotification(data.title || 'UBAFAI', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/portal';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if (c.url.includes(url) && 'focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
