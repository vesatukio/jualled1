const API_URL = 'https://script.google.com/macros/s/AKfycbzow1xcIduyHnwMA0WmlCvkz_s81IBu0ALbZ70fxPoXqEsYwtESEMm-S8mg6TZSuw95/exec';
const isAdmin = new URLSearchParams(window.location.search).get('role') === 'admin';

async function fetchProducts() {
    const res = await fetch(`${API_URL}?role=${isAdmin ? 'admin' : 'user'}`);
    const data = await res.json();
    const grid = document.getElementById('product-grid');
    
    grid.innerHTML = data.map(p => `
        <div class="product-card">
            ${!isAdmin ? `<div class="discount-badge">${p.Diskon}%</div>` : ''}
            <img src="${p.Gambar}" style="width:100%">
            <h4>${p.Nama}</h4>
            ${isAdmin ? `<p>Modal: ${p.HargaModal}</p>` : `<div class="price-old">Rp ${p.HargaAsli}</div>`}
            <div class="price-final">Rp ${p.HargaFinal}</div>
            <p>Stok: ${p.Stok}</p>
            ${p.Stok > 0 ? `<button onclick="addToCart('${p.Nama}')">+</button> <span>0</span> <button>-</button>` : '<button disabled>Stok Kosong</button>'}
        </div>
    `).join('');
}

fetchProducts();
