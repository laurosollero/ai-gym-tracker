// AI Gym Tracker Service Worker
const CACHE_NAME = 'ai-gym-tracker-v3';
const BASE_PATH = '/ai-gym-tracker';

// Core app routes to cache
const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/workout`,
  `${BASE_PATH}/history`,
  `${BASE_PATH}/settings`,
  `${BASE_PATH}/templates`,
  `${BASE_PATH}/exercises`,
  `${BASE_PATH}/analytics`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/icon-192x192.png`,
  `${BASE_PATH}/icon-512x512.png`,
];

// Install event - cache core resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Install complete');
        // Don't skipWaiting automatically - let the user decide
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      self.clients.claim();
    })
  );
});

// Fetch event - network first for API calls, cache first for assets
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // For navigation requests, try network first
        if (request.mode === 'navigate') {
          return fetch(request)
            .then((networkResponse) => {
              // Update cache with fresh content
              if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return networkResponse;
            })
            .catch(() => {
              // Fall back to cache if network fails
              return cachedResponse || caches.match(`${BASE_PATH}/`);
            });
        }
        
        // For other requests, return cached version or fetch from network
        return cachedResponse || fetch(request)
          .then((networkResponse) => {
            // Cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          });
      })
  );
});

// Handle background sync (for future use)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  // Future: sync workout data when back online
});

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  // Future: workout reminders, PR notifications
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting...');
    self.skipWaiting();
  }
});