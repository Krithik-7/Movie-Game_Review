const CACHE_NAME = 'my-cache-v2';
const urlsToCache = [
    '/',  // Homepage
    '/index1.html',  // Served via Flask route
    '/static/css/styles.css',  // CSS file
    '/static/js/main.js',  // JS file
    '/static/images/m3.jpeg',  // Image file
    '/static/offline.html'  // Offline page
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache);
        }).catch((error) => {
            console.error('Cache installation failed:', error);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;  // Serve from cache
            }
            return fetch(event.request).catch(() => {
                return caches.match('/offline.html');  // Fallback to offline page
            });
        })
    );
});

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