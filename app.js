js_content = """
const products = """ + df.to_json(orient='records') + """;
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
"""

# Save to files
with open("index.html", "w") as f: f.write(html_content)
with open("style.css", "w") as f: f.write(css_content)
with open("app.js", "w") as f: f.write(js_content)
