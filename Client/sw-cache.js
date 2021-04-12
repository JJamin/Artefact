const CACHE = [
  // './',
  '/static/font/regular.woff2',
  '/static/font/medium.woff2',
  '/static/three.min.js',
];
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open("app").then(function(cache) {
      return cache.addAll(CACHE);
    })
  );
});
self.addEventListener('activate',  event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request, {ignoreSearch:true}).then(response => {
      return response || fetch(event.request);
    })
  );
});