/* DUTA LED - legacy Ambil Barang loader disabled.
   Ambil Barang sekarang ditangani penuh oleh admin-ambil-barang.js (Supabase Realtime only). */
(()=>{
  'use strict';
  if (document.getElementById('dutaAmbilRealtimeScript')) return;
  const s=document.createElement('script');
  s.id='dutaAmbilRealtimeScript';
  s.src='admin-ambil-barang.js?v=20260911-3';
  s.async=false;
  s.onerror=()=>console.error('[Ambil Barang] modul realtime gagal dimuat');
  document.head.appendChild(s);
})();
