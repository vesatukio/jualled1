// URL data Anda
const API_URL = "https://script.google.com/macros/s/AKfycbxO1ItQclyBRHKSRso9yDL7WMLowhP1cJHXNtXXEiA8uiBrZnBVYW_fq__nGCcCSES4/exec";

// Memuat data saat website terbuka
async function loadProduk() {
    const container = document.getElementById('produk-container');
    const url = "https://script.google.com/macros/s/AKfycbxO1ItQclyBRHKSRso9yDL7WMLowhP1cJHXNtXXEiA8uiBrZnBVYW_fq__nGCcCSES4/exec";
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        
        container.innerHTML = ''; 
        data.forEach(item => {
            // Pastikan item.nama, item.harga, dll sesuai dengan header sheet Anda
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-container">
                    <img src="${item.foto}" alt="Produk">
                </div>
                <div class="card-body">
                    <div class="card-title">${item.nama || 'Produk'}</div>
                    <div class="price-container">
                        <span class="final-price">Rp ${item.harga || '0'}</span>
                    </div>
                    <div class="qty-control">
                        <button class="qty-btn" onclick="updateQty(this, -1)">-</button>
                        <input type="text" class="qty-input" value="0" readonly data-harga="${item.harga.replace(/[^0-9]/g, '')}">
                        <button class="qty-btn" onclick="updateQty(this, 1)">+</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch(e) { console.log("Error:", e); }
}

function updateQty(btn, change) {
    let input = btn.parentElement.querySelector('.qty-input');
    let val = parseInt(input.value) + change;
    input.value = val < 0 ? 0 : val;
    
    let total = 0;
    document.querySelectorAll('.card').forEach(card => {
        let harga = parseInt(card.querySelector('.qty-input').dataset.harga);
        let qty = parseInt(card.querySelector('.qty-input').value);
        total += (harga * qty);
    });
    document.getElementById('total-harga').innerText = 'Rp ' + total.toLocaleString('id-ID');
}

loadProduk();
