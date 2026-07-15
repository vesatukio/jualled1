// js/api.js

const API = {
    // Fungsi umum untuk fetch ke Google Apps Script
    fetchData: async function(params) {
        try {
            const url = new URL(CONFIG.API_URL);
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
            
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error("Error fetching data:", error);
            return { status: "error", message: error.message };
        }
    },

    // Fungsi untuk mendapatkan semua produk
    getProduk: async function() {
        return await this.fetchData({ action: 'getProduk' });
    },

    // Fungsi untuk menambah/edit produk (POST)
    saveProduk: async function(data) {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        return await response.json();
    }
};
