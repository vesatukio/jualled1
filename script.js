const API_URL = "https://script.google.com/macros/s/AKfycbxO1ItQclyBRHKSRso9yDL7WMLowhP1cJHXNtXXEiA8uiBrZnBVYW_fq__nGCcCSES4/exec";

async function loadProduk() {
    const res = await fetch(API_URL);
    const data = await res.json();
    const container = document.getElementById('produk-container');
    
    data.forEach(item => {
        container.innerHTML += `
            <div class="card">
                <span class="discount-badge">${item.diskon}</span>
                <img src="${item.foto}" alt="${item.nama}">
                <div class="card-title">${item.nama}</div>
                <div class="price-container">
                    <span class="old-price">Rp ${item.harga_coret}</span>
                    <span class="final-price">Rp ${item.harga}</span>
                </div>
                <div class="qty-control">
                    <button onclick="ubahQty(this, -1)">-</button>
                    <input type="number" value="0" readonly class="qty-input">
                    <button onclick="ubahQty(this, 1)">+</button>
                </div>
                <button class="btn-order">Klik Order</button>
            </div>
        `;
    });
}

function ubahQty(btn, change) {
    let input = btn.parentElement.querySelector('.qty-input');
    let val = parseInt(input.value) + change;
    input.value = val < 0 ? 0 : val;
    // Tambahkan logika hitung total di sini
}

loadProduk();
