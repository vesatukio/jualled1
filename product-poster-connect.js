/* Inject a Promosikan button into product cards without changing app.js */
(function(){
  function inject(){
    document.querySelectorAll('.product-card').forEach(card=>{
      if(card.querySelector('.poster-open')) return;
      const share=card.querySelector('.product-share');
      if(!share) return;
      const btn=document.createElement('button');
      btn.type='button'; btn.className='poster-open'; btn.title='Buat posting Facebook/TikTok'; btn.textContent='📣 Promosikan';
      share.appendChild(btn);
      btn.addEventListener('click',function(e){
        e.preventDefault(); e.stopPropagation();
        const name=card.querySelector('.product-name')?.textContent.trim()||'';
        const product=(window.products||[]).find(p=>String(p.nama||'').trim()===name);
        if(window.DutaPoster&&product){window.DutaPoster.open(product);return;}
        /* app.js keeps products private; recover basic card data safely for the poster */
        const price=card.querySelector('.price')?.textContent.trim()||'';
        const old=card.querySelector('.old-price')?.textContent.trim()||'';
        const img=card.querySelector('.gallery-slide img')?.src||'';
        window.DutaPoster?.open({id:'',nama:name,hargaJual:Number(price.replace(/[^0-9]/g,''))||0,hargaDiskon:old?Number(price.replace(/[^0-9]/g,'')):0,deskripsi:'Produk Duta LED untuk kebutuhan rumah, toko, teknisi, dan usaha.',gambar1:img});
      });
    });
  }
  document.addEventListener('DOMContentLoaded',inject);
  const observer=new MutationObserver(inject);
  observer.observe(document.body,{childList:true,subtree:true});
})();
