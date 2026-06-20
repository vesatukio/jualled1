async function loadProduk() {
    const container = document.getElementById('produk-container');
    const url = "https://script.google.com/macros/s/AKfycbxO1ItQclyBRHKSRso9yDL7WMLowhP1cJHXNtXXEiA8uiBrZnBVYW_fq__nGCcCSES4/exec";
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        
        // DEBUG: Ini akan mencetak isi data ke Console browser (F12)
        // Anda bisa lihat nama kolom yang benar di sini
        console.log("Data diterima:", data[0]);
        
        container.innerHTML = ''; 
        data.forEach(item => {
            // Kita gunakan variabel untuk menampung nilai, 
            // jika item.nama undefined, ia akan mencoba item.Nama atau item.nama_produk
            const nama = item.nama || item.Nama || item.Nama_Barang || "Produk";
            const harga = item.harga || item.Harga || "0";
            const foto = item.foto || item.Foto || "https://via.placeholder.com/150";
            
            // Bersihkan harga dari titik/koma untuk perhitungan
            const hargaBersih = harga.toString().replace(/[^0-9]/g, '');

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-container">
                    <img src="${foto}" alt="${nama}">
                </div>
                <div class="card-body">
                    <div class="card-title">${nama}</div>
                    <div class="price-container">
                        <span class="final-price">Rp ${harga}</span>
                    </div>
                    <div class="qty-control">
                        <button class="qty-btn" onclick="updateQty(this, -1)">-</button>
                        <input type="text" class="qty-input" value="0" readonly data-harga="${hargaBersih}">
                        <button class="qty-btn" onclick="updateQty(this, 1)">+</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch(e) { 
        console.error("Gagal memuat:", e); 
        container.innerHTML = "Gagal memuat data. Periksa Google Script Anda.";
    }
}

function updateQty(btn, change) {
    let input = btn.parentElement.querySelector('.qty-input');
    let val = parseInt(input.value) + change;
    input.value = val < 0 ? 0 : val;
    
    let total = 0;
    document.querySelectorAll('.qty-input').forEach(input => {
        let harga = parseInt(input.dataset.harga) || 0;
        let qty = parseInt(input.value) || 0;
        total += (harga * qty);
    });
    document.getElementById('total-harga').innerText = 'Rp ' + total.toLocaleString('id-ID');
}

loadProduk();
