/* Duta LED — Share Produk v7 */
(function(){
  'use strict';
  const rupiah=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0);
  const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
  const lists=()=>[window.products,window.produk,window.PRODUK,window.allProducts,window.productData].filter(Array.isArray);
  let productIndex=null;
  function buildIndex(){
    const map=new Map();
    for(const list of lists()) for(const p of list){
      const id=p?.id??p?.kode??p?.sku;
      if(id!=null) map.set(String(id),p);
      const name=clean(p?.nama||p?.namaProduk);
      if(name) map.set('name:'+name,p);
    }
    productIndex=map;
  }
  function productUrl(p){
    const id=p?.id??p?.kode??p?.sku??'';
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
      await navigator.clipboard.writeText(text); alert('Info produk sudah disalin.'); return true;
    }catch(e){
      if(e?.name==='AbortError')return false;
      try{await navigator.clipboard.writeText(text);alert('Info produk sudah disalin.');return true;}catch(_){prompt('Salin info produk ini:',text);return false;}
    }
  }
  window.shareProduct=shareProduct;
  function findProductForCard(card){
    if(!productIndex)buildIndex();
    const id=card.dataset.id||card.dataset.productId||card.getAttribute('data-id');
    if(id!=null){const p=productIndex.get(String(id));if(p)return p;}
    const name=clean(card.querySelector('.product-name')?.textContent);
    return name?(productIndex.get('name:'+name)||null):null;
  }
  function removeOldShareControls(card){
    card.querySelectorAll('.product-share-btn,[class*="share"],[id*="share"],a[title*="Bagikan"],button[title*="Bagikan"],a[aria-label*="Bagikan"],button[aria-label*="Bagikan"]').forEach(el=>el.remove());
  }
  function addButton(card){
    removeOldShareControls(card);
    const imageWrap=card.querySelector('.product-image,.product-img');
    if(!imageWrap)return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='product-share-btn';
    btn.setAttribute('aria-label','Bagikan produk');
    btn.setAttribute('title','Bagikan produk');
    btn.textContent='↗';
    imageWrap.appendChild(btn);
    const p=findProductForCard(card);
    if(p)btn.onclick=e=>{e.preventDefault();e.stopPropagation();shareProduct(p);};
  }
  function refresh(){
    const grid=document.querySelector('#productGrid');
    if(!grid)return;
    buildIndex();
    grid.querySelectorAll('.product-card').forEach(addButton);
  }
  function init(){
    const grid=document.querySelector('#productGrid');
    if(!grid){setTimeout(init,300);return;}
    refresh();
    let timer=0;
    const observer=new MutationObserver(()=>{
      clearTimeout(timer);
      timer=setTimeout(refresh,250);
    });
    observer.observe(grid,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
