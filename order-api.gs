/* DUTA LED - ORDER API
 * Add this code to the SAME Google Apps Script project as the existing Code.gs.
 * It is intentionally separate so the existing PRODUK/AFFILIATE API is not replaced.
 */
const ORDER_SHEET_NAME = 'PESANAN';

function createOrder_(data) {
  if (!data || !data.orderNo) throw new Error('Data pesanan tidak lengkap');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(ORDER_SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(ORDER_SHEET_NAME);
    sh.appendRow(['orderNo','createdAt','nama','wa','alamat','kota','pengiriman','pembayaran','items','subtotal','ongkir','total','status']);
  }
  const customer = data.customer || {};
  const items = Array.isArray(data.items) ? data.items : [];
  const total = Number(data.total || data.subtotal || 0) || 0;
  sh.appendRow([
    String(data.orderNo), new Date(), String(customer.nama || ''), String(customer.wa || ''),
    String(customer.alamat || ''), String(customer.kota || ''), String(customer.pengiriman || ''),
    String(customer.pembayaran || data.payment || ''), JSON.stringify(items),
    Number(data.subtotal || 0) || 0, String(data.shipping || 'menunggu konfirmasi'), total, 'BARU'
  ]);
  return {orderNo:String(data.orderNo), status:'BARU'};
}

function handleOrderPost_(e) {
  const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  if (body.action !== 'createOrder') return null;
  return createOrder_(body.data || {});
}
