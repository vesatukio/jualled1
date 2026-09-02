/* Duta LED — bagian Satu Website, Banyak Kegunaan */
(function(){
  'use strict';
  const items=[
    ['🛍️','Toko / Katalog','Produk, harga, stok, keranjang, checkout'],
    ['📣','Poster & Promo','Buat poster dari foto, harga dan teks'],
    ['📝','Pengumuman','Buat pengumuman siap dibagikan'],
    ['🍔','Menu Digital','Menu makanan/minuman dengan harga'],
    ['💼','Profil Usaha','Profil usaha, layanan, lokasi dan kontak'],
    ['🎉','Acara / Undangan','Tanggal, lokasi dan informasi acara'],
    ['📋','Daftar Harga','Daftar jasa atau barang yang mudah dibagikan'],
    ['🔗','Link Serbaguna','Satu halaman untuk semua link penting']
  ];
  function boot(){
    const box=document.querySelector('.usaha-directory-cta');
    if(!box)return;
    box.innerHTML='<div class="platform-inner"><div class="platform-head"><span class="eyebrow">DUTA LED</span><h2>🤝 SATU WEBSITE, BANYAK KEGUNAAN</h2><p><strong>Gunakan sesuai kebutuhan.</strong> Duta LED disiapkan sebagai mesin katalog, promosi, profil, menu, dan halaman informasi. Toko LED hanyalah salah satu template.</p></div><div class="platform-grid">'+items.map(x=>'<article class="platform-card"><div class="platform-icon">'+x[0]+'</div><div><strong>'+x[1]+'</strong><span>'+x[2]+'</span></div></article>').join('')+'</div><a class="usaha-add platform-cta" href="usaha.html">➕ Daftar & Lihat Usaha</a></div>';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();