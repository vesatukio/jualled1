async function loadProduk() {
    const container = document.getElementById('produk-container');
    const url = "https://script.google.com/macros/s/AKfycbxO1ItQclyBRHKSRso9yDL7WMLowhP1cJHXNtXXEiA8uiBrZnBVYW_fq__nGCcCSES4/exec";
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        
        container.innerHTML = ''; 
        data.forEach(item => {
            // PERHATIKAN: Ganti item.nama, item.foto, item.harga, item.diskon sesuai header Google Sheet Anda
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-container">
                    <span class="discount-badge">${item.diskon || '-5%'}</span>
                    <img src="${item.foto}" alt="Produk">
                </div>
                <div class="card-body">
                    <div class="card-title">${item.nama}</div>
                    <div class="price-container">
                        <span class="old-price">Rp ${item.harga_coret}</span>
                        <span class="final-price">Rp ${item.harga}</span>
                    </div>
                    <div class="qty-control">
                        <button onclick="updateQty(this, -1)">-</button>
                        <input type="text" class="qty-input" value="0" readonly data-harga="${item.harga.replace(/[^0-9]/g, '')}">
                        <button onclick="updateQty(this, 1)">+</button>
                    </div>
                    <button class="order-btn" onclick="orderLangsung()">Klik Order</button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch(e) { console.log("Error:", e); }
}
