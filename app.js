const products = [{"ID":1,"SKU":"JS5W","Nama_Barang":"LED AC JS 5W","Harga_Asli":3000,"Diskon_Persen":2,"Harga_Final":2940,"Gambar":"https:\/\/png.pngtree.com\/png-vector\/20230831\/ourmid\/pngtree-light-bulb-clipart-png-image_9230588.png"},{"ID":2,"SKU":"FPL5W","Nama_Barang":"LED AC FPL 5W","Harga_Asli":3480,"Diskon_Persen":2,"Harga_Final":3410,"Gambar":"https:\/\/png.pngtree.com\/png-vector\/20230831\/ourmid\/pngtree-light-bulb-clipart-png-image_9230588.png"},{"ID":3,"SKU":"FPL7W","Nama_Barang":"LED AC FPL 7W","Harga_Asli":4200,"Diskon_Persen":2,"Harga_Final":4116,"Gambar":"https:\/\/png.pngtree.com\/png-vector\/20230831\/ourmid\/pngtree-light-bulb-clipart-png-image_9230588.png"},{"ID":4,"SKU":"FPL9W","Nama_Barang":"LED AC FPL 9W","Harga_Asli":5400,"Diskon_Persen":2,"Harga_Final":5292,"Gambar":"https:\/\/png.pngtree.com\/png-vector\/20230831\/ourmid\/pngtree-light-bulb-clipart-png-image_9230588.png"},{"ID":5,"SKU":"FPL12W","Nama_Barang":"LED AC FPL 12W","Harga_Asli":6720,"Diskon_Persen":2,"Harga_Final":6588,"Gambar":"https:\/\/png.pngtree.com\/png-vector\/20230831\/ourmid\/pngtree-light-bulb-clipart-png-image_9230588.png"},{"ID":6,"SKU":"FPL15W","Nama_Barang":"LED AC FPL 15W","Harga_Asli":8760,"Diskon_Persen":2,"Harga_Final":8585,"Gambar":"https:\/\/png.pngtree.com\/png-vector\/20230831\/ourmid\/pngtree-light-bulb-clipart-png-image_9230588.png"},{"ID":7,"SKU":"FPL18W","Nama_Barang":"LED AC FPL 18W","Harga_Asli":10200,"Diskon_Persen":2,"Harga_Final":9996,"Gambar":"https:\/\/png.pngtree.com\/png-vector\/20230831\/ourmid\/pngtree-light-bulb-clipart-png-image_9230588.png"},{"ID":8,"SKU":"FPL24W","Nama_Barang":"LED AC FPL 24W","Harga_Asli":10560,"Diskon_Persen":2,"Harga_Final":10349,"Gambar":"https:\/\/png.pngtree.com\/png-vector\/20230831\/ourmid\/pngtree-light-bulb-clipart-png-image_9230588.png"},{"ID":9,"SKU":"FPL30W","Nama_Barang":"LED AC FPL 30W","Harga_Asli":18000,"Diskon_Persen":2,"Harga_Final":17640,"Gambar":"https:\/\/png.pngtree.com\/png-vector\/20230831\/ourmid\/pngtree-light-bulb-clipart-png-image_9230588.png"},{"ID":10,"SKU":"FPL40W","Nama_Barang":"LED AC FPL 40W","Harga_Asli":19200,"Diskon_Persen":2,"Harga_Final":18816,"Gambar":"https:\/\/png.pngtree.com\/png-vector\/20230831\/ourmid\/pngtree-light-bulb-clipart-png-image_9230588.png"},{"ID":11,"SKU":"FPL50W","Nama_Barang":"LED AC FPL 50W","Harga_Asli":22800,"Diskon_Persen":2,"Harga_Final":22344,"Gambar":"https:\/\/png.pngtree.com\/png-vector\/20230831\/ourmid\/pngtree-light-bulb-clipart-png-image_9230588.png"}];
const cart = {};

function renderProducts() {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = products.map(p => `
        <div class="product-card">
            <div class="discount-badge">${p.Diskon_Persen}%</div>
            <img src="${p.Gambar}" alt="${p.Nama_Barang}" style="width:100%">
            <h4>${p.Nama_Barang}</h4>
            <div class="price-old">Rp ${p.Harga_Asli}</div>
            <div class="price-final">Rp ${p.Harga_Final}</div>
            <button onclick="updateCart('${p.SKU}', 1)">+</button>
            <span id="qty-${p.SKU}">0</span>
            <button onclick="updateCart('${p.SKU}', -1)">-</button>
        </div>
    `).join('');
}

function updateCart(sku, change) {
    if(!cart[sku]) cart[sku] = 0;
    cart[sku] += change;
    if(cart[sku] < 0) cart[sku] = 0;
    document.getElementById(`qty-${sku}`).innerText = cart[sku];
    // Update total logic here
}

function toggleCart() {
    const box = document.getElementById('cart-box');
    box.style.display = box.style.display === 'block' ? 'none' : 'block';
}

renderProducts();
