/* Lapisan komunikasi ke Apps Script (fetch POST text/plain → tanpa preflight CORS). */
(function () {
  const C = window.PRESENSI_CONFIG;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function kirim(aksi, data, token, opsi = {}) {
    const body = JSON.stringify({ aksi, data: data || {}, token: token || undefined });
    const ulang = opsi.ulang === undefined ? 2 : opsi.ulang;
    let err;
    for (let i = 0; i <= ulang; i++) {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), opsi.timeout || 30000);
      try {
        const res = await fetch(C.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body, redirect: 'follow', signal: ctl.signal, cache: 'no-store' });
        clearTimeout(to);
        const j = await res.json();
        if (!j.ok) { const e = new Error(j.pesan || 'Gagal'); e.kode = j.kode; throw e; }
        return j.data;
      } catch (e) {
        clearTimeout(to);
        if (e.kode) throw e; // jawaban server: jangan diulang
        err = e;
        if (i < ulang) await sleep(1200 * Math.pow(2, i)); // coba ulang bertahap (sinyal lemah)
      }
    }
    const e = new Error(navigator.onLine === false ? 'Tidak ada koneksi internet. Periksa paket data/Wi-Fi.' : 'Server tidak dapat dihubungi. Coba lagi.');
    e.kode = 'JARINGAN'; e.asli = err; throw e;
  }
  window.API = { kirim };
})();
