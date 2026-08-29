import json
import html
import re
import shutil
import urllib.request
from pathlib import Path

API_URL = "https://script.google.com/macros/s/AKfycbyr4eSauu1RneZIrwwPVBilx21kWNrauE9V40D17dmrntqTu4U3OGi4fafAYHXcd-A/exec"
SITE = "https://dutaled.my.id"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "produk"


def clean(v):
    return str(v or "").strip()


def money(v):
    try:
        n = int(float(str(v).replace(".", "").replace(",", "")))
    except Exception:
        n = 0
    return n


def rupiah(n):
    return "Rp" + f"{int(n):,}".replace(",", ".")


def slug(v):
    s = re.sub(r"[^a-z0-9]+", "-", clean(v).lower()).strip("-")
    return s or "produk"


def esc(v):
    return html.escape(clean(v), quote=True)


def get(row, *names):
    for name in names:
        if name in row and clean(row[name]):
            return clean(row[name])
    return ""


def main():
    req = urllib.request.Request(API_URL + "?t=seo", headers={"User-Agent": "DutaLED-SEO-Generator/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        payload = json.load(r)
    rows = payload.get("data", payload) if isinstance(payload, dict) else payload
    if not isinstance(rows, list):
        raise RuntimeError("API produk tidak mengembalikan array")

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True, exist_ok=True)

    urls = [SITE + "/"]
    for row in rows:
        pid = get(row, "ID", "id", "Id")
        name = get(row, "nama", "Nama", "NAMA")
        if not pid or not name:
            continue

        category = get(row, "kategori", "Kategori", "KATEGORI") or "Sparepart LED"
        desc = get(row, "deskripsi", "Deskripsi", "diskipsi")
        price = money(get(row, "harga diskon", "hargaDiskon", "HargaDiskon")) or money(get(row, "harga jual", "hargaJual", "HargaJual"))
        normal = money(get(row, "harga jual", "hargaJual", "HargaJual"))
        image = get(row, "gambar1", "Gambar1")
        image2 = get(row, "gambar2", "Gambar2")
        image3 = get(row, "gambar3", "Gambar3")
        if not image:
            image = SITE + "/image/no-image.png"
        if image.startswith("/"):
            image = SITE + image

        url = f"{SITE}/produk/{pid}/"
        title = f"{name} | Harga {rupiah(price)} | Duta LED"
        meta = desc or f"{name} kategori {category}. Tersedia di Duta LED untuk kebutuhan eceran dan grosir."
        meta = re.sub(r"\s+", " ", meta).strip()[:155]

        schema = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": name,
            "description": meta,
            "image": [x for x in [image, image2, image3] if x],
            "category": category,
            "url": url,
            "brand": {"@type": "Brand", "name": "Duta LED"},
            "offers": {
                "@type": "Offer",
                "url": url,
                "priceCurrency": "IDR",
                "price": price,
                "availability": "https://schema.org/InStock",
                "itemCondition": "https://schema.org/NewCondition",
                "seller": {"@type": "Organization", "name": "Duta LED", "url": SITE},
            },
        }
        if normal > price and price > 0:
            schema["offers"]["priceSpecification"] = [
                {"@type": "UnitPriceSpecification", "price": price, "priceCurrency": "IDR", "priceType": "https://schema.org/SalePrice"},
                {"@type": "UnitPriceSpecification", "price": normal, "priceCurrency": "IDR", "priceType": "https://schema.org/ListPrice"},
            ]

        page = f'''<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(meta)}">
<link rel="canonical" href="{esc(url)}">
<meta property="og:type" content="product">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(meta)}">
<meta property="og:url" content="{esc(url)}">
<meta property="og:image" content="{esc(image)}">
<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>
<style>body{{font-family:Arial,sans-serif;max-width:900px;margin:auto;padding:20px;line-height:1.6}}img{{max-width:100%;max-height:500px;object-fit:contain}}.price{{font-size:30px;font-weight:700}}.old{{text-decoration:line-through;color:#777}}a{{color:#e65c00}}</style>
</head>
<body>
<main>
<a href="{SITE}/">← Duta LED</a>
<h1>{esc(name)}</h1>
<p><strong>{esc(category)}</strong></p>
<img src="{esc(image)}" alt="{esc(name)}" loading="eager">
<p class="price">{rupiah(price)}</p>
{f'<p class="old">Harga normal {rupiah(normal)}</p>' if normal > price else ''}
<h2>Deskripsi Produk</h2>
<p>{esc(desc or meta)}</p>
<p><a href="{SITE}/?id={esc(pid)}">Lihat produk & belanja di Duta LED</a></p>
</main>
</body>
</html>'''
        target = OUT / str(pid) / "index.html"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(page, encoding="utf-8")
        urls.append(url)

    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    sitemap += [f"<url><loc>{html.escape(u)}</loc></url>" for u in urls]
    sitemap.append('</urlset>')
    (ROOT / "sitemap.xml").write_text("\n".join(sitemap) + "\n", encoding="utf-8")
    print(f"Generated {len(urls)-1} product pages")


if __name__ == "__main__":
    main()
