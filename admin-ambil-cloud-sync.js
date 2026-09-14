/* DUTA LED - Ambil Barang Cloud Sync compatibility + autocomplete loader */
(()=>{'use strict';
window.dutaAmbilSync=async()=>{};
window.dutaSyncAmbilBarang=async()=>{};
window.refreshAmbilBarangCloud=async()=>{};
function loadAutocomplete(){if(window.__dutaAmbilAutocompleteLoaded)return;window.__dutaAmbilAutocompleteLoaded=true;const s=document.createElement('script');s.src='admin-ambil-autocomplete.js?v=20260913-1';s.async=false;s.onload=()=>console.log('[Ambil Barang] autocomplete aktif');s.onerror=()=>{window.__dutaAmbilAutocompleteLoaded=false;console.warn('[Ambil Barang] autocomplete gagal dimuat')};document.head.appendChild(s)}
function fixAmbilTabPersistence(){
  document.addEventListener('click',e=>{
    const tab=e.target.closest?.('.tabs .tab');
    if(!tab || tab.id==='tabAmbilBarang') return;
    const v=document.getElementById('ambilBarangView');
    if(v){v.classList.add('hidden');v.style.display='none';}
  },true);
}
function init(){loadAutocomplete();fixAmbilTabPersistence()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();