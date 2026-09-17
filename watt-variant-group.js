/* DutaLED - otomatis menggabungkan produk berdasarkan variant_group Supabase */
(function(){
  'use strict';
  var applied={};
  var SUPABASE_URL='https://opgeeqnucxrdqcgwcuge.supabase.co';
  var SUPABASE_KEY='sb_publishable_uqah55SK8ZjyugWprFnFMA_QnyVdCLA';
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c];});}
  async function loadMeta(){
    try{
      var r=await fetch(SUPABASE_URL+'/rest/v1/produk?select=id,nama,deskripsi,harga_jual,diskon,stok,foto_urls,variant_group,variant_label&is_active=eq.true&variant_group=not.is.null&order=id.asc',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY},cache:'no-store'});
      if(!r.ok) throw Error('HTTP '+r.status);
      return await r.json();
    }catch(e){console.warn('Variant metadata:',e);return null;}
  }
  function findCard(grid,name){
    var all=[].slice.call(grid.querySelectorAll(':scope > .product-card:not(.manual-variant-card)'));
    return all.find(function(c){return (c.querySelector('.product-name')?.textContent||'').trim()===String(name||'').trim();})||null;
  }
  function hideCard(c){if(c){c.dataset.manualVariantHidden='1';c.style.display='none';}}
  function baseName(name){return String(name||'').replace(/\s*[-–—|/]?\s*\b(?:5|7|9|12|15|18|24|30|40|50)\s*W\b/ig,'').replace(/\s{2,}/g,' ').trim();}
  function makeGroup(grid,items,cards){
    var first=items[0],firstCard=cards[0],name=baseName(first.nama)||first.nama,img=(first.foto_urls&&first.foto_urls[0])||firstCard?.querySelector('.product-gallery img')?.src||'image/no-image.png';
    var group=document.createElement('article');group.className='product-card watt-variant-card manual-variant-card';group.dataset.variantGroup=String(first.variant_group||'');
    group.innerHTML='<div class="product-gallery watt-gallery"><div class="gallery-slide"><img class="manual-variant-img" src="'+esc(img)+'" alt="'+esc(name)+'" loading="lazy" draggable="false"></div></div><div class="product-info"><div class="product-name">'+esc(name)+'</div><div class="watt-label">Pilih Varian</div><div class="watt-options"></div><div class="watt-price"><span class="price"></span><span class="old-price"></span></div><div class="watt-stock"></div><div class="watt-description"></div><button type="button" class="buy-button watt-buy">🛒 + Keranjang</button><div class="watt-note">Pilih ukuran daya yang diinginkan.</div></div>';
    var opts=group.querySelector('.watt-options'),price=group.querySelector('.price'),old=group.querySelector('.old-price'),stock=group.querySelector('.watt-stock'),desc=group.querySelector('.watt-description'),im=group.querySelector('.manual-variant-img');
    var selected=items[0],selectedCard=cards[0];
    function render(item,card,button){
      selected=item;selectedCard=card;opts.querySelectorAll('.watt-option').forEach(function(x){x.classList.remove('active')});if(button)button.classList.add('active');
      var p=Number(item.harga_jual||0),d=Number(item.diskon||0),final=d>0?Math.max(0,Math.round(p-(p*d/100))):p;
      price.textContent='Rp '+final.toLocaleString('id-ID');old.style.display=d>0?'inline-block':'none';old.textContent=d>0?'Rp '+p.toLocaleString('id-ID'):'';stock.textContent=Number(item.stok)>0?'Stok tersedia':'Stok habis';desc.textContent=item.deskripsi||'';if(item.foto_urls&&item.foto_urls[0])im.src=item.foto_urls[0];
    }
    items.forEach(function(item,i){var b=document.createElement('button');b.type='button';b.className='watt-option'+(i===0?' active':'');b.textContent=item.variant_label||item.nama;if(Number(item.stok)<=0)b.classList.add('out');b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();render(item,cards[i],b);});opts.appendChild(b);});
    render(items[0],cards[0],opts.firstChild);
    group.querySelector('.watt-buy').addEventListener('click',function(e){e.preventDefault();e.stopPropagation();var buy=selectedCard?.querySelector('.buy-button');if(buy)buy.click();});
    grid.insertBefore(group,firstCard);cards.forEach(hideCard);return group;
  }
  async function apply(){
    var grid=document.getElementById('productGrid');if(!grid)return;var meta=await loadMeta();if(!meta)return;var groups={};
    meta.forEach(function(x){var g=String(x.variant_group||'').trim();if(g)(groups[g]||(groups[g]=[])).push(x);});
    Object.keys(groups).forEach(function(g){if(applied[g])return;var items=groups[g].filter(function(x){return findCard(grid,x.nama)});if(items.length<2)return;items.sort(function(a,b){return Number(a.id)-Number(b.id)});var cards=items.map(function(x){return findCard(grid,x.nama)});if(cards.some(function(c){return !c}))return;makeGroup(grid,items,cards);applied[g]=1;});
  }
  function init(){var tries=0;function go(){apply();if(++tries<40)setTimeout(go,500);}go();var grid=document.getElementById('productGrid');if(grid)new MutationObserver(function(){setTimeout(apply,100)}).observe(grid,{childList:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
