/* DUTA LED - Admin Ambil Barang loader + RIWAYAT AUTOCOMPLETE v20260904-12 */
(function(){
'use strict';
/* Jalankan versi Ambil Barang yang sudah stabil, lalu pasang autocomplete yang benar.
   Memuat berdasarkan commit SHA agar tidak terjadi recursive self-load. */
const base='https://raw.githubusercontent.com/vesatukio/jualled1/3be13671a3f5a27f6003af7329ceb0e5c1f2b122/admin-final-fix.js';
const auto='https://raw.githubusercontent.com/vesatukio/jualled1/8641df231dff46b7578d9d895342fb9960ce881c/admin-ambil-autocomplete.js';
function load(src,done){const s=document.createElement('script');s.src=src;s.onload=done;s.onerror=()=>console.error('Gagal memuat',src);document.head.appendChild(s)}
load(base,()=>load(auto));
})();
