const API_URL = 'https://script.google.com/macros/s/AKfycbxQI9ONgYCNsO4oSfFGxZ7GmvWieVP0TFIRFrAHiPOW/exec'; 
// Catatan: Pastikan URL diakhiri dengan /exec, bukan /dev untuk akses publik yang stabil.

document.addEventListener('DOMContentLoaded', () => {
  initPWA();
  initTheme();
  setupNavigation();
  loadProductData(); // Memanggil fungsi untuk ambil data dari Sheets
});

// Fungsi mengambil data produk dari Google Sheets
async function loadProductData() {
  const productGrid = document.getElementById('productGrid');
  
  try {
    const response = await fetch(`${API_URL}?sheet=PRODUK`);
    const data = await response.json();

    if (data.length > 0) {
      productGrid.innerHTML = data.map(item => `
        <div class="col-6">
          <div class="product-card p-2 shadow-sm">
            <img src="${item.Gambar || 'https://via.placeholder.com/150'}" class="img-fluid rounded-3 mb-2 w-100" alt="${item.Nama_Produk}">
            <h6 class="text-truncate fs-6 mb-1">${item.Nama_Produk}</h6>
            <div class="text-danger fw-bold">Rp${parseInt(item.Harga).toLocaleString()}</div>
            <button class="btn btn-sm btn-primary w-100 mt-2 text-white">Beli</button>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Gagal mengambil data produk:', error);
    productGrid.innerHTML = '<p class="text-center w-100">Gagal memuat produk. Periksa koneksi.</p>';
  }
}

// ... (tambahkan fungsi initPWA, initTheme, setupNavigation dari kode sebelumnya)
