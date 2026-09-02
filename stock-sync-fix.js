/* DUTA LED - stock sync + price position fix */
(function(){
  'use strict';
  function moveStock(card){
    if(!card) return;
    const info=card.querySelector('.product-info');
    const price=info?.querySelector('.price');
    const old=info?.querySelector('.old-price');
    const badge=info?.querySelector('.stock-status');
    if(!info||!price||!badge)return;
    let row=info.querySelector('.price-stock-row');
    if(!row){
      row=document.createElement('div');
      row.className='price-stock-row';
      price.parentNode.insertBefore(row,price);
      row.appendChild(price);
      if(old)row.appendChild(old);
    }else{
      row.appendChild(price);
      if(old)row.appendChild(old);
    }
    row.appendChild(badge);
  }
  function scan(){document.querySelectorAll('.product-card').forEach(moveStock);}
  function css(){
    if(document.getElementById('stockSyncFixCSS'))return;
    const s=document.createElement('style');s.id='stockSyncFixCSS';
    s.textContent='.product-info .price-stock-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-height:28px;margin:2px 0 5px}.product-info .price-stock-row .price{margin:0}.product-info .price-stock-row .old-price{margin:0}.product-info .price-stock-row .stock-status{margin:0}.product-info .stock-status.stock-empty{font-size:10px;padding:4px 7px}.product-info .stock-status.stock-low{font-size:10px;padding:4px 7px}';
    document.head.appendChild(s);
  }
  function boot(){css();scan();const grid=document.getElementById('productGrid');if(grid)new MutationObserver(scan).observe(grid,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();