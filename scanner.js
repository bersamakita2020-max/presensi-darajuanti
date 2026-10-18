/* Pemindai QR: BarcodeDetector bawaan Chrome Android bila ada, cadangan jsQR (lokal, tanpa CDN). */
(function () {
  let stream = null, raf = null, aktif = false;
  async function mulai(video, canvas, onHasil, onGagal) {
    aktif = true;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    } catch (e) { onGagal(e.name === 'NotAllowedError' ? 'Izin kamera ditolak. Izinkan kamera di pengaturan browser.' : 'Kamera tidak dapat dibuka (' + e.name + ').'); return; }
    video.srcObject = stream; video.setAttribute('playsinline', ''); video.muted = true;
    await video.play().catch(() => {});
    let detector = null;
    if ('BarcodeDetector' in window) { try { const f = await BarcodeDetector.getSupportedFormats(); if (f.includes('qr_code')) detector = new BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { } }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let last = 0;
    const loop = async (t) => {
      if (!aktif) return;
      if (t - last > 140 && video.readyState >= 2) {
        last = t;
        try {
          let teks = null;
          if (detector) { const r = await detector.detect(video); if (r && r[0]) teks = r[0].rawValue; }
          else {
            const w = 480, h = Math.round(480 * video.videoHeight / video.videoWidth) || 480;
            canvas.width = w; canvas.height = h; ctx.drawImage(video, 0, 0, w, h);
            const img = ctx.getImageData(0, 0, w, h);
            const r = window.jsQR && jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' });
            if (r) teks = r.data;
          }
          if (teks) { if (navigator.vibrate) navigator.vibrate(60); berhenti(); onHasil(teks); return; }
        } catch (e) { }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }
  function berhenti() { aktif = false; if (raf) cancelAnimationFrame(raf); if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; }
  window.Scanner = { mulai, berhenti };
})();
