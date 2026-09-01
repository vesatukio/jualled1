/* DUTA LED - HOMEPAGE DINAMIS */
(function(){
  'use strict';
  function loadPromo(){if(window.__promoHeaderLoaded)return;window.__promoHeaderLoaded=true;const s=document.createElement('script');s.src='promo-header-supabase.js?v=20260902-1';s.defer=true;document.head.appendChild(s)}
  loadPromo();
  let lastSignature='';
  function rupiah(n){return 'Rp'+(Number(n)||0).toLocaleString('id-ID');}
  function price(p){
    const j=Number(p.hargaJual)||0, d=Number(p.hargaDiskon)||0;
    return d>0&&d<j?d:j;
  }
  function card(p){
    const image=p.gambar1||p.gambar2||p.gambar3||'image/no-image.png';
    const j=Number(p.hargaJual)||0, h=price(p), promo=h<j&&j>0;
    const el=document.createElement('article'); el.className='product-card dynamic-card';
    el.innerHTML='<a href="?id='+encodeURIComponent(p.id)+'" class="product-image"><img loading="lazy" src="'+image.replace(/"/g,'&quot;')+'" alt="'+String(p.nama||'Produk').replace(/"/g,'&quot;')+'">'+(promo?'<span class="discount-badge">PROMO</span>':'')+'</a><div class="product-info"><div class="product-name">'+p.nama+'</div>'+(promo?'<div class="old-price">'+rupiah(j)+'</div>':'')+'<div class="price">'+rupiah(h)+'</div><button class="buy-button" type="button">🛒 Tambah Keranjang</button></div>';
    const b=el.querySelector('.buy-button'); if(b&&typeof window.addToCart==='function') b.onclick=function(){window.addToCart(p.id);};
    return el;
  }
  function section(id,title,items){
    let s=document.getElementById(id); if(!s){s=document.createElement('section');s.id=id;s.className='dynamic-section';document.getElementById('produk')?.before(s);}
    s.innerHTML='<div class="container"><div class="section-title"><span class="eyebrow">DUTA LED</span><h2>'+title+'</h2></div><div class="dynamic-products"></div></div>';
    const g=s.querySelector('.dynamic-products'); items.slice(0,4).forEach(p=>g.appendChild(card(p)));
  }
  function render(){
    if(!Array.isArray(window.products)||!window.products.length)return;
    const sig=window.products.map(p=>p.id+':'+p.hargaJual+':'+p.hargaDiskon).join('|'); if(sig===lastSignature)return; lastSignature=sig;
    const all=window.products.slice();
    const promo=all.filter(p=>(Number(p.hargaDiskon)||0)>0&&(Number(p.hargaDiskon)||0)<(Number(p.hargaJual)||0));
    const latest=all.slice(-4).reverse();
    const featured=all.filter(p=>Number(p.hargaJual)>0).sort((a,b)=>(Number(b.hargaJual)||0)-(Number(a.hargaJual)||0)).slice(0,4);
    if(promo.length)section('homePromo','🔥 Promo Pilihan',promo); else document.getElementById('homePromo')?.remove();
    section('homeLatest','🆕 Produk Terbaru',latest);
    section('homeFeatured','⭐ Produk Pilihan',featured);
  }
  function boot(){let n=0;const t=setInterval(function(){render();if(Array.isArray(window.products)&&window.products.length)n++;if(n>3)clearInterval(t);},1500);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
