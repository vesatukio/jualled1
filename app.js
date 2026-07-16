const API_URL = 'https://script.google.com/macros/s/AKfycbzow1xcIduyHnwMA0WmlCvkz_s81IBu0ALbZ70fxPoXqEsYwtESEMm-S8mg6TZSuw95/exec';
const isAdmin = new URLSearchParams(window.location.search).get('role') === 'admin';
let cart = {}; 
let allProducts = [];
async function fetchProducts() {
    const res = await fetch(`${API_URL}?role=${isAdmin ? 'admin' : 'user'}`);
    allProducts = await res.json();
    renderCategories(); // Panggil fungsi buat tombol kategori
    renderProducts(allProducts);
}

function renderCategories() {
    const container = document.getElementById('category-container');
    // Ambil kategori unik dari data produk
    const categories = ['Semua', ...new Set(allProducts.map(p => p.Kategori))];
    
    container.innerHTML = categories.map(cat => `
        <button class="cat-btn" onclick="filterCategory('${cat}')">${cat}</button>
    `).join('');
}

function filterCategory(kategori) {
    if (kategori === 'Semua') {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.Kategori === kategori);
        renderProducts(filtered);
    }
}
function updateOrder(nama, change) {
    if (!cart[nama]) cart[nama] = 0;
    cart[nama] += change;
    if (cart[nama] < 0) cart[nama] = 0;
    
    // Update angka di kartu produk
    const qtyElement = document.getElementById(`qty-${nama}`);
    if (qtyElement) qtyElement.innerText = cart[nama];
    
    // PENTING: Panggil fungsi untuk update tampilan keranjang
    updateCartUI();
}

function updateCartUI() {
    const cartItemsDiv = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    let html = '';
    let total = 0;
    let count = 0;

    for (const [nama, qty] of Object.entries(cart)) {
        if (qty > 0) {
            const prod = allProducts.find(p => p.Nama === nama);
            if (prod) {
                html += `<p>${nama} x ${qty} = <b>Rp ${(prod.HargaFinal * qty).toLocaleString()}</b></p>`;
                total += (prod.HargaFinal * qty);
                count += qty;
            }
        }
    }
    
    if (cartItemsDiv) cartItemsDiv.innerHTML = html || '<p>Keranjang kosong</p>';
    if (document.getElementById('cart-total')) document.getElementById('cart-total').innerText = 'Total: Rp ' + total.toLocaleString();
    if (cartCount) cartCount.innerText = count;
}

function toggleCart() {
    const box = document.getElementById('cart-box');
    if (box) box.classList.toggle('hidden');
}

// Jalankan saat halaman dimuat
fetchProducts();
// Fungsi untuk membuka modal
function openModal(nama) {
    document.getElementById('edit-nama-produk').innerText = nama;
    document.getElementById('adminModal').classList.remove('hidden');
}

// Fungsi untuk menutup modal
function closeModal() {
    document.getElementById('adminModal').classList.add('hidden');
}

// Fungsi simpan (kirim data ke Apps Script)
async function saveStock() {
    const nama = document.getElementById('edit-nama-produk').innerText;
    const stokBaru = document.getElementById('input-stok-baru').value;
    
    // Pastikan API_URL Anda benar-benar URL Web App dari GAS
    await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors', // Mencegah error CORS
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateStok', nama: nama, stokBaru: stokBaru })
    });
    
    alert("Data terkirim ke server!");
    location.reload(); 
}
