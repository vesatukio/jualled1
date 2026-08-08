const API_URL = 'const API_URL = 'https://script.google.com/macros/s/AKfycbyM5sG2IcP5-ut8nuAt-htHz-bVG70EPd4aKXMuXbVuhdFsdPZ5F8F4ium5EErQha9u8A/exec';'; 

document.addEventListener('DOMContentLoaded', () => {
  initPWA();
  initTheme();
  setupNavigation();
  loadProductData();
});

function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('Service Worker Registered'))
      .catch((err) => console.log('SW Registration Failed', err));
  }
}

function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const currentTheme = localStorage.getItem('theme') || 'light';
  if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if(themeToggle) themeToggle.innerHTML = '<span class="material-symbols-rounded fs-5">light_mode</span>';
  }

  if(themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      themeToggle.innerHTML = `<span class="material-symbols-rounded fs-5">${isDark ? 'light_mode' : 'dark_mode'}</span>`;
    });
  }
}

function setupNavigation() {
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetID = item.getAttribute('data-target');
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      switchView(targetID);
    });
  });
}

function switchView(targetID) {
  document.querySelectorAll('.view-section').forEach(view => {
    if (view.id === targetID) {
      view.classList.remove('d-none');
    } else {
      view.classList.add('d-none');
    }
  });
  window.scrollTo(0, 0);
  if(targetID === 'adminView') {
    loadAdminProductList();
  }
}

// Ambil dan Tampilkan Produk di Beranda
async function loadProductData() {
  const productGrid = document.getElementById('productGrid');
  try {
    const response = await fetch(`${API_URL}?sheet=PRODUK`);
    const data = await response.json();

    if (data && data.length > 0) {
      productGrid.innerHTML = data.map(item => `
        <div class="col-6">
          <div class="product-card p-2 shadow-sm rounded-4 position-relative bg-card h-100 d-flex flex-column">
            <img src="${item.Gambar || 'https://via.placeholder.com/150'}" class="img-fluid rounded-3 mb-2 w-100 object-fit-cover" style="height: 140px;" alt="${item.Nama_Produk}">
            <h6 class="text-truncate fs-6 mb-1">${item.Nama_Produk}</h6>
            <div class="text-danger fw-bold mt-auto">Rp${parseInt(item.Harga || 0).toLocaleString()}</div>
            <button class="btn btn-sm btn-primary w-100 mt-2 text-white rounded-3 fw-semibold" onclick="beliProduk('${item.ID_Produk}')">Beli</button>
          </div>
        </div>
      `).join('');
    } else {
      productGrid.innerHTML = '<p class="text-center text-muted w-100 py-4">Belum ada produk tersedia.</p>';
    }
  } catch (error) {
    console.error('Gagal mengambil data produk:', error);
    productGrid.innerHTML = '<p class="text-center text-muted w-100 py-4">Gagal memuat produk dari server.</p>';
  }
}

// Tambah Produk Baru (Admin)
async function tambahProduk() {
  const id = document.getElementById('adminId').value || "PROD-" + Date.now();
  const nama = document.getElementById('adminNama').value;
  const harga = document.getElementById('adminHarga').value;
  const gambar = document.getElementById('adminGambar').value;

  if (!nama || !harga) {
    Swal.fire('Peringatan', 'Nama dan Harga produk wajib diisi!', 'warning');
    return;
  }

  Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        sheet: "PRODUK",
        action: "upsert", // Mendukung tambah / update
        payload: {
          ID_Produk: id,
          Nama_Produk: nama,
          Harga: harga,
          Gambar: gambar,
          Stok: 10
        }
      })
    });
    
    const result = await response.json();
    if (result.status === "success") {
      Swal.fire('Berhasil!', 'Data produk berhasil disimpan ke Google Sheets.', 'success');
      resetAdminForm();
      loadProductData();
      loadAdminProductList();
    } else {
      Swal.fire('Gagal', 'Gagal menyimpan data.', 'error');
    }
  } catch (error) {
    Swal.fire('Error', 'Terjadi kesalahan koneksi.', 'error');
  }
}

// Tampilkan Daftar Produk di Dashboard Admin untuk Edit/Hapus
async function loadAdminProductList() {
  const container = document.getElementById('adminProductList');
  if(!container) return;
  
  container.innerHTML = '<p class="text-center text-muted small">Memuat daftar produk...</p>';
  try {
    const response = await fetch(`${API_URL}?sheet=PRODUK`);
    const data = await response.json();

    if (data && data.length > 0) {
      container.innerHTML = data.map(item => `
        <div class="d-flex align-items-center justify-content-between p-2 mb-2 border rounded-3 bg-body">
          <div class="text-truncate" style="max-width: 60%;">
            <strong>${item.Nama_Produk}</strong><br>
            <small class="text-danger">Rp${parseInt(item.Harga || 0).toLocaleString()}</small>
          </div>
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-outline-primary py-0 px-2" onclick="editProduk('${item.ID_Produk}', '${item.Nama_Produk}', '${item.Harga}', '${item.Gambar}')">Edit</button>
            <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="hapusProduk('${item.ID_Produk}')">Hapus</button>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p class="text-center text-muted small">Belum ada produk.</p>';
    }
  } catch (e) {
    container.innerHTML = '<p class="text-center text-muted small">Gagal memuat daftar.</p>';
  }
}

function editProduk(id, nama, harga, gambar) {
  document.getElementById('adminId').value = id;
  document.getElementById('adminNama').value = nama;
  document.getElementById('adminHarga').value = harga;
  document.getElementById('adminGambar').value = gambar;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function hapusProduk(id) {
  const confirm = await Swal.fire({
    title: 'Hapus Produk?',
    text: "Data akan dihapus dari Google Sheets.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ee4d2d',
    cancelButtonText: 'Batal',
    confirmButtonText: 'Ya, Hapus'
  });

  if(confirm.isConfirmed) {
    Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ sheet: "PRODUK", action: "delete", payload: { ID_Produk: id } })
      });
      const result = await response.json();
      if(result.status === "success") {
        Swal.fire('Terhapus!', 'Produk berhasil dihapus.', 'success');
        loadProductData();
        loadAdminProductList();
      }
    } catch(e) {
      Swal.fire('Gagal', 'Terjadi kesalahan.', 'error');
    }
  }
}

function resetAdminForm() {
  document.getElementById('adminId').value = '';
  document.getElementById('adminNama').value = '';
  document.getElementById('adminHarga').value = '';
  document.getElementById('adminGambar').value = '';
}

function beliProduk(id) {
  Swal.fire('Informasi', 'Fitur keranjang & checkout aktif. Produk dipilih: ' + id, 'info');
}
