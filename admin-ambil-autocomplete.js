(function(){
  'use strict';
  const KEY='DUTA_ADMIN_AMBIL_BARANG_V1';
  let box=null, activeInput=null;

  function norm(v){return String(v||'').trim().toLowerCase();}
  function loadHistory(){
    const out=new Map();
    try{
      const raw=localStorage.getItem(KEY);
      const data=raw?JSON.parse(raw):[];
      const list=Array.isArray(data)?data:(Array.isArray(data.items)?data.items:[]);
      list.forEach(tr=>{
        (tr.items||[]).forEach(it=>{
          const name=String(it.name||it.nama||'').trim();
          if(!name)return;
          const k=norm(name);
          if(!out.has(k)) out.set(k,{name,price:it.price??it.harga??'',discount:it.discount??it.diskon??0,unit:it.unit||it.satuan||'pcs'});
        });
      });
    }catch(e){}
    return [...out.values()];
  }
  function ensureBox(){
    if(box)return box;
    box=document.createElement('div');
    box.id='ab-history-suggestions';
    box.style.cssText='position:fixed;display:none;background:#fff;border:1px solid #ccc;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.18);z-index:2147483647;max-height:280px;overflow:auto;min-width:260px;font:14px Arial,sans-serif;';
    document.body.appendChild(box);
    return box;
  }
  function position(){
    if(!activeInput||!box)return;
    const r=activeInput.getBoundingClientRect();
    box.style.left=r.left+'px'; box.style.top=(r.bottom+3)+'px'; box.style.width=Math.max(r.width,300)+'px';
  }
  function hide(){if(box)box.style.display='none';activeInput=null;}
  function show(input){
    activeInput=input; const q=norm(input.value); const all=loadHistory();
    const hits=all.filter(x=>!q||norm(x.name).includes(q)).slice(0,30);
    const b=ensureBox(); b.innerHTML='';
    if(!hits.length){
      if(q){
        const empty=document.createElement('div'); empty.textContent='Barang baru: '+input.value; empty.style.cssText='padding:10px;color:#777;'; b.appendChild(empty);
      } else {hide();return;}
    } else hits.forEach(item=>{
      const row=document.createElement('div'); row.style.cssText='padding:9px 10px;cursor:pointer;border-bottom:1px solid #eee;';
      row.innerHTML='<b>'+escapeHtml(item.name)+'</b><br><small>Harga terakhir: '+format(item.price)+' · Diskon: '+(item.discount||0)+'% · '+escapeHtml(item.unit||'pcs')+'</small>';
      row.addEventListener('mousedown',function(e){e.preventDefault();select(item,input);});
      b.appendChild(row);
    });
    position(); b.style.display='block';
  }
  function select(item,input){
    input.value=item.name;
    const row=input.closest('[data-i]')||input.parentElement;
    if(row){
      const p=row.querySelector('input[data-k="price"]'); const d=row.querySelector('input[data-k="discount"]'); const u=row.querySelector('select[data-k="unit"],input[data-k="unit"]');
      if(p)p.value=item.price==null?'':item.price;
      if(d)d.value=item.discount==null?0:item.discount;
      if(u)u.value=item.unit||'pcs';
      [p,d,u,input].forEach(el=>{if(el)el.dispatchEvent(new Event('change',{bubbles:true}));});
    }
    hide(); input.focus();
  }
  function format(v){
    const n=Number(v); return Number.isFinite(n)&&n?new Intl.NumberFormat('id-ID').format(n):String(v||'');
  }
  function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));}
  function init(){
    document.addEventListener('focusin',e=>{
      if(e.target.matches('#ab11rows input[data-k="name"]')) show(e.target);
    });
    document.addEventListener('input',e=>{
      if(e.target.matches('#ab11rows input[data-k="name"]')) show(e.target);
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});
    document.addEventListener('mousedown',e=>{if(box&&box.style.display!=='none'&&!box.contains(e.target)&&e.target!==activeInput)hide();});
    window.addEventListener('resize',position); window.addEventListener('scroll',position,true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
