"use strict";
(function(){
  const CART_KEY="dutaled_cart_v4";
  const SUPABASE_URL="https://opgeeqnucxrdqcgwcuge.supabase.co";
  const SUPABASE_KEY="sb_publishable_uqah55SK8ZjyugWprFnFMA_QnyVdCLA";
  const db=window.supabase?.createClient(SUPABASE_URL,SUPABASE_KEY);
  const rupiah=n=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0);
  const getCart=()=>{try{return JSON.parse(localStorage.getItem(CART_KEY)||"[]")||[]}catch(_){return[]}};
  const getPrice=i=>Number(i.hargaTampil??i.hargaDiskon??i.hargaJual??i.harga??0)||0;
  const totalCart=c=>c.reduce((s,i)=>s+getPrice(i)*(Number(i.qty)||1),0);
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  function closeCheckout(){document.getElementById("checkoutModal")?.classList.remove("show");document.body.classList.remove("checkout-open")}
  function renderSummary(){const c=getCart(),box=document.getElementById("checkoutItems"),t=totalCart(c);if(!box)return;box.innerHTML=c.map(i=>{const q=Number(i.qty)||1;return `<div class="checkout-item"><div><strong>${esc(i.nama||"Produk")}</strong><small>${q} × ${rupiah(getPrice(i))}</small></div><b>${rupiah(getPrice(i)*q)}</b></div>`}).join("");document.getElementById("checkoutSubtotal").textContent=rupiah(t);document.getElementById("checkoutGrandTotal").textContent=rupiah(t)}
  function openCheckout(){if(!getCart().length)return alert("Keranjang masih kosong.");renderSummary();document.getElementById("checkoutModal")?.classList.add("show");document.body.classList.add("checkout-open")}
  async function submitOrder(e){
    e.preventDefault();
    const form=e.currentTarget;if(!form.reportValidity())return;
    const cart=getCart();if(!cart.length)return alert("Keranjang kosong.");
    if(!db)return alert("Sistem pesanan belum siap. Silakan refresh halaman.");
    const data=Object.fromEntries(new FormData(form).entries()),total=totalCart(cart),orderNo="DL"+new Date().toISOString().replace(/\D/g,"").slice(0,14)+Math.floor(Math.random()*90+10);
    const btn=form.querySelector(".checkout-submit");if(btn){btn.disabled=true;btn.textContent="Menyimpan pesanan..."}
    try{
      /* Match the EXISTING Supabase schema exactly. */
      const payload={order_id:orderNo,nama_pembeli:data.nama,no_hp:data.wa,alamat:data.alamat,kecamatan:data.kota||null,metode_pengiriman:data.pengiriman||null,metode_pembayaran:data.pembayaran||null,total_harga:total,status:"Menunggu Pembayaran"};
      const {data:created,error}=await db.from("pesanan").insert(payload).select("*").single();
      if(error)throw error;
      const details=cart.map(i=>({pesanan_id:created.id,produk_id:Number(i.id)||null,nama_produk:i.nama||"Produk",qty:Number(i.qty)||1,harga_saat_beli:Number(getPrice(i))||0}));
      const {error:detailError}=await db.from("detail_pesanan").insert(details);
      if(detailError){await db.from("pesanan").delete().eq("id",created.id);throw detailError}
      const order={id:created.id,orderNo:created.order_id||orderNo,createdAt:created.created_at||new Date().toISOString(),customer:data,items:cart,total:total,payment:data.pembayaran,status:created.status||"Menunggu Pembayaran"};
      localStorage.setItem("dutaled_last_order",JSON.stringify(order));
      let old=[];try{old=JSON.parse(localStorage.getItem("dutaled_orders")||"[]")||[]}catch(_){}
      localStorage.setItem("dutaled_orders",JSON.stringify([order,...old].slice(0,50)));
      closeCheckout();showSuccess(order);localStorage.removeItem(CART_KEY);document.dispatchEvent(new CustomEvent("dutaled:order-created",{detail:order}));
    }catch(err){console.error("Supabase order error",err);alert("Pesanan gagal disimpan: "+(err.message||err));}
    finally{if(btn){btn.disabled=false;btn.textContent="Buat Pesanan"}}
  }
  function showSuccess(o){document.body.insertAdjacentHTML("beforeend",`<div class="order-success" id="orderSuccess"><div class="order-success-box"><div class="order-success-icon">✓</div><h2>Pesanan berhasil dibuat</h2><p>Nomor pesanan:</p><strong class="order-number">${esc(o.orderNo)}</strong><p>Status: <b>${esc(o.status)}</b></p><p class="order-note">Total produk: <b>${rupiah(o.total)}</b><br>Pesanan sudah tercatat di sistem Duta LED.<br><br>WhatsApp hanya digunakan untuk konsultasi.</p><button type="button" id="closeOrderSuccess" class="checkout-submit">Selesai</button></div></div>`);document.getElementById("closeOrderSuccess")?.addEventListener("click",()=>document.getElementById("orderSuccess")?.remove())}
  document.addEventListener("DOMContentLoaded",()=>{const b=document.getElementById("checkoutButton");if(b){b.textContent="Checkout";b.addEventListener("click",e=>{e.preventDefault();openCheckout()})}document.body.insertAdjacentHTML("beforeend",`<div id="checkoutModal" class="checkout-modal" aria-hidden="true"><div class="checkout-backdrop" data-checkout-close></div><section class="checkout-dialog" role="dialog" aria-modal="true" aria-label="Checkout Duta LED"><header><div><small>CHECKOUT WEBSITE</small><h2>Buat Pesanan</h2></div><button type="button" class="checkout-x" data-checkout-close>×</button></header><form id="checkoutForm"><div class="checkout-grid"><div class="checkout-form-side"><h3>Data Pembeli</h3><label>Nama lengkap<input name="nama" required autocomplete="name" placeholder="Nama penerima"></label><label>Nomor HP / WhatsApp<input name="wa" required inputmode="tel" autocomplete="tel" placeholder="08xxxxxxxxxx"></label><label>Alamat lengkap<textarea name="alamat" required placeholder="Desa, jalan, nomor rumah"></textarea></label><label>Kota / Kecamatan<input name="kota" required placeholder="Contoh: Subah, Batang"></label><h3>Pengiriman</h3><select name="pengiriman"><option>JNE / J&T</option><option>SiCepat</option><option>POS Indonesia</option><option>Ambil di toko</option></select><h3>Pembayaran</h3><select name="pembayaran"><option>Transfer Bank</option><option>QRIS</option><option>COD jika tersedia</option></select></div><aside class="checkout-summary"><h3>Ringkasan Pesanan</h3><div id="checkoutItems"></div><div class="checkout-total"><span>Total Produk</span><b id="checkoutSubtotal">Rp0</b></div><p class="shipping-note">🚚 <b>Ongkir dibayar manual / COD.</b><br>Ongkir tidak ditambahkan ke total produk.</p><div class="checkout-grand"><span>Total Produk</span><strong id="checkoutGrandTotal">Rp0</strong></div><button type="submit" class="checkout-submit">Buat Pesanan</button><small>Pesanan dibuat langsung di website. WhatsApp hanya untuk konsultasi.</small></aside></div></form></section></div>`);document.querySelectorAll("[data-checkout-close]").forEach(x=>x.addEventListener("click",closeCheckout));document.getElementById("checkoutForm")?.addEventListener("submit",submitOrder)})
})();