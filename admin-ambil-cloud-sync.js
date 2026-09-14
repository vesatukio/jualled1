/* DUTA LED - Ambil Barang tab visibility helper
   Sorting is handled directly by admin-final-fix.js. */
(()=>{
'use strict';
window.dutaAmbilSync=async()=>{};
window.dutaSyncAmbilBarang=async()=>{};
window.refreshAmbilBarangCloud=async()=>{};
function hideAmbilBarang(){const v=document.getElementById('ambilBarangView');if(!v)return;v.classList.add('hidden');v.style.setProperty('display','none','important')}
function isOtherTab(tab){if(!tab||tab.id==='tabAmbilBarang')return false;return tab.classList.contains('tab')||/^tab(Orders|Products|StoreFinance|PersonalFinance)$/i.test(tab.id||'')}
function init(){document.addEventListener('click',e=>{const tab=e.target.closest?.('.tabs button,.tabs a,.tab');if(!isOtherTab(tab))return;hideAmbilBarang();setTimeout(hideAmbilBarang,0)},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();