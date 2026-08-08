const API_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';

document.addEventListener('DOMContentLoaded', () => {
  initPWA();
  initTheme();
  loadHomeData();
  setupNavigation();
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
    themeToggle.innerHTML = '<span class="material-symbols-rounded fs-5">light_mode</span>';
  }

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = `<span class="material-symbols-rounded fs-5">${isDark ? 'light_mode' : 'dark_mode'}</span>`;
  });
}

function setupNavigation() {
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      // Handle view switching logic here
    });
  });
}

async function loadHomeData() {
  try {
    // Fetch banner, category, and products from Google Apps Script API
    // Example implementation placeholder
    setTimeout(() => {
      document.getElementById('productGrid').innerHTML = `
        <div class="col-6">
          <div class="product-card p-2 position-relative">
            <span class="badge bg-danger position-absolute top-0 end-0 m-2">-20%</span>
            <img src="https://via.placeholder.com/150" class="img-fluid rounded-3 mb-2" alt="Product">
            <h6 class="text-truncate fs-6 mb-1">Modul Driver LED AC 220V High Quality</h6>
            <div class="text-danger fw-bold">Rp45.000</div>
            <div class="text-muted text-decoration-line-through small">Rp56.000</div>
          </div>
        </div>
      `;
    }, 1000);
  } catch (error) {
    console.error('Failed to load data:', error);
  }
}
