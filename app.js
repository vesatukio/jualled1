const scriptURL = 'https://script.google.com/macros/s/AKfycbxO1ItQclyBRHKSRso9yDL7WMLowhP1cJHXNtXXEiA8uiBrZnBVYW_fq__nGCcCSES4/exec';
const container = document.getElementById('product-container');

// Fungsi untuk mengambil data
async function ambilData() {
    try {
        const response = await fetch(scriptURL);
        const data = await response.json(); // Mengasumsikan data berbentuk array JSON
        tampilkanProduk(data);
    } catch (error) {
        console.error('Gagal mengambil data:', error);
        container.innerHTML = "<p>Gagal memuat produk. Cek koneksi atau izin script.</p>";
    }
}

function tampilkanProduk(data) {
    container.innerHTML = "";
    
    // Debugging: Tampilkan data mentah di halaman agar Anda bisa melihat nama kolomnya
    const debug = document.createElement('pre');
    debug.textContent = JSON.stringify(data[0], null, 2); // Menampilkan contoh 1 data pertama
    container.appendChild(debug);

    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // JANGAN UBAH DULU BAGIAN INI, biarkan 'undefined' muncul, 
        // tapi lihat hasil dari 'debug' di atas untuk tahu nama kolom yang benar
        card.innerHTML = `<h3>${item.nama}</h3><p>${item.harga}</p>`;
        container.appendChild(card);
    });
}
// Panggil fungsi
ambilData();
