/* Duta LED — reliable bottom navigation */
(function(){
  'use strict';
  function init(){
    var items=document.querySelectorAll('.bottom-nav-item');
    if(!items.length)return;
    items.forEach(function(el){
      el.addEventListener('click',function(e){
        var nav=el.getAttribute('data-nav');
        if(!nav)return;
        e.preventDefault();
        items.forEach(function(x){x.classList.remove('active');});
        el.classList.add('active');
        if(nav==='home'){
          window.scrollTo({top:0,behavior:'smooth'});
        }else if(nav==='cart'){
          var b=document.getElementById('cartButton');
          if(b)b.click();
        }else if(nav==='orders'){
          var panel=document.getElementById('cartPanel');
          var checkout=document.getElementById('checkoutButton');
          if(panel && checkout){
            panel.classList.add('open');
            var overlay=document.getElementById('cartOverlay');
            if(overlay)overlay.classList.remove('hidden');
            setTimeout(function(){checkout.scrollIntoView({behavior:'smooth',block:'center'});},100);
          }else{
            var target=document.getElementById('pesanan')||document.querySelector('.checkout-section');
            if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
          }
        }else if(nav==='account'){
          var c=document.querySelector('.contact');
          if(c)c.scrollIntoView({behavior:'smooth',block:'start'});
        }
      });
    });
    var cc=document.getElementById('cartCount'),bc=document.getElementById('bottomCartCount');
    if(cc&&bc){
      function sync(){bc.textContent=cc.textContent||'0';}
      sync();
      new MutationObserver(sync).observe(cc,{childList:true,characterData:true,subtree:true});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
