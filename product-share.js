/* Duta LED — Share Produk
 * Aman: hanya membagikan nama, harga, dan link produk.
 * Menggunakan Web Share API jika tersedia, fallback ke salin link.
 */
(function(){
  'use strict';
  const rupiah=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0);
  const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
  function productUrl(p){
    const id=p?.id ?? p?.kode ?? p?.sku ?? '';
    const url=new URL(window.location.href);
    if(id) url.searchParams.set('produk',String(id));
    url.hash='produk';
    return url.toString();
  }
  function shareText(p){
    const nama=clean(p?.nama||p?.namaProduk||'Produk Duta LED');
    const harga=Number(p?.hargaTampil??p?.hargaDiskon??p?.hargaJual??p?.harga??0)||0;
    return `🛍️ ${nama}\n💰 ${rupiah(harga)}\n\nLihat produk: ${productUrl(p)}`;
  }
  async function shareProduct(p){
    if(!p)return;
    const text=shareText(p), url=productUrl(p), title=clean(p.nama||p.namaProduk||'Produk Duta LED');
    try{
      if(navigator.share){await navigator.share({title,text,url});return true;}
      await navigator.clipboard.writeText(text);
      alert('Info produk sudah disalin. Silakan tempel ke WhatsApp, Facebook, Telegram, atau aplikasi lain.');
      return true;
    }catch(e){
      if(e?.name==='AbortError')return false;
      try{await navigator.clipboard.writeText(text);alert('Info produk sudah disalin.');return true;}catch(_){prompt('Salin info produk ini:',text);return false;}
    }
  }
  window.shareProduct=shareProduct;
  function findProduct(id){
    const lists=[window.products,window.produk,window.PRODUK,window.allProducts,window.productData];
    for(const list of lists)if(Array.isArray(list)){const p=list.find(x=>String(x.id??x.kode??x.sku)===String(id));if(p)return p;}
    return null;
  }
  window.shareProductById=id=>{const p=findProduct(id);if(p)return shareProduct(p);alert('Produk tidak ditemukan.');};
  function addButtons(){
    document.querySelectorAll('.product-card').forEach(card=>{
      if(card.querySelector('.product-share-btn'))return;
      const id=card.dataset.id||card.dataset.productId||card.getAttribute('data-id');
      if(id==null)return;
      const btn=document.createElement('button');
      btn.type='button';btn.className='product-share-btn';btn.textContent='↗ Bagikan Produk';
      btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();window.shareProductById(id);});
      const image=card.querySelector('.product-image,.product-img,img');
      if(image?.parentElement)image.parentElement.insertAdjacentElement('afterend',btn);else card.insertAdjacentElement('afterbegin',btn);
    });
  }
  const obs=new MutationObserver(addButtons);
  function init(){addButtons();obs.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();