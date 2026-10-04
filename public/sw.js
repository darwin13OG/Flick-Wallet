const CACHE_NAME = 'flickwallet-cache-v5';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/notification-badge.png',
  '/material-symbols-outlined.woff2'
];

let reminderTimeoutId = null;
let lastNotifiedDateKey = null;

function scheduleNext9pmInSW(enabled, customBody) {
  if (reminderTimeoutId) {
    clearTimeout(reminderTimeoutId);
    reminderTimeoutId = null;
  }
  if (!enabled) return;

  const now = new Date();
  const target = new Date(now);
  target.setHours(21, 0, 0, 0);

  if (now.getTime() >= target.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const msUntil9pm = target.getTime() - now.getTime();
  reminderTimeoutId = setTimeout(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    if (lastNotifiedDateKey !== todayKey && self.registration && self.registration.showNotification) {
      lastNotifiedDateKey = todayKey;
      self.registration.showNotification('Recordatorio 9:00 PM · FlickWallet', {
        body:
          customBody ||
          '¿Tuviste algún gasto hormiga, ingreso o abono hoy? Regístralo antes de cerrar el día.',
        icon: '/pwa-192x192.png',
        badge: '/notification-badge.png',
        tag: `flickwallet-9pm-${todayKey}`,
      });
    }
    scheduleNext9pmInSW(true, customBody);
  }, msUntil9pm);
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (!event.data || typeof event.data !== 'object') return;
  if (event.data.type === 'SCHEDULE_9PM_REMINDER') {
    if (event.data.alreadyNotifiedDate) {
      lastNotifiedDateKey = event.data.alreadyNotifiedDate;
    }
    scheduleNext9pmInSW(Boolean(event.data.enabled), event.data.body);
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((res) => res || caches.match('/index.html')))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
