/* Sube VERSION en cada cambio para que los móviles se actualicen. */
var VERSION = 'mm-menus-v0.2.0';
var ARCHIVOS = ['./', 'index.html', 'styles.css', 'config.js', 'alergenos.js', 'datos-demo.js', 'app.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/logo-casa-maria-madre.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(function (r) {
    var copia = r.clone(); caches.open(VERSION).then(function (c) { c.put(e.request, copia); }); return r;
  }).catch(function () { return caches.match(e.request); }));
});
