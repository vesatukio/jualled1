# Panduan Toko Duta LED

## Menambah produk utama
Produk utama tetap dimasukkan ke Google Sheet pada sheet `PRODUK`. Jangan membuat kartu produk manual di `index.html`.

Kolom yang dipakai API saat ini:
- A: ID
- B: Nama
- C: Kategori
- F: Harga Jual
- G: Diskon
- H: Harga Diskon
- I: Deskripsi
- J: Gambar 1
- K: Gambar 2
- L: Gambar 3

Setelah baris produk disimpan, website mengambil data dari API dan menampilkan produk. Jika ingin langsung terlihat, tunggu cache maksimal sekitar 30 menit atau gunakan refresh setelah cache diperbarui.

## Gambar produk
Isi URL gambar pada J/K/L. Gambar 1 adalah foto utama. Gambar 2 dan 3 menjadi slide berikutnya. Di website pelanggan dapat swipe gambar.

Klik foto produk 1x membuka tampilan besar. Klik lagi digunakan untuk kembali ke mode normal. Di tampilan besar tersedia navigasi foto 1/2/3 jika gambar tersedia.

## Menambah / mengganti banner header
Tidak perlu mengedit `index.html`. Edit `banner.json`.

Contoh satu item:
`{"image":"https://.../promo.jpg","title":"Promo Agustus","link":"#produk"}`

Untuk menambah banner, tambahkan item baru di dalam array `[...]` dan pisahkan dengan koma.

Urutan di `banner.json` menentukan urutan slide. Pergantian otomatis berjalan sekitar 4,5 detik dan tombol kiri/kanan tetap tersedia.

## Membagikan produk
Pada kartu produk tersedia:
- WhatsApp: membagikan nama, harga, dan link produk.
- Facebook/Web Share: memakai fitur share perangkat bila tersedia.
- Link: menyalin link produk.
- 📣: membuka Product Poster Generator.

Di Product Poster Generator gunakan `🖼️ Buat Gambar` untuk menghasilkan poster PNG, kemudian `📤 Bagikan Gambar` pada HP yang mendukung file sharing. Jika browser tidak mendukung file sharing, poster dibuat sebagai file PNG dan caption disalin untuk upload manual ke Facebook/TikTok.

## Catatan
Facebook dan TikTok tidak boleh diberi password pengguna. Publikasi otomatis ke akun masing-masing membutuhkan OAuth/API resmi dan izin akun. Website hanya menyiapkan poster, caption, link, dan alur share sampai koneksi resmi tersedia.
