// service-worker.js

const CACHE_NAME = 'movie-reviews-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/register.html',
  '/login.html',
  '/reviews.html',
  '/static/css/styles.css',
  '/static/js/app.js',
  '/static/images/w.png',  // Include your images here
  // Add more images or assets to cache as needed
];

// Install event: cache the resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event: serve resources from cache first
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return the cached resource if available, else fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
