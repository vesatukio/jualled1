/* DUTA LED - Ambil Barang Cloud Sync
   Sync local Ambil Barang data with Supabase so PC/HP show the same history. */
(()=>{
'use strict';
const KEY='DUTA_ADMIN_AMBIL_BARANG_V1';
const TABLE='ambil_barang';
let db=null;
function getDb(){return window.dutaSupabase||window.supabaseClient||window.supabase||null}
function readLocal(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch(e){return[]}}
function writeLocal(x){try{localStorage.setItem(KEY,JSON.stringify(Array.isArray(x)?x:[]))}catch(e){console.warn('[Ambil Cloud] local write',e)}}
function toDb(x){return {id:Number(x.id),supplier:x.supplier||'',taken_at:x.takenAt||null,due:x.due||null,items:Array.isArray(x.items)?x.items:[],total:Number(x.total||0),paid:Number(x.paid||0),note:x.note||'',updated_at:new Date().toISOString()}}
function fromDb(x){return {id:Number(x.id),supplier:x.supplier||'',takenAt:x.taken_at||'',due:x.due||'',items:Array.isArray(x.items)?x.items:[],total:Number(x.total||0),paid:Number(x.paid||0),note:x.note||''}}
function redraw(){
  try{if(typeof window.drawAmbilBarang==='function')window.drawAmbilBarang();}catch(e){}
  try{window.dispatchEvent(new CustomEvent('dutaAmbilCloudReady'));}catch(e){}
}
async function syncNow(){
 db=getDb();
 if(!db||!db.from)return;
 try{
   const remoteRes=await db.from(TABLE).select('id,supplier,taken_at,due,items,total,paid,note,updated_at').order('id',{ascending:false});
   if(remoteRes.error)throw remoteRes.error;
   const remote=remoteRes.data||[];
   const local=readLocal();
   const map=new Map();
   local.forEach(x=>map.set(String(x.id),x));
   remote.forEach(x=>{const r=fromDb(x), l=map.get(String(r.id)); if(!l||Number(r.id)>=Number(l.id))map.set(String(r.id),r)});
   const merged=[...map.values()].sort((a,b)=>Number(b.id)-Number(a.id));
   if(merged.length){
     const up=await db.from(TABLE).upsert(merged.map(toDb),{onConflict:'id'});
     if(up.error)throw up.error;
   }
   const latestRes=await db.from(TABLE).select('id,supplier,taken_at,due,items,total,paid,note,updated_at').order('id',{ascending:false});
   if(latestRes.error)throw latestRes.error;
   writeLocal((latestRes.data||[]).map(fromDb));
   redraw();
 }catch(e){console.warn('[Ambil Cloud] sync gagal:',e)}
}
function patchStorage(){
 if(Storage.prototype.__dutaAmbilCloudPatched)return;
 const original=Storage.prototype.setItem;
 Storage.prototype.setItem=function(k,v){
   const result=original.apply(this,arguments);
   if(this===localStorage&&k===KEY){setTimeout(syncNow,50)}
   return result;
 };
 Storage.prototype.__dutaAmbilCloudPatched=true;
}
window.dutaAmbilSync=syncNow;
window.addEventListener('dutaAmbilCloudRefresh',syncNow);
window.addEventListener('dutaAmbilCloudReady',()=>{
 try{if(document.getElementById('ambilBarangView')&&!document.getElementById('ambilBarangView').classList.contains('hidden'))redraw()}catch(e){}
});
patchStorage();
document.addEventListener('DOMContentLoaded',()=>setTimeout(syncNow,300));
})();
