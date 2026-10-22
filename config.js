/**
 * KONFIGURASI PWA PEGAWAI — ubah sesuai pemasangan.
 * API_URL: alamat Web App Apps Script (Deploy > Web app > URL yang berakhiran /exec).
 */
window.PRESENSI_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbzLr5Le40iSUTNwAfKBVDA9j08toDqa_sMBvsOOF00Wne-lvHFnuRLQoskhK4_jThtpfw/exec',
  NAMA_APLIKASI: 'Presensi Dara Juanti',
  NAMA_INSTANSI: 'UPTD Puskesmas Dara Juanti',
  KABUPATEN: 'Kabupaten Sintang',
  LOGO: 'assets/logo-puskesmas.png', // ganti berkas ini untuk mengganti logo di aplikasi pegawai
  VERSI: '1.10.3'
  // Notifikasi HP memakai Web Push standar; kunci dibuat otomatis di server — tidak perlu diisi apa pun di sini.
};
