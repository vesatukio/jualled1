(function(){
  'use strict';
  const CART_KEY='dutaled_cart_v4';
  const HANDOFF_KEY='dutaled_checkout_handoff_v1';
  const CART_KEYS=[CART_KEY,'dutaled_cart_v3','dutaled_cart_v2','dutaled_cart','cart'];
  const SUPABASE_URL='https://opgeeqnucxrdqcgwcuge.supabase.co';
  const SUPABASE_KEY='sb_publishable_uqah55SK8ZjyugWprFnFMA_QnyVdCLA';
  const HEADERS={apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY,'Content-Type':'application/json'};
  const rupiah=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0);

  function normalizeItem(i){
    if(!i||typeof i!=='object') return null;
    const qty=Math.max(1,Number(i.qty??i.jumlah??i.quantity??1)||1);
    return {...i,qty};
  }

  function readCart(){
    try{
      const handoff=sessionStorage.getItem(HANDOFF_KEY);
      if(handoff){
        const parsed=JSON.parse(handoff);
        if(Array.isArray(parsed)&&parsed.length){
          const cart=parsed.map(normalizeItem).filter(Boolean);
          localStorage.setItem(CART_KEY,JSON.stringify(cart));
          return cart;
        }
      }
    }catch(_){ }
    for(const key of CART_KEYS){
      try{
        const parsed=JSON.parse(localStorage.getItem(key)||'[]');
        if(Array.isArray(parsed)&&parsed.length){
          const cart=parsed.map(normalizeItem).filter(Boolean);
          if(cart.length){
            localStorage.setItem(CART_KEY,JSON.stringify(cart));
            return cart;
          }
        }
      }catch(_){ }
    }
    return [];
  }

  function price(i){return Number(i.hargaTampil??i.hargaDiskon??i.hargaJual??i.harga??0)||0;}
  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}

  function render(){
    const cart=readCart(),box=document.getElementById('items'),total=document.getElementById('total');
    if(!cart.length){
      if(box) box.innerHTML='<div class="empty-checkout">🛒 Keranjang masih kosong.</div>';
      if(total) total.textContent=rupiah(0);
      const btn=document.getElementById('submit'); if(btn) btn.disabled=true;
      return;
    }
    let sum=0;
    if(box) box.innerHTML=cart.map(i=>{
      const q=Math.max(1,Number(i.qty)||1),sub=price(i)*q;sum+=sub;
      return '<div class="checkout-row"><div><strong>'+escapeHtml(i.nama||'Produk')+'</strong><small>'+q+' × '+rupiah(price(i))+'</small></div><b>'+rupiah(sub)+'</b></div>';
    }).join('');
    if(total) total.textContent=rupiah(sum);
  }

  async function createOrder(data,cart){
    const total=cart.reduce((s,i)=>s+price(i)*(Number(i.qty)||1),0);
    const orderNo='DL'+new Date().toISOString().replace(/\D/g,'').slice(0,14)+Math.floor(Math.random()*90+10);
    const payload={
      order_id:orderNo,
      nama_pembeli:data.nama,
      no_hp:data.wa,
      alamat:data.alamat,
      kecamatan:data.kota||null,
      metode_pengiriman:data.pengiriman||null,
      metode_pembayaran:data.pembayaran||null,
      total_harga:total,
      status:'Menunggu Pembayaran'
    };
    const items=cart.map(i=>{
      const pid=Number(i.id);
      return {
        produk_id:Number.isFinite(pid)&&pid>0?String(pid):null,
        nama_produk:i.nama||'Produk',
        qty:Number(i.qty)||1,
        harga_saat_beli:price(i)
      };
    });
    const response=await fetch(SUPABASE_URL+'/rest/v1/rpc/create_public_order',{
      method:'POST',headers:HEADERS,body:JSON.stringify({p_order:payload,p_items:items}),cache:'no-store'
    });
    let result=null;try{result=await response.json();}catch(_){ }
    if(!response.ok) throw new Error(result?.message||result?.hint||result?.details||result?.error||('HTTP '+response.status));
    if(!result?.success||!result?.id) throw new Error('Server tidak mengembalikan ID pesanan.');
    return {id:result.id,orderNo:result.order_id||orderNo,total,items,customer:data,payment:data.pembayaran,status:'Menunggu Pembayaran',createdAt:new Date().toISOString()};
  }

  function showSuccess(order){
    const el=document.getElementById('success');if(!el)return;
    el.classList.remove('hidden');
    el.innerHTML='<div class="success-card"><div class="success-icon">✓</div><h2>Pesanan berhasil dibuat</h2><p>Nomor pesanan Anda:</p><strong class="order-no">'+escapeHtml(order.orderNo)+'</strong><p class="success-note">Pesanan sudah tercatat di DutaLED. Simpan nomor pesanan ini untuk melihat status pesanan.</p><div class="success-actions"><a href="index.html">Kembali ke toko</a><a href="index.html#produk">Belanja lagi</a></div></div>';
    try{sessionStorage.removeItem(HANDOFF_KEY);localStorage.removeItem(CART_KEY);localStorage.setItem('dutaled_last_order',JSON.stringify(order));}catch(_){ }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    render();
    const form=document.getElementById('orderForm'),submit=document.getElementById('submit');
    if(!form||!submit)return;
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      if(!form.reportValidity())return;
      const cart=readCart();
      if(!cart.length){alert('Keranjang masih kosong. Silakan kembali ke toko dan tambahkan produk lagi.');return;}
      const data=Object.fromEntries(new FormData(form).entries());
      submit.disabled=true;submit.textContent='Menyimpan pesanan...';
      try{
        const order=await createOrder(data,cart);
        showSuccess(order);
      }catch(err){
        console.error('DutaLED checkout error',err);
        alert('Pesanan gagal disimpan: '+(err.message||err));
        submit.disabled=false;submit.textContent='Buat Pesanan';
      }
    });
  });
})();
