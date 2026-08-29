(function () {
  "use strict";

  const API_URL = "https://script.google.com/macros/s/AKfycbyr4eSauu1RneZIzwwPVBilx21kWNrauE9V40D17dmrntqTu4U3OGi4fafAYHXcd-A/exec";
  const SITE = "https://dutaled.my.id";

  function text(v) { return String(v == null ? "" : v).trim(); }
  function get(row, ...keys) { for (const k of keys) if (text(row[k])) return text(row[k]); return ""; }
  function num(v) { return Number(String(v || "").replace(/[^0-9.-]/g, "")) || 0; }
  function rupiah(n) { return "Rp" + Math.round(n).toLocaleString("id-ID"); }
  function meta(name, content, property) {
    const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
    let el = document.head.querySelector(selector);
    if (!el) { el = document.createElement("meta"); if (property) el.setAttribute("property", property); else el.setAttribute("name", name); document.head.appendChild(el); }
    el.setAttribute("content", content);
  }
  function setSchema(data) {
    let el = document.getElementById("productSchema");
    if (!el) { el = document.createElement("script"); el.id = "productSchema"; el.type = "application/ld+json"; document.head.appendChild(el); }
    el.textContent = JSON.stringify(data);
  }

  async function run() {
    const id = new URLSearchParams(location.search).get("id");
    if (!id) return;
    try {
      const response = await fetch(API_URL + "?t=seo-client-" + Date.now(), { cache: "no-store" });
      const payload = await response.json();
      const rows = Array.isArray(payload) ? payload : payload.data;
      if (!Array.isArray(rows)) return;
      const row = rows.find(r => get(r, "ID", "id", "Id") === text(id));
      if (!row) return;

      const name = get(row, "nama", "Nama", "NAMA");
      const category = get(row, "kategori", "Kategori", "KATEGORI") || "Sparepart LED";
      const desc = get(row, "deskripsi", "Deskripsi", "diskipsi") || `${name} kategori ${category}. Tersedia eceran dan grosir di Duta LED.`;
      const normal = num(get(row, "harga jual", "hargaJual", "HargaJual"));
      const sale = num(get(row, "harga diskon", "hargaDiskon", "HargaDiskon"));
      const price = sale > 0 && sale < normal ? sale : normal;
      const image = get(row, "gambar1", "Gambar1") || SITE + "/image/no-image.png";
      const url = `${SITE}/produk/${encodeURIComponent(id)}/`;
      const title = `${name} | Harga ${rupiah(price)} | Duta LED`;

      document.title = title;
      meta("description", desc.slice(0, 155));
      meta("robots", "index,follow,max-image-preview:large");
      meta("og:title", title, "og:title");
      meta("og:description", desc.slice(0, 200), "og:description");
      meta("og:type", "product", "og:type");
      meta("og:url", url, "og:url");
      meta("og:image", image, "og:image");

      let canonical = document.head.querySelector("link[rel=canonical]");
      if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
      canonical.href = url;

      setSchema({
        "@context": "https://schema.org",
        "@type": "Product",
        name,
        description: desc,
        image: [image].filter(Boolean),
        category,
        url,
        brand: { "@type": "Brand", name: "Duta LED" },
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: "IDR",
          price,
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@type": "Organization", name: "Duta LED", url: SITE }
        }
      });

      // Make product sharing point to the clean SEO URL.
      document.querySelectorAll(".share-copy").forEach(btn => {
        btn.onclick = async () => {
          try { await navigator.clipboard.writeText(url); btn.textContent = "✓"; setTimeout(() => btn.textContent = "🔗", 1200); }
          catch (_) { window.prompt("Salin link produk:", url); }
        };
      });
      document.querySelectorAll(".share-fb").forEach(btn => {
        btn.onclick = () => window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url), "_blank", "noopener,noreferrer");
      });
    } catch (e) {
      console.warn("SEO produk gagal dimuat", e);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
