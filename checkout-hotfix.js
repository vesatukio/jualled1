/* Duta LED - checkout emergency fallback */
(function(){
'use strict';
const CART_KEY='dutaled_cart_v4', ORDERS_KEY='dutaled_orders';
const SUPABASE_URL='https://opgeeqnucxrdqcgwcuge.supabase.co', SUPABASE_KEY='sb_publishable_uqah55SK8ZjyugWprFnFMA_QnyVdCLA';
const headers={apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY,'Content-Type':'application/json'};
const cart=()=>{try{return JSON.parse(localStorage.getItem(CART_KEY)||'[]')||[]}catch(e){return[]}};
const orders=()=>{try{return JSON.parse(localStorage.getItem(ORDERS_KEY)||'[]')||[]}catch(e){return[]}};
const rupiah=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0);
const price=i=>Number(i.hargaTampil??i.hargaDiskon??i.hargaJual??i.harga??0)||0;
const total=c=>c.reduce((s,i)=>s+price(i)*(Number(i.qty)||1),0);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function closeCart(){document.getElementById('cartClose')?.click();document.getElementById('cartOverlay')?.classList.add('hidden');document.getElementById('cartPanel')?.classList.remove('show','open','active');}
function clearCart(){localStorage.removeItem(CART_KEY);['cartCount','bottomCartCount'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent='0';});const t=document.getElementById('cartTotal');if(t)t.textContent=rupiah(0);}
function payment(o){const p=String(o.payment||'').toLowerCase();return p.includes('cod')?'COD':p.includes('qris')?'QRIS':'Transfer Bank';}
function showOrders(){
 document.getElementById('ordersPage')?.remove();
 const a=orders();
 document.body.insertAdjacentHTML('beforeend',`<div class="orders-page" id="ordersPage"><div class="orders-wrap"><div class="orders-head"><button type="button" id="hotfixOrdersBack">‹</button><div><small>DUTA LED</small><h2>Pesanan Saya</h2></div></div>${a.length?a.map(o=>`<article class="order-list-card"><div class="order-list-top"><div><span>Nomor pesanan</span><strong>${esc(o.orderNo)}</strong></div><b class="order-badge wait">${esc(o.status||'Menunggu Pembayaran')}</b></div><div class="order-list-address">📍 <span>${esc(o.customer?.nama||'')}<br>${esc(o.customer?.alamat||'')}${o.customer?.kota?', '+esc(o.customer.kota):''}</span></div><div class="order-list-items">${(o.items||[]).map(i=>`<div><span>${esc(i.nama||'Produk')} × ${Number(i.qty)||1}</span><b>${rupiah(price(i)*(Number(i.qty)||1))}</b></div>`).join('')}</div><div class="order-list-bottom"><span>${payment(o)}</span><strong>${rupiah(o.total)}</strong></div></article>`).join(''):'<div class="orders-empty"><div>📦</div><h3>Belum ada pesanan</h3><p>Pesanan yang berhasil dibuat akan muncul di sini.</p></div>'}</div></div>`);
 document.getElementById('hotfixOrdersBack')?.addEventListener('click',()=>{document.getElementById('ordersPage')?.remove();window.scrollTo({top:0,behavior:'smooth'});});
 document.querySelectorAll('.bottom-nav-item[data-nav]').forEach(el=>el.classList.toggle('active',el.getAttribute('data-nav')==='orders'));
}
window.showOrders=window.showOrders||showOrders;
function build(){
 if(document.getElementById('checkoutModal'))return false;
 document.body.insertAdjacentHTML('beforeend',`<div id="checkoutModal" class="checkout-modal" aria-hidden="true"><div class="checkout-backdrop" data-hotfix-close></div><section class="checkout-dialog"><header><div><small>CHECKOUT WEBSITE</small><h2>Buat Pesanan</h2></div><button type="button" class="checkout-x" data-hotfix-close>×</button></header><form id="checkoutHotfixForm"><div class="checkout-grid"><div class="checkout-form-side"><h3>Data Pembeli</h3><label>Nama lengkap<input name="nama" required autocomplete="name" placeholder="Nama penerima"></label><label>Nomor HP / WhatsApp<input name="wa" required inputmode="tel" placeholder="08xxxxxxxxxx"></label><label>Alamat lengkap<textarea name="alamat" required placeholder="Desa, jalan, nomor rumah"></textarea></label><label>Kota / Kecamatan<input name="kota" required placeholder="Contoh: Subah, Batang"></label><h3>Pengiriman</h3><select name="pengiriman"><option>JNE / J&T</option><option>SiCepat</option><option>POS Indonesia</option><option>Ambil di toko</option></select><h3>Pembayaran</h3><select name="pembayaran"><option>Transfer Bank</option><option>QRIS</option><option>COD jika tersedia</option></select></div><aside class="checkout-summary"><h3>Ringkasan Pesanan</h3><div id="hotfixItems"></div><div class="checkout-total"><span>Total Produk</span><b id="hotfixTotal">Rp0</b></div><p>🚚 Ongkir tidak ditambahkan ke total produk.</p><button type="submit" class="checkout-submit">Buat Pesanan</button><small>Pesanan disimpan langsung ke database. WhatsApp hanya untuk konsultasi.</small></aside></div></form></section></div>`);
 document.querySelectorAll('[data-hotfix-close]').forEach(e=>e.addEventListener('click',close));
 document.getElementById('checkoutHotfixForm').addEventListener('submit',submit);
 return true;
}
function render(){const c=cart(),box=document.getElementById('hotfixItems');if(!box)return;box.innerHTML=c.map(i=>`<div class="checkout-item"><div><strong>${esc(i.nama||'Produk')}</strong><small>${Number(i.qty)||1} × ${rupiah(price(i))}</small></div><b>${rupiah(price(i)*(Number(i.qty)||1))}</b></div>`).join('');document.getElementById('hotfixTotal').textContent=rupiah(total(c));}
function open(){if(!cart().length){alert('Keranjang masih kosong.');return false;}closeCart();build();render();const m=document.getElementById('checkoutModal');if(!m)return false;m.classList.add('show');m.setAttribute('aria-hidden','false');document.body.classList.add('checkout-open');return true;}
function close(){const m=document.getElementById('checkoutModal');if(m){m.classList.remove('show');m.setAttribute('aria-hidden','true');}document.body.classList.remove('checkout-open');}
async function submit(e){
 e.preventDefault();e.stopImmediatePropagation();const f=e.currentTarget;if(!f.reportValidity())return;const c=cart();if(!c.length){alert('Keranjang kosong.');return;}
 const d=Object.fromEntries(new FormData(f).entries()),orderNo='DL'+new Date().toISOString().replace(/\D/g,'').slice(0,14)+Math.floor(Math.random()*90+10),btn=f.querySelector('.checkout-submit');if(btn){btn.disabled=true;btn.textContent='Menyimpan pesanan...';}
 try{
  const payload={order_id:orderNo,nama_pembeli:d.nama,no_hp:d.wa,alamat:d.alamat,kecamatan:d.kota,metode_pengiriman:d.pengiriman,metode_pembayaran:d.pembayaran,total_harga:total(c),status:'Menunggu Pembayaran'};
  const items=c.map(i=>({produk_id:Number(i.id)>0?String(i.id):null,nama_produk:i.nama||'Produk',qty:Number(i.qty)||1,harga_saat_beli:price(i)}));
  const r=await fetch(SUPABASE_URL+'/rest/v1/rpc/create_public_order',{method:'POST',headers,body:JSON.stringify({p_order:payload,p_items:items}),cache:'no-store'});let j=null;try{j=await r.json();}catch(_){ }
  if(!r.ok)throw new Error(j?.message||j?.details||j?.hint||j?.error||('HTTP '+r.status));if(!j?.success||!j?.id)throw new Error('Database tidak mengembalikan ID pesanan.');
  const o={id:j.id,orderNo:j.order_id||orderNo,createdAt:new Date().toISOString(),customer:d,items:c,total:total(c),payment:d.pembayaran,status:'Menunggu Pembayaran'};
  localStorage.setItem('dutaled_last_order',JSON.stringify(o));localStorage.setItem(ORDERS_KEY,JSON.stringify([o,...orders()].slice(0,50)));clearCart();close();document.dispatchEvent(new CustomEvent('dutaled:order-created',{detail:o}));showOrders();
 }catch(err){console.error('Checkout hotfix:',err);alert('Pesanan gagal disimpan: '+(err.message||err));}
 finally{if(btn){btn.disabled=false;btn.textContent='Buat Pesanan';}}
}
function hook(){
 if(document.getElementById('checkoutModal')){if(document.getElementById('checkoutForm'))return;}
 const b=document.getElementById('checkoutButton');if(!b||b.dataset.hotfix)return;b.dataset.hotfix='1';b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();open();},true);if(typeof window.openCheckout!=='function')window.openCheckout=open;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();
})();
