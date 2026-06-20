const API_URL = "https://script.google.com/macros/s/AKfycbxO1ItQclyBRHKSRso9yDL7WMLowhP1cJHXNtXXEiA8uiBrZnBVYW_fq__nGCcCSES4/exec";

async function loadProduk() {
    const res = await fetch(API_URL);
    const data = await res.json();
    const container = document.getElementById('produk-container');
    
    container.innerHTML = ''; 
    data.forEach(item => {
        // Jika data undefined, berikan nilai default
        const nama = item.nama || "Produk";
        const harga = item.harga || "0";
        const hargaCoret = item.harga_coret || "";
        const diskon = item.diskon || "-5%";
        const foto = item.foto || "https://via.placeholder.com/150";

        container.innerHTML += `
            <div class="card">
                <span class="discount-badge">${diskon}</span>
                <img src="${foto}" alt="${nama}">
                <div class="card-title">${nama}</div>
                <div class="price-container">
                    <span class="old-price">Rp ${hargaCoret}</span>
                    <span class="final-price">Rp ${harga}</span>
                </div>
                <div class="qty-control">
                    <button onclick="ubahQty(this, -1)">-</button>
                    <input type="number" value="0" readonly class="qty-input" data-harga="${harga.replace(/\./g, '')}">
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
    
    let total = 0;
    document.querySelectorAll('.qty-input').forEach(input => {
        total += parseInt(input.dataset.harga || 0) * parseInt(input.value || 0);
    });
    document.getElementById('total-harga').innerText = 'Rp ' + total.toLocaleString('id-ID');
}

loadProduk();
