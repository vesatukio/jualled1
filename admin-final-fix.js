/* DUTA LED - Ambil Barang loader + mobile interaction fix
   SUMBER DATA Ambil Barang: SUPABASE ONLY. */
(()=>{
'use strict';
function addScript(id,src){return new Promise(resolve=>{if(document.getElementById(id))return resolve();const s=document.createElement('script');s.id=id;s.src=src;s.async=false;s.onload=resolve;s.onerror=()=>{console.error('[Ambil Barang] gagal:',src);resolve()};document.head.appendChild(s)})}
async function load(){
 await addScript('dutaAmbilRealtimeScript','admin-ambil-barang.js?v=20260912-2');
 await addScript('dutaAmbilAutocompleteScript','admin-ambil-autocomplete.js?v=20260912-2');
 let st=document.getElementById('dutaAmbilMobileFix');
 if(!st){st=document.createElement('style');st.id='dutaAmbilMobileFix';st.textContent=`
 #tabAmbilBarang{position:relative;z-index:10001;pointer-events:auto;touch-action:manipulation;cursor:pointer}
 #ambilBarangView{position:relative;z-index:1}
 #ambilBarangView .ab-list{max-height:calc(100vh - 300px);overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding-right:3px}
 #ambilBarangView .ab-card{position:relative}
 #ambilBarangView .ab-pay,#ambilBarangView .ab-edit,#ambilBarangView #abNew,#ambilBarangView #abSave,#ambilBarangView #abCancel,#ambilBarangView #abAdd{position:relative;z-index:2;pointer-events:auto;touch-action:manipulation;cursor:pointer}
 @media(max-width:650px){#ambilBarangView .ab-list{max-height:calc(100vh - 270px)}#ambilBarangView{padding:12px}}
 `;document.head.appendChild(st)}
 const fix=()=>{const b=document.getElementById('tabAmbilBarang');if(!b)return false;if(!b.dataset.touchFix){b.dataset.touchFix='1';b.addEventListener('touchend',e=>{e.preventDefault();b.click()},{passive:false})}return true};
 fix();let n=0,t=setInterval(()=>{if(fix()||++n>20)clearInterval(t)},250);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
