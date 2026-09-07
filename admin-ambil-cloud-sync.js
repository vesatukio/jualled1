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
