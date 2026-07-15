// js/auth.js

const Auth = {
    // Fungsi untuk cek status login
    checkLogin: function() {
        const user = localStorage.getItem('duta_admin_session');
        const currentPage = window.location.pathname;

        // Jika tidak login dan mencoba akses selain index.html, tendang ke index
        if (!user && !currentPage.includes('index.html')) {
            window.location.href = 'index.html';
        } 
        // Jika sudah login dan mencoba akses index.html, arahkan ke dashboard
        else if (user && currentPage.includes('index.html')) {
            window.location.href = 'dashboard.html';
        }
    },

    // Fungsi login
    login: async function(email, password) {
        const url = CONFIG.API_URL;
        const response = await fetch(`${url}?action=login&email=${email}&password=${password}`);
        const data = await response.json();

        if (data.status === 'success') {
            localStorage.setItem('duta_admin_session', 'true');
            window.location.href = 'dashboard.html';
        } else {
            alert('Login gagal! Periksa email dan password.');
        }
    },

    // Fungsi logout
    logout: function() {
        localStorage.removeItem('duta_admin_session');
        window.location.href = 'index.html';
    }
};

// Panggil checkLogin saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    Auth.checkLogin();
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            Auth.login(email, password);
        });
    }
});
