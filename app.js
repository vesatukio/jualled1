const API_URL = "https://script.google.com/macros/s/AKfycbywjIfrH7oiESl9tzJX24LR27bM_N9pV1TDiczjyMDDr5-pkupjlErpEYgYoe4Tue68/exec";

// Sample Data Produk untuk memudahkan preview & edit awal
const sampleProducts = [
  { id_produk: "P001", nama: "Driver LED Power Supply 30W Slim", harga: 45000, gambar: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=300" },
  { id_produk: "P002", nama: "Modul LED HPL 10W White High Power", harga: 12000, gambar: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300" },
  { id_produk: "P003", nama: "Kabel AC SNI Serabut Murni 2 Meter", harga: 15000, gambar: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300" },
  { id_produk: "P004", nama: "Kit Power Amplifier Mini Bluetooth", harga: 65000, gambar: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=300" }
];

let allProducts = [];
let cart = JSON.parse(localStorage.getItem('dt_cart')) || [];

document.addEventListener("DOMContentLoaded", () => {
  initPWA();
  fetchProducts();
  setupRouter();
  setupSearch();
  updateCartBadge();
});

function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log("Service Worker Registered"))
      .catch(err => console.log("SW Registration failed:", err));
  }
}

async function fetchProducts() {
  try {
    const res = await fetch(`${API_URL}?action=getProducts`);
    const json = await res.json();
    if (json.status === "success" && json.data.length > 0) {
      allProducts = json.data;
    } else {
      allProducts = sampleProducts; // Gunakan sample jika sheet kosong
    }
    renderProducts(allProducts);
  } catch (err) {
    console.warn("Mode Offline: Menggunakan data lokal/cache.");
    allProducts = sampleProducts;
    renderProducts(allProducts);
  }
}

function renderProducts(products) {
  const grid = document.getElementById("product-grid");
  if (!grid) return;
  
  grid.innerHTML = products.map(p => `
    <div class="product-card" onclick="addToCart('${p.id_produk}', '${p.nama}', ${p.harga}, '${p.gambar || 'https://via.placeholder.com/150'}')">
      <div class="product-img-wrapper">
        <img src="${p.gambar || 'https://via.placeholder.com/150'}" class="product-img" alt="${p.nama}" loading="lazy">
      </div>
      <div class="product-info">
        <div class="product-title">${p.nama}</div>
        <div class="product-price">Rp ${Number(p.harga).toLocaleString('id-ID')}</div>
        <button class="btn-primary">+ Keranjang</button>
      </div>
    </div>
  `).join('');
}

function setupRouter() {
  const navItems = document.querySelectorAll('.nav-item');
  const views = {
    'nav-home': document.getElementById('view-home'),
    'nav-category': document.getElementById('view-category'),
    'nav-cart': document.getElementById('view-cart'),
    'nav-orders': document.getElementById('view-orders'),
    'nav-account': document.getElementById('view-account')
  };

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      const targetId = item.getAttribute('data-target');
      Object.keys(views).forEach(key => {
        if (views[key]) {
          views[key].style.display = (key === targetId) ? 'block' : 'none';
        }
      });

      if (targetId === 'nav-cart') renderCartView();
    });
  });
}

function setupSearch() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = allProducts.filter(p => p.nama.toLowerCase().includes(keyword));
    renderProducts(filtered);
  });
}

function addToCart(id, nama, harga, gambar) {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, nama, harga, gambar, qty: 1 });
  }
  localStorage.setItem('dt_cart', JSON.stringify(cart));
  updateCartBadge();
  showToast(`Berhasil menambahkan ${nama}!`);
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  if (badge) {
    badge.textContent = totalQty;
    badge.style.display = totalQty > 0 ? 'inline-block' : 'none';
  }
}

function renderCartView() {
  const cartContainer = document.getElementById('cart-items-container');
  if (!cartContainer) return;

  if (cart.length === 0) {
    cartContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted); font-size: 13px;">Keranjang belanja Anda masih kosong.</div>`;
    return;
  }

  cartContainer.innerHTML = cart.map((item, index) => `
    <div style="display: flex; gap: 10px; background: var(--card-bg); padding: 10px; border-radius: 12px; margin-bottom: 8px; border: 1px solid var(--border-color); align-items: center;">
      <img src="${item.gambar}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
      <div style="flex: 1;">
        <div style="font-size: 12px; font-weight: 500; margin-bottom: 2px;">${item.nama}</div>
        <div style="color: var(--primary); font-weight: 700; font-size: 12px;">Rp ${Number(item.harga * item.qty).toLocaleString('id-ID')}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <button onclick="changeQty(${index}, -1)" style="padding: 2px 6px; border: 1px solid var(--border-color); background: transparent; border-radius: 4px; cursor:pointer;">-</button>
        <span style="font-size: 12px; font-weight: 600;">${item.qty}</span>
        <button onclick="changeQty(${index}, 1)" style="padding: 2px 6px; border: 1px solid var(--border-color); background: transparent; border-radius: 4px; cursor:pointer;">+</button>
      </div>
    </div>
  `).join('') + `
    <button class="btn-primary" onclick="checkoutWhatsApp()" style="margin-top: 12px; padding: 12px;">Checkout via WhatsApp</button>
  `;
}

function changeQty(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  localStorage.setItem('dt_cart', JSON.stringify(cart));
  updateCartBadge();
  renderCartView();
}

function checkoutWhatsApp() {
  if (cart.length === 0) return;
  const phone = "6281234567890"; // Ganti dengan nomor WhatsApp toko Anda
  let text = "Halo Duta Terang, saya ingin memesan produk berikut:\n\n";
  let total = 0;
  
  cart.forEach((item, i) => {
    text += `${i + 1}. *${item.nama}* (${item.qty}x) - Rp ${Number(item.harga * item.qty).toLocaleString('id-ID')}\n`;
    total += item.harga * item.qty;
  });
  
  text += `\n*Total Belanja: Rp ${Number(total).toLocaleString('id-ID')}*\n\nMohon informasi ketersediaannya. Terima kasih!`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
}

function showToast(message) {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.cssText = "position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: #222; color: #fff; padding: 8px 16px; border-radius: 20px; font-size: 12px; z-index: 2000; box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: 0.3s;";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = "1";
  setTimeout(() => { toast.style.opacity = "0"; }, 2000);
}
