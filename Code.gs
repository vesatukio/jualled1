const SHEET_NAME = 'PRODUK';
const AFFILIATE_SHEET_NAME = 'AFFILIATE';
const ADMIN_KEY_PROPERTY = 'DUTALED_ADMIN_KEY';

function doGet(e) {
  const action = e && e.parameter && e.parameter.action ? String(e.parameter.action) : 'produk';
  try {
    if (action === 'test') return json({ success: true, message: 'Duta LED API aktif' });
    if (action === 'produk') return json({ success: true, data: getProduk() });
    if (action === 'affiliate') return json({ success: true, data: getAffiliate() });
    return json({ success: false, message: 'Action tidak ditemukan: ' + action });
  } catch (err) {
    return json({ success: false, message: String(err.message || err) });
  }
}

function doPost(e) {
  try {
    const p = e && e.parameter ? e.parameter : {};
    const action = String(p.action || '');

    if (action !== 'createProduct' && action !== 'updateProduct') {
      return json({ success: false, message: 'Action POST tidak valid: ' + action });
    }

    const savedKey = PropertiesService.getScriptProperties().getProperty(ADMIN_KEY_PROPERTY);
    if (!savedKey) throw new Error('DUTALED_ADMIN_KEY belum dibuat di Script Properties.');
    if (String(p.key || '') !== String(savedKey)) throw new Error('Kunci admin salah.');

    let data = {};
    if (p.data) {
      try { data = JSON.parse(p.data); }
      catch (err) { throw new Error('Data produk tidak valid.'); }
    }

    const result = action === 'createProduct'
      ? tambahProduk(data)
      : updateProduk(data);

    return json({ success: true, data: result });
  } catch (err) {
    return json({ success: false, message: String(err.message || err) });
  }
}

function getSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Sheet PRODUK tidak ditemukan.');
  return sheet;
}

function getProduk() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, 12).getDisplayValues();
  return data.filter(r => String(r[1]).trim() !== '').map(r => ({
    id: String(r[0]).trim(),
    nama: String(r[1]).trim(),
    kategori: String(r[2]).trim(),
    hargaModal: toNumber(r[3]),
    laba: String(r[4]).trim(),
    hargaJual: toNumber(r[5]),
    diskon: toNumber(r[6]),
    hargaDiskon: toNumber(r[7]),
    deskripsi: String(r[8]).trim(),
    gambar1: String(r[9]).trim(),
    gambar2: String(r[10]).trim(),
    gambar3: String(r[11]).trim()
  }));
}

function tambahProduk(d) {
  const sheet = getSheet();
  const nama = String(d.nama || '').trim();
  if (!nama) throw new Error('Nama produk wajib diisi.');

  const hargaJual = toNumber(d.hargaJual);
  const hargaDiskon = toNumber(d.hargaDiskon);
  const diskon = hitungDiskon(hargaJual, hargaDiskon);
  const id = buatIdBaru(sheet);

  const row = buatBaris(d, id, diskon);
  sheet.insertRowBefore(2);
  sheet.getRange(2, 1, 1, 12).setValues([row]);
  SpreadsheetApp.flush();

  return { id: id, nama: nama, diskon: diskon, message: 'Produk berhasil ditambahkan.' };
}

function updateProduk(d) {
  const sheet = getSheet();
  const id = String(d.id || '').trim();
  const nama = String(d.nama || '').trim();
  if (!id) throw new Error('ID produk wajib ada untuk edit.');
  if (!nama) throw new Error('Nama produk wajib diisi.');

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('Produk belum ada.');

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === id) {
      const hargaJual = toNumber(d.hargaJual);
      const hargaDiskon = toNumber(d.hargaDiskon);
      const diskon = hitungDiskon(hargaJual, hargaDiskon);
      sheet.getRange(i + 2, 1, 1, 12).setValues([buatBaris(d, id, diskon)]);
      SpreadsheetApp.flush();
      return { id: id, nama: nama, diskon: diskon, message: 'Produk berhasil diperbarui.' };
    }
  }
  throw new Error('ID produk tidak ditemukan: ' + id);
}

function buatBaris(d, id, diskon) {
  return [
    id,
    String(d.nama || '').trim(),
    String(d.kategori || '').trim(),
    toNumber(d.hargaModal),
    String(d.laba || '').trim(),
    toNumber(d.hargaJual),
    diskon,
    toNumber(d.hargaDiskon),
    String(d.deskripsi || '').trim(),
    String(d.gambar1 || '').trim(),
    String(d.gambar2 || '').trim(),
    String(d.gambar3 || '').trim()
  ];
}

function hitungDiskon(hargaJual, hargaDiskon) {
  if (hargaJual > 0 && hargaDiskon > 0 && hargaDiskon < hargaJual) {
    return Math.round(((hargaJual - hargaDiskon) / hargaJual) * 100);
  }
  return 0;
}

function buatIdBaru(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return '1';
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  let max = 0;
  ids.forEach(r => {
    const n = parseInt(String(r[0]).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return String(max + 1);
}

function getAffiliate() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AFFILIATE_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getDisplayValues();
  return data.filter(r => {
    return String(r[1]).trim() !== '' &&
      String(r[7]).trim() !== '' &&
      String(r[9]).trim().toUpperCase() === 'YA' &&
      String(r[10]).trim().toUpperCase() === 'YA';
  }).map(r => ({
    id: String(r[0]).trim(), nama: String(r[1]).trim(), kategori: String(r[2]).trim(),
    harga: toNumber(r[3]), hargaCoret: toNumber(r[4]), deskripsi: String(r[5]).trim(),
    gambar: String(r[6]).trim(), linkAffiliate: String(r[7]).trim(), platform: String(r[8]).trim()
  }));
}

function toNumber(value) {
  const text = String(value || '').replace(/Rp/gi, '').replace(/\s/g, '').replace(/[^\d-]/g, '');
  return Number(text) || 0;
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
