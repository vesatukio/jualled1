/* DUTA LED - Admin fixes v20260904-11 - preserve all admin tabs */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const norm=s=>String(s||'').trim().toUpperCase().replace(/\s+/g,' ');
  const STATUS=[['ALL','Semua'],['MENUNGGU BAYAR','Menunggu Pembayaran'],['BARU','Baru'],['DIPROSES','Diproses'],['DIKIRIM','Dikirim'],['SELESAI','Selesai'],['BATAL','Batal']];
  function statusKey(s){
    const x=norm(s);
    return x==='MENUNGGU PEMBAYARAN'||x==='MENUNGGU BAYAR'||x==='MENUNGGU PEMBAYARAN/COD'||x==='MENUNGGU BAYAR/COD'?'MENUNGGU BAYAR':x;
  }
  function mountOrderTabs(){
    const host=$('orderStatusTabs'),list=$('orderList');
    if(!host||!list)return;
    const cards=Array.from(list.querySelectorAll('.order'));
    const active=window.__dutaFinalStatus||'ALL';
    host.innerHTML=STATUS.map(function(pair){
      const key=pair[0],label=pair[1];
      const n=key==='ALL'?cards.length:cards.filter(function(c){return statusKey(c.querySelector('.status')?.textContent)===key}).length;
      return '<button type="button" class="order-status-tab '+(key===active?'active':'')+'" data-final-status="'+key+'">'+label+'<b>'+n+'</b></button>';
    }).join('');
    host.querySelectorAll('.order-status-tab').forEach(function(b){
      b.onclick=function(){window.__dutaFinalStatus=b.dataset.finalStatus;mountOrderTabs();};
    });
    cards.forEach(function(c){
      const k=statusKey(c.querySelector('.status')?.textContent);
      c.style.display=active==='ALL'||k===active?'':'none';
    });
  }
  function styleStatus(){
    if($('adminFinalStyle'))return;
    const s=document.createElement('style');
    s.id='adminFinalStyle';
    s.textContent='.order-status-tabs{display:flex!important;gap:7px!important;overflow-x:auto!important;white-space:nowrap!important;padding:3px 1px 8px!important;margin:0 0 10px!important}.order-status-tab{flex:0 0 auto;border:1px solid #dfe5ec!important;background:#fff!important;color:#344054!important;border-radius:10px!important;padding:8px 11px!important;font-weight:800!important}.order-status-tab.active{background:#1769e0!important;color:#fff!important;border-color:#1769e0!important}.order-status-tab b{margin-left:5px;border-radius:10px;padding:2px 6px;background:#eef1f5;color:#344054}.order-status-tab.active b{background:#fff;color:#1769e0}';
    document.head.appendChild(s);
  }
  function run(){styleStatus();mountOrderTabs();}
  function boot(){run();setTimeout(run,500);setTimeout(run,1200);setTimeout(run,2500);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
