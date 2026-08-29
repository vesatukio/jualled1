/* Duta LED Universal Tools - reusable mini web utilities */
(function(){
  const tools=[
    ['🛍️','Toko / Katalog','Produk, harga, stok, keranjang, checkout'],
    ['📣','Poster & Promo','Buat poster dari foto, harga dan teks'],
    ['📝','Pengumuman','Buat pengumuman siap dibagikan'],
    ['🍔','Menu Digital','Menu makanan/minuman dengan harga'],
    ['💼','Profil Usaha','Profil usaha, layanan, lokasi dan kontak'],
    ['🎉','Acara / Undangan','Halaman acara dengan tanggal, lokasi dan informasi'],
    ['📋','Daftar Harga','Daftar jasa atau barang yang mudah dibagikan'],
    ['🔗','Link Serbaguna','Satu halaman untuk semua link penting']
  ];
  function render(){
    const host=document.getElementById('universalTools');if(!host)return;
    host.innerHTML='<div class="container"><div class="section-title center"><span class="eyebrow">SATU WEBSITE, BANYAK KEGUNAAN</span><h2>Gunakan Sesuai Kebutuhan</h2><p class="universal-intro">Duta LED sekarang disiapkan sebagai mesin katalog, promosi, profil, menu, dan halaman informasi. Toko LED hanyalah salah satu template.</p></div><div class="universal-grid">'+tools.map(t=>`<button class="universal-tool" type="button" data-tool="${t[1]}"><span>${t[0]}</span><strong>${t[1]}</strong><small>${t[2]}</small></button>`).join('')+'</div></div>';
    host.querySelectorAll('.universal-tool').forEach(b=>b.onclick=()=>alert(b.dataset.tool+'\n\nFitur ini disiapkan sebagai template yang bisa dikembangkan tanpa mengubah katalog toko.'));
  }
  document.addEventListener('DOMContentLoaded',render);
})();
