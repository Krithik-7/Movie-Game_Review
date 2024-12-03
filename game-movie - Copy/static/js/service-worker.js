// Define cache names
const CACHE_NAME = 'movie-review-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/reviews',
    '/static/css/styles.css',
    '/static/js/main.js',
    '/static/icons/a.png',  // Example of image
    // Add other static assets that should be cached
];

// Install event – caching resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
});

// Activate event – clean up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);  // Remove old caches
                    }
                })
            );
        })
    );
});

// Fetch event – serve cached files when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Return cached response if available
                return cachedResponse;
            }
            return fetch(event.request);  // Otherwise, make a network request
        })
    );
});
