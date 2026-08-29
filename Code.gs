const SHEET_NAME = "PRODUK";
const AFFILIATE_SHEET_NAME = "AFFILIATE";
const ORDER_SHEET_NAME = "PESANAN";
const ADMIN_EMAIL = "vesatukio@gmail.com";
const ADMIN_WA = "083157925577";
const ADMIN_KEY = "GANTI_DENGAN_KUNCI_ADMIN_UNIK";

function doGet(e) {
  var action = "produk";
  if (e && e.parameter && e.parameter.action) action = String(e.parameter.action);
  if (action === "test") return json({success:true,message:"Duta LED API aktif"});
  if (action === "produk") return json({success:true,data:getProduk()});
  if (action === "affiliate") return json({success:true,data:getAffiliate()});
  if (action === "resolveAffiliate") {
    var url = e && e.parameter && e.parameter.url ? String(e.parameter.url).trim() : "";
    if (!url) return json({success:false,message:"URL affiliate belum diisi"});
    try { return json({success:true,data:resolveAffiliate(url)}); }
    catch(err) { return json({success:false,message:String(err.message || err)}); }
  }
  return json({success:false,message:"Action tidak ditemukan: " + action});
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var action = String(body.action || "");
    if (action === "createOrder") return json({success:true,data:createOrder(body.data || {})});
    if (action === "createProduct" || action === "updateProduct") {
      if (String(body.key || "") !== ADMIN_KEY) throw new Error("Kunci admin salah");
      return json({success:true,data:saveProduct(body.data || {}, action === "updateProduct")});
    }
    return json({success:false,message:"Action POST tidak ditemukan: " + action});
  } catch (err) { return json({success:false,message:String(err.message || err)}); }
}

function createOrder(data) {
  if (!data || !data.orderNo) throw new Error("Nomor pesanan tidak ada");
  var customer=data.customer||{};
  if (!String(customer.nama||"").trim()) throw new Error("Nama pembeli wajib diisi");
  if (!String(customer.wa||"").trim()) throw new Error("Nomor HP wajib diisi");
  if (!String(customer.alamat||"").trim()) throw new Error("Alamat wajib diisi");
  var items=Array.isArray(data.items)?data.items:[];
  if (!items.length) throw new Error("Keranjang kosong");
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var sh=ss.getSheetByName(ORDER_SHEET_NAME);
  if (!sh) { sh=ss.insertSheet(ORDER_SHEET_NAME); sh.appendRow(["orderNo","createdAt","nama","wa","alamat","kota","pengiriman","pembayaran","items","subtotal","ongkir","total","status"]); }
  var subtotal=Number(data.subtotal||0)||0;
  var existing=sh.getRange(1,1,Math.max(sh.getLastRow(),1),1).getDisplayValues().map(function(r){return String(r[0]);});
  if (existing.indexOf(String(data.orderNo))!==-1) throw new Error("Nomor pesanan sudah digunakan");
  var shippingNote="Ongkir dibayar manual / COD";
  sh.appendRow([String(data.orderNo),new Date(),String(customer.nama).trim(),String(customer.wa).trim(),String(customer.alamat).trim(),String(customer.kota||"").trim(),String(customer.pengiriman||"").trim(),String(customer.pembayaran||data.payment||"").trim(),JSON.stringify(items),subtotal,shippingNote,subtotal,"BARU"]);
  var order={orderNo:String(data.orderNo),nama:String(customer.nama).trim(),wa:String(customer.wa).trim(),alamat:String(customer.alamat).trim(),kota:String(customer.kota||"").trim(),pengiriman:String(customer.pengiriman||"").trim(),pembayaran:String(customer.pembayaran||data.payment||"").trim(),items:items,subtotal:subtotal,ongkir:shippingNote,total:subtotal,status:"BARU"};
  notifyAdminNewOrder(order);
  return {orderNo:order.orderNo,status:"BARU",message:"Pesanan berhasil diterima"};
}

function saveProduct(data, isUpdate) {
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var sh=ss.getSheetByName(SHEET_NAME);
  if(!sh) throw new Error("Sheet PRODUK tidak ditemukan");
  var name=String(data.nama||"").trim();
  if(!name) throw new Error("Nama produk wajib diisi");
  var id=String(data.id||"").trim();
  if(!isUpdate) {
    if(!id) id="P"+new Date().getTime().toString().slice(-8);
    sh.appendRow([id,name,String(data.kategori||"").trim(),Number(data.stok||0),Number(data.hargaModal||0),Number(data.hargaJual||0),Number(data.diskon||0),Number(data.hargaDiskon||0),String(data.deskripsi||"").trim(),String(data.gambar1||"").trim(),String(data.gambar2||"").trim(),String(data.gambar3||"").trim()]);
    return {id:id,message:"Produk berhasil ditambahkan"};
  }
  if(!id) throw new Error("ID produk tidak ada");
  var last=sh.getLastRow();
  if(last<2) throw new Error("Produk tidak ditemukan");
  var ids=sh.getRange(2,1,last-1,1).getDisplayValues();
  for(var i=0;i<ids.length;i++) {
    if(String(ids[i][0]).trim()===id) {
      var row=i+2;
      var old=sh.getRange(row,1,1,12).getValues()[0];
      sh.getRange(row,1,1,12).setValues([[id,name,String(data.kategori||"").trim(),Number(data.stok||0),old[4],Number(data.hargaJual||0),Number(data.diskon||0),Number(data.hargaDiskon||0),String(data.deskripsi||"").trim(),String(data.gambar1||"").trim(),String(data.gambar2||"").trim(),String(data.gambar3||"").trim()]]);
      return {id:id,message:"Produk berhasil diperbarui"};
    }
  }
  throw new Error("ID produk tidak ditemukan");
}

