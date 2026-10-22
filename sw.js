/* Service worker — cache cangkang aplikasi. Permintaan API (Apps Script) TIDAK pernah di-cache. */
const VERSI = 'presensi-dj-v10.0.1';
const CANGKANG = ['./', './index.html', './app.css', './app.js', './api.js', './scanner.js', './config.js', './vendor/jsQR.min.js', './manifest.webmanifest',
  './assets/logo-puskesmas.png', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/maskable-192.png', './icons/favicon.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSI).then(c => c.addAll(CANGKANG)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSI).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return; // API & lintas domain langsung ke jaringan
  if (/\/admin(\/|$)/.test(u.pathname)) return; // TAHAP 8: halaman pengalih admin/ (ke panel /exec) tidak pernah di-cache
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => { if (res.ok) { const cp = res.clone(); caches.open(VERSI).then(c => c.put(e.request, cp)); } return res; }).catch(() => hit);
      return hit || net;
    })
  );
});

// TAHAP 10: notifikasi HP (Web Push standar tanpa isi). Server hanya "membangunkan"; isi diambil dari server di sini.
async function swCek() {
  try {
    const c = await caches.open('dj-ctx'), r = await c.match('./__ctx'); if (!r) return null;
    const k = await r.json(); if (!k.api || !k.token) return null;
    const res = await fetch(k.api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ aksi: 'cek.status', data: { device_id: k.device }, token: k.token }), redirect: 'follow', cache: 'no-store' });
    const j = await res.json(); return (j && j.ok && j.data) ? j.data : null;
  } catch (e) { return null; }
}
self.addEventListener('push', e => {
  e.waitUntil(swCek().then(d => {
    const c = d && d.cek;
    const judul = c ? 'Konfirmasi keberadaan' : 'Presensi Dara Juanti';
    const isi = c ? 'Kepala Puskesmas meminta konfirmasi lokasi Anda sebelum pukul ' + String(c.batas).replace(':', '.') + '. Ketuk untuk menjawab.' : 'Kepala Puskesmas meminta konfirmasi keberadaan. Ketuk untuk membuka aplikasi.';
    return self.registration.showNotification(judul, { body: isi, icon: './icons/icon-192.png', badge: './icons/favicon.png', tag: c ? c.id_cek : 'cek', renotify: true, requireInteraction: true, vibrate: [200, 100, 200], data: { url: './#/beranda' } });
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => { for (const c of cs) { if (c.url.indexOf(self.registration.scope) === 0 && 'focus' in c) { c.postMessage({ jenis: 'CEK' }); return c.focus(); } } return self.clients.openWindow(url); }));
});
