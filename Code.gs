const SHEET_NAME = "PRODUK";
const AFFILIATE_SHEET_NAME = "AFFILIATE";
const ORDER_SHEET_NAME = "PESANAN";
const ADMIN_EMAIL = "vesatukio@gmail.com";
const ADMIN_WA = "083157925577";
const ADMIN_KEY_PROPERTY = "DUTALED_ADMIN_KEY";

function getAdminKey(){return PropertiesService.getScriptProperties().getProperty(ADMIN_KEY_PROPERTY)||"";}

function doGet(e){
  var action=e&&e.parameter&&e.parameter.action?String(e.parameter.action):"produk";
  if(action==="test")return json({success:true,message:"Duta LED API aktif"});
  if(action==="produk")return json({success:true,data:getProduk()});
  if(action==="affiliate")return json({success:true,data:getAffiliate()});
  if(action==="resolveAffiliate"){
    var url=e&&e.parameter&&e.parameter.url?String(e.parameter.url).trim():"";
    if(!url)return json({success:false,message:"URL affiliate belum diisi"});
    try{return json({success:true,data:resolveAffiliate(url)});}catch(err){return json({success:false,message:String(err.message||err)});}
  }
  return json({success:false,message:"Action tidak ditemukan: "+action});
}

function doPost(e){
  try{
    var body={};
    var raw=(e&&e.postData&&e.postData.contents)||"";
    if(raw){try{body=JSON.parse(raw);}catch(x){body=e.parameter||{};}}
    else body=e.parameter||{};
    var action=String(body.action||"");
    if(action==="createOrder")return json({success:true,data:createOrder(body.data||{})});
    if(action==="createProduct"||action==="updateProduct"){
      requireAdmin(body.key);
      var data=body.data||{}; if(typeof data==="string")data=JSON.parse(data);
      return json({success:true,data:saveProduct(data,action==="updateProduct")});
    }
    if(action==="saveProducts"){
      requireAdmin(body.key);
      var products=body.products||[]; if(typeof products==="string")products=JSON.parse(products);
      return json({success:true,data:saveProducts(Array.isArray(products)?products:[])});
    }
    return json({success:false,message:"Action POST tidak ditemukan: "+action});
  }catch(err){return json({success:false,message:String(err.message||err)});}
}
function requireAdmin(key){var configured=getAdminKey();if(!configured)throw new Error("Kunci admin belum dikonfigurasi di Apps Script");if(String(key||"")!==configured)throw new Error("Kunci admin salah");}
function saveProducts(products){if(!products.length)throw new Error("Tidak ada produk untuk disimpan");var results=[];products.forEach(function(p){results.push(saveProduct(p,String(p.id||"").trim()!==""));});return{count:results.length,results:results,message:results.length+" produk berhasil diproses"};}

function saveProduct(data,isUpdate){
  var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);if(!sh)throw new Error("Sheet PRODUK tidak ditemukan");
  var name=String(data.nama||"").trim();if(!name)throw new Error("Nama produk wajib diisi");
  var id=String(data.id||"").trim();
  var hargaCoret=Number(data.hargaCoret||0)||0;
  var hargaJual=Number(data.hargaDiskon||data.hargaJual||0)||0;
  var diskon=(hargaCoret>0&&hargaJual>0&&hargaJual<hargaCoret)?Math.round((hargaCoret-hargaJual)/hargaCoret*100):0;
  var rowData=[id,name,String(data.kategori||"").trim(),Number(data.stok||0)||0,Number(data.hargaModal||0)||0,hargaCoret,diskon,hargaJual,String(data.deskripsi||"").trim(),String(data.gambar1||"").trim(),String(data.gambar2||"").trim(),String(data.gambar3||"").trim()];
  if(!isUpdate){id="P"+new Date().getTime().toString().slice(-8);rowData[0]=id;sh.appendRow(rowData);return{id:id,message:"Produk berhasil ditambahkan",diskon:diskon};}
  if(!id)throw new Error("ID produk tidak ada");
  var last=sh.getLastRow();if(last<2)throw new Error("Produk tidak ditemukan");
  var ids=sh.getRange(2,1,last-1,1).getDisplayValues();
  for(var i=0;i<ids.length;i++)if(String(ids[i][0]).trim()===id){rowData[0]=id;rowData[4]=sh.getRange(i+2,5).getValue();sh.getRange(i+2,1,1,12).setValues([rowData]);return{id:id,message:"Produk berhasil diperbarui",diskon:diskon};}
  throw new Error("ID produk tidak ditemukan: "+id);
}

