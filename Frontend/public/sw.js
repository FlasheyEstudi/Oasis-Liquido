// OASIS - PWA Service Worker
// Manages offline assets caching and Firebase Cloud Messaging push events

const CACHE_NAME = 'oasis-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/oasis-icon.png',
  '/oasis-logo.png',
  '/robots.txt'
];

// Installation: Cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('OASIS SW: Pre-caching static assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('OASIS SW: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch events strategy: Network-First with Cache Fallback for assets, bypass API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass API and Auth calls so they always talk to the server in real-time
  if (url.pathname.includes('/api/') || url.pathname.includes('/auth/')) {
    return;
  }

  // Network-First, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache valid static responses
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline mode: match in cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If it's a page navigation request, return index.html shell
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/');
          }
        });
      })
  );
});

// Push Notifications receiver
self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload = { title: 'Oasis Nicaragua', body: event.data.text() };
    }
  }

  const title = payload.title || 'Oasis Nicaragua';
  const options = {
    body: payload.body || 'Tienes una nueva notificación.',
    icon: '/oasis-icon.png',
    badge: '/oasis-icon.png',
    data: payload.data || {},
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Ver Detalles' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const redirectUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Find window client and focus if open
      for (const client of clientList) {
        const clientPath = new URL(client.url).pathname;
        if (clientPath === redirectUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // If not open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(redirectUrl);
      }
    })
  );
});
