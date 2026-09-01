"use strict";
(function(){
  const CART_KEY="dutaled_cart_v4";
  const SUPABASE_URL="https://opgeeqnucxrdqcgwcuge.supabase.co";
  const SUPABASE_KEY="sb_publishable_uqah55SK8ZjyugWprFnFMA_QnyVdCLA";
  const headers={apikey:SUPABASE_KEY,Authorization:"Bearer "+SUPABASE_KEY,"Content-Type":"application/json"};
  const rupiah=n=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0);
  const getCart=()=>{try{return JSON.parse(localStorage.getItem(CART_KEY)||"[]")||[]}catch(_){return[]}};
  const getPrice=i=>Number(i.hargaTampil??i.hargaDiskon??i.hargaJual??i.harga??0)||0;
  const totalCart=c=>c.reduce((s,i)=>s+getPrice(i)*(Number(i.qty)||1),0);
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

  function closeCartPanel(){
    const close=document.getElementById("cartClose");
    if(close) close.click();
    document.getElementById("cartOverlay")?.classList.add("hidden");
    document.getElementById("cartPanel")?.classList.remove("show","open","active");
  }

  function syncCartUI(){
    const countEls=[document.getElementById("cartCount"),document.getElementById("bottomCartCount")].filter(Boolean);
    countEls.forEach(el=>el.textContent="0");
    const totalEl=document.getElementById("cartTotal");
    if(totalEl)totalEl.textContent=rupiah(0);
    const box=document.getElementById("cartBox");
    if(box)box.innerHTML='<div class="cart-empty">🛒 Keranjang masih kosong</div>';
    document.dispatchEvent(new CustomEvent("dutaled:cart-updated",{detail:{cart:[]}}));
  }

  async function rpc(name,body){
    const r=await fetch(SUPABASE_URL+"/rest/v1/rpc/"+name,{method:"POST",headers,body:JSON.stringify(body),cache:"no-store"});
    let j=null;try{j=await r.json()}catch(_){}
    if(!r.ok)throw new Error(j?.message||j?.hint||j?.details||j?.error||( "HTTP "+r.status));
    return j;
  }

  function closeCheckout(){
    const modal=document.getElementById("checkoutModal");
    if(modal){modal.classList.remove("show");modal.setAttribute("aria-hidden","true")}
    document.body.classList.remove("checkout-open");
  }

  function renderSummary(){
    const c=getCart(),box=document.getElementById("checkoutItems"),t=totalCart(c);
    if(!box)return;
    box.innerHTML=c.map(i=>{const q=Number(i.qty)||1;return `<div class="checkout-item"><div><strong>${esc(i.nama||"Produk")}</strong><small>${q} × ${rupiah(getPrice(i))}</small></div><b>${rupiah(getPrice(i)*q)}</b></div>`}).join("");
    const sub=document.getElementById("checkoutSubtotal"),grand=document.getElementById("checkoutGrandTotal");
    if(sub)sub.textContent=rupiah(t);if(grand)grand.textContent=rupiah(t);
  }

  function openCheckout(){
    const cart=getCart();
    if(!cart.length){alert("Keranjang masih kosong.");return false;}
    closeCartPanel();
    if(!document.getElementById("checkoutModal")) buildCheckoutModal();
    renderSummary();
    const modal=document.getElementById("checkoutModal");
    if(modal){
      modal.classList.add("show");
      modal.setAttribute("aria-hidden","false");
      document.body.classList.add("checkout-open");
      setTimeout(()=>document.querySelector("#checkoutModal input[name='nama']")?.focus(),80);
    }
    return true;
  }
  window.openCheckout=openCheckout;
  window.closeCheckout=closeCheckout;

  async function submitOrder(e){
    e.preventDefault();
    const form=e.currentTarget;if(!form.reportValidity())return;
    const cart=getCart();if(!cart.length){alert("Keranjang kosong.");return;}
    const data=Object.fromEntries(new FormData(form).entries());
    const total=totalCart(cart);
    const orderNo="DL"+new Date().toISOString().replace(/\D/g,"").slice(0,14)+Math.floor(Math.random()*90+10);
    const btn=form.querySelector(".checkout-submit");
    if(btn){btn.disabled=true;btn.textContent="Menyimpan pesanan..."}
    try{
      const payload={order_id:orderNo,nama_pembeli:data.nama,no_hp:data.wa,alamat:data.alamat,kecamatan:data.kota||null,metode_pengiriman:data.pengiriman||null,metode_pembayaran:data.pembayaran||null,total_harga:total,status:"Menunggu Pembayaran"};
      const items=cart.map(i=>{const pid=Number(i.id);return{produk_id:Number.isFinite(pid)&&pid>0?String(pid):null,nama_produk:i.nama||"Produk",qty:Number(i.qty)||1,harga_saat_beli:Number(getPrice(i))||0}});
      const result=await rpc("create_public_order",{p_order:payload,p_items:items});
      if(!result?.success||!result?.id)throw new Error("Server tidak mengembalikan ID pesanan.");
      const order={id:result.id,orderNo:result.order_id||orderNo,createdAt:new Date().toISOString(),customer:data,items:cart,total,payment:data.pembayaran,status:"Menunggu Pembayaran"};
      localStorage.setItem("dutaled_last_order",JSON.stringify(order));
      let old=[];try{old=JSON.parse(localStorage.getItem("dutaled_orders")||"[]")||[]}catch(_){}
      localStorage.setItem("dutaled_orders",JSON.stringify([order,...old].slice(0,50)));

      localStorage.removeItem(CART_KEY);
      syncCartUI();
      closeCheckout();
      showSuccess(order);
      document.dispatchEvent(new CustomEvent("dutaled:order-created",{detail:order}));
    }catch(err){
      console.error("Supabase order RPC error",err);
      alert("Pesanan gagal disimpan: "+(err.message||err));
    }finally{
      if(btn){btn.disabled=false;btn.textContent="Buat Pesanan"}
    }
  }

  function paymentInfo(o){
    const p=String(o.payment||"").toLowerCase();
    if(p.includes("cod"))return{label:"COD",title:"Bayar saat barang diterima",status:"Menunggu diproses",amount:"Bayar saat barang sampai"};
    if(p.includes("qris"))return{label:"QRIS",title:"Pembayaran QRIS",status:"Menunggu pembayaran",amount:rupiah(o.total)};
    return{label:"Transfer Bank",title:"Transfer sesuai total pesanan",status:"Menunggu pembayaran",amount:rupiah(o.total)};
  }

  function showSuccess(o){
    document.getElementById("orderSuccess")?.remove();
    const pay=paymentInfo(o);
    const items=o.items||[];
    document.body.insertAdjacentHTML("beforeend",`<div class="order-success" id="orderSuccess"><div class="order-success-page"><div class="order-success-top"><div class="order-success-icon">✓</div><span class="order-success-check">PESANAN TERSIMPAN</span><h2>Pesanan berhasil dibuat</h2><p>Terima kasih. Pesanan Anda sudah masuk ke sistem Duta LED.</p></div><div class="order-card order-number-card"><span>Nomor pesanan</span><strong>${esc(o.orderNo)}</strong></div><div class="order-card"><h3>📦 Detail Pesanan</h3>${items.map(i=>{const q=Number(i.qty)||1;const price=getPrice(i);return `<div class="order-detail-item"><div><strong>${esc(i.nama||"Produk")}</strong><small>${q} × ${rupiah(price)}</small></div><b>${rupiah(price*q)}</b></div>`}).join("")}<div class="order-total"><span>Total Pesanan</span><strong>${rupiah(o.total)}</strong></div></div><div class="order-card payment-card"><h3>💳 Pembayaran</h3><div class="payment-method"><span>Metode</span><strong>${esc(pay.label)}</strong></div><div class="payment-method"><span>Status pembayaran</span><strong>${esc(pay.status)}</strong></div><div class="payment-amount"><span>${esc(pay.title)}</span><strong>${esc(pay.amount)}</strong></div>${pay.label==="Transfer Bank"?'<p>Silakan transfer sebesar <b>'+rupiah(o.total)+'</b> sesuai instruksi pembayaran dari Duta LED.</p>':''}${pay.label==="COD"?'<p>Pesanan dibayar saat barang diterima. Tidak perlu transfer sekarang.</p>':''}</div><div class="order-card status-card"><h3>📋 Status Pesanan</h3><div class="order-status"><span class="status-dot"></span><div><strong>Menunggu Pembayaran</strong><small>Pesanan sudah dibuat dan menunggu proses berikutnya.</small></div></div></div><div class="order-success-actions"><button type="button" id="orderBackShop" class="checkout-submit">Kembali Belanja</button><button type="button" id="orderCloseSuccess" class="order-secondary">Tutup</button></div></div></div>`);
    document.body.classList.add("order-success-open");
    document.getElementById("orderCloseSuccess")?.addEventListener("click",closeSuccess);
    document.getElementById("orderBackShop")?.addEventListener("click",closeSuccess);
  }

  function closeSuccess(){
    document.getElementById("orderSuccess")?.remove();
    document.body.classList.remove("order-success-open");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function buildCheckoutModal(){
    if(document.getElementById("checkoutModal"))return;
    document.body.insertAdjacentHTML("beforeend",`<div id="checkoutModal" class="checkout-modal" aria-hidden="true"><div class="checkout-backdrop" data-checkout-close></div><section class="checkout-dialog" role="dialog" aria-modal="true" aria-label="Checkout Duta LED"><header><div><small>CHECKOUT WEBSITE</small><h2>Buat Pesanan</h2></div><button type="button" class="checkout-x" data-checkout-close>×</button></header><form id="checkoutForm"><div class="checkout-grid"><div class="checkout-form-side"><h3>Data Pembeli</h3><label>Nama lengkap<input name="nama" required autocomplete="name" placeholder="Nama penerima"></label><label>Nomor HP / WhatsApp<input name="wa" required inputmode="tel" autocomplete="tel" placeholder="08xxxxxxxxxx"></label><label>Alamat lengkap<textarea name="alamat" required placeholder="Desa, jalan, nomor rumah"></textarea></label><label>Kota / Kecamatan<input name="kota" required placeholder="Contoh: Subah, Batang"></label><h3>Pengiriman</h3><select name="pengiriman"><option>JNE / J&T</option><option>SiCepat</option><option>POS Indonesia</option><option>Ambil di toko</option></select><h3>Pembayaran</h3><select name="pembayaran"><option>Transfer Bank</option><option>QRIS</option><option>COD jika tersedia</option></select></div><aside class="checkout-summary"><h3>Ringkasan Pesanan</h3><div id="checkoutItems"></div><div class="checkout-total"><span>Total Produk</span><b id="checkoutSubtotal">Rp0</b></div><p class="shipping-note">🚚 <b>Ongkir dibayar manual / COD.</b><br>Ongkir tidak ditambahkan ke total produk.</p><div class="checkout-grand"><span>Total Produk</span><strong id="checkoutGrandTotal">Rp0</strong></div><button type="submit" class="checkout-submit">Buat Pesanan</button><small>Pesanan dibuat langsung di website/database. WhatsApp hanya untuk konsultasi.</small></aside></div></form></section></div>`);
    document.querySelectorAll("[data-checkout-close]").forEach(x=>x.addEventListener("click",closeCheckout));
    document.getElementById("checkoutForm")?.addEventListener("submit",submitOrder);
  }

  function initCheckout(){
    const b=document.getElementById("checkoutButton");
    if(b){
      b.textContent="Checkout";
      b.type="button";
      b.onclick=null;
      b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();openCheckout();},true);
    }
    buildCheckoutModal();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initCheckout);
  else initCheckout();
})();
