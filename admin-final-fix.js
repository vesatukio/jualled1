/* DUTA LED - Admin Ambil Barang loader + mobile interaction fix
   Server/Supabase only. Tidak memakai localStorage. */
(()=>{
  'use strict';
  const load=()=>{
    if(!document.getElementById('dutaAmbilRealtimeScript')){
      const s=document.createElement('script');
      s.id='dutaAmbilRealtimeScript';
      s.src='admin-ambil-barang.js?v='+Date.now();
      s.async=false;
      s.onerror=()=>console.error('[Ambil Barang] modul realtime gagal dimuat');
      document.head.appendChild(s);
    }
    const st=document.createElement('style');
    st.id='dutaAmbilMobileFix';
    st.textContent=`
      #tabAmbilBarang{position:relative;z-index:10001;pointer-events:auto;touch-action:manipulation}
      #ambilBarangView{position:relative;z-index:1}
      #ambilBarangView .ab-list{max-height:calc(100vh - 300px);overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding-right:3px}
      #ambilBarangView .ab-card{position:relative}
      #ambilBarangView .ab-pay,#ambilBarangView .ab-edit,#ambilBarangView #abNew,#ambilBarangView #abSave,#ambilBarangView #abCancel,#ambilBarangView #abAddItem{position:relative;z-index:2;pointer-events:auto;touch-action:manipulation}
      @media(max-width:650px){#ambilBarangView .ab-list{max-height:calc(100vh - 270px)}#ambilBarangView{padding:12px}}
    `;
    document.head.appendChild(st);
    setTimeout(()=>{
      const tab=document.getElementById('tabAmbilBarang');
      if(tab){
        tab.onclick=()=>{
          ['ordersView','productsView','storeFinanceView','personalFinanceView'].forEach(id=>document.getElementById(id)?.classList.add('hidden'));
          document.getElementById('ambilBarangView')?.classList.remove('hidden');
          document.querySelectorAll('.tabs .tab').forEach(x=>x.classList.remove('active'));
          tab.classList.add('active');
          window.dispatchEvent(new Event('duta-ambil-open'));
        };
      }
    },300);
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',load,{once:true}); else load();
})();
