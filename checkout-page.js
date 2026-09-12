(function(){
  'use strict';
  const CART_KEY='dutaled_cart_v4';
  const rupiah=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0);
  const getCart=()=>{try{return JSON.parse(localStorage.getItem(CART_KEY)||'[]')||[]}catch(_){return[]}};
  const price=i=>Number(i.hargaTampil??i.hargaDiskon??i.hargaJual??i.harga??0)||0;

  function render(){
    const cart=getCart(), box=document.getElementById('items'), total=document.getElementById('total');
    if(!cart.length){
      if(box) box.innerHTML='<div class="empty-checkout">🛒 Keranjang masih kosong.</div>';
      if(total) total.textContent=rupiah(0);
      const btn=document.getElementById('submit'); if(btn) btn.disabled=true;
      return;
    }
    let sum=0;
    if(box) box.innerHTML=cart.map(i=>{
      const q=Math.max(1,Number(i.qty)||1), sub=price(i)*q; sum+=sub;
      return '<div class="checkout-row"><div><strong>'+escapeHtml(i.nama||'Produk')+'</strong><small>'+q+' × '+rupiah(price(i))+'</small></div><b>'+rupiah(sub)+'</b></div>';
    }).join('');
    if(total) total.textContent=rupiah(sum);
  }

  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}

  function setModalForm(data){
    const form=document.querySelector('#checkoutModal form');
    if(!form) return false;
    ['nama','wa','alamat','kota','pengiriman','pembayaran'].forEach(name=>{
      const value=data[name];
      if(value==null) return;
      const el=form.querySelector('[name="'+name+'"]');
      if(!el) return;
      if(el.type==='radio'){
        form.querySelectorAll('[name="'+name+'"] input').forEach(x=>x.checked=x.value===value);
        form.querySelectorAll('[name="'+name+'"]').forEach(x=>x.checked=x.value===value);
      }else el.value=value;
    });
    return true;
  }

  function showPageSuccess(order){
    const el=document.getElementById('success'); if(!el) return;
    const no=order?.orderNo||order?.order_id||'-';
    el.classList.remove('hidden');
    el.innerHTML='<div class="success-card"><div class="success-icon">✓</div><h2>Pesanan berhasil dibuat</h2><p>Nomor pesanan Anda:</p><strong class="order-no">'+escapeHtml(no)+'</strong><p class="success-note">Pesanan sudah tercatat di DutaLED. Simpan nomor pesanan ini untuk melihat status pesanan.</p><div class="success-actions"><a href="index.html">Kembali ke toko</a><button type="button" id="goOrders">Pesanan Saya</button></div></div>';
    document.getElementById('goOrders')?.addEventListener('click',()=>{
      if(typeof window.showOrders==='function') window.showOrders();
      else location.href='index.html';
    });
  }

  document.addEventListener('dutaled:order-created',e=>{
    document.body.classList.remove('checkout-open');
    const modal=document.getElementById('checkoutModal');
    if(modal) modal.style.display='none';
    showPageSuccess(e.detail||{});
  });

  document.addEventListener('DOMContentLoaded',()=>{
    render();
    const form=document.getElementById('orderForm');
    const submit=document.getElementById('submit');
    if(!form||!submit) return;
    form.addEventListener('submit',e=>{
      e.preventDefault();
      if(!form.reportValidity()) return;
      if(!getCart().length){alert('Keranjang masih kosong.');return;}
      if(typeof window.openCheckout!=='function'){
        alert('Sistem checkout belum siap. Silakan muat ulang halaman.');
        return;
      }
      const data=Object.fromEntries(new FormData(form).entries());
      submit.disabled=true; submit.textContent='Menyimpan pesanan...';
      try{
        window.openCheckout();
        const modal=document.getElementById('checkoutModal');
        if(!setModalForm(data)) throw new Error('Form order lama tidak ditemukan.');
        if(modal) modal.style.display='none';
        const oldForm=document.querySelector('#checkoutModal form');
        if(!oldForm) throw new Error('Form order tidak ditemukan.');
        oldForm.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
      }catch(err){
        console.error(err);
        submit.disabled=false; submit.textContent='Buat Pesanan';
        alert('Checkout gagal dijalankan: '+(err.message||err));
      }
    });
  });
})();