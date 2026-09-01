/* Duta LED — reliable bottom navigation */
(function(){
  'use strict';
  function init(){
    var items=document.querySelectorAll('.bottom-nav-item[data-nav]');
    if(!items.length)return;
    items.forEach(function(el){
      el.addEventListener('click',function(e){
        e.preventDefault();
        var nav=el.getAttribute('data-nav');
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
          // Akun Toko = Admin. Gunakan URL relatif agar tetap bekerja
          // pada custom domain, GitHub Pages, dan saat PWA dibuka standalone.
          window.location.href='./admin.html';
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
