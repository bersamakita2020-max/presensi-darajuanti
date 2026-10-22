/* Presensi Digital Puskesmas Dara Juanti — aplikasi pegawai (PWA). Seluruh validasi final ada di server. */
(function () {
  'use strict';
  const C = window.PRESENSI_CONFIG;
  const $ = (s, el) => (el || document).querySelector(s);
  const app = $('#app');
  const esc = s => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LS = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } }, del: k => { try { localStorage.removeItem(k); } catch (e) { } } };
  const S = { pantau: LS.get('dj_pantau') === '1', token: LS.get('dj_token'), device: null, info: null, offset: 0, gps: null, gpsErr: '', beranda: null, watch: null, timers: [], installEvt: null, sandiLogin: '' };
  const pad = n => (n < 10 ? '0' : '') + n;
  const now = () => Date.now() + S.offset;
  const wib = ms => new Date(ms + 7 * 3600000);
  const jamTeks = (ms, det) => { const d = wib(ms); return pad(d.getUTCHours()) + '.' + pad(d.getUTCMinutes()) + (det ? ':' + pad(d.getUTCSeconds()) : ''); };
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const menitTeks = m => { m = Math.round(m || 0); const j = Math.floor(m / 60), s = m % 60; return (j ? j + ' jam ' : '') + (s || !j ? s + ' menit' : '').trim(); };
  const jarakTeks = m => m >= 1000 ? (Math.round(m / 100) / 10).toString().replace('.', ',') + ' km' : Math.round(m) + ' m';
  const WARNA = { P: '#16a34a', S: '#d97706', M: '#4338ca', R: '#0f766e', LJ: '#64748b', L: '#94a3b8', C: '#7c3aed' };
  const I = {
    masuk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>',
    pulang: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
    izin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15l2 2 4-4"/></svg>',
    sakit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>',
    tl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    kal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>',
    riw: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>',
    mon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    jam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="48" height="48"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>'
  };

  // ---------- util ----------
  function toast(msg, jenis, ms) { const t = document.createElement('div'); t.className = 'toast ' + (jenis || ''); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), ms || 3200); }
  function clearTimers() { S.timers.forEach(clearInterval); S.timers = []; if (window.Scanner) Scanner.berhenti(); }
  function rid() { const a = new Uint8Array(12); crypto.getRandomValues(a); return 'r-' + Array.from(a, b => b.toString(16).padStart(2, '0')).join(''); }
  function deviceId() {
    let d = LS.get('dj_device');
    if (!d || !/^[A-Za-z0-9_-]{32,128}$/.test(d)) { const a = new Uint8Array(32); crypto.getRandomValues(a); d = btoa(String.fromCharCode.apply(null, a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); LS.set('dj_device', d); }
    return d;
  }
  function labelPerangkat() { const ua = navigator.userAgent; const m = /Android [\d.]+;[^;)]*?;?\s*([^;)]+?)\s*(Build|\))/.exec(ua); return (m ? 'Android · ' + m[1] : (/(iPhone|iPad)/.exec(ua) || ['Peramban'])[0]) + ' · ' + (/(Chrome|Firefox|Safari)\/[\d]+/.exec(ua) || [''])[0]; }
  function salam(ms) { const h = wib(ms).getUTCHours(); return h < 10 ? 'Selamat pagi,' : h < 15 ? 'Selamat siang,' : h < 18 ? 'Selamat sore,' : 'Selamat malam,'; }
  function logo() { return (S.info && S.info.logo) || C.LOGO; }
  async function api(aksi, data, opsi) {
    data = Object.assign({ device_id: S.device }, data || {});
    try { return await API.kirim(aksi, data, S.token, opsi); }
    catch (e) {
      if (e.kode === 'SESI') { keluarLokal(); toast('Sesi berakhir. Silakan masuk kembali.', 'bad'); go('login'); }
      else if (e.kode === 'NONAKTIF') { keluarLokal(); viewTerkunci(e.message); }
      else if (e.kode === 'WAJIB_GANTI') go('aktivasi');
      throw e;
    }
  }
  function keluarLokal() { try { caches.delete('dj-ctx'); } catch (e) { } S.token = null; LS.del('dj_token'); S.beranda = null; S.pantau = false; S.pt = null; LS.del('dj_pantau'); if (S.watch !== null) { navigator.geolocation.clearWatch(S.watch); S.watch = null; } }
  // ---------- GPS ----------
  function jarakKe(lat, lng) {
    const g = S.info && S.info.geo; if (!g) return null;
    const R = 6371000, r = Math.PI / 180, dLat = (g.lat - lat) * r, dLng = (g.lng - lng) * r;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * r) * Math.cos(g.lat * r) * Math.sin(dLng / 2) ** 2;
    let d = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)), rad = g.radius, nm = g.nama || 'Puskesmas';
    (g.lain || []).forEach(l => { const dl = 2 * R * Math.asin(Math.sqrt(Math.sin((l.lat - lat) * r / 2) ** 2 + Math.cos(lat * r) * Math.cos(l.lat * r) * Math.sin((l.lng - lng) * r / 2) ** 2)); if (dl - (l.radius || rad) < d - rad) { d = dl; rad = l.radius || rad; nm = l.nama || nm; } });
    return { jarak: d, radius: rad, dalam: d <= rad, nama: nm };
  }
  function mulaiGps() {
    if (!('geolocation' in navigator)) { S.gpsErr = 'Perangkat tidak mendukung GPS.'; return; }
    if (S.watch !== null) return;
    S.watch = navigator.geolocation.watchPosition(p => { S.gps = { lat: p.coords.latitude, lng: p.coords.longitude, akurasi: Math.round(p.coords.accuracy), ts: Date.now() }; S.gpsErr = ''; renderArea(); },
      e => { S.gpsErr = e.code === 1 ? 'Izin lokasi ditolak' : 'GPS belum aktif'; renderArea(); }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 });
  }
  function posisiSegar() {
    return new Promise((ok, no) => {
      if (S.gps && Date.now() - S.gps.ts < 15000) return ok(S.gps);
      navigator.geolocation.getCurrentPosition(p => { S.gps = { lat: p.coords.latitude, lng: p.coords.longitude, akurasi: Math.round(p.coords.accuracy), ts: Date.now() }; ok(S.gps); },
        e => no(new Error(e.code === 1 ? 'Izin lokasi ditolak. Aktifkan lokasi untuk aplikasi ini di pengaturan browser.' : 'Lokasi GPS belum didapat. Aktifkan GPS lalu coba lagi.')), { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 });
    });
  }
  function areaHtml() {
    if (S.gpsErr) return '<div class="area err"><i class="dot"></i><div>' + esc(S.gpsErr) + '<small>Aktifkan lokasi</small></div></div>';
    if (!S.gps) return '<div class="area wait"><i class="dot"></i><div>Mencari lokasi…<small>GPS</small></div></div>';
    const j = jarakKe(S.gps.lat, S.gps.lng); if (!j) return '';
    return j.dalam ? '<div class="area in"><i class="dot"></i><div>DALAM AREA<small>' + esc(j.nama) + ' · ±' + jarakTeks(j.jarak) + '</small></div></div>'
      : '<div class="area out"><i class="dot"></i><div>DI LUAR AREA<small>' + esc(namaLokasi()) + ' ±' + jarakTeks(j.jarak) + ' · Izin/Sakit/TL boleh</small></div></div>';
  }
  // TAHAP 5: nama lokasi induk pegawai (Puskesmas induk / Polindes)
  function namaLokasi() { const b = S.beranda && S.beranda.lokasi, g = S.info && S.info.geo; return (b && b.nama) || (g && g.nama) || 'Puskesmas'; }
  function renderArea() { const el = $('#area'); if (el) el.innerHTML = areaHtml(); const ck = $('#ck-lokasi'); if (ck) ck.outerHTML = chkLokasi(); }
  function chkLokasi() {
    if (!S.gps) return '<div class="chk wait" id="ck-lokasi"><span class="ci">…</span><b>Lokasi</b><span>' + esc(S.gpsErr || 'mencari GPS…') + '</span></div>';
    const j = jarakKe(S.gps.lat, S.gps.lng);
    return '<div class="chk ' + (j && j.dalam ? 'ok' : 'bad') + '" id="ck-lokasi"><span class="ci">' + (j && j.dalam ? '✓' : '!') + '</span><b>Lokasi</b><span>' + (j ? jarakTeks(j.jarak) : '-') + ' · akurasi ' + S.gps.akurasi + ' m</span></div>';
  }
  // ---------- navigasi ----------
  function go(v, arg) { location.hash = '#/' + v + (arg ? '/' + arg : ''); }
  window.addEventListener('hashchange', route);
  function route() {
    clearTimers(); closeSheet();
    const [v, arg] = location.hash.replace(/^#\//, '').split('/');
    if (!S.token && v !== 'login') return viewLogin();
    ({ login: viewLogin, aktivasi: viewAktivasi, beranda: viewBeranda, scan: () => viewScan(arg || 'MASUK'), ajukan: () => viewAjukan(arg || 'IZIN'), jadwal: () => viewJadwal(), tukar: () => (arg === 'baru' ? viewTukarBaru() : viewTukar()), riwayat: () => viewRiwayat(), pantau: () => viewPantau(arg), profil: viewProfil, hasil: viewHasilTerakhir }[v] || viewBeranda)();
    window.scrollTo(0, 0);
  }
  function nav(aktif) {
    const b = (k, ic, t) => '<button data-go="' + k + '" class="' + (aktif === k ? 'on' : '') + '">' + I[ic] + '<span>' + t + '</span></button>';
    // TAHAP 8: tab Monitoring hanya untuk akun ber-akses pantau (Kepala Puskesmas); server lama tidak mengirim 'pantau' → tab tidak tampil
    return '<nav class="nav' + (S.pantau ? ' n5' : '') + '">' + b('beranda', 'home', 'Beranda') + b('jadwal', 'kal', 'Jadwal') + (S.pantau ? b('pantau', 'mon', 'Monitoring') : '') + b('riwayat', 'riw', 'Riwayat') + b('profil', 'user', 'Profil') + '</nav>';
  }
  app.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); go(g.dataset.go, g.dataset.arg); } });
  function appbar(judul, kembali) { return '<div class="appbar"><button class="icon-btn" data-go="' + (kembali || 'beranda') + '" aria-label="Kembali">' + I.back + '</button><h2>' + esc(judul) + '</h2></div>'; }

  // ---------- LOGIN ----------
  function viewLogin() {
    app.innerHTML = '<div class="login view" style="padding-bottom:0"><div class="head"><img src="' + esc(logo()) + '" alt="Logo Puskesmas"><h1>Presensi Digital</h1><p>' + esc(C.NAMA_INSTANSI) + ' · ' + esc(C.KABUPATEN) + '</p></div>' +
      '<form class="card" id="f-login" autocomplete="on"><h3 style="color:var(--navy);font-size:18px;margin-bottom:4px">Masuk</h3><p style="margin:0 0 16px;color:var(--muted);font-size:14px">Gunakan NIP/NIK dan kata sandi dari bagian kepegawaian.</p>' +
      '<label class="f"><span>NIP / NIK</span><input class="inp" name="u" inputmode="numeric" autocomplete="username" maxlength="18" required value="' + esc(LS.get('dj_user') || '') + '" placeholder="18 digit NIP atau 16 digit NIK"></label>' +
      '<label class="f"><span>Kata sandi</span><div class="pw"><input class="inp" name="p" type="password" autocomplete="current-password" required maxlength="64"><button type="button" id="tg-pw" aria-label="Tampilkan sandi">' + I.eye + '</button></div></label>' +
      '<button class="btn pri" id="b-login" type="submit">Masuk</button>' +
      '<p style="font-size:12.5px;color:var(--muted);margin:14px 0 0;display:flex;gap:8px"><span style="color:var(--hijau)">' + I.lock.replace('width="48" height="48"', 'width="18" height="18"') + '</span><span>Akun hanya dapat dipakai di <b>satu HP terdaftar</b>. Lokasi GPS dicatat setiap presensi.</span></p></form>' +
      '<div class="foot">Dengan masuk, Anda menyetujui <a href="#" id="l-privasi">Pemberitahuan Privasi</a> (UU No. 27/2022).<br>v' + esc(C.VERSI) + ' · ' + esc(C.NAMA_APLIKASI) + '</div></div>';
    $('#tg-pw').onclick = () => { const i = $('[name=p]'); i.type = i.type === 'password' ? 'text' : 'password'; };
    $('#l-privasi').onclick = e => { e.preventDefault(); sheetPrivasi(); };
    $('#f-login').onsubmit = async e => {
      e.preventDefault(); const f = e.target, b = $('#b-login');
      b.disabled = true; b.innerHTML = '<span class="spin"></span> Memeriksa…';
      try {
        const u = f.u.value.replace(/\s/g, '');
        const r = await API.kirim('login', { username: u, password: f.p.value, device_id: S.device, device_label: labelPerangkat() }, null, { ulang: 1 });
        LS.set('dj_user', u);
        if (r.menunggu_perangkat) { b.disabled = false; b.textContent = 'Masuk'; return sheetInfo('Menunggu persetujuan', r.pesan); }
        S.token = r.token; LS.set('dj_token', r.token); S.profil = r.profil; S.sandiLogin = f.p.value;
        if (r.perangkat_baru) toast('HP ini telah terdaftar sebagai perangkat presensi Anda.', 'ok', 4000);
        mulaiGps();
        go(r.wajib_ganti || r.wajib_pin ? 'aktivasi' : 'beranda');
        if (r.wajib_ganti || r.wajib_pin) S.aktivasi = { ganti: r.wajib_ganti, pin: r.wajib_pin };
      } catch (err) { b.disabled = false; b.textContent = 'Masuk'; toast(err.message, 'bad', 5000); }
    };
  }
  // ---------- AKTIVASI (ganti sandi + PIN) ----------
  function viewAktivasi() {
    const a = S.aktivasi || { ganti: true, pin: true };
    app.innerHTML = '<div class="view">' + '<div class="hero" style="padding-bottom:70px"><div class="topbar"><img class="logo" src="' + esc(logo()) + '" alt=""><div class="nm"><b>Aktivasi Akun</b><small>Sekali saja</small></div></div><div class="greet"><h1>Amankan akun Anda</h1><div class="sub">Buat kata sandi baru dan PIN 6 digit untuk presensi.</div></div></div>' +
      '<div class="wrap"><form class="card" id="f-akt">' +
      (a.ganti ? '<label class="f"><span>Kata sandi baru (min. 8, huruf + angka)</span><input class="inp" name="b1" type="password" minlength="8" maxlength="64" required autocomplete="new-password"></label><label class="f"><span>Ulangi kata sandi baru</span><input class="inp" name="b2" type="password" required autocomplete="new-password"></label>' : '') +
      (a.pin ? '<div class="row2"><label class="f"><span>PIN 6 digit</span><input class="inp" name="p1" type="password" inputmode="numeric" pattern="\\d{6}" maxlength="6" required></label><label class="f"><span>Ulangi PIN</span><input class="inp" name="p2" type="password" inputmode="numeric" pattern="\\d{6}" maxlength="6" required></label></div><p style="font-size:12.5px;color:var(--muted);margin:-4px 0 12px">PIN diminta setiap presensi agar HP tidak dapat dipinjamkan. Hindari 123456 / tanggal lahir.</p>' : '') +
      '<label class="chk" style="color:var(--ink)"><input type="checkbox" name="ok" required style="width:20px;height:20px"> <span>Saya telah membaca <a href="#" id="l-priv2" style="color:var(--hijau);font-weight:600">Pemberitahuan Privasi</a> termasuk pencatatan lokasi & ID perangkat.</span></label>' +
      '<button class="btn pri" id="b-akt" style="margin-top:8px">Simpan & Lanjutkan</button></form>' +
      '<div class="note info"><span class="ni">' + I.home + '</span><div><b>Tips:</b> setelah aktivasi, pilih menu browser ⋮ → <b>Tambahkan ke Layar Utama</b> agar aplikasi terbuka seperti aplikasi biasa.</div></div></div></div>';
    $('#l-priv2').onclick = e => { e.preventDefault(); sheetPrivasi(); };
    $('#f-akt').onsubmit = async e => {
      e.preventDefault(); const f = e.target, b = $('#b-akt');
      if (a.ganti && f.b1.value !== f.b2.value) return toast('Ulangan kata sandi tidak sama.', 'bad');
      if (a.pin && f.p1.value !== f.p2.value) return toast('Ulangan PIN tidak sama.', 'bad');
      b.disabled = true; b.innerHTML = '<span class="spin"></span> Menyimpan…';
      try {
        if (a.ganti) {
          if (!S.sandiLogin) { toast('Silakan masuk ulang untuk aktivasi.', 'bad'); keluarLokal(); return go('login'); }
          const r = await api('gantiSandi', { lama: S.sandiLogin, baru: f.b1.value, pin: a.pin ? f.p1.value : '' });
          S.token = r.token; LS.set('dj_token', r.token);
        } else if (a.pin) await api('gantiPin', { sandi: S.sandiLogin, baru: f.p1.value });
        S.sandiLogin = ''; S.aktivasi = null; LS.set('dj_privasi', '1');
        toast('Aktivasi berhasil. Selamat bertugas!', 'ok'); go('beranda');
      } catch (err) { b.disabled = false; b.textContent = 'Simpan & Lanjutkan'; if (err.kode !== 'SESI') toast(err.message, 'bad', 5000); }
    };
  }
  // ---------- BERANDA ----------
  async function viewBeranda() {
    mulaiGps();
    if (!S.beranda) app.innerHTML = '<div class="loading"><span class="spin d"></span>Memuat jadwal…</div>';
    else renderBeranda();
    try {
      const r = await api('beranda', {});
      S.beranda = r; S.offset = r.waktu_server - Date.now(); if (r.geo) S.info = Object.assign(S.info || {}, { geo: r.geo }); S.profil = r.profil;
      if (!!r.pantau !== S.pantau) { S.pantau = !!r.pantau; if (S.pantau) LS.set('dj_pantau', '1'); else LS.del('dj_pantau'); } // TAHAP 8
      if (location.hash.indexOf('beranda') >= 0 || location.hash === '' || location.hash === '#/') renderBeranda();
    } catch (e) { if (!S.beranda && S.token) app.innerHTML = '<div class="loading"><p>' + esc(e.message) + '</p><button class="btn sec" style="max-width:220px" onclick="location.reload()">Coba lagi</button></div>' + nav('beranda'); }
  }
  function kartuJadwal(j) {
    let tag = '<span class="tag mut">BELUM</span>', ket = esc(j.jam);
    if (j.masuk && j.pulang) tag = '<span class="tag ' + (j.status_pulang === 'PULANG_AWAL' ? 'bad' : 'ok') + '">SELESAI</span>';
    else if (j.masuk) tag = '<span class="tag ' + (j.menit_terlambat > 0 ? 'warn' : 'ok') + '">' + (j.menit_terlambat > 0 ? 'T ' + j.menit_terlambat + 'm' : 'HADIR') + '</span>';
    if (j.masuk) ket += ' · masuk ' + esc(j.masuk.replace(':', '.')) + (j.pulang ? ' · pulang ' + esc(j.pulang.replace(':', '.')) : '');
    else if (j.buka_masuk) ket += ' · dibuka ' + esc(j.buka_masuk.replace(':', '.'));
    return '<div class="jadwal-row"><div class="ico" style="background:' + (WARNA[j.kode] || '#0b5d3b') + '">' + esc(j.kode) + '</div><div class="t"><b>' + esc(j.nama) + '</b><span>' + ket + '</span></div>' + tag + '</div>';
  }
  function renderBeranda() {
    const r = S.beranda, p = r.profil, t = now();
    const contoh = /\(CONTOH\)/.test(p.nama);
    const nama = p.nama.replace(/\s*\(CONTOH\)/, '');
    const lbr = r.hari_libur && r.jadwal.length ? '<div class="note info lbr"><span class="ni">' + I.kal + '</span><div>Hari ini <b>' + esc(r.hari_libur.nama) + '</b>. Anda tetap terjadwal dinas — presensi seperti biasa.</div></div>' : '';
    const jad = lbr + (r.jadwal.length ? r.jadwal.map(kartuJadwal).join('') : '<div class="jadwal-row"><div class="ico" style="background:#94a3b8">L</div><div class="t"><b>' + esc(r.libur || 'Tidak ada jadwal') + '</b><span>Presensi tanpa jadwal ditandai LUAR JADWAL</span></div></div>');
    const notif = (r.notifikasi || []).map(n => '<div class="note ' + (n.status === 'DISETUJUI' ? 'ok' : 'bad') + '"><span class="ni">' + I.bell + '</span><div>Pengajuan <b>' + esc(n.jenis) + '</b> ' + esc(n.tgl) + ': <b>' + esc(n.status) + '</b>' + (n.catatan ? '<br><small style="color:var(--muted)">' + esc(n.catatan) + '</small>' : '') + '</div></div>').join('') +
      (r.menunggu ? '<div class="note info"><span class="ni">' + I.jam + '</span><div>' + r.menunggu + ' pengajuan Anda <b>menunggu persetujuan</b> admin.</div></div>' : '');
    const tk = r.tukar || { masuk: 0, daftar: [], hasil: [] };
    const notifTukar = (tk.masuk ? '<button class="note tk-note" data-go="tukar"><span class="ni">⇄</span><div><b>' + tk.masuk + ' permintaan tukar shift</b> menunggu jawaban Anda' + (tk.daftar[0] ? '<br><small>' + esc(tk.daftar[0].dengan.nama) + ' · ' + esc(tglPendek(tk.daftar[0].tanggal)) + ': ' + esc(tk.daftar[0].saya_sebelum[0].kode) + ' → ' + esc(tk.daftar[0].saya_sesudah[0].kode) + '</small>' : '') + '</div><span class="tk-go">Jawab ›</span></button>' : '') +
      (tk.hasil || []).map(x => '<div class="note ' + (x.status === 'DISETUJUI' ? 'ok' : 'bad') + '"><span class="ni">⇄</span><div>Tukar shift dengan <b>' + esc(x.dengan.nama) + '</b> ' + esc(tglPendek(x.tanggal)) + ': <b>' + esc((ST_TK[x.status] || [x.status])[0]) + '</b>' + (x.catatan ? '<br><small style="color:var(--muted)">' + esc(x.catatan) + '</small>' : '') + '</div></div>').join('');
    const ak = r.akumulasi || {};
    app.innerHTML = '<div class="view"><div class="hero"><div class="topbar"><img class="logo" src="' + esc(logo()) + '" alt="Logo"><div class="nm"><b>Presensi Dara Juanti</b><small>📍 ' + esc(namaLokasi()) + '</small></div><button class="avatar" data-go="profil" aria-label="Profil">' + esc(p.inisial) + '</button></div>' +
      '<div class="greet"><small>' + salam(t) + '</small><h1>' + esc(nama) + (contoh ? ' <span class="tag contoh">CONTOH</span>' : '') + '</h1><div class="sub">' + esc(p.jabatan) + ' · ' + esc(p.unit) + '</div></div></div>' +
      '<div class="wrap"><div class="card"><h3>' + I.kal.replace('<svg', '<svg width="16" height="16"') + ' Jadwal hari ini · ' + esc(r.tanggal) + '</h3>' + jad +
      '<div class="clock"><div><div class="jam" id="jam">' + jamTeks(t) + '<small>:' + pad(wib(t).getUTCSeconds()) + '</small></div><div class="lbl">Waktu server · WIB</div></div><div id="area">' + areaHtml() + '</div></div></div>' +
      '<div class="aksi">' +
      '<button class="btn-aksi b-masuk" data-go="scan" data-arg="MASUK"><span class="bi">' + I.masuk + '</span><div><b>MASUK</b><span>Pindai QR name tag</span></div></button>' +
      '<button class="btn-aksi b-pulang" data-go="scan" data-arg="PULANG"><span class="bi">' + I.pulang + '</span><div><b>PULANG</b><span>Setelah masuk</span></div></button>' +
      '<button class="btn-aksi b-izin" data-go="ajukan" data-arg="IZIN"><span class="bi">' + I.izin + '</span><div><b>IZIN</b><span>' + (r.bukti_lebih_hari !== undefined ? 'Dokumen bila &gt; ' + esc(r.bukti_lebih_hari) + ' hari' : 'Unggah surat') + '</span></div></button>' +
      '<button class="btn-aksi b-sakit" data-go="ajukan" data-arg="SAKIT"><span class="bi">' + I.sakit + '</span><div><b>SAKIT</b><span>' + (r.bukti_lebih_hari !== undefined ? 'Dokumen bila &gt; ' + esc(r.bukti_lebih_hari) + ' hari' : 'Unggah bukti') + '</span></div></button>' +
      '<button class="btn-aksi b-tl" data-go="ajukan" data-arg="TL"><span class="bi">' + I.tl + '</span><div class="tx"><b>TUGAS LAPANGAN (TL)</b><span>Surat tugas · boleh di luar area</span></div></button>' +
      (r.bisa_tukar ? '<button class="btn-aksi b-tukar" data-go="tukar"><span class="bi">⇄</span><div class="tx"><b>TUKAR SHIFT</b><span>Dengan rekan · disetujui rekan, tanpa admin</span></div>' + (tk.masuk ? '<em class="bdg">' + tk.masuk + '</em>' : '') + '</button>' : '') + '</div>' + notifTukar + notif +
      '<div class="card"><h3>Akumulasi ' + BULAN[wib(t).getUTCMonth()] + '</h3><div class="mini-stat"><div><small>Total terlambat</small><b>' + esc(ak.t_teks || '0 menit') + '</b><small>' + (ak.t_kali || 0) + ' kali</small></div><div><small>Total pulang awal</small><b>' + esc(ak.pa_teks || '0 menit') + '</b><small>' + (ak.pa_kali || 0) + ' kali</small></div></div></div>' +
      '</div></div>' + nav('beranda');
    S.timers.push(setInterval(() => { const el = $('#jam'); if (el) { const x = now(); el.innerHTML = jamTeks(x) + '<small>:' + pad(wib(x).getUTCSeconds()) + '</small>'; } }, 1000));
    S.timers.push(setInterval(() => { if (document.visibilityState === 'visible') api('beranda', {}).then(r => { S.beranda = r; S.offset = r.waktu_server - Date.now(); }).catch(() => { }); }, 120000));
  }
  // ---------- SCAN QR (MASUK/PULANG) ----------
  function viewScan(jenis) {
    if (jenis !== 'MASUK' && jenis !== 'PULANG') jenis = 'MASUK';
    mulaiGps();
    const jad = S.beranda && S.beranda.jadwal[0];
    app.innerHTML = '<div class="view">' + appbar('Presensi ' + jenis) + '<div class="pad">' +
      '<div class="scan-box"><video id="vid" playsinline muted></video><canvas id="cv" class="hidden"></canvas><div class="scan-frame"><i></i><i></i><i></i><i></i><div class="scan-line"></div></div><div class="scan-hint">Arahkan kamera ke QR di name tag Anda</div><div class="scan-msg hidden" id="scan-msg"></div></div>' +
      '<div class="card" style="padding:8px 16px">' + chkLokasi() +
      '<div class="chk ok"><span class="ci">✓</span><b>Perangkat</b><span>Terdaftar</span></div>' +
      '<div class="chk ' + (jad ? 'ok' : 'wait') + '"><span class="ci">' + (jad ? '✓' : 'i') + '</span><b>Jadwal</b><span>' + (jad ? esc(jad.nama + ' · ' + jad.jam) : 'Luar jadwal / diperiksa server') + '</span></div>' +
      '<div class="chk wait" id="ck-qr"><span class="ci"><span class="spin d" style="width:14px;height:14px;border-width:2px"></span></span><b>QR name tag</b><span>Memindai…</span></div></div>' +
      '<p style="font-size:12.5px;color:var(--muted);text-align:center">Pindai QR di <b>name tag milik Anda sendiri</b>. QR pegawai lain ditolak & dicatat. QR hanya berlaku dari HP ini dan di area ' + esc(namaLokasi()) + (S.info && S.info.pin_wajib === false ? '' : '; setelah terbaca, masukkan PIN') + '.</p></div></div>';
    Scanner.mulai($('#vid'), $('#cv'), teks => prosesQr(jenis, teks), msg => { const m = $('#scan-msg'); m.textContent = msg; m.classList.remove('hidden'); });
  }
  async function prosesQr(jenis, teks) {
    const ck = $('#ck-qr'); if (ck) ck.outerHTML = '<div class="chk ok" id="ck-qr"><span class="ci">✓</span><b>QR name tag</b><span>Terbaca · memeriksa…</span></div>';
    let pos;
    try { pos = await posisiSegar(); } catch (e) { return hasilGagal(jenis, e.message); }
    const base = { jenis, qr: teks, lat: pos.lat, lng: pos.lng, akurasi: pos.akurasi };
    let cek;
    try { cek = await api('presensi.cek', base, { ulang: 1 }); } catch (e) { return e.kode === 'SESI' || e.kode === 'NONAKTIF' ? null : hasilGagal(jenis, e.message); }
    let alasan = '';
    if (cek.perlu_konfirmasi) { const k = await sheetPulangAwal(cek); if (!k) return go('beranda'); alasan = k.alasan; }
    const data = Object.assign({}, base, { konfirmasi_pulang_awal: !!cek.perlu_konfirmasi, alasan, request_id: rid() });
    if (cek.swafoto_wajib) { const f = await sheetSwafoto(); if (!f) return go('beranda'); data.swafoto = { b64: f }; }
    simpanDenganPin(data, jenis);
  }
  async function simpanDenganPin(data, jenis) {
    const pakaiPin = !S.info || S.info.pin_wajib !== false;
    while (true) {
      if (pakaiPin) { const pin = await sheetPin('Masukkan PIN', 'Konfirmasi presensi ' + jenis); if (pin === null) return go('beranda'); data.pin = pin; }
      try { const r = await api('presensi.simpan', data); S.terakhir = r; S.beranda = null; return viewHasil(r); }
      catch (e) { if (e.kode === 'PIN') { toast(e.message, 'bad'); continue; } if (e.kode === 'SESI' || e.kode === 'NONAKTIF') return; return hasilGagal(jenis, e.message); }
    }
  }
  function statusInfo(r) {
    if (r.status === 'TEPAT_WAKTU') return { k: 'ok', t: 'TEPAT WAKTU', s: 'Jadwal masuk ' + (r.jadwal || '').split('–')[0].replace(':', '.') + ' · toleransi ' + r.toleransi + ' menit' };
    if (r.status === 'TERLAMBAT') return { k: 'warn', t: 'TERLAMBAT ' + menitTeks(r.menit_terlambat).toUpperCase(), s: 'Jadwal masuk ' + (r.jadwal || '').split('–')[0].replace(':', '.') + ' · toleransi ' + r.toleransi + ' menit' };
    if (r.status === 'PULANG_AWAL') return { k: 'bad', t: 'PULANG AWAL ' + menitTeks(r.menit_pulang_awal).toUpperCase(), s: 'Jadwal pulang ' + (r.jadwal || '').split('–')[1] };
    if (r.status === 'NORMAL') return { k: 'ok', t: 'PULANG NORMAL', s: 'Jadwal pulang ' + (r.jadwal || '').split('–')[1] };
    return { k: 'info', t: 'LUAR JADWAL', s: 'Tidak ada jadwal dinas — diverifikasi admin' };
  }
  function viewHasil(r) {
    const st = statusInfo(r), ak = r.akumulasi || {};
    app.innerHTML = '<div class="view"><div class="hasil ' + (st.k === 'bad' ? 'warn' : st.k === 'warn' ? 'warn' : 'ok') + '"><div class="big">' + (st.k === 'ok' || st.k === 'info' ? I.ok : I.jam) + '</div><h2>Presensi ' + esc(r.jenis) + ' tercatat</h2><div class="waktu">' + esc(String(r.waktu).replace(':', '.')) + '</div><div class="tgl">' + esc(r.tanggal) + ' · WIB (server)</div>' +
      '<div class="status-band ' + st.k + '">' + esc(st.t) + '<small>' + esc(st.s) + '</small></div></div>' +
      '<div class="pad"><div class="card dl"><div><span>Shift</span><b>' + esc(r.shift) + ' · ' + esc(r.jadwal) + '</b></div><div><span>Tanggal dinas</span><b>' + esc(r.tanggal_dinas.split('-').reverse().join('-')) + '</b></div><div><span>QR name tag / jarak</span><b>v' + esc(r.qr_versi) + ' ✓ · ' + jarakTeks(r.jarak) + '</b></div><div><span>ID transaksi</span><b>' + esc(r.id_presensi) + '</b></div></div>' +
      (ak.t_kali || ak.pa_kali ? '<div class="note info"><span class="ni">' + I.jam + '</span><div>Akumulasi ' + BULAN[wib(now()).getUTCMonth()] + ': terlambat <b>' + esc(ak.t_teks) + '</b> (' + ak.t_kali + ' kali)' + (ak.pa_kali ? ', pulang awal <b>' + esc(ak.pa_teks) + '</b>' : '') + '</div></div>' : '') +
      (st.k === 'warn' || st.k === 'bad' ? '<button class="btn sec" data-go="ajukan" data-arg="IZIN" style="margin-bottom:10px">Ajukan keterangan (izin)</button>' : '') +
      '<button class="btn pri" data-go="beranda">Selesai</button></div></div>' + nav('beranda');
  }
  function viewHasilTerakhir() { if (S.terakhir) viewHasil(S.terakhir); else go('beranda'); }
  function hasilGagal(jenis, pesan) {
    app.innerHTML = '<div class="view"><div class="hasil bad"><div class="big">' + I.x + '</div><h2>Presensi ' + esc(jenis) + ' belum berhasil</h2><p class="tgl" style="margin-top:6px">' + esc(jamTeks(now(), true)) + ' WIB (server)</p>' +
      '<div class="status-band bad" style="font-size:15px;line-height:1.4">' + esc(pesan) + '</div></div><div class="pad"><button class="btn pri" data-go="scan" data-arg="' + jenis + '" style="margin-bottom:10px">Coba lagi</button><button class="btn sec" data-go="beranda">Kembali ke beranda</button>' +
      '<p style="font-size:12.5px;color:var(--muted);text-align:center;margin-top:14px">Percobaan yang gagal tercatat. Bila ada kendala, hubungi admin untuk koreksi.</p></div></div>' + nav('beranda');
  }
  // ---------- AJUKAN IZIN/SAKIT/TL (TAHAP 3: dokumen izin/sakit hanya wajib bila > N hari, termasuk yang bersambung)
  // TAHAP 7: TL tanpa unggahan (cukup keterangan ≥ 10 karakter); pengajuan ≤ X hari (digabung yang bersambung) disetujui OTOMATIS ----------
  function viewAjukan(jenis) {
    if (['IZIN', 'SAKIT', 'TL'].indexOf(jenis) < 0) jenis = 'IZIN';
    mulaiGps();
    const t = wib(now()), hari = t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate());
    const ambang = (S.info && S.info.bukti_wajib_lebih_hari !== undefined) ? S.info.bukti_wajib_lebih_hari : 3;
    const lbl = { IZIN: 'Surat/keterangan izin', SAKIT: 'Surat keterangan sakit', TL: 'Surat tugas' }[jenis];
    const ketMin = (S.info && S.info.tl_ket_min) || 10, otoMaks = (S.info && S.info.auto_setuju_maks_hari !== undefined) ? +S.info.auto_setuju_maks_hari : 0; // server lama (tanpa info) → anggap tidak ada persetujuan otomatis
    const otoJenis = (S.info && S.info.auto_setuju_jenis) || [], otoOn = otoMaks > 0 && otoJenis.indexOf(jenis) >= 0;
    const ph = { IZIN: 'Mis. keperluan keluarga mendesak…', SAKIT: 'Mis. demam, istirahat sesuai anjuran dokter…', TL: 'Lokasi & kegiatan tugas lapangan…' }[jenis];
    const m0 = S.ajTgl && S.ajTgl.m >= hari ? S.ajTgl.m : hari, s0 = S.ajTgl && S.ajTgl.s >= m0 ? S.ajTgl.s : m0;
    app.innerHTML = '<div class="view">' + appbar('Pengajuan Ketidakhadiran') + '<form class="pad" id="f-aj">' +
      '<div class="seg">' + ['IZIN', 'SAKIT', 'TL'].map(j => '<button type="button" data-go="ajukan" data-arg="' + j + '" class="' + (j === jenis ? 'on' : '') + '">' + (j === 'TL' ? 'TL' : j.charAt(0) + j.slice(1).toLowerCase()) + '</button>').join('') + '</div>' +
      '<div class="card"><div class="row2"><label class="f"><span>Tanggal mulai</span><input class="inp" type="date" name="m" value="' + m0 + '" required></label><label class="f"><span>Tanggal selesai</span><input class="inp" type="date" name="s" value="' + s0 + '" required></label></div>' +
      '<label class="f"><span>' + (jenis === 'TL' ? 'Keterangan lokasi & kegiatan · <b style="color:var(--merah)">wajib</b>, min. ' + ketMin + ' karakter' : 'Keterangan') + '</span><textarea class="inp" name="k" maxlength="500" required' + (jenis === 'TL' ? ' minlength="' + ketMin + '"' : '') + ' placeholder="' + ph + '"></textarea>' + (jenis === 'TL' ? '<small id="k-hit" style="display:block;text-align:right;font-size:12px;color:var(--muted)">0/' + ketMin + '</small>' : '') + '</label>' +
      '<div id="bukti-info" class="bukti-info"><span class="spin d" style="width:14px;height:14px;border-width:2px"></span> Memeriksa aturan ' + (jenis === 'TL' ? 'pengajuan' : 'dokumen') + '…</div><div id="oto-info" class="bukti-info hidden"></div>' +
      '<div id="up-wrap" class="hidden"><label class="f" style="margin:0"><span>' + lbl + ' · <b style="color:var(--merah)">wajib</b></span></label><div class="upload"><div id="file-chip"></div><div class="row2"><label class="btn sec" style="min-height:46px;font-size:14px">' + I.cam + ' Kamera<input type="file" accept="image/*" capture="environment" class="hidden" id="in-cam"></label><label class="btn sec" style="min-height:46px;font-size:14px">' + I.file + ' Galeri/PDF<input type="file" accept="image/jpeg,image/png,application/pdf" class="hidden" id="in-file"></label></div><p style="font-size:12px;color:var(--muted);margin:8px 0 0">JPG/PNG/PDF, maks. ' + Math.round(((S.info && S.info.bukti_maks_kb) || 2048) / 1024) + ' MB. Foto dikompres otomatis.</p></div></div></div>' +
      '<div class="card" style="padding:8px 16px"><div id="gps-aj">' + gpsAjukan() + '</div><div class="chk ok"><span class="ci">✓</span><b>HP terdaftar</b><span>waktu server ' + jamTeks(now()) + ' WIB</span></div></div>' +
      '<button class="btn pri" id="b-aj">Kirim Pengajuan</button><p style="font-size:12.5px;color:var(--muted);text-align:center">' + (otoOn ? 'Pengajuan sampai ' + otoMaks + ' hari (termasuk yang bersambung) disetujui otomatis oleh sistem; lebih lama menunggu persetujuan admin. ' : 'Pengajuan berlaku setelah disetujui admin. ') + (jenis === 'TL' ? 'Tugas lapangan tidak perlu unggah surat — cukup keterangan lokasi & kegiatan.' : 'Izin/sakit sampai ' + ambang + ' hari tidak perlu dokumen; lebih dari ' + ambang + ' hari (termasuk yang bersambung dengan pengajuan sebelumnya/sesudahnya) wajib dokumen.') + '</p></form></div>' + nav('beranda');
    let bukti = null, wajib = false, cekNo = 0, tCek = null;
    const tampilUnggah = (w, pesan, kelas) => {
      app.querySelectorAll('.aj-bentrok').forEach(x => x.remove());
      wajib = w; $('#up-wrap').classList.toggle('hidden', !w);
      const bi = $('#bukti-info'); if (!bi) return;
      bi.className = 'bukti-info ' + (kelas || (w ? 'wajib' : 'bebas'));
      bi.innerHTML = pesan ? (w ? '📎 ' : '✓ ') + esc(pesan) : '';
    };
    const tampilOto = (r) => { const oi = $('#oto-info'); if (!oi) return; if (!r || !r.pesan_otomatis) { oi.classList.add('hidden'); return; } oi.className = 'bukti-info ' + (r.otomatis ? 'bebas' : 'wajib'); oi.innerHTML = (r.otomatis ? '⚡ ' : '⏳ ') + esc(r.pesan_otomatis); };
    if (jenis === 'TL') { const k = $('#f-aj').k, hit = $('#k-hit'); k.oninput = () => { const n = k.value.trim().length; hit.textContent = n + '/' + ketMin; hit.style.color = n >= ketMin ? 'var(--hijau)' : 'var(--muted)'; }; }
    const cekAturan = () => {
      const f = $('#f-aj'); if (!f) return;
      const m = f.m.value, s = f.s.value || m; S.ajTgl = { m, s };
      if (!m || s < m) return tampilUnggah(false, 'Periksa tanggal.', 'bebas');
      const no = ++cekNo;
      api('ajukan.cek', { jenis, tgl_mulai: m, tgl_selesai: s }).then(r => {
        if (no !== cekNo) return;
        tampilUnggah(jenis === 'TL' && r.ket_min ? false : r.wajib_bukti, r.pesan); // server lama (tanpa ket_min) masih mewajibkan surat tugas TL tampilOto(r);
        const bi = $('#bukti-info'); if (bi && r.bentrok) bi.insertAdjacentHTML('afterend', '<div class="bukti-info wajib aj-bentrok">⚠ ' + esc(r.bentrok) + ' Ubah tanggal atau batalkan pengajuan lama.</div>');
      }).catch(e => { if (no === cekNo && e.kode !== 'SESI') tampilUnggah(false, e.message, 'bebas'); });
    };
    const jadwalkanCek = () => { clearTimeout(tCek); tCek = setTimeout(cekAturan, 350); };
    $('#f-aj').m.onchange = () => { const f = $('#f-aj'); if (f.s.value < f.m.value) f.s.value = f.m.value; jadwalkanCek(); };
    $('#f-aj').s.onchange = jadwalkanCek;
    cekAturan();
    const pilih = async (f) => {
      if (!f) return;
      const maks = ((S.info && S.info.bukti_maks_kb) || 2048) * 1024;
      try {
        if (f.type === 'application/pdf') { if (f.size > maks) throw new Error('PDF melebihi batas ukuran.'); bukti = { b64: await bacaB64(f), mime: 'application/pdf', nama: f.name.replace(/\.pdf$/i, ''), size: f.size }; }
        else if (/^image\//.test(f.type)) { bukti = await kompres(f, maks); bukti.nama = (f.name || 'foto').replace(/\.\w+$/, ''); }
        else throw new Error('Jenis berkas harus JPG, PNG, atau PDF.');
        $('#file-chip').innerHTML = '<div class="file">' + (bukti.mime === 'application/pdf' ? '<div class="pdf">PDF</div>' : '<img src="' + bukti.b64 + '" alt="">') + '<div class="fi"><b>' + esc(bukti.nama) + (bukti.mime === 'application/pdf' ? '.pdf' : '.jpg') + '</b>' + Math.round(bukti.size / 1024) + ' KB' + (bukti.mime === 'image/jpeg' ? ' · dikompres otomatis' : '') + '</div></div>';
      } catch (e) { toast(e.message, 'bad'); }
    };
    $('#in-cam').onchange = e => pilih(e.target.files[0]); $('#in-file').onchange = e => pilih(e.target.files[0]);
    S.timers.push(setInterval(() => { const g = $('#gps-aj'); if (g) g.innerHTML = gpsAjukan(); }, 3000));
    $('#f-aj').onsubmit = async e => {
      e.preventDefault(); const f = e.target, b = $('#b-aj');
      if (f.s.value < f.m.value) return toast('Tanggal selesai sebelum tanggal mulai.', 'bad');
      if (jenis === 'TL' && f.k.value.trim().length < ketMin) return toast('Keterangan Tugas Lapangan minimal ' + ketMin + ' karakter (lokasi & kegiatan).', 'bad', 5000);
      if (wajib && !bukti) return toast(jenis === 'TL' ? 'Surat tugas wajib diunggah.' : 'Dokumen pendukung wajib diunggah untuk izin/sakit lebih dari ' + ambang + ' hari.', 'bad', 5000);
      let pos; try { pos = await posisiSegar(); } catch (er) { return toast(er.message, 'bad', 5000); }
      const data = { jenis, tgl_mulai: f.m.value, tgl_selesai: f.s.value, keterangan: f.k.value, lat: pos.lat, lng: pos.lng, akurasi: pos.akurasi, request_id: rid() };
      if (bukti && wajib) data.bukti = { b64: bukti.b64, mime: bukti.mime, nama: bukti.nama };
      while (true) {
        const pin = (!S.info || S.info.pin_wajib !== false) ? await sheetPin('Masukkan PIN', 'Kirim pengajuan ' + jenis) : '';
        if (pin === null) return;
        data.pin = pin; b.disabled = true; b.innerHTML = '<span class="spin"></span> Mengirim…';
        try {
          const r = await api('ajukan', data, { timeout: 60000 });
          S.beranda = null; S.ajTgl = null;
          app.innerHTML = '<div class="view"><div class="hasil ok"><div class="big">' + I.ok + '</div><h2>Pengajuan ' + esc(jenis) + (r.otomatis ? ' disetujui' : ' terkirim') + '</h2><div class="tgl" style="margin-top:6px">' + esc(f.m.value) + (f.s.value !== f.m.value ? ' s.d. ' + esc(f.s.value) : '') + ' · ' + esc(r.waktu_server) + ' WIB</div>' + (r.otomatis ? '<div class="status-band ok">DISETUJUI OTOMATIS<small>' + esc(r.alasan_otomatis || 'Disetujui otomatis oleh sistem.') + ' · ' : '<div class="status-band info">MENUNGGU PERSETUJUAN<small>') + 'Lokasi tercatat ' + jarakTeks(r.jarak) + ' dari Puskesmas' + (r.dalam_area ? '' : ' (di luar area — diizinkan)') + '</small></div></div><div class="pad"><div class="card dl"><div><span>ID pengajuan</span><b>' + esc(r.id_pengajuan) + '</b></div><div><span>Dokumen</span><b>' + (r.bukti ? esc(bukti.nama) : (jenis === 'TL' ? 'Tidak perlu (TL cukup keterangan)' : 'Tidak dilampirkan (tidak wajib)')) + '</b></div>' + (r.hari_berturut > 1 ? '<div><span>Lama (termasuk bersambung)</span><b>' + r.hari_berturut + ' hari</b></div>' : '') + '</div><button class="btn pri" data-go="beranda">Selesai</button></div></div>' + nav('beranda');
          return;
        } catch (er) {
          b.disabled = false; b.textContent = 'Kirim Pengajuan';
          if (er.kode === 'PIN') { toast(er.message, 'bad'); continue; }
          if (er.kode === 'BUKTI_WAJIB') { tampilUnggah(true, er.message.replace(/ Unggah dokumen.*$/, '')); toast('Unggah dokumen pendukung terlebih dahulu.', 'bad', 5000); $('#up-wrap').scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
          if (er.kode !== 'SESI') toast(er.message, 'bad', 6000); return;
        }
      }
    };
  }
  function gpsAjukan() {
    if (!S.gps) return '<div class="chk wait"><span class="ci">…</span><b>GPS</b><span>' + esc(S.gpsErr || 'mencari lokasi…') + '</span></div>';
    const j = jarakKe(S.gps.lat, S.gps.lng);
    return '<div class="chk ok"><span class="ci">✓</span><b>GPS tercatat</b><span>' + (j ? jarakTeks(j.jarak) + ' dari ' + esc(namaLokasi()) + ' · ' + (j.dalam ? 'dalam area' : 'di luar area (boleh)') : '') + '</span></div>';
  }
  function bacaB64(f) { return new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(f); }); }
  async function kompres(f, maks) {
    const url = URL.createObjectURL(f); const img = new Image(); img.src = url; await img.decode(); URL.revokeObjectURL(url);
    let w = img.naturalWidth, h = img.naturalHeight, sc = Math.min(1, 1600 / Math.max(w, h)), q = 0.8, out;
    const cv = document.createElement('canvas');
    for (let i = 0; i < 6; i++) {
      cv.width = Math.round(w * sc); cv.height = Math.round(h * sc); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      out = cv.toDataURL('image/jpeg', q); const size = Math.round((out.length - 23) * 0.75);
      if (size <= Math.min(maks, 900 * 1024)) return { b64: out, mime: 'image/jpeg', size };
      sc *= 0.8; q = Math.max(0.5, q - 0.08);
    }
    throw new Error('Foto terlalu besar meski sudah dikompres.');
  }
  // ---------- TUKAR SHIFT (TAHAP 3: antarpegawai, disetujui langsung oleh rekan — tanpa admin) ----------
  const ST_TK = { MENUNGGU_REKAN: ['Menunggu rekan', 'warn'], DISETUJUI: ['Disetujui · jadwal sudah ditukar', 'ok'], DITOLAK: ['Ditolak rekan', 'bad'], DIBATALKAN: ['Dibatalkan', 'mut'], KEDALUWARSA: ['Kedaluwarsa', 'mut'], GAGAL: ['Gagal validasi', 'bad'] };
  const tglPendek = d => { const x = String(d || '').split('-'); return x.length === 3 ? (+x[2]) + ' ' + BULAN[+x[1] - 1].slice(0, 3) + ' ' + x[0] : d; };
  const kodeKecil = (k, teks) => '<span class="kd" style="background:' + (WARNA[String(k || 'L').split('+')[0]] || '#334155') + '" title="' + esc(teks || '') + '">' + esc(k || 'L') + '</span>';
  const swapHtml = (seb, ses) => '<div class="tk-swap">' + seb.map((x, i) => '<div><small>' + esc(tglPendek(x.tgl)) + '</small>' + kodeKecil(x.kode, x.teks) + '<i>→</i>' + kodeKecil(ses[i] && ses[i].kode, ses[i] && ses[i].teks) + '<span>' + esc((ses[i] && ses[i].teks) || '') + '</span></div>').join('') + '</div>';
  function kartuTukar(r, mode) {
    const st = ST_TK[r.status] || [r.status, 'mut'];
    return '<div class="card tk-card"><div class="tk-head"><div><b>' + (r.peran === 'REKAN' ? esc(r.dengan.nama) + ' mengajak tukar shift' : 'Tukar dengan ' + esc(r.dengan.nama)) + '</b><small>' + esc(r.dengan.unit) + ' · ' + esc(String(r.diajukan_pada).slice(0, 16)) + ' WIB</small></div><span class="tag ' + st[1] + '">' + esc(st[0]) + '</span></div>' +
      '<div class="tk-lbl">Jadwal Anda</div>' + swapHtml(r.saya_sebelum, r.saya_sesudah) +
      (r.alasan ? '<p class="tk-al">“' + esc(r.alasan) + '”</p>' : '') + (r.catatan && r.status !== 'MENUNGGU_REKAN' ? '<p class="tk-al" style="color:var(--muted)">' + esc(r.catatan) + '</p>' : '') +
      (r.status === 'MENUNGGU_REKAN' && r.kedaluwarsa ? '<p class="tk-exp">' + I.jam.replace('<svg', '<svg width="14" height="14"') + ' Berlaku sampai ' + esc(String(r.kedaluwarsa).slice(0, 16)) + ' WIB</p>' : '') +
      (mode === 'masuk' ? '<div class="row2"><button class="btn bad" data-tk-tolak="' + esc(r.id) + '">Tolak</button><button class="btn pri" data-tk-setuju="' + esc(r.id) + '">Setuju</button></div>' : mode === 'keluar' ? '<button class="btn sec" data-tk-batal="' + esc(r.id) + '">Batalkan permintaan</button>' : '') + '</div>';
  }
  async function viewTukar() {
    app.innerHTML = '<div class="view">' + appbar('Tukar Shift') + '<div class="pad" id="isi"><div class="loading"><span class="spin d"></span></div></div></div>' + nav('jadwal');
    let d;
    try { d = await api('tukar.daftar', {}); } catch (e) { $('#isi').innerHTML = '<p>' + esc(e.message) + '</p>'; return; }
    $('#isi').innerHTML = (d.bisa_tukar ? '<button class="btn pri" data-go="tukar" data-arg="baru" style="margin-bottom:14px">⇄ Ajukan tukar shift</button>' : '<div class="note info"><span class="ni">' + I.kal + '</span><div>Tukar shift hanya untuk pegawai grup SHIFT.</div></div>') +
      '<div class="sec-title">Permintaan masuk' + (d.masuk.length ? ' · ' + d.masuk.length : '') + '</div>' + (d.masuk.length ? d.masuk.map(r => kartuTukar(r, 'masuk')).join('') : '<p class="kosong">Tidak ada permintaan yang menunggu jawaban Anda.</p>') +
      '<div class="sec-title">Permintaan saya</div>' + (d.keluar.length ? d.keluar.map(r => kartuTukar(r, 'keluar')).join('') : '<p class="kosong">Tidak ada permintaan yang sedang menunggu.</p>') +
      '<div class="sec-title">Riwayat</div>' + (d.riwayat.length ? d.riwayat.map(r => kartuTukar(r, '')).join('') : '<p class="kosong">Belum ada riwayat tukar shift.</p>') +
      '<p style="font-size:12px;color:var(--muted)">Bila rekan menyetujui, jadwal Anda berdua langsung bertukar tanpa persetujuan admin. Admin tetap dapat memantau di menu Riwayat Tukar Shift. Permintaan otomatis kedaluwarsa bila tidak dijawab.</p>';
    const cari = id => d.masuk.concat(d.keluar).filter(r => r.id === id)[0];
    app.querySelectorAll('[data-tk-setuju]').forEach(b => b.onclick = async () => {
      const r = cari(b.dataset.tkSetuju);
      while (true) {
        const pin = (!S.info || S.info.pin_wajib !== false) ? await sheetPin('Setujui tukar shift', 'Jadwal Anda: ' + r.saya_sebelum.map(x => x.kode + ' → ').join('') + r.saya_sesudah.map(x => x.kode).join(', ')) : '';
        if (pin === null) return;
        b.disabled = true;
        try { await api('tukar.respon', { id: r.id, keputusan: 'SETUJU', pin }); S.beranda = null; toast('Disetujui. Jadwal Anda dan ' + r.dengan.nama + ' sudah ditukar.', 'ok', 5000); return viewTukar(); }
        catch (e) { b.disabled = false; if (e.kode === 'PIN') { toast(e.message, 'bad'); continue; } if (e.kode !== 'SESI') { toast(e.message, 'bad', 6000); viewTukar(); } return; }
      }
    });
    app.querySelectorAll('[data-tk-tolak]').forEach(b => b.onclick = () => {
      const r = cari(b.dataset.tkTolak);
      const el = openSheet('<h3>Tolak permintaan ' + esc(r.dengan.nama) + '?</h3><label class="f"><span>Catatan untuk rekan (opsional)</span><input class="inp" id="tk-cat" maxlength="200" placeholder="Mis. sudah ada acara keluarga"></label><div class="row2"><button class="btn sec" id="tk-x">Kembali</button><button class="btn bad" id="tk-ok">Tolak</button></div>');
      $('#tk-x', el).onclick = closeSheet;
      $('#tk-ok', el).onclick = async () => { const cat = $('#tk-cat', el).value; closeSheet(); try { await api('tukar.respon', { id: r.id, keputusan: 'TOLAK', catatan: cat }); S.beranda = null; toast('Permintaan ditolak.', 'ok'); } catch (e) { if (e.kode !== 'SESI') toast(e.message, 'bad', 6000); } viewTukar(); };
    });
    app.querySelectorAll('[data-tk-batal]').forEach(b => b.onclick = async () => { b.disabled = true; try { await api('tukar.batal', { id: b.dataset.tkBatal }); toast('Permintaan dibatalkan.', 'ok'); } catch (e) { if (e.kode !== 'SESI') toast(e.message, 'bad', 6000); } viewTukar(); });
  }
  async function viewTukarBaru() {
    const t = wib(now() + 86400000), besok = t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate());
    const st = S.tkForm || (S.tkForm = { tanggal: besok, beda: false, tanggal_b: besok, rekan: '', q: '' });
    app.innerHTML = '<div class="view">' + appbar('Ajukan Tukar Shift', 'tukar') + '<form class="pad" id="f-tk">' +
      '<div class="card"><label class="f"><span>Tanggal shift Anda yang ingin ditukar</span><input class="inp" type="date" name="d" value="' + esc(st.tanggal) + '" required></label>' +
      '<label class="chkline"><input type="checkbox" name="beda"' + (st.beda ? ' checked' : '') + '> Rekan memberi shift pada <b>tanggal lain</b></label>' +
      '<label class="f' + (st.beda ? '' : ' hidden') + '" id="w-db"><span>Tanggal shift rekan</span><input class="inp" type="date" name="db" value="' + esc(st.tanggal_b) + '"></label><div id="tk-saya"></div></div>' +
      '<div class="card"><h3>Pilih rekan</h3><input class="inp" id="tk-q" placeholder="Cari nama / unit…" value="' + esc(st.q) + '" style="margin-bottom:10px"><div id="tk-rekan"><div class="loading"><span class="spin d"></span></div></div></div>' +
      '<div class="card" id="tk-prev"></div>' +
      '<div class="card"><label class="f" style="margin:0"><span>Alasan / kesepakatan</span><textarea class="inp" name="al" maxlength="200" required placeholder="Mis. sudah sepakat lewat telepon, ada keperluan keluarga…"></textarea></label></div>' +
      '<button class="btn pri" id="b-tk" disabled>Kirim permintaan ke rekan</button><p style="font-size:12.5px;color:var(--muted);text-align:center">Rekan menerima notifikasi di aplikasi dan menjawab SETUJU/TOLAK. Bila disetujui, jadwal langsung bertukar.</p></form></div>' + nav('jadwal');
    const f = $('#f-tk'); let opsi = null, no = 0, noCek = 0;
    const pilihRekan = () => opsi && opsi.rekan.filter(x => x.id === st.rekan)[0];
    const renderRekan = () => {
      if (!opsi) return;
      const kerja = k => !!k && k !== 'L' && k !== 'C', beda = st.beda && opsi.tanggal_b !== opsi.tanggal;
      if (!kerja(opsi.saya.kode_a)) { $('#tk-rekan').innerHTML = '<p class="kosong">Anda tidak memiliki shift pada tanggal ini — pilih tanggal lain.</p>'; return; }
      const cocok = x => x.kode_a !== 'C' && x.kode_b !== 'C' && (beda ? kerja(x.kode_b) : x.kode_a !== opsi.saya.kode_a);
      const q = st.q.toLowerCase(), daftar = opsi.rekan.filter(x => cocok(x) && (!q || (x.nama + ' ' + x.unit + ' ' + x.jabatan).toLowerCase().indexOf(q) >= 0));
      const kodeR = x => st.beda ? x.kode_b : x.kode_a;
      $('#tk-rekan').innerHTML = daftar.length ? '<div class="tk-list">' + daftar.slice(0, 40).map(x => '<label class="tk-opt' + (x.id === st.rekan ? ' on' : '') + '"><input type="radio" name="rk" value="' + esc(x.id) + '"' + (x.id === st.rekan ? ' checked' : '') + '><div><b>' + esc(x.nama) + '</b><small>' + esc(x.unit) + (x.sama_unit ? ' · unit sama' : '') + '</small></div>' + kodeKecil(kodeR(x) || '–', opsi.kode[kodeR(x)]) + '</label>').join('') + '</div>' : '<p class="kosong">Tidak ada rekan sesuai pencarian.</p>';
      $('#tk-rekan').querySelectorAll('input[name=rk]').forEach(r => r.onchange = () => { st.rekan = r.value; renderRekan(); renderPrev(); });
    };
    const renderPrev = () => {
      const p = $('#tk-prev'), r = pilihRekan(), b = $('#b-tk');
      if (!opsi || !r) { p.innerHTML = '<h3>Pratinjau</h3><p class="kosong" style="margin:0">Pilih rekan untuk melihat jadwal sesudah ditukar.</p>'; b.disabled = true; return; }
      const da = opsi.tanggal, db = opsi.tanggal_b, beda = st.beda && db !== da;
      const sayaSeb = [{ tgl: da, kode: opsi.saya.kode_a }].concat(beda ? [{ tgl: db, kode: opsi.saya.kode_b }] : []);
      const sayaSes = [{ tgl: da, kode: r.kode_a }].concat(beda ? [{ tgl: db, kode: r.kode_b }] : []);
      const isi = x => x.map(y => Object.assign({ teks: opsi.kode[y.kode] || (y.kode === 'L' || !y.kode ? 'Libur' : y.kode) }, y));
      p.innerHTML = '<h3>Pratinjau sesudah ditukar</h3><div class="tk-lbl">Anda</div>' + swapHtml(isi(sayaSeb), isi(sayaSes)) + '<div class="tk-lbl">' + esc(r.nama) + '</div>' + swapHtml(isi(sayaSes), isi(sayaSeb)) +
        '<p style="font-size:12px;color:var(--muted);margin:8px 0 0">Server memeriksa ulang: jadwal sudah TERBIT, belum ada presensi, tidak dua shift sehari, dan jeda istirahat minimal ' + esc(opsi.jeda_min_jam) + ' jam (mis. Malam lalu Pagi ditolak).</p>';
      b.disabled = true;
      if (!opsi.terbit) return;
      // pra-cek server untuk rekan terpilih (bentrok/jeda istirahat/presensi) sebelum meminta PIN
      const n = ++noCek; p.insertAdjacentHTML('beforeend', '<div id="tk-cek" class="bukti-info"><span class="spin d" style="width:14px;height:14px;border-width:2px"></span> Memeriksa jadwal…</div>');
      api('tukar.opsi', { tanggal: st.tanggal, tanggal_b: st.tanggal_b, cek_rekan: r.id }).then(o => {
        if (n !== noCek) return; const c = $('#tk-cek'); if (!c) return; const ok = o.cek && o.cek.ok;
        c.className = 'bukti-info ' + (ok ? 'bebas' : 'wajib'); c.textContent = ok ? '✓ Jadwal aman untuk ditukar.' : '⚠ ' + ((o.cek && o.cek.pesan) || 'Tidak dapat ditukar.');
        b.disabled = !ok;
      }).catch(e => { if (n === noCek && e.kode !== 'SESI') { const c = $('#tk-cek'); if (c) { c.className = 'bukti-info wajib'; c.textContent = e.message; } } });
    };
    const muat = () => {
      st.tanggal = f.d.value; st.beda = f.beda.checked; st.tanggal_b = st.beda ? (f.db.value || st.tanggal) : st.tanggal;
      $('#w-db').classList.toggle('hidden', !st.beda);
      const n = ++no; $('#tk-rekan').classList.add('memuat');
      api('tukar.opsi', { tanggal: st.tanggal, tanggal_b: st.tanggal_b }).then(o => {
        if (n !== no) return; opsi = o; $('#tk-rekan').classList.remove('memuat');
        $('#tk-saya').innerHTML = '<div class="note ' + (o.terbit ? 'info' : 'bad') + '" style="box-shadow:none;background:#f6f8fa;margin:10px 0 0"><span class="ni">' + I.kal + '</span><div>' + (o.terbit ? 'Shift Anda ' + esc(tglPendek(o.tanggal)) + ': <b>' + esc(o.kode[o.saya.kode_a] || o.saya.kode_a || 'Libur') + '</b>' + (st.beda ? ' · ' + esc(tglPendek(o.tanggal_b)) + ': <b>' + esc(o.kode[o.saya.kode_b] || o.saya.kode_b || 'Libur') + '</b>' : '') : 'Jadwal bulan tersebut belum TERBIT — tukar shift belum bisa diajukan.') + '</div></div>';
        renderRekan(); renderPrev();
      }).catch(e => { if (n === no && e.kode !== 'SESI') { $('#tk-rekan').classList.remove('memuat'); $('#tk-rekan').innerHTML = '<p class="kosong">' + esc(e.message) + '</p>'; } });
    };
    f.d.onchange = muat; f.beda.onchange = muat; f.db.onchange = muat;
    let tq = null; $('#tk-q').oninput = e => { clearTimeout(tq); tq = setTimeout(() => { st.q = e.target.value; renderRekan(); }, 250); };
    muat();
    f.onsubmit = async e => {
      e.preventDefault(); const b = $('#b-tk'), r = pilihRekan(); if (!r) return toast('Pilih rekan.', 'bad');
      if (f.al.value.trim().length < 5) return toast('Isi alasan/kesepakatan (min. 5 karakter).', 'bad');
      const data = { tanggal: st.tanggal, tanggal_b: st.beda ? st.tanggal_b : '', rekan: r.id, alasan: f.al.value.trim(), request_id: rid() };
      while (true) {
        const pin = (!S.info || S.info.pin_wajib !== false) ? await sheetPin('Masukkan PIN', 'Ajukan tukar shift dengan ' + r.nama) : '';
        if (pin === null) return;
        data.pin = pin; b.disabled = true; b.innerHTML = '<span class="spin"></span> Mengirim…';
        try {
          const x = await api('tukar.ajukan', data);
          S.tkForm = null; S.beranda = null;
          app.innerHTML = '<div class="view"><div class="hasil ok"><div class="big">' + I.ok + '</div><h2>Permintaan terkirim</h2><div class="tgl" style="margin-top:6px">ke ' + esc(x.rekan) + '</div><div class="status-band info">MENUNGGU JAWABAN REKAN<small>Berlaku sampai ' + esc(String(x.kedaluwarsa).slice(0, 16)) + ' WIB</small></div></div><div class="pad"><div class="card dl"><div><span>ID</span><b>' + esc(x.id) + '</b></div><div><span>Tanggal</span><b>' + esc(tglPendek(data.tanggal)) + (data.tanggal_b ? ' & ' + esc(tglPendek(data.tanggal_b)) : '') + '</b></div></div><button class="btn pri" data-go="tukar">Lihat permintaan</button></div></div>' + nav('jadwal');
          return;
        } catch (er) { b.disabled = false; b.textContent = 'Kirim permintaan ke rekan'; if (er.kode === 'PIN') { toast(er.message, 'bad'); continue; } if (er.kode !== 'SESI') toast(er.message, 'bad', 7000); return; }
      }
    };
  }
  // ---------- JADWAL ----------
  async function viewJadwal(bulanArg) {
    const t = wib(now()), bulan = bulanArg || S.blnJadwal || (t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1));
    S.blnJadwal = bulan;
    app.innerHTML = '<div class="view">' + appbarBulan('Jadwal Saya', bulan, 'jadwal') + '<div class="pad" id="isi"><div class="loading"><span class="spin d"></span></div></div></div>' + nav('jadwal');
    pasangBulan(viewJadwal);
    try {
      const r = await api('jadwal', { bulan });
      const hariIni = t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate());
      $('#isi').innerHTML = (r.terbit ? '' : '<div class="note info"><span class="ni">' + I.kal + '</span><div>Jadwal shift bulan ini <b>belum dipublikasikan</b> admin.</div></div>') +
        (S.beranda && S.beranda.bisa_tukar === false ? '' : '<button class="btn sec" data-go="tukar" style="margin-bottom:12px">⇄ Tukar shift dengan rekan</button>') +
        r.hari.map(h => '<div class="list-item ' + (h.tanggal === hariIni ? 'today' : '') + (h.libur ? ' libur' : '') + '"><div class="d"><b>' + (+h.tanggal.slice(8)) + '</b><small>' + esc(h.hari.slice(0, 3)) + '</small></div><div class="m">' +
          (h.libur && h.shift.length ? '<span class="lbr-mark">🎌 ' + esc(h.libur) + ' — tetap dinas sesuai jadwal</span>' : '') +
          (h.shift.length ? h.shift.map(s => '<b>' + esc(s.nama) + '</b><span>' + esc(s.jam) + '</span>').join('<br>') : '<b style="color:var(--muted)">' + esc(h.raw === 'C' ? 'Cuti' : h.ket || (h.raw === 'L' || h.raw === 'LN' ? 'Libur' : '—')) + '</b>') + (h.tukar ? '<span class="tk-mark">⇄ tukar dengan ' + esc(h.tukar.dengan) + ' (' + esc(h.tukar.sebelum) + ' → ' + esc(h.tukar.sesudah) + ')</span>' : '') + '</div>' +
          (h.shift.length ? h.shift.map(s => '<span class="kode" style="background:' + (WARNA[s.kode] || '#0b5d3b') + '">' + esc(s.kode) + '</span>').join('') : '<span class="kode" style="background:' + (h.raw === 'C' ? WARNA.C : '#cbd5e1') + '">' + esc(h.raw === 'C' ? 'C' : 'L') + '</span>') + '</div>').join('');
      const el = document.querySelector('.list-item.today'); if (el) el.scrollIntoView({ block: 'center' });
    } catch (e) { $('#isi').innerHTML = '<p>' + esc(e.message) + '</p>'; }
  }
  function appbarBulan(judul, bulan, k) { const [y, m] = bulan.split('-').map(Number); return '<div class="appbar"><h2 style="padding-left:6px">' + judul + '</h2><button class="icon-btn" id="b-prev" aria-label="Bulan sebelumnya">' + I.back + '</button><b style="min-width:112px;text-align:center;font-size:14px">' + BULAN[m - 1] + ' ' + y + '</b><button class="icon-btn" id="b-next" aria-label="Bulan berikutnya" style="transform:rotate(180deg)">' + I.back + '</button></div>'; }
  function pasangBulan(fn) {
    const geser = n => { const b = (fn === viewJadwal ? S.blnJadwal : S.blnRiwayat).split('-').map(Number); const d = new Date(Date.UTC(b[0], b[1] - 1 + n, 1)); fn(d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1)); };
    $('#b-prev').onclick = () => geser(-1); $('#b-next').onclick = () => geser(1);
  }
  // ---------- MONITORING KEPALA PUSKESMAS (TAHAP 8 · hanya baca; server memeriksa akses_viewer di setiap panggilan) ----------
  const GELAR_CARI = ['dr', 'drg', 'drs', 'dra', 'ns', 'apt', 'bdn', 'hj', 'h', 'ir', 'prof', 'skm', 'skep', 'sked', 'ssttkeb', 'sst', 'sstr', 'strkeb', 'strkes', 'sgz', 'sfarm', 'skeb', 'stp', 'se', 'sh', 'ssos', 'spd', 'sap', 'skom', 'sip', 'mm', 'mkes', 'mkm', 'amd', 'amdkeb', 'amdkep', 'amdgz', 'amdak', 'amdfarm', 'amdkg', 'amdkl', 'amdrmik', 'amdtlm', 'amdrad', 'spog', 'spa', 'sppd', 'mph', 'msi'];
  function normCari(s) {
    s = String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const i = s.indexOf(','); if (i > 0) s = s.slice(0, i);
    return s.split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, '')).filter((w, k, a) => w && !(GELAR_CARI.indexOf(w) >= 0 && a.length > 1)).join('');
  }
  function cocokCari(x, q) {
    const nq = String(q || '').toLowerCase().replace(/[^a-z0-9]/g, ''); if (!nq) return true;
    const nn = normCari(q);
    if (nn && normCari(x.nama).indexOf(nn) >= 0) return true;
    if ((String(x.nama || '') + ' ' + (x.unit || '')).toLowerCase().replace(/[^a-z0-9]/g, '').indexOf(nq) >= 0) return true;
    return /^\d+$/.test(nq) && String(x.nip || '').replace(/\D/g, '').indexOf(nq) >= 0;
  }
  function tglHariIni() { const d = wib(now()); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
  function matikanPantau(pesan) { S.pantau = false; LS.del('dj_pantau'); if (pesan) toast(pesan, 'bad', 4500); go('beranda'); }
  const PT_TAB = [['belum', 'Belum masuk'], ['kb', 'Keberadaan'], ['telat', 'Terlambat'], ['isl', 'Izin/Sakit/TL'], ['cuti', 'Cuti'], ['akt', 'Aktivitas'], ['lok', 'Peringatan Lokasi']];
  async function viewPantau(tglArg) {
    if (!S.pantau) return go('beranda');
    const P = S.pt = S.pt || { tab: 'belum', q: '', lokasi: '', unit: '', ids: {}, idsQ: '' };
    const hariIni = tglHariIni();
    P.tgl = /^\d{4}-\d{2}-\d{2}$/.test(tglArg || '') && tglArg <= hariIni ? tglArg : (P.tgl && P.tgl <= hariIni ? P.tgl : hariIni);
    app.innerHTML = '<div class="view pantau">' + '<div class="appbar"><h2 style="padding-left:6px;flex:1">Monitoring</h2><span class="tag info" title="Hanya melihat — tidak dapat mengubah data">HANYA BACA</span></div>' +
      '<div class="pad"><div class="pt-flt"><label><span>Tanggal</span><input type="date" class="inp" id="pt-tgl" max="' + hariIni + '" value="' + P.tgl + '"></label><label><span>Lokasi</span><select class="inp" id="pt-lok"><option value="">Semua lokasi</option></select></label><label><span>Unit</span><select class="inp" id="pt-unit"><option value="">Semua unit</option></select></label></div>' +
      '<div id="pt-tarik" class="pt-tarik">↓ Tarik untuk memuat ulang</div><div id="pt-isi"><div class="loading"><span class="spin d"></span>Memuat monitoring…</div></div></div></div>' + nav('pantau');
    $('#pt-tgl').onchange = e => { P.tgl = e.target.value || hariIni; muatPantau(true); };
    $('#pt-lok').onchange = e => { P.lokasi = e.target.value; P.unit = ''; muatPantau(true); };
    $('#pt-unit').onchange = e => { P.unit = e.target.value; renderPantau(); };
    pasangTarik(() => muatPantau(true));
    await muatPantau(false);
    S.timers.push(setInterval(() => { if (document.visibilityState === 'visible' && location.hash.indexOf('pantau') >= 0 && P.tgl === tglHariIni()) muatPantau(false, true); }, Math.max(30, (P.m && P.m.refresh) || 60) * 1000));
  }
  async function muatPantau(segar, diam) {
    const P = S.pt, seq = P.seq = (P.seq || 0) + 1;
    if (!diam && P.m) $('#pt-isi').classList.add('memuat');
    try {
      const mulaiPL = P.plRentang === 7 ? geserTgl(P.tgl, -6) : P.tgl;
      const [m, pl, kb] = await Promise.all([api('pantau', { tanggal: P.tgl, lokasi: P.lokasi, segar: !!segar }), api('pantau.lokasi', { mulai: mulaiPL, selesai: P.tgl }).catch(() => null), P.tgl === tglHariIni() ? api('pantau.keberadaan', {}).catch(() => null) : Promise.resolve(null)]); // TAHAP 10
      if (seq !== P.seq || location.hash.indexOf('pantau') < 0) return;
      P.m = m; P.pl = pl; P.kb = kb; renderPantau();
    } catch (e) {
      if (e.kode === 'AKSI' || e.kode === 'AKSES') return matikanPantau(e.kode === 'AKSI' ? 'Server belum mendukung Monitoring di aplikasi ini.' : e.message);
      if (location.hash.indexOf('pantau') < 0) return;
      const el = $('#pt-isi'); if (el) { el.classList.remove('memuat'); if (!P.m || !diam) el.innerHTML = '<div class="note bad"><span class="ni">!</span><div>' + esc(e.message) + '</div></div>' + (P.m ? '' : '<button class="btn sec" id="pt-ulang">Coba lagi</button>'); const u = $('#pt-ulang'); if (u) u.onclick = () => muatPantau(true); }
    }
  }
  function renderPantau() {
    const P = S.pt, m = P.m, k = m.kpi, el = $('#pt-isi'); if (!el) return;
    const fk = document.activeElement && document.activeElement.id === 'pt-q' ? document.activeElement.selectionStart : null;
    const lok = $('#pt-lok'), un = $('#pt-unit');
    if (lok) { lok.innerHTML = '<option value="">Semua lokasi</option>' + (m.lokasi || []).map(l => '<option value="' + esc(l.kode) + '"' + (P.lokasi === l.kode ? ' selected' : '') + '>' + esc(l.nama) + '</option>').join(''); lok.parentNode.style.display = (m.lokasi || []).length > 1 ? '' : 'none'; }
    const units = Array.from(new Set([].concat(m.belum, m.terlambat_list || [], m.isl_list || [], m.cuti_list || [], (m.unit || []).map(u => ({ unit: u.unit }))).map(x => x.unit).filter(x => x && x !== '-'))).sort();
    if (un) un.innerHTML = '<option value="">Semua unit</option>' + units.map(u => '<option' + (P.unit === u ? ' selected' : '') + '>' + esc(u) + '</option>').join('');
    const fU = x => !P.unit || x.unit === P.unit;
    const L = { belum: m.belum.filter(fU), telat: (m.terlambat_list || []).filter(fU), isl: (m.isl_list || []).filter(fU), cuti: (m.cuti_list || []).filter(fU), akt: (m.aktivitas || []).filter(fU), lok: P.pl ? P.pl.presensi.concat(P.pl.ditolak).filter(fU) : [], kb: P.kb ? P.kb.rows.filter(fU) : [] };
    if ((!P.pl && P.tab === 'lok') || (!P.kb && P.tab === 'kb')) P.tab = 'belum';
    const kp = (j, n, sub, c, tab) => '<button class="pt-kpi" data-tab="' + tab + '" style="--c:' + c + '"><small>' + j + '</small><b>' + n + '</b><span>' + sub + '</span></button>';
    const masuk = k.hadir + k.terlambat;
    el.classList.remove('memuat');
    el.innerHTML = (m.libur ? '<div class="note info"><span class="ni">' + I.kal + '</span><div>' + esc(m.tanggal_teks) + ': <b>' + esc(m.libur.nama || 'Hari libur') + '</b></div></div>' : '') +
      '<p class="pt-sub">' + esc(m.tanggal_teks) + (m.lokasi_nama ? ' · ' + esc(m.lokasi_nama) : '') + ' · diperbarui ' + esc(m.diperbarui) + ' WIB' + (P.tgl === tglHariIni() ? ' · otomatis tiap ' + m.refresh + ' dtk' : '') + '</p>' +
      '<div class="pt-kpis">' + kp('Terjadwal', k.terjadwal, 'pegawai berdinas', '#1d4e89', 'belum') + kp('Sudah masuk', masuk, k.terjadwal ? Math.round(masuk / k.terjadwal * 100) + '% · tepat ' + k.hadir : '—', '#12873f', 'akt') +
      kp('Terlambat', k.terlambat, 'Σ ' + esc(m.kpi_teks || '0 menit'), '#c98a00', 'telat') + kp('Belum masuk', m.belum_total !== undefined ? m.belum_total : m.belum.length, 'belum ' + k.belum + ' · TK ' + k.TK, '#d64545', 'belum') +
      kp('Izin · Sakit · TL', k.I + k.S + k.TL, 'I ' + k.I + ' · S ' + k.S + ' · TL ' + k.TL, '#0e7c86', 'isl') + kp('Cuti', k.C || 0, 'sesuai jadwal', '#7c3aed', 'cuti') + '</div>' +
      (L.lok.length ? '<button class="pl-alert" data-tab="lok"><span class="ni">!</span><div><b>' + L.lok.length + ' peringatan lokasi</b><span>Presensi di luar area lokasi kerja · ketuk untuk melihat daftar</span></div></button>' : '') +
      '<div class="pt-tabs" role="tablist">' + PT_TAB.filter(t => (t[0] !== 'lok' || P.pl) && (t[0] !== 'kb' || P.kb)).map(t => '<button data-tab="' + t[0] + '" class="' + (P.tab === t[0] ? 'on' : '') + (t[0] === 'lok' ? ' pl-tab' : '') + '">' + t[1] + ' <i' + ((t[0] === 'lok' && L.lok.length) || (t[0] === 'kb' && P.kb && P.kb.badge) ? ' class="merah"' : '') + '>' + (t[0] === 'kb' && P.kb ? P.kb.badge : L[t[0]].length) + '</i></button>').join('') + '</div>' +
      '<div class="pt-cari"><input class="inp" id="pt-q" placeholder="Cari nama, NIP/NIK, unit…" value="' + esc(P.q) + '" autocomplete="off" inputmode="search"><button type="button" id="pt-x" aria-label="Hapus pencarian" style="visibility:' + (P.q ? 'visible' : 'hidden') + '">×</button></div>' +
      (P.tab === 'lok' && P.pl ? '<div class="pl-rentang"><button data-plr="1" class="' + (P.plRentang !== 7 ? 'on' : '') + '">Tanggal ini</button><button data-plr="7" class="' + (P.plRentang === 7 ? 'on' : '') + '">7 hari s.d. tanggal ini</button>' + (P.pl.jumlah ? '<button id="pl-xls" class="pl-xls">Unduh Excel</button>' : '') + '</div>' : '') +
      (P.tab === 'kb' && P.kb ? kbKepalaAtas(P) : '') +
      '<div class="pt-hit" id="pt-hit"></div><div id="pt-list"></div>' +
      '<div class="sec-title">Unduh</div><button class="btn sec" id="pt-rekap">Rekap bulanan ' + esc(BULAN[+m.bulan.slice(5) - 1] + ' ' + m.bulan.slice(0, 4)) + ' (PDF)</button>' +
      '<p style="font-size:12px;color:var(--muted);margin:12px 0 4px">Mode pantau: hanya melihat, NIP/NIK disamarkan. Koreksi & persetujuan tetap dilakukan admin di panel admin.</p>';
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { P.tab = b.dataset.tab; renderPantau(); });
    const q = $('#pt-q');
    q.oninput = () => { P.q = q.value.trim(); cariNipPantau(); isiDaftarPantau(L); $('#pt-x').style.visibility = P.q ? 'visible' : 'hidden'; };
    $('#pt-x').onclick = () => { q.value = ''; P.q = ''; isiDaftarPantau(L); $('#pt-x').style.visibility = 'hidden'; q.focus(); };
    $('#pt-rekap').onclick = unduhRekapPantau;
    el.querySelectorAll('[data-plr]').forEach(b => b.onclick = () => { P.plRentang = +b.dataset.plr; muatPantau(false); });
    if ($('#pl-xls')) $('#pl-xls').onclick = unduhLokasiPantau;
    if ($('#kb-cek')) $('#kb-cek').onclick = kbBuatCek;
    if ($('#kb-hasil')) $('#kb-hasil').onclick = () => kbHasil(P.kb.terakhir_cek.id_cek);
    if ($('#kb-riw')) $('#kb-riw').onclick = kbRiwayat;
    isiDaftarPantau(L);
    if (fk !== null) { q.focus(); try { q.setSelectionRange(fk, fk); } catch (e) { } }
  }
  function cariNipPantau() {
    const P = S.pt, nq = P.q.replace(/\D/g, '');
    if (nq.length < 4 || P.idsQ === nq) return;
    clearTimeout(P.tq); P.tq = setTimeout(async () => { try { const r = await api('pantau.cari', { q: nq }); P.ids = {}; r.ids.forEach(x => P.ids[x] = 1); P.idsQ = nq; if (location.hash.indexOf('pantau') >= 0) renderPantau(); } catch (e) { } }, 350);
  }
  function isiDaftarPantau(L) {
    const P = S.pt, m = P.m, el = $('#pt-list'); if (!el) return;
    const nq = P.q.replace(/\D/g, '');
    const cocok = x => cocokCari(x, P.q) || (nq.length >= 4 && P.idsQ === nq && !!P.ids[x.id]);
    const semua = L[P.tab], rows = semua.filter(cocok);
    $('#pt-hit').innerHTML = P.q ? '<b>' + rows.length + '</b> dari ' + semua.length : semua.length + ' ' + (P.tab === 'akt' || P.tab === 'lok' ? 'kejadian' : P.tab === 'kb' ? 'pegawai sedang bertugas' : 'pegawai') + (P.tab === 'lok' && P.pl ? ' · ' + esc(tglPendek(P.pl.mulai)) + (P.pl.selesai !== P.pl.mulai ? '–' + esc(tglPendek(P.pl.selesai)) : '') : '');
    const sub = x => esc(x.unit || '') + (x.nip ? ' · ' + esc(x.nip) : '') + ((m.lokasi || []).length > 1 && x.lokasi ? ' · 📍 ' + esc(x.lokasi) : '');
    const baris = {
      belum: x => '<div class="list-item"><div class="m"><b>' + esc(x.nama) + '</b><span>' + sub(x) + '<br>' + esc(x.shift) + ' · batas ' + esc(x.jendela) + '</span></div><span class="tag ' + (x.status === 'BELUM HADIR' ? 'mut' : 'bad') + '">' + (x.status === 'BELUM HADIR' ? 'BELUM' : 'TK') + '</span></div>',
      telat: x => '<div class="list-item"><div class="m"><b>' + esc(x.nama) + '</b><span>' + sub(x) + '<br>' + esc(x.shift) + ' · masuk ' + esc(String(x.masuk || '').replace(':', '.')) + '</span></div><span class="tag warn">' + x.menit + ' mnt</span></div>',
      isl: x => '<div class="list-item"><div class="m"><b>' + esc(x.nama) + '</b><span>' + sub(x) + (x.rentang ? '<br>' + esc(x.rentang) : '') + '</span></div><span class="tag info">' + esc(x.jenis) + '</span></div>',
      cuti: x => '<div class="list-item"><div class="m"><b>' + esc(x.nama) + '</b><span>' + sub(x) + '</span></div><span class="tag ung">CUTI</span></div>',
      kb: x => '<div class="list-item pl-item' + (x.dalam === false ? ' kb-luar' : '') + '"><div class="m"><b>' + esc(x.nama) + '</b><span>' + esc(x.unit || '') + (x.nip ? ' · ' + esc(x.nip) : '') + '</span>' +
        '<span class="pl-baris">Masuk ' + esc(String(x.masuk).replace(':', '.')) + ' · terakhir terlihat <b>' + esc(String(x.terakhir).replace(':', '.')) + '</b> (' + kbLalu(x.menit_lalu) + ')' + (x.jarak !== '' ? ' · ' + Number(x.jarak).toLocaleString('id-ID') + ' m dari ' + esc(x.lokasi) : '') + '</span>' +
        '<span class="pl-baris">' + ({ PASIF: 'Lokasi otomatis', CEK: 'Jawaban cek keberadaan', MASUK: 'Saat presensi masuk' })[x.sumber] + (x.akurasi ? ' · GPS ±' + esc(x.akurasi) + ' m' : '') + (x.tl === 'TL_RESMI' ? ' · <b class="pl-tl">Tugas Lapangan disetujui</b>' : x.tl === 'TL_MENUNGGU' ? ' · <b class="pl-tl">Tugas Lapangan menunggu</b>' : '') + '</span>' +
        (x.peta ? '<a class="pl-peta" href="' + esc(x.peta) + '" target="_blank" rel="noopener">Lihat peta ›</a>' : '') + '</div><span class="tag ' + (x.dalam === false ? 'bad' : x.dalam ? 'ok' : 'mut') + '">' + (x.dalam === false ? 'DI LUAR' : x.dalam ? 'DI LOKASI' : '—') + '</span></div>',
      lok: x => '<div class="list-item pl-item"><div class="m"><b>' + esc(x.nama) + '</b><span>' + esc(x.unit || '') + (x.nip ? ' · ' + esc(x.nip) : '') + '</span>' +
        '<span class="pl-baris">' + (x.jenis === 'MASUK' ? 'Masuk' : 'Pulang') + ' · ' + esc(tglPendek(x.tanggal)) + ' ' + esc(String(x.jam).replace(':', '.')) + ' · <b>' + Number(x.jarak).toLocaleString('id-ID') + ' m</b> dari ' + esc(x.lokasi) + ' (batas ' + esc(x.radius) + ' m) · GPS ±' + esc(x.akurasi) + ' m</span>' +
        '<span class="pl-baris">' + (x.sumber === 'PRESENSI' ? 'Presensi tercatat' : 'Presensi ditolak ' + x.percobaan + '×' + (x.berhasil_jam ? (x.berhasil_koreksi ? ' · dikoreksi admin ' : ' · berhasil di lokasi ') + esc(String(x.berhasil_jam).replace(':', '.')) : '')) + (x.tl === 'TL_RESMI' ? ' · <b class="pl-tl">Tugas Lapangan disetujui</b>' : x.tl === 'TL_MENUNGGU' ? ' · <b class="pl-tl">Tugas Lapangan menunggu</b>' : '') + '</span>' +
        ((x.keterangan || x.tl_ket) ? '<span class="pl-ket">' + esc(x.keterangan || x.tl_ket) + '</span>' : '') +
        (x.peta ? '<a class="pl-peta" href="' + esc(x.peta) + '" target="_blank" rel="noopener">Lihat peta ›</a>' : '') + '</div><span class="tag ' + (x.kelas === 'LUAR' ? 'bad' : 'warn') + '">' + (x.kelas === 'LUAR' ? 'DI LUAR' : 'MERAGUKAN') + '</span></div>',
      akt: x => '<div class="list-item"><div class="d"><b style="font-size:15px">' + esc(String(x.waktu).replace(':', '.')) + '</b></div><div class="m"><b>' + esc(x.nama) + '</b><span>' + esc(x.unit || '') + ' · ' + esc(x.jenis) + (x.shift ? ' · ' + esc(x.shift) : '') + '</span></div><span class="tag ' + (!x.ok ? 'bad' : /TERLAMBAT|PULANG_AWAL/.test(x.status) ? 'warn' : 'ok') + '">' + esc(!x.ok ? 'DITOLAK' : String(x.status).replace(/_/g, ' ')) + (x.lama ? ' ' + x.lama + 'm' : '') + '</span></div>'
    };
    const kosong = { belum: 'Semua yang terjadwal sudah presensi masuk.', telat: 'Tidak ada yang terlambat.', isl: 'Tidak ada izin/sakit/TL.', cuti: 'Tidak ada yang cuti.', akt: 'Belum ada presensi.', kb: 'Belum ada pegawai yang sedang bertugas (sudah masuk dan belum pulang).', lok: 'Tidak ada presensi di luar lokasi. Semua presensi berada di area lokasi kerja.' };
    el.innerHTML = rows.length ? rows.map(baris[P.tab]).join('') : '<p class="pt-kosong">' + (P.q && semua.length ? 'Tidak ada nama yang cocok dengan “' + esc(P.q) + '”.' : kosong[P.tab]) + '</p>';
  }
  function geserTgl(d, n) { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
  // ---------- TAHAP 10: Cek Keberadaan (Kepala Puskesmas) ----------
  function kbLalu(m) { m = +m || 0; return m < 1 ? 'baru saja' : m < 60 ? m + ' menit lalu' : Math.floor(m / 60) + ' jam ' + (m % 60) + ' menit lalu'; }
  function kbKepalaAtas(P) {
    const k = P.kb, c = k.terakhir_cek;
    return '<div class="kb-panel"><button class="btn pri" id="kb-cek">Cek keberadaan sekarang' + (P.unit ? ' · ' + esc(P.unit) : '') + '</button>' +
      '<p class="kb-sub">' + k.bertugas + ' pegawai sedang bertugas' + (k.di_luar ? ' · <b class="merah">' + k.di_luar + ' terakhir terlihat di luar lokasi</b>' : '') + ' · batas jawab ' + k.batas_menit + ' menit</p>' +
      (c ? '<div class="kb-cek"><div><b>Cek terakhir ' + esc(c.jam.replace(':', '.')) + '</b><span>' + (c.selesai ? 'selesai' : 'menunggu jawaban s.d. ' + esc(c.batas.replace(':', '.'))) + ' · ' + c.jumlah + ' pegawai</span></div>' +
        '<div class="kb-angka"><i class="r">' + c.di_luar + '<small>di luar</small></i><i class="o">' + c.tidak + '<small>' + (c.selesai ? 'tidak merespons' : 'belum jawab') + '</small></i><i class="g">' + c.di_lokasi + '<small>di lokasi</small></i></div>' +
        '<div class="kb-aksi"><button class="btn sec" id="kb-hasil">Lihat hasil</button><button class="btn sec" id="kb-riw">Riwayat hari ini</button></div></div>' : '') +
      '<div class="sec-title" style="margin-top:14px">Lokasi terakhir diketahui</div></div>';
  }
  async function kbBuatCek() {
    const P = S.pt, b = $('#kb-cek'); b.disabled = true;
    try {
      const pr = await api('pantau.cekBuat', { unit: P.unit, pratinjau: true });
      b.disabled = false;
      const el = openSheet('<h3>Cek keberadaan sekarang</h3><p>Permintaan konfirmasi lokasi dikirim ke <b>' + pr.jumlah + ' pegawai</b> yang sedang bertugas' + (P.unit ? ' di unit <b>' + esc(P.unit) + '</b>' : '') + '. Pegawai menjawab dari aplikasi di HP masing-masing.</p><button class="btn pri" id="kb-ya">Kirim permintaan</button><button class="btn sec" id="kb-no" style="margin-top:8px">Batal</button>');
      $('#kb-no', el).onclick = closeSheet;
      $('#kb-ya', el).onclick = async () => { const y = $('#kb-ya', el); y.disabled = true; try { const r = await api('pantau.cekBuat', { unit: P.unit }); closeSheet(); toast('Permintaan dikirim ke ' + r.jumlah + ' pegawai. Batas jawab pukul ' + r.batas + '.', 'ok', 4500); muatPantau(true); } catch (e) { y.disabled = false; toast(e.message, 'bad', 5000); } };
    } catch (e) { b.disabled = false; if (e.kode === 'AKSI' || e.kode === 'AKSES') return matikanPantau(e.message); toast(e.message, 'bad', 5000); }
  }
  function kbBaris(x, jenis) {
    const tl0 = x.tl === 'TL_RESMI' ? ' · <b class="pl-tl">Tugas Lapangan disetujui</b>' : x.tl === 'TL_MENUNGGU' ? ' · <b class="pl-tl">Tugas Lapangan menunggu</b>' : '';
    const tl = tl0 + (x.notif_aktif === false ? '<br><b class="kb-notif">🔕 Notifikasi belum aktif</b>' : '') + (x.uji ? '<br><b class="kb-notif">Akun uji</b>' : '');
    if (jenis === 'tidak') return '<div class="list-item pl-item"><div class="m"><b>' + esc(x.nama) + '</b><span>' + esc(x.unit) + (x.nip ? ' · ' + esc(x.nip) : '') + tl + '</span></div><span class="tag warn">' + (x.status === 'MENUNGGU' ? 'MENUNGGU' : 'TIDAK MERESPONS') + '</span></div>';
    return '<div class="list-item pl-item"><div class="m"><b>' + esc(x.nama) + '</b><span>' + esc(x.unit) + (x.nip ? ' · ' + esc(x.nip) : '') + '</span><span class="pl-baris">Jawab ' + esc(String(x.jam).replace(':', '.')) + ' · <b>' + Number(x.jarak).toLocaleString('id-ID') + ' m</b> dari ' + esc(x.lokasi) + ' · GPS ±' + esc(x.akurasi) + ' m' + tl + '</span>' + (x.peta ? '<a class="pl-peta" href="' + esc(x.peta) + '" target="_blank" rel="noopener">Lihat peta ›</a>' : '') + '</div><span class="tag ' + (jenis === 'luar' ? 'bad' : 'ok') + '">' + (jenis === 'luar' ? 'DI LUAR' : 'DI LOKASI') + '</span></div>';
  }
  async function kbHasil(id) {
    const el = openSheet('<div class="loading"><span class="spin d"></span>Memuat hasil…</div>');
    try {
      const r = await api('pantau.cekDetail', { id_cek: id });
      el.querySelector('.sheet').innerHTML = '<div class="grab"></div><h3>Hasil cek ' + esc(r.jam.replace(':', '.')) + '</h3><p class="kb-sub">' + esc(r.oleh) + ' · ' + r.jumlah + ' pegawai · ' + (r.selesai ? 'batas ' + esc(r.batas.replace(':', '.')) + ' sudah lewat' : 'menunggu jawaban s.d. ' + esc(r.batas.replace(':', '.'))) + '</p>' +
        '<div class="kb-grp r">Di luar lokasi <i>' + r.di_luar.length + '</i></div>' + (r.di_luar.length ? r.di_luar.map(x => kbBaris(x, 'luar')).join('') : '<p class="pt-kosong">Tidak ada.</p>') +
        '<div class="kb-grp o">' + (r.selesai ? 'Tidak merespons' : 'Belum menjawab') + ' <i>' + r.tidak.length + '</i></div>' + (r.tidak.length ? r.tidak.map(x => kbBaris(x, 'tidak')).join('') : '<p class="pt-kosong">Tidak ada.</p>') +
        '<details class="kb-det"><summary>Di lokasi <i>' + r.di_lokasi.length + '</i></summary>' + r.di_lokasi.map(x => kbBaris(x, 'dalam')).join('') + '</details>' +
        '<button class="btn sec" id="kb-xls" style="margin-top:12px">Unduh Excel</button><button class="btn sec" id="kb-tt" style="margin-top:8px">Tutup</button>';
      $('#kb-tt', el).onclick = closeSheet;
      $('#kb-xls', el).onclick = async () => { const b = $('#kb-xls', el); b.disabled = true; try { const x = await api('pantau.cekXlsx', { id_cek: id }, { timeout: 90000, ulang: 0 }); unduhBerkas(x); } catch (e) { toast(e.message, 'bad'); } b.disabled = false; };
    } catch (e) { closeSheet(); toast(e.message, 'bad', 5000); }
  }
  async function kbRiwayat() {
    const el = openSheet('<div class="loading"><span class="spin d"></span>Memuat…</div>');
    try {
      const r = await api('pantau.cekList', {});
      el.querySelector('.sheet').innerHTML = '<div class="grab"></div><h3>Riwayat cek hari ini</h3>' + (r.rows.length ? r.rows.map(x => '<button class="list-item kb-riw" data-id="' + esc(x.id_cek) + '"><div class="m"><b>' + esc(x.jam.replace(':', '.')) + ' · ' + x.jumlah + ' pegawai</b><span>' + esc(x.oleh) + ' · di luar ' + x.di_luar + ' · ' + (x.selesai ? 'tidak merespons ' : 'belum jawab ') + x.tidak + ' · di lokasi ' + x.di_lokasi + '</span></div><span class="tag ' + (x.di_luar ? 'bad' : 'ok') + '">' + (x.di_luar ? x.di_luar + ' DI LUAR' : 'LIHAT') + '</span></button>').join('') : '<p class="pt-kosong">Belum ada permintaan cek hari ini.</p>') + '<button class="btn sec" id="kb-tt" style="margin-top:10px">Tutup</button>';
      $('#kb-tt', el).onclick = closeSheet;
      el.querySelectorAll('[data-id]').forEach(b => b.onclick = () => kbHasil(b.dataset.id));
    } catch (e) { closeSheet(); toast(e.message, 'bad'); }
  }
  function unduhBerkas(r) {
    const bin = atob(r.b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([u8], { type: r.mime })), a = document.createElement('a'); a.href = url; a.download = r.nama; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
    toast('Berkas diunduh: ' + r.nama, 'ok');
  }
  async function unduhLokasiPantau() {
    const b = $('#pl-xls'), t0 = b.textContent; b.disabled = true; b.textContent = 'Menyiapkan…';
    try {
      const r = await api('pantau.lokasiXlsx', { mulai: S.pt.pl.mulai, selesai: S.pt.pl.selesai }, { timeout: 90000, ulang: 0 });
      const bin = atob(r.b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([u8], { type: r.mime })), a = document.createElement('a'); a.href = url; a.download = r.nama; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast('Excel diunduh: ' + r.nama, 'ok');
    } catch (e) { toast(e.message, 'bad', 5000); }
    b.disabled = false; b.textContent = t0;
  }
  async function unduhRekapPantau() {
    const b = $('#pt-rekap'), t0 = b.textContent; b.disabled = true; b.innerHTML = '<span class="spin d"></span> Menyiapkan PDF…';
    try {
      const r = await api('pantau.rekap', { bulan: S.pt.m.bulan, lokasi: S.pt.lokasi }, { timeout: 90000, ulang: 0 });
      const bin = atob(r.b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([u8], { type: r.mime })), a = document.createElement('a'); a.href = url; a.download = r.nama; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast('PDF diunduh: ' + r.nama, 'ok');
    } catch (e) { if (e.kode === 'AKSI' || e.kode === 'AKSES') return matikanPantau(e.message); toast(e.message, 'bad', 5000); }
    b.disabled = false; b.textContent = t0;
  }
  /** Tarik layar ke bawah (di puncak halaman) untuk memuat ulang. */
  function pasangTarik(fn) {
    let y0 = null, dy = 0; const ind = $('#pt-tarik');
    const v = $('.view.pantau'); if (!v) return;
    v.addEventListener('touchstart', e => { y0 = window.scrollY <= 0 ? e.touches[0].clientY : null; dy = 0; }, { passive: true });
    v.addEventListener('touchmove', e => { if (y0 === null) return; dy = e.touches[0].clientY - y0; if (dy > 10 && ind) { ind.style.height = Math.min(56, dy / 2) + 'px'; ind.classList.toggle('siap', dy > 90); ind.textContent = dy > 90 ? '↻ Lepas untuk memuat ulang' : '↓ Tarik untuk memuat ulang'; } }, { passive: true });
    v.addEventListener('touchend', () => { if (y0 !== null && dy > 90) { if (ind) ind.textContent = 'Memuat…'; Promise.resolve(fn()).then(() => { if (ind) { ind.style.height = '0'; ind.classList.remove('siap'); } }); } else if (ind) { ind.style.height = '0'; } y0 = null; dy = 0; });
  }
  // ---------- RIWAYAT ----------
  async function viewRiwayat(bulanArg) {
    const t = wib(now()), bulan = bulanArg || S.blnRiwayat || (t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1));
    S.blnRiwayat = bulan;
    app.innerHTML = '<div class="view">' + appbarBulan('Riwayat', bulan, 'riwayat') + '<div class="pad" id="isi"><div class="loading"><span class="spin d"></span></div></div></div>' + nav('riwayat');
    pasangBulan(viewRiwayat);
    try {
      const r = await api('riwayat', { bulan });
      const kodeTag = h => { const k = h.kode; const c = /T|PA|TPP/.test(k) ? (/PA|TPP/.test(k) ? 'bad' : 'warn') : k === 'H' ? 'ok' : /^(I|S|TL)$/.test(k) ? 'info' : k === 'TK' ? 'bad' : 'mut'; return '<span class="tag ' + c + '">' + esc(k === 'BELUM' ? 'BELUM' : k) + (h.mt ? ' ' + h.mt + 'm' : h.pa ? ' ' + h.pa + 'm' : '') + '</span>'; };
      $('#isi').innerHTML = '<div class="mini-stat" style="margin-bottom:12px"><div style="background:#fff;box-shadow:var(--sh)"><small>Total terlambat</small><b>' + esc(r.total.t_teks) + '</b><small>' + r.total.t_kali + ' kali</small></div><div style="background:#fff;box-shadow:var(--sh)"><small>Total pulang awal</small><b>' + esc(r.total.pa_teks) + '</b><small>' + r.total.pa_kali + ' kali</small></div></div>' +
        (r.hari.length ? r.hari.map(h => '<div class="list-item"><div class="d"><b>' + (+h.tanggal.slice(8)) + '</b><small>' + esc(h.hari) + '</small></div><div class="m"><b>' + esc(h.shift || '-') + '</b><span>' + (h.masuk ? esc(h.masuk.replace(':', '.')) + '–' + esc((h.pulang || '…').replace(':', '.')) : esc(h.ket || '')) + '</span></div>' + kodeTag(h) + '</div>').join('') : '<p style="color:var(--muted);text-align:center">Belum ada riwayat bulan ini.</p>') +
        '<div class="sec-title">Pengajuan saya</div>' + (r.pengajuan.length ? r.pengajuan.map(p => '<div class="list-item"><div class="m"><b>' + esc(p.jenis) + ' · ' + esc(p.tgl) + '</b>' + (p.catatan ? '<span>' + esc(p.catatan) + '</span>' : '') + '</div><span class="tag ' + (p.status === 'DISETUJUI' ? 'ok' : p.status === 'DITOLAK' ? 'bad' : 'warn') + '">' + esc(p.status) + '</span></div>').join('') : '<p style="color:var(--muted)">Belum ada pengajuan.</p>') +
        '<p style="font-size:12px;color:var(--muted)">H hadir · T terlambat · PA pulang awal · TPP tidak presensi pulang · I/S/TL disetujui · TK tanpa keterangan</p>';
    } catch (e) { $('#isi').innerHTML = '<p>' + esc(e.message) + '</p>'; }
  }
  // ---------- TAHAP 10e: ganti foto mandiri (pas foto 3:4) & kartu pegawai digital ----------
  function gantiFoto(sesudah) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    const el = openSheet('<h3>Ganti foto profil & ID card</h3><ul class="foto-tips"><li>Latar polos (putih/biru/merah), cahaya cukup</li><li>Wajah menghadap depan, jelas, tanpa kacamata hitam/masker</li><li>Foto ini langsung dipakai di profil dan kartu/name tag Anda</li></ul>' +
      '<button class="btn pri" id="ft-kam" style="margin-bottom:10px">📷 Ambil dengan kamera</button><button class="btn sec" id="ft-gal">🖼️ Pilih dari galeri</button>');
    const pilih = cap => { inp.removeAttribute('capture'); if (cap) inp.setAttribute('capture', 'user'); inp.value = ''; inp.click(); };
    $('#ft-kam', el).onclick = () => pilih(true); $('#ft-gal', el).onclick = () => pilih(false);
    inp.onchange = () => { const f = inp.files && inp.files[0]; if (!f) return; if (!/^image\//.test(f.type)) return toast('Pilih berkas gambar.', 'bad'); if (f.size > 15 * 1048576) return toast('Gambar terlalu besar (maks 15 MB).', 'bad'); closeSheet(); potongFoto(f, sesudah); };
  }
  function potongFoto(file, sesudah) {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const W = 270, H = 360; // bingkai 3:4
      const d = document.createElement('div'); d.className = 'crop-layar'; d.id = 'crop-layar';
      d.innerHTML = '<div class="crop-kotak"><h3>Atur posisi foto</h3><p>Geser foto dan atur zoom hingga wajah pas di bingkai.</p><div class="crop-bingkai" style="width:' + W + 'px;height:' + H + 'px"><canvas id="crop-cv" width="' + W * 2 + '" height="' + H * 2 + '"></canvas><div class="crop-garis"></div></div>' +
        '<label class="crop-zoom">Zoom <input type="range" id="crop-z" min="1" max="4" step="0.01" value="1"></label><div id="crop-ps"></div><div class="push-aksi"><button class="btn sec" id="crop-batal">Batal</button><button class="btn pri" id="crop-ok">Simpan foto</button></div></div>';
      document.body.appendChild(d);
      const cv = $('#crop-cv', d), cx = cv.getContext('2d'), base = Math.max(W / img.width, H / img.height);
      let z = 1, ox = 0, oy = 0; // geser (px bingkai)
      const batas = () => { const s = base * z, iw = img.width * s, ih = img.height * s; ox = Math.min(0, Math.max(W - iw, ox)); oy = Math.min(0, Math.max(H - ih, oy)); };
      const pusat = () => { const s = base * z; ox = (W - img.width * s) / 2; oy = (H - img.height * s) / 2; };
      const gambar = () => { batas(); const s = base * z; cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, ox * 2, oy * 2, img.width * s * 2, img.height * s * 2); };
      pusat(); gambar();
      const zi = $('#crop-z', d);
      zi.oninput = () => { const s0 = base * z, cxp = (W / 2 - ox) / s0, cyp = (H / 2 - oy) / s0; z = +zi.value; const s = base * z; ox = W / 2 - cxp * s; oy = H / 2 - cyp * s; gambar(); };
      let seret = null, jari = {};
      cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); jari[e.pointerId] = { x: e.clientX, y: e.clientY }; seret = { x: e.clientX, y: e.clientY, ox, oy }; });
      cv.addEventListener('pointermove', e => { if (!seret || !jari[e.pointerId]) return; const ids = Object.keys(jari); jari[e.pointerId] = { x: e.clientX, y: e.clientY }; if (ids.length > 1) return; ox = seret.ox + (e.clientX - seret.x); oy = seret.oy + (e.clientY - seret.y); gambar(); });
      const lepas = e => { delete jari[e.pointerId]; if (!Object.keys(jari).length) seret = null; };
      cv.addEventListener('pointerup', lepas); cv.addEventListener('pointercancel', lepas);
      cv.addEventListener('wheel', e => { e.preventDefault(); zi.value = Math.min(4, Math.max(1, z * (e.deltaY < 0 ? 1.08 : 0.93))); zi.oninput(); }, { passive: false });
      const tutup = () => { d.remove(); URL.revokeObjectURL(url); };
      $('#crop-batal', d).onclick = tutup;
      $('#crop-ok', d).onclick = async () => {
        const b = $('#crop-ok', d), ps = $('#crop-ps', d); b.disabled = true; b.innerHTML = '<span class="spin"></span> Menyimpan…'; ps.innerHTML = '';
        try {
          const out = document.createElement('canvas'); out.width = 600; out.height = 800; const o = out.getContext('2d'), s = base * z * (600 / W);
          o.fillStyle = '#fff'; o.fillRect(0, 0, 600, 800); o.drawImage(img, ox * (600 / W), oy * (600 / W), img.width * s, img.height * s);
          let q = 0.82, du = out.toDataURL('image/jpeg', q);
          while (du.length * 0.75 > 290 * 1024 && q > 0.4) { q -= 0.08; du = out.toDataURL('image/jpeg', q); }
          const r = await api('profil.foto', { b64: du }, { ulang: 1, timeout: 40000 });
          tutup(); toast('Foto diperbarui. Berlaku di profil dan ID card.', 'ok', 4000); if (sesudah) sesudah(r.foto);
        } catch (e) { ps.innerHTML = '<div class="note bad"><span class="ni">!</span><div>' + esc(e.message) + '</div></div>'; b.disabled = false; b.textContent = 'Coba lagi'; }
      };
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast('Gambar tidak dapat dibaca. Coba foto lain.', 'bad'); };
    img.src = url;
  }
  function kartuPegawai(p) {
    const el = openSheet('<div class="idc"><div class="idc-h"><img src="' + esc(logo()) + '" alt=""><div><b>' + esc(C.NAMA_INSTANSI) + '</b><small>' + esc(C.KABUPATEN) + '</small></div></div>' +
      '<div class="idc-foto">' + (p.foto ? '<img src="' + esc(p.foto) + '" alt="Foto">' : '<span>' + esc(p.inisial) + '</span>') + '</div>' +
      '<div class="idc-nama">' + esc(p.nama) + '</div><div class="idc-jab">' + esc(p.jabatan || '') + '</div>' +
      '<div class="idc-dl"><div><span>' + (p.jenis_nomor || 'NIP/NIK') + '</span><b>' + esc(p.nip) + '</b></div><div><span>Unit</span><b>' + esc(p.unit || '-') + '</b></div><div><span>Status</span><b>' + esc(p.kategori_label || '') + '</b></div></div>' +
      '<div class="idc-f">KARTU PEGAWAI DIGITAL · bukan pengganti QR name tag presensi</div></div>' +
      (p.foto_mandiri ? '<button class="btn sec" id="idc-ganti" style="margin-top:12px">Ganti foto</button>' : '') + '<button class="btn pri" id="s-ok" style="margin-top:10px">Tutup</button>');
    $('#s-ok', el).onclick = closeSheet;
    const g = $('#idc-ganti', el); if (g) g.onclick = () => { closeSheet(); gantiFoto(f => { p.foto = f; viewProfil(); }); };
  }
  // ---------- PROFIL ----------
  async function viewProfil() {
    app.innerHTML = '<div class="view">' + appbar('Profil') + '<div class="pad" id="isi"><div class="loading"><span class="spin d"></span></div></div></div>' + nav('profil');
    try {
      const p = await api('profil', {});
      $('#isi').innerHTML = '<div class="card" style="text-align:center"><div class="avatar" style="width:86px;height:86px;margin:4px auto 10px;background:var(--hijauL);color:var(--hijau);border-color:var(--hijauL);font-size:28px">' + (p.foto ? '<img src="' + esc(p.foto) + '" alt="">' : esc(p.inisial)) + '</div>' + (p.foto_mandiri ? '<button class="btn-link" id="b-foto" style="margin:-4px 0 8px">📷 Ganti foto</button><br>' : '') + '<b style="font-size:18px">' + esc(p.nama) + '</b><div style="color:var(--muted);font-size:14px">' + esc(p.jabatan) + ' · ' + esc(p.unit) + '</div><div style="margin-top:8px"><span class="tag ok">' + esc(p.kategori_label) + '</span> <span class="tag mut">' + esc(p.grup_jadwal) + '</span></div></div>' +
        '<div class="card dl"><div><span>NIP/NIK</span><b>' + esc(p.nip) + '</b></div><div><span>Golongan</span><b>' + esc(p.golongan || '—') + '</b></div><div><span>Perangkat terdaftar</span><b>' + esc(p.perangkat ? p.perangkat.label : '-') + '</b></div><div><span>Terdaftar sejak</span><b>' + esc(p.perangkat ? p.perangkat.sejak : '-') + '</b></div></div>' +
        '<button class="btn sec" id="b-kartu" style="margin-bottom:10px">🪪 Kartu pegawai digital</button><button class="btn sec" id="b-sandi" style="margin-bottom:10px">Ganti kata sandi</button><button class="btn sec" id="b-pin" style="margin-bottom:10px">Ganti PIN</button>' +
        (terpasang() ? '' : '<button class="btn sec" id="b-pasang" style="margin-bottom:10px">📲 Tambahkan ke Layar Utama</button>') + (!iosBelumLayarUtama() && pushDidukung() && Notification.permission !== 'granted' && Notification.permission !== 'denied' ? '<button class="btn sec" id="b-notif" style="margin-bottom:10px">🔔 Aktifkan notifikasi</button>' : '') +
        '<button class="btn sec" id="b-priv" style="margin-bottom:10px">Pemberitahuan privasi</button><button class="btn bad" id="b-out">Keluar</button>' +
        '<p style="font-size:12px;color:var(--muted);text-align:center;margin-top:14px">Ganti HP? Minta admin mereset perangkat. Menghapus data browser juga memerlukan pendaftaran ulang perangkat.<br>v' + esc(C.VERSI) + '</p>';
      $('#b-priv').onclick = sheetPrivasi;
      $('#b-kartu').onclick = () => kartuPegawai(p);
      if ($('#b-foto')) $('#b-foto').onclick = () => gantiFoto(() => viewProfil());
      $('#b-out').onclick = async () => { try { await api('logout', {}); } catch (e) { } keluarLokal(); go('login'); };
      if ($('#b-pasang')) $('#b-pasang').onclick = () => pasangSekarang();
      if ($('#b-notif')) $('#b-notif').onclick = async () => { try { await pushAktifkan(); $('#b-notif').remove(); toast('Notifikasi aktif.', 'ok'); } catch (e) { toast(e.message, 'bad', 5000); } };
      $('#b-sandi').onclick = () => sheetForm('Ganti kata sandi', [['lama', 'Kata sandi lama', 'password'], ['baru', 'Kata sandi baru (min. 8, huruf+angka)', 'password'], ['ulang', 'Ulangi kata sandi baru', 'password']], async v => {
        if (v.baru !== v.ulang) throw new Error('Ulangan tidak sama.'); const r = await api('gantiSandi', { lama: v.lama, baru: v.baru }); S.token = r.token; LS.set('dj_token', r.token); toast('Kata sandi diganti.', 'ok'); });
      $('#b-pin').onclick = () => sheetForm('Ganti PIN', [['lama', 'PIN lama', 'password', 'numeric'], ['baru', 'PIN baru (6 digit)', 'password', 'numeric'], ['ulang', 'Ulangi PIN baru', 'password', 'numeric']], async v => {
        if (v.baru !== v.ulang) throw new Error('Ulangan tidak sama.'); await api('gantiPin', { lama: v.lama, baru: v.baru }); toast('PIN diganti.', 'ok'); });
    } catch (e) { $('#isi').innerHTML = '<p>' + esc(e.message) + '</p>'; }
  }
  function viewTerkunci(pesan) {
    clearTimers();
    app.innerHTML = '<div class="lock"><div class="li">' + I.lock + '</div><h2>Akun tidak aktif</h2><p>' + esc(pesan || 'Akun Anda dinonaktifkan. Presensi tidak dapat dilakukan.') + '</p><p style="font-size:13px">Hubungi bagian kepegawaian bila ini keliru.</p><span class="tag bad" style="margin-top:14px">PERANGKAT TERKUNCI</span><button class="btn sec" style="max-width:220px;margin-top:22px" onclick="location.hash=\'#/login\';location.reload()">Kembali</button></div>';
  }
  // ---------- sheet (modal bawah) ----------
  let sheetEl = null;
  function closeSheet() { if (sheetEl) { sheetEl.remove(); sheetEl = null; } }
  function openSheet(html) { closeSheet(); sheetEl = document.createElement('div'); sheetEl.className = 'sheet-bg'; sheetEl.innerHTML = '<div class="sheet"><div class="grab"></div>' + html + '</div>'; document.body.appendChild(sheetEl); return sheetEl; }
  function sheetInfo(judul, isi) { const el = openSheet('<h3>' + esc(judul) + '</h3><p>' + esc(isi) + '</p><button class="btn pri" id="s-ok">Mengerti</button>'); $('#s-ok', el).onclick = closeSheet; }
  function sheetPin(judul, sub) {
    return new Promise(res => {
      let pin = '';
      const el = openSheet('<h3 style="text-align:center">' + esc(judul) + '</h3><p style="text-align:center">' + esc(sub) + '</p><div class="dots" id="dots">' + '<i></i>'.repeat(6) + '</div><div class="keypad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => '<button data-k="' + n + '">' + n + '</button>').join('') + '<button data-k="x" style="font-size:15px">Batal</button><button data-k="0">0</button><button data-k="del" style="font-size:16px">⌫</button></div>');
      const upd = () => el.querySelectorAll('#dots i').forEach((d, i) => d.classList.toggle('on', i < pin.length));
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-k]'); if (!b) { if (e.target === el) { closeSheet(); res(null); } return; }
        const k = b.dataset.k;
        if (k === 'x') { closeSheet(); return res(null); }
        if (k === 'del') pin = pin.slice(0, -1); else if (pin.length < 6) pin += k;
        upd(); if (pin.length === 6) setTimeout(() => { closeSheet(); res(pin); }, 120);
      });
    });
  }
  function sheetPulangAwal(c) {
    return new Promise(res => {
      const jp = (c.jadwal || '').split('–')[1] || '';
      const el = openSheet('<div style="display:flex;gap:12px;align-items:center;margin-bottom:8px"><span class="ni" style="width:46px;height:46px;border-radius:14px;background:var(--kuningL);color:#b07800;display:grid;place-items:center">' + I.jam + '</span><div><h3>Belum waktunya pulang</h3></div></div>' +
        '<p>Jam pulang jadwal Anda <b>' + esc(jp.replace(':', '.')) + '</b>. Bila melanjutkan sekarang (' + jamTeks(now()) + '), presensi tercatat:</p><div class="status-band bad" style="text-align:center">PULANG AWAL ' + esc(menitTeks(c.menit_pulang_awal).toUpperCase()) + '</div>' +
        '<label class="f" style="margin-top:12px"><span>Alasan (opsional)</span><input class="inp" id="pa-al" maxlength="200" placeholder="Mis. mengantar rujukan pasien"></label><p style="font-size:12.5px">Jika ada izin resmi, ajukan IZIN agar admin dapat memverifikasi.</p><div class="row2"><button class="btn sec" id="pa-no">Batal</button><button class="btn bad" id="pa-ok">Tetap pulang</button></div>');
      $('#pa-no', el).onclick = () => { closeSheet(); res(null); };
      $('#pa-ok', el).onclick = () => { const a = $('#pa-al', el).value; closeSheet(); res({ alasan: a }); };
    });
  }
  /** Swafoto (opsional, hanya bila Pengaturan swafoto_wajib = TRUE): kamera depan, dikompres JPEG ±480 px. */
  function sheetSwafoto() {
    return new Promise(res => {
      let stream = null;
      const el = openSheet('<h3 style="text-align:center">Swafoto presensi</h3><p style="text-align:center">Diwajibkan Puskesmas. Pastikan wajah terlihat jelas.</p><div class="scan-box" style="aspect-ratio:3/4;max-height:52vh"><video id="sv" playsinline muted style="transform:scaleX(-1)"></video><canvas id="sc" class="hidden"></canvas></div><div class="row2" style="margin-top:12px"><button class="btn sec" id="sf-no">Batal</button><button class="btn pri" id="sf-ok" disabled>Ambil foto</button></div>');
      const stop = () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 } }, audio: false }).then(st => { stream = st; const v = $('#sv', el); v.srcObject = st; v.play().catch(() => {}); $('#sf-ok', el).disabled = false; }).catch(e => { toast('Kamera depan tidak dapat dibuka (' + e.name + ').', 'bad'); });
      $('#sf-no', el).onclick = () => { stop(); closeSheet(); res(null); };
      $('#sf-ok', el).onclick = () => { const v = $('#sv', el), c = $('#sc', el), w = 480, h = Math.round(480 * (v.videoHeight || 640) / (v.videoWidth || 480)); c.width = w; c.height = h; c.getContext('2d').drawImage(v, 0, 0, w, h); const d = c.toDataURL('image/jpeg', 0.8); stop(); closeSheet(); res(d); };
    });
  }
  function sheetForm(judul, fields, onSubmit) {
    const el = openSheet('<h3>' + esc(judul) + '</h3><form id="sf">' + fields.map(f => '<label class="f"><span>' + esc(f[1]) + '</span><input class="inp" name="' + f[0] + '" type="' + f[2] + '"' + (f[3] ? ' inputmode="numeric" maxlength="6"' : ' maxlength="64"') + ' required></label>').join('') + '<div class="row2"><button type="button" class="btn sec" id="sf-x">Batal</button><button class="btn pri" id="sf-ok">Simpan</button></div></form>');
    $('#sf-x', el).onclick = closeSheet;
    $('#sf', el).onsubmit = async e => { e.preventDefault(); const v = {}; fields.forEach(f => v[f[0]] = e.target[f[0]].value); const b = $('#sf-ok', el); b.disabled = true; try { await onSubmit(v); closeSheet(); } catch (er) { b.disabled = false; toast(er.message, 'bad'); } };
  }
  function sheetPrivasi() {
    const el = openSheet('<h3>Pemberitahuan Privasi</h3><div style="font-size:14px;color:var(--ink)"><p style="color:var(--ink)">Sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, aplikasi ini memproses:</p><ul style="padding-left:18px;margin:0 0 10px"><li><b>Identitas kepegawaian</b> (nama, NIP/NIK, jabatan, unit, kategori).</li><li><b>Lokasi GPS</b> & akurasinya <b>hanya saat</b> Anda menekan presensi/pengajuan (bukan pelacakan terus-menerus di server).</li><li><b>ID perangkat</b> yang disimpan dalam bentuk hash untuk kunci 1 HP.</li><li><b>Bukti</b> izin/sakit/tugas yang Anda unggah.</li><li>Waktu server setiap transaksi & log keamanan.</li></ul><p style="color:var(--ink)"><b>Tujuan:</b> presensi & administrasi kepegawaian Puskesmas. Data disimpan di akun Google institusi, tidak dibagikan publik, dan hanya dapat diakses admin berwenang. Anda berhak meminta akses/koreksi data melalui bagian kepegawaian.</p></div><button class="btn pri" id="s-ok">Tutup</button>');
    $('#s-ok', el).onclick = closeSheet;
  }
  // ---------- TAHAP 10: konfirmasi keberadaan & lokasi selama jam kerja ----------
  const KB = { sibuk: false, t: 0, mati: false, jawab: null };
  function kbBolehCek() { const v = location.hash.replace(/^#\//, '').split('/')[0]; return S.token && !KB.mati && document.visibilityState === 'visible' && v !== 'login' && v !== 'aktivasi'; }
  async function kbPeriksa(paksa) {
    if (!kbBolehCek() || KB.sibuk) return;
    if (!paksa && Date.now() - KB.t < 50000) return;
    KB.sibuk = true; KB.t = Date.now();
    try {
      const r = await api('cek.status', {}, { ulang: 0, timeout: 15000 });
      KB.menit = r.jejak_menit;
      if (r.cek) kbLayar(r.cek); else if (!KB.jawab) kbTutup();
      if (r.minta_lokasi) kbJejak();
      pushTawar();
    } catch (e) { if (e.kode === 'AKSI') KB.mati = true; }
    KB.sibuk = false;
  }
  function kbGpsSegar() {
    return new Promise((ok, no) => {
      if (!('geolocation' in navigator)) return no(new Error('Perangkat tidak mendukung GPS.'));
      navigator.geolocation.getCurrentPosition(p => { S.gps = { lat: p.coords.latitude, lng: p.coords.longitude, akurasi: Math.round(p.coords.accuracy), ts: Date.now() }; ok(S.gps); },
        e => no(new Error(e.code === 1 ? 'Izin lokasi ditolak. Aktifkan lokasi untuk aplikasi ini di pengaturan browser.' : 'Lokasi GPS belum didapat. Aktifkan GPS lalu coba lagi.')), { enableHighAccuracy: true, maximumAge: 0, timeout: 25000 });
    });
  }
  function kbPrivasi() {
    return new Promise(res => {
      if (LS.get('dj_privasi_lokasi') === '1') return res(true);
      if ($('#kb-priv')) return res(false);
      const d = document.createElement('div'); d.id = 'kb-priv'; d.className = 'kb-priv';
      d.innerHTML = '<div><b>Pencatatan lokasi selama jam kerja</b><p>Setelah Anda presensi masuk dan sebelum presensi pulang, aplikasi ini mencatat lokasi HP Anda saat aplikasi dibuka (paling sering sekali tiap ' + (KB.menit || 10) + ' menit). Lokasi hanya dilihat Kepala Puskesmas untuk memastikan kehadiran di tempat tugas. Di luar jam kerja lokasi tidak dicatat.</p><button class="btn pri" id="kb-priv-ok">Saya mengerti</button></div>';
      document.body.appendChild(d);
      $('#kb-priv-ok', d).onclick = () => { LS.set('dj_privasi_lokasi', '1'); d.remove(); res(true); };
    });
  }
  async function kbJejak() {
    if (!(await kbPrivasi())) return;
    try { const g = (S.gps && Date.now() - S.gps.ts < 60000) ? S.gps : await posisiSegar(); await api('jejak.kirim', { lat: g.lat, lng: g.lng, akurasi: g.akurasi }, { ulang: 0, timeout: 15000 }); } catch (e) { }
  }
  function kbTutup() { const d = $('#kb-layar'); if (d) d.remove(); KB.jawab = null; }
  function kbLayar(c) {
    let d = $('#kb-layar');
    if (d && d.dataset.id === c.id_cek) return;
    if (d) d.remove();
    d = document.createElement('div'); d.id = 'kb-layar'; d.className = 'kb-layar'; d.dataset.id = c.id_cek;
    d.innerHTML = '<div class="kb-kotak"><div class="kb-ikon">📍</div><h2>Kepala Puskesmas meminta konfirmasi keberadaan</h2><p>Tekan tombol di bawah untuk mengirim lokasi Anda saat ini. Mohon dijawab sebelum pukul <b>' + esc(String(c.batas).replace(':', '.')) + '</b>.</p>' +
      '<div id="kb-pesan"></div><button class="btn pri" id="kb-kirim">Konfirmasi lokasi saya</button><p class="kb-kecil">Pastikan GPS aktif. Lokasi diambil saat tombol ditekan.</p></div>';
    document.body.appendChild(d);
    $('#kb-kirim', d).onclick = async () => {
      const b = $('#kb-kirim', d), ps = $('#kb-pesan', d); b.disabled = true; b.innerHTML = '<span class="spin"></span> Mengambil lokasi…'; ps.innerHTML = '';
      try {
        const g = await kbGpsSegar(); b.innerHTML = '<span class="spin"></span> Mengirim…';
        const r = await api('cek.jawab', { id_cek: c.id_cek, lat: g.lat, lng: g.lng, akurasi: g.akurasi }, { ulang: 1, timeout: 25000 });
        KB.jawab = c.id_cek;
        d.querySelector('.kb-kotak').innerHTML = '<div class="kb-ikon ' + (r.dalam ? 'ok' : 'bad') + '">' + (r.dalam ? '✓' : '!') + '</div><h2>Terima kasih</h2><p>' + (r.sudah ? 'Konfirmasi Anda sudah diterima sebelumnya.' : 'Lokasi Anda tercatat pukul ' + esc(String(r.jam).replace(':', '.')) + (r.dalam ? ', di area ' + esc(r.lokasi) + '.' : ', <b>di luar area ' + esc(r.lokasi) + '</b> (±' + jarakTeks(r.jarak) + ').')) + '</p><button class="btn pri" id="kb-ok">Tutup</button>';
        $('#kb-ok', d).onclick = kbTutup;
      } catch (e) {
        if (e.kode === 'SELESAI') { kbTutup(); toast(e.message, 'bad', 4000); return; }
        ps.innerHTML = '<div class="note bad"><span class="ni">!</span><div>' + esc(e.message) + '</div></div>'; b.disabled = false; b.textContent = 'Coba lagi';
      }
    };
  }
  // ---------- TAHAP 10: notifikasi HP (Web Push standar, opsional) & Tambahkan ke Layar Utama ----------
  const PUSH = { proses: false };
  const UA = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const iosBukanSafari = isIOS && /CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|FBAN|FBAV|Instagram|Line\/|WhatsApp/.test(UA);
  function terpasang() { return !!(navigator.standalone || (window.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches)) || LS.get('dj_terpasang') === '1' && !isIOS && window.matchMedia && matchMedia('(display-mode: standalone)').matches); }
  function iosBelumLayarUtama() { return isIOS && !terpasang(); }
  function pushDidukung() { return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window && location.protocol === 'https:'; }
  function b64uKeBytes(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const r = atob(s), o = new Uint8Array(r.length); for (let i = 0; i < r.length; i++) o[i] = r.charCodeAt(i); return o; }
  /** Simpan konteks minimal agar service worker bisa menanyakan permintaan cek aktif saat ada push. */
  async function swKonteks() {
    try { if (!('caches' in window)) return; const c = await caches.open('dj-ctx'); if (S.token) await c.put('./__ctx', new Response(JSON.stringify({ api: C.API_URL, token: S.token, device: S.device }), { headers: { 'Content-Type': 'application/json' } })); else await c.delete('./__ctx'); } catch (e) { }
  }
  async function pushLangganan() {
    const reg = await navigator.serviceWorker.ready;
    const k = await api('push.kunci', {}, { ulang: 1, timeout: 20000 }), kunci = b64uKeBytes(k.kunci);
    let sub = await reg.pushManager.getSubscription();
    if (sub && sub.options && sub.options.applicationServerKey) { const a = new Uint8Array(sub.options.applicationServerKey); if (a.length !== kunci.length || a.some((x, i) => x !== kunci[i])) { await sub.unsubscribe(); sub = null; } }
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: kunci });
    await api('push.daftar', { endpoint: sub.endpoint, platform: /Android/.test(UA) ? 'Android' : isIOS ? 'iPhone' : 'Lainnya' });
    LS.set('dj_push_t', String(Date.now())); await swKonteks();
  }
  async function pushAktifkan() {
    const izin = await Notification.requestPermission();
    if (izin !== 'granted') throw new Error('Notifikasi tidak diizinkan. Permintaan konfirmasi tetap muncul saat aplikasi dibuka.');
    await pushLangganan();
  }
  function bannerDi(d) { const v = document.querySelector('.view'); if (!v) return false; const k = v.querySelector('.wrap > .card'); if (k) { d.style.margin = '12px 0 0'; k.after(d); } else v.insertBefore(d, v.children[1] || null); return true; }
  async function pushTawar() {
    if (PUSH.proses || !S.token) return;
    if (location.hash.indexOf('beranda') < 0 && location.hash !== '' && location.hash !== '#/') return;
    swKonteks();
    if (pushDidukung() && Notification.permission === 'granted') { // perbarui langganan diam-diam sekali sehari
      if (Date.now() - (+LS.get('dj_push_t') || 0) > 86400000) { PUSH.proses = true; try { await pushLangganan(); } catch (e) { } PUSH.proses = false; }
      return;
    }
    if (pasangTawar()) return; // belum terpasang: tawarkan pasang dulu
    if (LS.get('dj_push_tutup') === '1' || $('#push-tawar') || $('#pasang-tawar')) return;
    if (iosBelumLayarUtama() || !pushDidukung() || Notification.permission === 'denied') return;
    const d = document.createElement('div'); d.id = 'push-tawar'; d.className = 'note info push-tawar';
    d.innerHTML = '<span class="ni">🔔</span><div style="flex:1"><b>Notifikasi konfirmasi keberadaan</b><br>Aktifkan agar HP berbunyi saat Kepala Puskesmas meminta konfirmasi lokasi, walaupun aplikasi sedang ditutup.' +
      '<div class="push-aksi"><button class="btn pri" id="push-ya">Aktifkan notifikasi</button><button class="btn sec" id="push-no">Nanti saja</button></div></div>';
    if (!bannerDi(d)) return;
    $('#push-no', d).onclick = () => { LS.set('dj_push_tutup', '1'); d.remove(); };
    const ya = $('#push-ya', d);
    ya.onclick = async () => { ya.disabled = true; PUSH.proses = true; try { await pushAktifkan(); d.remove(); toast('Notifikasi aktif.', 'ok'); } catch (e) { ya.disabled = false; toast(e.message, 'bad', 5000); } PUSH.proses = false; };
  }
  /** Banner "Tambahkan ke Layar Utama" (bisa ditutup, diingat 7 hari). Return true bila banner tampil. */
  function pasangTawar() {
    if (terpasang() || $('#pasang-tawar')) return !!$('#pasang-tawar');
    if (!isIOS && !S.installEvt) return false;
    if (Date.now() - (+LS.get('dj_pasang_tutup') || 0) < 7 * 86400000) return false;
    const d = document.createElement('div'); d.id = 'pasang-tawar'; d.className = 'note info push-tawar';
    d.innerHTML = '<span class="ni">📲</span><div style="flex:1"><b>Tambahkan ke Layar Utama</b><br>Buka aplikasi presensi langsung dari ikon di HP' + (isIOS ? ', dan aktifkan notifikasi konfirmasi keberadaan (di iPhone notifikasi hanya bisa aktif dari Layar Utama).' : ' dan terima notifikasi konfirmasi keberadaan.') +
      '<div class="push-aksi"><button class="btn pri" id="pasang-ya">Tambahkan</button><button class="btn sec" id="pasang-no">Nanti saja</button></div></div>';
    if (!bannerDi(d)) return false;
    $('#pasang-no', d).onclick = () => { LS.set('dj_pasang_tutup', String(Date.now())); d.remove(); };
    $('#pasang-ya', d).onclick = () => pasangSekarang();
    return true;
  }
  async function pasangSekarang() {
    if (S.installEvt) {
      const ev = S.installEvt; S.installEvt = null;
      try { ev.prompt(); const r = await ev.userChoice; if (r && r.outcome === 'accepted') { const b = $('#pasang-tawar'); if (b) b.remove(); } } catch (e) { }
      perbaruiTombolPasang(); return;
    }
    if (isIOS) return panduanIOS();
    const el = openSheet('<h3>Tambahkan ke Layar Utama</h3><p>Buka menu browser (⋮) lalu pilih <b>Instal aplikasi</b> atau <b>Tambahkan ke layar utama</b>.</p><button class="btn pri" id="s-ok">Mengerti</button>'); $('#s-ok', el).onclick = closeSheet;
  }
  function panduanIOS() {
    const langkah = (n, ikon, t) => '<div class="ios-langkah"><span class="ios-no">' + n + '</span><span class="ios-ikon">' + ikon + '</span><div>' + t + '</div></div>';
    const svgBagikan = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#0a84ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/></svg>';
    const svgTambah = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
    const isi = (iosBukanSafari ? '<div class="note warn"><span class="ni">!</span><div>Anda membuka aplikasi ini dari browser lain. Di iPhone/iPad, salin alamat ini lalu buka di <b>Safari</b> untuk menambahkannya ke Layar Utama.<br><button class="btn sec" id="ios-salin" style="margin-top:8px">Salin alamat</button></div></div>' : '') +
      langkah(1, svgBagikan, 'Ketuk tombol <b>Bagikan</b> di bawah (atau di atas pada iPad) layar Safari.') +
      langkah(2, svgTambah, 'Gulir lalu pilih <b>Tambah ke Layar Utama</b>.') +
      langkah(3, '<b style="color:#0a84ff">Tambah</b>', 'Ketuk <b>Tambah</b> di pojok kanan atas, lalu buka aplikasi dari ikon <b>Presensi DJ</b>.') +
      '<p class="kb-kecil" style="margin-top:10px">Notifikasi Cek Keberadaan di iPhone/iPad (iOS 16.4 atau lebih baru) hanya bisa diaktifkan setelah aplikasi dibuka dari Layar Utama.</p>';
    const el = openSheet('<h3>Tambahkan ke Layar Utama</h3>' + isi + '<button class="btn pri" id="s-ok" style="margin-top:12px">Mengerti</button>'); $('#s-ok', el).onclick = closeSheet;
    const s = $('#ios-salin'); if (s) s.onclick = () => { try { navigator.clipboard.writeText(location.href.split('#')[0]); toast('Alamat disalin. Tempel di Safari.', 'ok'); } catch (e) { } };
  }
  function perbaruiTombolPasang() { const b = $('#b-pasang'); if (b) b.style.display = terpasang() ? 'none' : ''; }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); S.installEvt = e; perbaruiTombolPasang(); setTimeout(pushTawar, 300); });
  window.addEventListener('appinstalled', () => { S.installEvt = null; LS.set('dj_terpasang', '1'); const b = $('#pasang-tawar'); if (b) b.remove(); perbaruiTombolPasang(); toast('Aplikasi ditambahkan ke Layar Utama.', 'ok'); setTimeout(pushTawar, 800); });
  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.jenis === 'CEK') kbPeriksa(true); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') kbPeriksa(true); });
  window.addEventListener('hashchange', () => setTimeout(() => kbPeriksa(false), 800));
  setInterval(() => kbPeriksa(true), 60000);
  // ---------- mulai ----------
  window.addEventListener('offline', () => toast('Koneksi terputus. Presensi memerlukan internet.', 'bad', 4000));
  async function init() {
    S.device = deviceId();
    try { const c = LS.get('dj_info'); if (c) S.info = JSON.parse(c); } catch (e) { }
    try { const inf = await API.kirim('info', {}, null, { ulang: 1, timeout: 15000 }); S.info = inf; S.offset = inf.waktu_server - Date.now(); LS.set('dj_info', JSON.stringify(inf)); } catch (e) { }
    const sp = $('#splash'); if (sp) { sp.style.transition = 'opacity .35s'; sp.style.opacity = '0'; setTimeout(() => sp.remove(), 380); }
    if (S.token) { mulaiGps(); if (!location.hash || location.hash === '#/' || location.hash === '#/login') location.hash = '#/beranda'; else route(); }
    else { if (location.hash !== '#/login') location.hash = '#/login'; else route(); }
    setTimeout(() => kbPeriksa(true), 2500); // TAHAP 10
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
  }
  init();
})();
