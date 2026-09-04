/* DUTA LED - Admin Ambil Barang loader v20260904-13 */
(function(){
'use strict';
const base='https://raw.githubusercontent.com/vesatukio/jualled1/3be13671a3f5a27f6003af7329ceb0e5c1f2b122/admin-final-fix.js';
const auto='https://raw.githubusercontent.com/vesatukio/jualled1/50ee3d7e1b221aaf9d2d3d783185b08a4075601c/admin-ambil-autocomplete.js';
function removePersonal(){
  ['tabPersonalFinance','personalFinanceView'].forEach(id=>{const el=document.getElementById(id);if(el)el.remove();});
}
function showAmbil(e){
  const tab=document.getElementById('tabAmbilBarang');
  const view=document.getElementById('ambilBarangView');
  if(!tab||!view)return;
  if(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}
  document.querySelectorAll('main .tabs .tab').forEach(x=>x.classList.remove('active'));
  ['ordersView','productsView','storeFinanceView','personalFinanceView'].forEach(id=>{const x=document.getElementById(id);if(x)x.classList.add('hidden');});
  tab.classList.add('active');
  view.classList.remove('hidden');
}
function bind(){
  removePersonal();
  const tab=document.getElementById('tabAmbilBarang');
  if(tab && !tab.dataset.abBound){
    tab.dataset.abBound='1';
    tab.addEventListener('click',showAmbil,true);
  }
  document.addEventListener('click',function(e){
    if(e.target.closest && e.target.closest('#tabAmbilBarang'))showAmbil(e);
  },true);
}
function load(src,done){const s=document.createElement('script');s.src=src;s.onload=done;s.onerror=()=>console.error('Gagal memuat',src);document.head.appendChild(s)}
load(base,()=>{
  bind();
  load(auto,()=>{bind();setTimeout(removePersonal,50);});
  setTimeout(bind,100);
  setTimeout(bind,500);
});
})();
