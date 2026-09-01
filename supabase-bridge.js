/* DUTA LED - Supabase bridge
 * Menjembatani app.js lama agar katalog berpindah dari Google Sheet ke Supabase
 * tanpa mengubah logika katalog, keranjang, checkout, atau UI.
 */
(() => {
  "use strict";

  const SUPABASE_URL = "https://opgeeqnucxrdqcgwcuge.supabase.co";
  const SUPABASE_KEY = "sb_publishable_uqah55SK8ZjyugWprFnFMA_QnyVdCLA";
  const OLD_API_PREFIX = "https://script.google.com/macros/s/AKfycbyr4eSauu1RneZIrwwPVBilx21kWNrauE9V40D17dmrntqTu4U3OGi4fafAYHXcd-A/exec";

  const originalFetch = window.fetch.bind(window);

  async function supabaseGet(path) {
    const response = await originalFetch(SUPABASE_URL + path, {
      method: "GET",
      cache: "no-store",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY
      }
    });

    if (!response.ok) {
      throw new Error("Supabase HTTP " + response.status);
    }

    return response.json();
  }

  function normalizeRows(products, categories) {
    const categoryMap = new Map(
      (Array.isArray(categories) ? categories : []).map(c => [String(c.id), String(c.nama || "Lainnya")])
    );

    return (Array.isArray(products) ? products : [])
      .filter(p => p && p.is_active !== false)
      .map(p => {
        const fotos = Array.isArray(p.foto_urls) ? p.foto_urls.filter(Boolean) : [];
        const hargaJual = Number(p.harga_jual) || 0;
        const diskon = Number(p.diskon) || 0;
        const hargaDiskon = diskon > 0
          ? Math.round(hargaJual - (hargaJual * diskon / 100))
          : hargaJual;

        return {
          id: String(p.id ?? ""),
          nama: String(p.nama ?? "").trim(),
          kategori: categoryMap.get(String(p.kategori_id ?? "")) || String(p.kategori_id || "Lainnya"),
          hargaModal: Number(p.harga_pokok) || 0,
          laba: hargaJual - (Number(p.harga_pokok) || 0),
          hargaJual,
          diskon,
          hargaDiskon,
          deskripsi: String(p.deskripsi ?? ""),
          gambar1: String(fotos[0] || ""),
          gambar2: String(fotos[1] || ""),
          gambar3: String(fotos[2] || "")
        };
      })
      .filter(p => p.nama);
  }

  window.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : input?.url;

    if (url && url.startsWith(OLD_API_PREFIX)) {
      try {
        const [products, categories] = await Promise.all([
          supabaseGet("/rest/v1/produk?select=id,nama,deskripsi,harga_jual,harga_pokok,diskon,stok,sku,berat,foto_urls,kategori_id,is_active&is_active=eq.true&order=id.asc"),
          supabaseGet("/rest/v1/kategori?select=id,nama")
        ]);

        return new Response(JSON.stringify(normalizeRows(products, categories)), {
          status: 200,
          headers: { "Content-Type": "application/json; charset=utf-8" }
        });
      } catch (error) {
        console.error("Supabase katalog gagal:", error);
        throw error;
      }
    }

    return originalFetch(input, init);
  };
})();
