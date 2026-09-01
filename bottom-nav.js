/* Duta LED — bottom navigation */
(function(){
  'use strict';
  function openOrdersPage(e){
    if(e){e.preventDefault();e.stopPropagation();}
    if(typeof window.showOrders==='function'){window.showOrders();return false;}
    setTimeout(function(){if(typeof window.showOrders==='function')window.showOrders();},100);
    return false;
  }
  function init(){
    var items=document.querySelectorAll('.bottom-nav-item[data-nav]');
    if(!items.length)return;
    items.forEach(function(el){
      if(el.getAttribute('data-nav')==='orders'){
        el.removeAttribute('href');
        el.addEventListener('click',openOrdersPage,true);
        return;
      }
      el.addEventListener('click',function(e){
        e.preventDefault();
        var nav=el.getAttribute('data-nav');
        items.forEach(function(x){x.classList.remove('active');});
        el.classList.add('active');
        if(nav==='home'){
          document.getElementById('ordersPage')?.remove();
          window.scrollTo({top:0,behavior:'smooth'});
        }else if(nav==='cart'){
          var b=document.getElementById('cartButton');if(b)b.click();
        }else if(nav==='account'){
          window.location.href='./admin.html';
        }
      });
    });
    var cc=document.getElementById('cartCount'),bc=document.getElementById('bottomCartCount');
    if(cc&&bc){function sync(){bc.textContent=cc.textContent||'0';}sync();new MutationObserver(sync).observe(cc,{childList:true,characterData:true,subtree:true});}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
