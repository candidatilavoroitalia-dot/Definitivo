const CACHE_NAME = 'parrucco-v35';

// Install event - force activation
self.addEventListener('install', (event) => {
  console.log('Service Worker installing, version: parrucco-v35');
  self.skipWaiting(); // Force immediate activation
});

// Activate event - clean ALL old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating, cleaning old caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete ALL caches
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let data = {
    title: 'Promemoria Appuntamento',
    body: 'Hai un appuntamento in programma!',
    icon: '/logo192.png',
    badge: '/logo192.png'
  };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/logo192.png',
    badge: data.badge || '/logo192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Apri App' },
      { action: 'close', title: 'Chiudi' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url || '/dashboard');
        }
      })
  );
});

// Fetch event - NO CACHING
self.addEventListener('fetch', (event) => {
  // Always fetch from network, no caching
  return;
});
