/* DUTA LED - Ambil Barang Cloud Sync - mobile/PC */
(()=>{
'use strict';
const KEY='DUTA_ADMIN_AMBIL_BARANG_V1';
const TABLE='ambil_barang';
let db=null,authBound=false,syncing=false;
function getDb(){return window.dutaSupabase||window.supabaseClient||window.supabase||null}
function readLocal(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch(e){return[]}}
function writeLocal(x){try{localStorage.setItem(KEY,JSON.stringify(Array.isArray(x)?x:[]))}catch(e){console.warn('[Ambil Cloud] local write',e)}}
function toDb(x){return {id:Number(x.id),supplier:x.supplier||'',taken_at:x.takenAt||null,due:x.due||null,items:Array.isArray(x.items)?x.items:[],total:Number(x.total||0),paid:Number(x.paid||0),note:x.note||'',updated_at:new Date().toISOString()}}
function fromDb(x){return {id:Number(x.id),supplier:x.supplier||'',takenAt:x.taken_at||'',due:x.due||'',items:Array.isArray(x.items)?x.items:[],total:Number(x.total||0),paid:Number(x.paid||0),note:x.note||''}}
function refreshHistory(){
  try{
    const tab=document.getElementById('tabAmbilBarang');
    const view=document.getElementById('ambilBarangView');
    if(tab&&view&&!view.classList.contains('hidden')) tab.click();
  }catch(e){console.warn('[Ambil Cloud] refresh UI',e)}
  try{window.dispatchEvent(new CustomEvent('dutaAmbilCloudReady'))}catch(e){}
}
async function syncNow(){
 if(syncing)return;
 db=getDb(); if(!db||!db.from)return;
 syncing=true;
 try{
   const remoteRes=await db.from(TABLE).select('id,supplier,taken_at,due,items,total,paid,note,updated_at').order('id',{ascending:false});
   if(remoteRes.error)throw remoteRes.error;
   const remote=remoteRes.data||[], local=readLocal(), map=new Map();
   local.forEach(x=>map.set(String(x.id),x));
   remote.forEach(x=>{const r=fromDb(x);map.set(String(r.id),r)});
   const merged=[...map.values()].sort((a,b)=>Number(b.id)-Number(a.id));
   if(merged.length){const up=await db.from(TABLE).upsert(merged.map(toDb),{onConflict:'id'});if(up.error)throw up.error}
   const latestRes=await db.from(TABLE).select('id,supplier,taken_at,due,items,total,paid,note,updated_at').order('id',{ascending:false});
   if(latestRes.error)throw latestRes.error;
   writeLocal((latestRes.data||[]).map(fromDb));
   refreshHistory();
 }catch(e){console.warn('[Ambil Cloud] sync gagal:',e)}finally{syncing=false}
}
function bindAuth(){
 if(authBound)return;
 db=getDb();
 if(!db||!db.auth||!db.auth.onAuthStateChange)return;
 authBound=true;
 try{db.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED'||event==='INITIAL_SESSION')setTimeout(syncNow,100)})}catch(e){console.warn('[Ambil Cloud] auth listener',e)}
}
function patchStorage(){
 if(Storage.prototype.__dutaAmbilCloudPatched)return;
 const original=Storage.prototype.setItem;
 Storage.prototype.setItem=function(k,v){const result=original.apply(this,arguments);if(this===localStorage&&k===KEY)setTimeout(syncNow,50);return result};
 Storage.prototype.__dutaAmbilCloudPatched=true;
}
window.dutaAmbilSync=syncNow;
window.addEventListener('dutaAmbilCloudRefresh',syncNow);
patchStorage();
function start(){bindAuth();setTimeout(()=>{bindAuth();syncNow()},500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
