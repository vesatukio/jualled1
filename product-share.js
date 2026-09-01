/* Duta LED — Share Produk v4 */
(function(){
  'use strict';
  const rupiah=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0);
  const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
  const lists=()=>[window.products,window.produk,window.PRODUK,window.allProducts,window.productData].filter(Array.isArray);
  function productUrl(p){
    const id=p?.id ?? p?.kode ?? p?.sku ?? '';
    const url=new URL(window.location.href);
    if(id) url.searchParams.set('id',String(id));
    url.hash='produk';
    return url.toString();
  }
  function shareText(p){
    const nama=clean(p?.nama||p?.namaProduk||'Produk Duta LED');
    const harga=Number(p?.hargaTampil??p?.hargaDiskon??p?.hargaJual??p?.harga??0)||0;
    return `🛍️ ${nama}\n💰 ${rupiah(harga)}\n\nLihat produk: ${productUrl(p)}`;
  }
  async function shareProduct(p){
    if(!p)return false;
    const text=shareText(p),url=productUrl(p),title=clean(p.nama||p.namaProduk||'Produk Duta LED');
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
    for(const list of lists()){
      const p=list.find(x=>String(x.id??x.kode??x.sku)===String(id));
      if(p)return p;
    }
    return null;
  }
  function findProductForCard(card){
    const id=card.dataset.id||card.dataset.productId||card.getAttribute('data-id');
    if(id!=null){const p=findProduct(id);if(p)return p;}
    const name=clean(card.querySelector('.product-name')?.textContent);
    if(name){
      for(const list of lists()){
        const p=list.find(x=>clean(x?.nama||x?.namaProduk)===name);
        if(p)return p;
      }
    }
    return null;
  }
  window.shareProductById=id=>{const p=findProduct(id);if(p)return shareProduct(p);alert('Produk tidak ditemukan.');};
  function addButtons(){
    document.querySelectorAll('.product-card').forEach(card=>{
      const imageWrap=card.querySelector('.product-image,.product-img');
      let btn=imageWrap?.querySelector('.product-share-btn');
      if(imageWrap){
        /* Hapus hanya tombol share lama yang berada di luar gambar. */
        card.querySelectorAll('.product-share-btn').forEach(old=>{
          if(old!==btn && old.parentElement!==imageWrap) old.remove();
        });
      }else{
        /* Jika tidak ada wrapper gambar, jangan hapus tombol lalu membuatnya lagi. */
        btn=card.querySelector('.product-share-btn');
      }
      if(!btn){
        btn=document.createElement('button');
        btn.type='button';
        btn.className='product-share-btn';
        btn.textContent='↗ Bagikan';
        (imageWrap||card).appendChild(btn);
      }
      const p=findProductForCard(card);
      if(p) btn.onclick=e=>{e.preventDefault();e.stopPropagation();shareProduct(p);};
    });
  }
  function init(){
    addButtons();
    let timer=null;
    const observer=new MutationObserver(()=>{
      clearTimeout(timer);
      timer=setTimeout(addButtons,80);
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
