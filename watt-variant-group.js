/* DutaLED - 1 kartu utuh untuk varian watt: hanya watt & harga yang berubah */
(function(){
  'use strict';
  var WATTS=['5W','7W','9W','12W','18W'];
  var done=false;
  function esc(v){return String(v||'').replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c];});}
  function watt(name){var m=String(name||'').match(/\b(5|7|9|12|18)\s*W\b/i);return m?m[1]+'W':'';}
  function baseName(name){return String(name||'').replace(/\b(5|7|9|12|18)\s*W\b/ig,'').replace(/\s{2,}/g,' ').replace(/\s*[-–—|/]\s*$/,'').trim().toLowerCase();}
  function makeGroup(cards){
    var data=cards.map(function(card){
      var name=card.querySelector('.product-name')?.textContent.trim()||'';
      var img=card.querySelector('.product-gallery img')?.getAttribute('src')||'image/no-image.png';
      var price=card.querySelector('.price')?.textContent.trim()||'';
      var old=card.querySelector('.old-price')?.textContent.trim()||'';
      var buy=card.querySelector('.buy-button');
      var desc=card.querySelector('.product-description,.description,.product-desc')?.textContent.trim()||'';
      return {card:card,name:name,watt:watt(name),img:img,price:price,old:old,buy:buy,desc:desc};
    }).filter(function(x){return x.watt;});
    data.sort(function(a,b){return parseInt(a.watt)-parseInt(b.watt);});
    if(data.length<2)return null;
    var first=data[0];
    var displayName=first.name.replace(/\b(5|7|9|12|18)\s*W\b/i,'').replace(/\s{2,}/g,' ').trim();
    var group=document.createElement('article');
    group.className='product-card watt-variant-card';
    group.innerHTML='<div class="product-gallery watt-gallery"><div class="gallery-slide"><img src="'+esc(first.img)+'" alt="'+esc(displayName)+' '+esc(first.watt)+'" loading="lazy" draggable="false"></div></div>'+
      '<div class="product-info">'+
      '<div class="product-name">'+esc(displayName)+'</div>'+ 
      '<div class="watt-label">Pilih Watt</div><div class="watt-options"></div>'+ 
      '<div class="watt-price"><span class="price">'+esc(first.price)+'</span><span class="old-price">'+esc(first.old)+'</span></div>'+ 
      '<div class="watt-description">'+esc(first.desc)+'</div>'+ 
      '<button type="button" class="buy-button watt-buy">🛒 + Keranjang</button>'+ 
      '<div class="watt-note">Bentuk lampu sama, pilih daya sesuai kebutuhan.</div></div>';
    var opts=group.querySelector('.watt-options'),priceEl=group.querySelector('.watt-price .price'),oldEl=group.querySelector('.watt-price .old-price'),imgEl=group.querySelector('.watt-gallery img'),descEl=group.querySelector('.watt-description');
    var selected=first;
    data.forEach(function(item,i){
      var b=document.createElement('button');b.type='button';b.className='watt-option'+(i===0?' active':'');b.textContent=item.watt;
      b.addEventListener('click',function(e){
        e.preventDefault();e.stopPropagation();selected=item;
        opts.querySelectorAll('.watt-option').forEach(function(x){x.classList.remove('active');});b.classList.add('active');
        priceEl.textContent=item.price;oldEl.textContent=item.old;oldEl.style.display=item.old?'inline-block':'none';
        imgEl.src=item.img;imgEl.alt=displayName+' '+item.watt;
        if(descEl)descEl.textContent=item.desc||first.desc||'';
      });
      opts.appendChild(b);
    });
    group.querySelector('.watt-buy').addEventListener('click',function(e){e.preventDefault();e.stopPropagation();if(selected.buy)selected.buy.click();});
    return group;
  }
  function apply(){
    if(done)return;
    var grid=document.getElementById('productGrid');if(!grid)return;
    var cards=[].slice.call(grid.querySelectorAll(':scope > .product-card:not(.watt-variant-card)'));if(!cards.length)return;
    var groups={};cards.forEach(function(card){var name=card.querySelector('.product-name')?.textContent||'';var w=watt(name);if(!w)return;var key=baseName(name);(groups[key]||(groups[key]=[])).push(card);});
    var changed=false;
    Object.keys(groups).forEach(function(key){var list=groups[key];var allowed=list.filter(function(c){return WATTS.indexOf(watt(c.querySelector('.product-name')?.textContent||''))>=0;});if(allowed.length<2)return;var group=makeGroup(allowed);if(!group)return;grid.insertBefore(group,allowed[0]);allowed.forEach(function(c){c.remove();});changed=true;});
    if(changed)done=true;
  }
  function init(){var grid=document.getElementById('productGrid');if(!grid)return;var observer=new MutationObserver(function(){apply();});observer.observe(grid,{childList:true});var tries=0;var timer=setInterval(function(){apply();if(done||++tries>80)clearInterval(timer);},250);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
