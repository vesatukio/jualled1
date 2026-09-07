/* DUTA LED - Ambil Barang sync lintas PC/HP */
(function(){
'use strict';
const KEY='DUTA_ADMIN_AMBIL_BARANG_V1';
const TABLE='ambil_barang';
const db=window.dutaSupabase;
if(!db)return;
let syncing=false;
function readLocal(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch(e){return[]}}
function writeLocal(rows){try{localStorage.setItem(KEY,JSON.stringify(rows));return true}catch(e){return false}}
function toDb(x){return{id:Number(x.id),supplier:String(x.supplier||''),taken_at:x.takenAt||null,due:x.due||null,items:Array.isArray(x.items)?x.items:[],total:Number(x.total)||0,paid:Number(x.paid)||0,note:x.note||null,updated_at:new Date().toISOString()}}
function fromDb(x){return{id:Number(x.id),supplier:x.supplier||'',takenAt:x.taken_at||'',due:x.due||'',items:Array.isArray(x.items)?x.items:[],total:Number(x.total)||0,paid:Number(x.paid)||0,note:x.note||''}}
async function syncNow(){
 if(syncing)return;
 syncing=true;
 try{
  const local=readLocal();
  const {data:remote,error}=await db.from(TABLE).select('id,supplier,taken_at,due,items,total,paid,note,updated_at').order('id',{ascending:false});
  if(error)throw error;
  const r=Array.isArray(remote)?remote:[];
  const map=new Map();
  r.forEach(x=>map.set(String(x.id),fromDb(x)));
  local.forEach(x=>{if(!map.has(String(x.id)))map.set(String(x.id),x)});
  const merged=[...map.values()].sort((a,b)=>Number(b.id)-Number(a.id));
  if(merged.length){
   const {error:e}=await db.from(TABLE).upsert(merged.map(toDb),{onConflict:'id'});
   if(e)throw e;
  }
  const {data:latest,error:e2}=await db.from(TABLE).select('id,supplier,taken_at,due,items,total,paid,note,updated_at').order('id',{ascending:false});
  if(e2)throw e2;
  writeLocal((latest||[]).map(fromDb));
  window.dispatchEvent(new CustomEvent('dutaAmbilCloudReady'));
 }catch(e){console.warn('[Ambil Barang sync]',e.message||e)}finally{syncing=false}
}
const originalSet=Storage.prototype.setItem;
Storage.prototype.setItem=function(k,v){
 const result=originalSet.call(this,k,v);
 if(this===localStorage && k===KEY){
  try{
   const rows=JSON.parse(v||'[]');
   if(Array.isArray(rows) && !syncing){
    Promise.resolve().then(async()=>{
     const {error}=await db.from(TABLE).upsert(rows.map(toDb),{onConflict:'id'});
     if(error)console.warn('[Ambil Barang save]',error.message||error);
    });
   }
  }catch(e){}
 }
 return result;
};
window.dutaSyncAmbilBarang=syncNow;
if(db.auth?.onAuthStateChange){db.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED')setTimeout(syncNow,250)});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(syncNow,300));else setTimeout(syncNow,300);
})();

/* DUTA LED - Dashboard Pengunjung */
(function(){
'use strict';
const db=window.dutaSupabase;
if(!db)return;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function dayStart(daysAgo=0){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-daysAgo);return d}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function ensureUI(){
 const tabs=document.querySelector('.tabs');
 if(!tabs||$('tabVisitors'))return;
 const b=document.createElement('button');b.id='tabVisitors';b.className='btn tab';b.type='button';b.textContent='👁️ Pengunjung';tabs.appendChild(b);
 const sec=document.createElement('section');sec.id='visitorsView';sec.className='hidden';sec.innerHTML=`<div class="finance-panel visitor-panel"><div class="finance-head"><div><small>ANALITIK WEBSITE</small><h2>👁️ Dashboard Pengunjung</h2><p>Statistik pengunjung toko dari website. Tidak menyimpan alamat IP.</p></div><button id="visitorRefresh" class="btn primary" type="button">↻ Refresh</button></div><div class="finance-cards visitor-cards"><div><span>Hari ini</span><strong id="vToday">0</strong></div><div><span>7 hari</span><strong id="v7">0</strong></div><div><span>30 hari</span><strong id="v30">0</strong></div><div><span>Pengunjung unik 30 hari</span><strong id="vUnique">0</strong></div><div><span>Online ±5 menit</span><strong id="vOnline">0</strong></div><div><span>Halaman dilihat 30 hari</span><strong id="vPages">0</strong></div></div><div class="visitor-grid"><div class="visitor-box"><h3>📄 Halaman terpopuler</h3><div id="vTopPages"></div></div><div class="visitor-box"><h3>📱 Perangkat</h3><div id="vDevices"></div></div><div class="visitor-box"><h3>🔗 Sumber pengunjung</h3><div id="vSources"></div></div><div class="visitor-box"><h3>🕘 Kunjungan terbaru</h3><div id="vRecent"></div></div></div><div id="vMsg" class="visitor-msg"></div></div>`;
 document.querySelector('main.wrap')?.appendChild(sec);
 const st=document.createElement('style');st.textContent=`.visitor-panel{padding:16px}.visitor-cards{min-width:0;grid-template-columns:repeat(6,1fr);margin-bottom:16px}.visitor-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.visitor-box{background:#fff;border:1px solid #e1e6ed;border-radius:14px;padding:14px;min-width:0}.visitor-box h3{font-size:14px;margin:0 0 12px}.visitor-row{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid #edf0f4;font-size:13px}.visitor-row:last-child{border-bottom:0}.visitor-row small{color:#778294}.visitor-bar{height:6px;background:#e8edf3;border-radius:99px;overflow:hidden;margin-top:5px}.visitor-bar i{display:block;height:100%;background:#1769e0;border-radius:99px}@media(max-width:760px){.visitor-cards{grid-template-columns:repeat(2,1fr)}.visitor-grid{grid-template-columns:1fr}}`;document.head.appendChild(st);
 b.onclick=()=>showVisitors();
 ['tabOrders','tabProducts','tabStoreFinance','tabPersonalFinance','tabAmbilBarang'].forEach(id=>$(id)?.addEventListener('click',hideVisitors));
}
function hideVisitors(){ $('visitorsView')?.classList.add('hidden'); $('tabVisitors')?.classList.remove('active') }
function showVisitors(){
 document.querySelectorAll('main.wrap > section').forEach(s=>s.classList.add('hidden'));
 document.querySelectorAll('.tabs .tab').forEach(x=>x.classList.remove('active'));
 $('visitorsView')?.classList.remove('hidden');$('tabVisitors')?.classList.add('active');loadVisitorStats();
}
function groupCount(rows,key){const m=new Map();rows.forEach(r=>{const k=String(r[key]||'Direct');m.set(k,(m.get(k)||0)+1)});return [...m.entries()].sort((a,b)=>b[1]-a[1])}
function listHTML(items,labelFn,max=6){const top=items.slice(0,max),maxN=top[0]?.[1]||1;return top.length?top.map(([k,n])=>`<div class="visitor-row"><div>${esc(labelFn(k))}<div class="visitor-bar"><i style="width:${Math.max(4,Math.round(n/maxN*100))}%"></i></div></div><b>${n}</b></div>`).join(''):'<div class="visitor-row"><small>Belum ada data</small></div>'}
async function loadVisitorStats(){
 const msg=$('vMsg');if(msg)msg.textContent='Memuat statistik…';
 try{
  const now=new Date(),d0=dayStart(0),d7=dayStart(6),d30=dayStart(29),future=addDays(dayStart(0),1);
  const {data,error}=await db.from('visitor_logs').select('visitor_id,session_id,path,title,referrer,device_type,created_at').gte('created_at',d30.toISOString()).lt('created_at',future.toISOString()).order('created_at',{ascending:false}).limit(10000);
  if(error)throw error;
  const rows=data||[], today=rows.filter(r=>new Date(r.created_at)>=d0), week=rows.filter(r=>new Date(r.created_at)>=d7);
  const unique=new Set(rows.map(r=>r.visitor_id)).size,online=new Set(rows.filter(r=>now-new Date(r.created_at)<=5*60*1000).map(r=>r.session_id)).size;
  $('vToday').textContent=today.length;$('v7').textContent=week.length;$('v30').textContent=rows.length;$('vUnique').textContent=unique;$('vOnline').textContent=online;$('vPages').textContent=rows.length;
  $('vTopPages').innerHTML=listHTML(groupCount(rows,'path'),k=>k==='/'?'Beranda':k);
  $('vDevices').innerHTML=listHTML(groupCount(rows,'device_type'),k=>k==='mobile'?'HP':k==='tablet'?'Tablet':'Desktop');
  const sources=rows.map(r=>{try{return r.referrer?new URL(r.referrer).hostname:'Direct'}catch{return 'Direct'}});const sm=new Map();sources.forEach(k=>sm.set(k,(sm.get(k)||0)+1));$('vSources').innerHTML=listHTML([...sm.entries()].sort((a,b)=>b[1]-a[1]),k=>k);
  $('vRecent').innerHTML=rows.slice(0,10).map(r=>`<div class="visitor-row"><div>${esc(r.title||r.path)}<br><small>${new Date(r.created_at).toLocaleString('id-ID')} · ${esc(r.device_type)}</small></div></div>`).join('')||'<div class="visitor-row"><small>Belum ada kunjungan.</small></div>';
  if(msg)msg.textContent=`Diperbarui ${now.toLocaleTimeString('id-ID')}. Data maksimal 30 hari terakhir ditampilkan.`;
 }catch(e){if(msg){msg.className='visitor-msg visitor-error';msg.textContent='Gagal memuat pengunjung: '+(e.message||e)}}
}
function bootVisitors(){ensureUI();$('visitorRefresh')?.addEventListener('click',loadVisitorStats)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(bootVisitors,700));else setTimeout(bootVisitors,700);
})();