function getProduk(){var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);if(!sh||sh.getLastRow()<2)return[];var d=sh.getRange(2,1,sh.getLastRow()-1,12).getDisplayValues();return d.filter(function(r){return String(r[1]).trim()!=="";}).map(function(r){return{id:String(r[0]).trim(),nama:String(r[1]).trim(),kategori:String(r[2]).trim(),stok:toNumber(r[3]),hargaModal:toNumber(r[4]),hargaCoret:toNumber(r[5]),diskon:toNumber(r[6]),hargaDiskon:toNumber(r[7]),hargaJual:toNumber(r[7]),deskripsi:String(r[8]).trim(),gambar1:String(r[9]).trim(),gambar2:String(r[10]).trim(),gambar3:String(r[11]).trim()};});}
function getAffiliate(){var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AFFILIATE_SHEET_NAME);if(!sh||sh.getLastRow()<2)return[];var d=sh.getRange(2,1,sh.getLastRow()-1,11).getDisplayValues();return d.filter(function(r){return String(r[1]).trim()!==""&&String(r[7]).trim()!==""&&String(r[9]).trim().toUpperCase()==="YA"&&String(r[10]).trim().toUpperCase()==="YA";}).map(function(r){return{id:String(r[0]).trim(),nama:String(r[1]).trim(),kategori:String(r[2]).trim(),harga:toNumber(r[3]),hargaCoret:toNumber(r[4]),deskripsi:String(r[5]).trim(),gambar:String(r[6]).trim(),linkAffiliate:String(r[7]).trim(),platform:String(r[8]).trim(),affiliate:String(r[9]).trim(),aktif:String(r[10]).trim()};});}
function toNumber(v){return Number(String(v||"").replace(/Rp/gi,"").replace(/\s/g,"").replace(/[^\d-]/g,""))||0;}
function json(d){return ContentService.createTextOutput(JSON.stringify(d)).setMimeType(ContentService.MimeType.JSON);}
function createOrder(data){throw new Error("Gunakan versi order yang sudah terpasang sebelumnya");}
function resolveAffiliate(shortUrl){shortUrl=String(shortUrl||"").trim();if(!shortUrl)throw new Error("Link affiliate kosong");var response=UrlFetchApp.fetch(shortUrl,{followRedirects:true,muteHttpExceptions:true,headers:{"User-Agent":"Mozilla/5.0"}});if(response.getResponseCode()>=400)throw new Error("Shopee mengembalikan HTTP "+response.getResponseCode());var html=response.getContentText();return{nama:extractMeta(html,"og:title")||extractTitle(html)||"Produk Shopee",harga:extractPrice(html),hargaCoret:0,deskripsi:extractMeta(html,"og:description")||"",gambar:extractMeta(html,"og:image")||"",linkAffiliate:shortUrl,platform:"Shopee"};}
function extractMeta(html,name){var m=String(html).match(new RegExp("<meta[^>]+(?:property|name)=[\\\"']"+name+"[\\\"'][^>]+content=[\\\"']([^\\\"']+)[\\\"']","i"));return m&&m[1]?decodeHtml(m[1]):"";}
function extractTitle(html){var m=String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i);return m&&m[1]?decodeHtml(m[1].replace(/\s+/g," ").trim()):"";}
function extractPrice(html){var p=[/"price"\s*:\s*"?([0-9.,]+)"?/i,/"priceValue"\s*:\s*"?([0-9.,]+)"?/i,/"finalPrice"\s*:\s*"?([0-9.,]+)"?/i,/Rp\s*([0-9.]+)/i];for(var i=0;i<p.length;i++){var m=String(html).match(p[i]);if(m&&m[1]){var n=normalizePrice(m[1]);if(n>0)return n;}}return 0;}
function normalizePrice(v){return Number(String(v||"").replace(/[^\d]/g,""))||0;}
function decodeHtml(t){return String(t||"").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">");}
