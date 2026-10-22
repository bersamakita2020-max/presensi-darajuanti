/* Service worker — cache cangkang aplikasi. Permintaan API (Apps Script) TIDAK pernah di-cache. */
const VERSI = 'presensi-dj-v10.4.0';
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

// TAHAP 10h: notifikasi HP (Web Push standar tanpa isi, tanpa Firebase).
// iPhone (Safari/PWA): notifikasi WAJIB ditampilkan segera di setiap event push — tidak boleh menunggu jaringan dulu,
// kalau tidak, notifikasi tidak tampil dan langganan bisa dicabut. Jadi: tampilkan teks umum dulu, detail (opsional) sesudahnya.
const TAG_CEK = 'dj-cek';
const OPSI_CEK = { icon: './icons/icon-192.png', badge: './icons/favicon.png', tag: TAG_CEK, requireInteraction: true, vibrate: [200, 100, 200], data: { url: './#/konfirmasi' } };
async function swCek(ms) {
  try {
    const c = await caches.open('dj-ctx'), r = await c.match('./__ctx'); if (!r) return null;
    const k = await r.json(); if (!k.api || !k.token) return null;
    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null, t = ac ? setTimeout(() => ac.abort(), ms) : 0;
    try {
      const res = await fetch(k.api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ aksi: 'cek.status', data: { device_id: k.device }, token: k.token }), redirect: 'follow', cache: 'no-store', signal: ac ? ac.signal : undefined });
      const j = await res.json(); return (j && j.ok && j.data) ? j.data : null;
    } finally { if (t) clearTimeout(t); }
  } catch (e) { return null; }
}
self.addEventListener('push', e => {
  let isi = null; try { isi = e.data ? e.data.json() : null; } catch (x) { isi = null; }
  const tampil = self.registration.showNotification((isi && isi.judul) || 'Konfirmasi keberadaan', Object.assign({}, OPSI_CEK, { body: (isi && isi.isi) || 'Kepala Puskesmas meminta konfirmasi keberadaan. Ketuk untuk menjawab.', renotify: true }));
  // detail opsional (batas waktu pendek); notifikasi di atas sudah tampil apa pun hasilnya
  const detail = tampil.then(() => swCek(4000)).then(d => {
    const c = d && d.cek; if (!c || !c.batas) return;
    return self.registration.showNotification('Konfirmasi keberadaan', Object.assign({}, OPSI_CEK, { body: 'Kepala Puskesmas meminta konfirmasi lokasi Anda sebelum pukul ' + String(c.batas).replace(':', '.') + '. Ketuk untuk menjawab.', renotify: false, silent: true }));
  }).catch(() => {});
  e.waitUntil(Promise.all([tampil, detail]));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => { for (const c of cs) { if (c.url.indexOf(self.registration.scope) === 0 && 'focus' in c) { c.postMessage({ jenis: 'CEK' }); return c.focus(); } } return self.clients.openWindow(url); }));
});
