/* Service worker — cache cangkang aplikasi. Permintaan API (Apps Script) TIDAK pernah di-cache. */
const VERSI = 'presensi-dj-v7.1.0';
const CANGKANG = ['./', './index.html', './app.css', './app.js', './api.js', './scanner.js', './config.js', './vendor/jsQR.min.js', './manifest.webmanifest',
  './assets/logo-puskesmas.png', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/favicon.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSI).then(c => c.addAll(CANGKANG)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSI).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return; // API & lintas domain langsung ke jaringan
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => { if (res.ok) { const cp = res.clone(); caches.open(VERSI).then(c => c.put(e.request, cp)); } return res; }).catch(() => hit);
      return hit || net;
    })
  );
});
