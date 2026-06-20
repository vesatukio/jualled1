const API_URL = "https://script.google.com/macros/s/AKfycbxO1ItQclyBRHKSRso9yDL7WMLowhP1cJHXNtXXEiA8uiBrZnBVYW_fq__nGCcCSES4/exec";

async function loadProduk() {
    const container = document.getElementById('produk-container');
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Gagal ambil data");
        const data = await res.json();
        
        container.innerHTML = ''; 
        data.forEach(item => {
            // Bersihkan harga dari titik agar bisa dihitung (contoh: 3.990 jadi 3990)
            const hargaBersih = (item.harga || "0").toString().replace(/\./g, '').replace(/[^0-9]/g, '');
            
            container.innerHTML += `
                <div class="card">
                    <span class="discount-badge">${item.diskon || '-5%'}</span>
                    <img src="${item.foto}" alt="${item.nama}" onerror="this.src='https://via.placeholder.com/150'">
                    <div class="card-title">${item.nama || 'Produk'}</div>
                    <div class="price-container">
                        <span class="old-price">Rp ${item.harga_coret || ''}</span>
                        <span class="final-price">Rp ${item.harga || '0'}</span>
                    </div>
                    <div class="qty-control">
                        <button onclick="ubahQty(this, -1)">-</button>
                        <input type="number" value="0" readonly class="qty-input" data-harga="${hargaBersih}">
                        <button onclick="ubahQty(this, 1)">+</button>
                    </div>
                    <button class="btn-order">Klik Order</button>
                </div>
            `;
        });
    } catch(e) {
        console.error("Error:", e);
        container.innerHTML = "<p>Gagal memuat produk. Cek koneksi internet Anda.</p>";
    }
}

function ubahQty(btn, change) {
    let input = btn.parentElement.querySelector('.qty-input');
    let val = parseInt(input.value) + change;
    input.value = val < 0 ? 0 : val;
    
    let total = 0;
    document.querySelectorAll('.qty-input').forEach(input => {
        // Ambil data-harga yang sudah bersih
        let harga = parseInt(input.dataset.harga) || 0;
        let qty = parseInt(input.value) || 0;
        total += (harga * qty);
    });
    document.getElementById('total-harga').innerText = 'Rp ' + total.toLocaleString('id-ID');
}

loadProduk();