function notifyAdminNewOrder(order) {
  var itemText=order.items.map(function(i){return (i.nama||"Produk")+" x"+(Number(i.qty)||1)+" — "+formatRupiah((Number(i.hargaTampil??i.hargaDiskon??i.hargaJual??i.harga??0)||0)*(Number(i.qty)||1));}).join("\n");
  var subject="🔔 Pesanan Baru " + order.orderNo + " - Duta LED";
  var body="PESANAN BARU DUTA LED\n\nNo: "+order.orderNo+"\nPembeli: "+order.nama+"\nHP/WA: "+order.wa+"\nAlamat: "+order.alamat+"\nKota: "+order.kota+"\nPengiriman: "+order.pengiriman+"\nPembayaran: "+order.pembayaran+"\n\nProduk:\n"+itemText+"\n\nTotal Produk: "+formatRupiah(order.total)+"\nOngkir: dibayar manual / COD\nStatus: BARU\n\nOrder dibuat melalui website Duta LED.";
  try { MailApp.sendEmail(ADMIN_EMAIL,subject,body); } catch(err) { console.log("Email notifikasi gagal: "+err); }
  console.log("Admin WA notification target: "+ADMIN_WA);
}
function formatRupiah(n){return "Rp"+Number(n||0).toLocaleString("id-ID");}

function getProduk() {
  var sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME); if(!sheet||sheet.getLastRow()<2)return[];
  var data=sheet.getRange(2,1,sheet.getLastRow()-1,12).getDisplayValues();
  return data.filter(function(row){return String(row[1]).trim()!=="";}).map(function(row){return{id:String(row[0]).trim(),nama:String(row[1]).trim(),kategori:String(row[2]).trim(),stok:toNumber(row[3]),hargaJual:toNumber(row[5]),diskon:toNumber(row[6]),hargaDiskon:toNumber(row[7]),deskripsi:String(row[8]).trim(),gambar1:String(row[9]).trim(),gambar2:String(row[10]).trim(),gambar3:String(row[11]).trim()};});
}
function getAffiliate() {
  var sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AFFILIATE_SHEET_NAME); if(!sheet||sheet.getLastRow()<2)return[];
  var data=sheet.getRange(2,1,sheet.getLastRow()-1,11).getDisplayValues();
  return data.filter(function(row){return String(row[1]).trim()!==""&&String(row[7]).trim()!==""&&String(row[9]).trim().toUpperCase()==="YA"&&String(row[10]).trim().toUpperCase()==="YA";}).map(function(row){return{id:String(row[0]).trim(),nama:String(row[1]).trim(),kategori:String(row[2]).trim(),harga:toNumber(row[3]),hargaCoret:toNumber(row[4]),deskripsi:String(row[5]).trim(),gambar:String(row[6]).trim(),linkAffiliate:String(row[7]).trim(),platform:String(row[8]).trim(),affiliate:String(row[9]).trim(),aktif:String(row[10]).trim()};});
}
function toNumber(value){return Number(String(value||"").replace(/Rp/gi,"").replace(/\s/g,"").replace(/[^\d-]/g,""))||0;}
function json(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);}
function resolveAffiliate(shortUrl){shortUrl=String(shortUrl||"").trim();if(!shortUrl)throw new Error("Link affiliate kosong");if(!/^https?:\/\//i.test(shortUrl))throw new Error("Format link tidak valid");var response;try{response=UrlFetchApp.fetch(shortUrl,{followRedirects:true,muteHttpExceptions:true,headers:{"User-Agent":"Mozilla/5.0"}});}catch(err){throw new Error("Gagal membuka link: "+String(err.message||err));}var code=response.getResponseCode();if(code>=400)throw new Error("Shopee mengembalikan HTTP "+code);var html=response.getContentText();var nama=extractMeta(html,"og:title")||extractTitle(html);return{nama:nama||"Produk Shopee",harga:extractPrice(html),hargaCoret:0,deskripsi:extractMeta(html,"og:description")||"",gambar:extractMeta(html,"og:image")||"",linkAffiliate:shortUrl,platform:"Shopee"};}
function extractMeta(html,name){var regex=new RegExp("<meta[^>]+(?:property|name)=[\\\"']"+name+"[\\\"'][^>]+content=[\\\"']([^\\\"']+)[\\\"']","i");var match=String(html).match(regex);return match&&match[1]?decodeHtml(match[1]):"";}
function extractTitle(html){var match=String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i);return match&&match[1]?decodeHtml(match[1].replace(/\s+/g," ").trim()):"";}
function extractPrice(html){var patterns=[/"price"\s*:\s*"?([0-9.,]+)"?/i,/"priceValue"\s*:\s*"?([0-9.,]+)"?/i,/"finalPrice"\s*:\s*"?([0-9.,]+)"?/i,/Rp\s*([0-9.]+)/i];for(var i=0;i<patterns.length;i++){var match=String(html).match(patterns[i]);if(match&&match[1]){var price=normalizePrice(match[1]);if(price>0)return price;}}return 0;}
function normalizePrice(value){return Number(String(value||"").replace(/[^\d]/g,""))||0;}
function decodeHtml(text){return String(text||"").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">");}
function testUrlFetch(){var response=UrlFetchApp.fetch("https://www.google.com");Logger.log(response.getResponseCode());}
