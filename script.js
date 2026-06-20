// URL data Anda
const API_URL = "https://script.google.com/macros/s/AKfycbxO1ItQclyBRHKSRso9yDL7WMLowhP1cJHXNtXXEiA8uiBrZnBVYW_fq__nGCcCSES4/exec";

// Memuat data saat website terbuka
async function loadProduk() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json(); // Data dalam bentuk array
        
        const grid = document.querySelector('.produk-grid');
        grid.innerHTML = ''; // Kosongkan grid sebelum diisi

        data.forEach(item => {
            // Membuat elemen kartu
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="discount-badge">-5%</div>
                <img src="${item.foto}" alt="${item.nama}">
                <div class="card-body">
                    <p class="brand">Duta Terang LED</p>
                    <h3 class="card-title">${item.nama}</h3>
                    <div class="price-box">
                        <span class="old-price">Rp ${item.harga_coret}</span>
                        <span class="price">Rp ${item.harga}</span>
                    </div>
                    <div class="qty-group">
                        <button onclick="ubahQty(this, -1)">-</button>
                        <input type="number" value="0" class="qty-input" readonly>
                        <button onclick="ubahQty(this, 1)">+</button>
                    </div>
                    <button class="order-btn">Klik Order</button>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error("Gagal mengambil data:", error);
    }
}

// Panggil fungsi
loadProduk();
