/* DUTA LED - Ambil Barang Cloud Sync v20260910-3 */
(()=>{
'use strict';
const KEY='DUTA_ADMIN_AMBIL_BARANG_V1';
const TABLE='ambil_barang';
let db=null,authBound=false,syncing=false,timer=null;
function getDb(){return window.dutaSupabase||window.supabaseClient||window.supabase||null}
function readLocal(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch(e){return[]}}
function writeLocal(x){try{localStorage.setItem(KEY,JSON.stringify(Array.isArray(x)?x:[]))}catch(e){console.warn('[Ambil Cloud] local write',e)}}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function cleanItems(items){
 if(!Array.isArray(items))return[];
 return items.filter(x=>x&&typeof x==='object').map(x=>{
   const r=Object.assign({},x);
   if('qty' in r)r.qty=num(r.qty);
   if('harga' in r)r.harga=num(r.harga);
   if('price' in r)r.price=num(r.price);
   if('modal' in r)r.modal=num(r.modal);
   return r;
 });
}
function toDb(x){
 const id=Number(x&&x.id);
 if(!Number.isSafeInteger(id)||id<=0)return null;
 return {
   id,
   supplier:String(x.supplier||''),
   taken_at:x.takenAt||x.taken_at||null,
   due:x.due||null,
   items:cleanItems(x.items),
   total:num(x.total),
   paid:num(x.paid),
   note:String(x.note||''),
   updated_at:new Date().toISOString()
 };
}
function fromDb(x){return {id:Number(x.id),supplier:x.supplier||'',takenAt:x.taken_at||'',due:x.due||'',items:Array.isArray(x.items)?x.items:[],total:num(x.total),paid:num(x.paid),note:x.note||''}}
function refreshHistory(){
 try{
  const tab=document.getElementById('tabAmbilBarang'),view=document.getElementById('ambilBarangView');
  if(tab&&view&&!view.classList.contains('hidden'))tab.click();
 }catch(e){console.warn('[Ambil Cloud] refresh UI',e)}
 try{window.dispatchEvent(new CustomEvent('dutaAmbilCloudReady'))}catch(e){}
}
async function syncNow(){
 if(syncing)return;
 db=getDb();if(!db||!db.from)return;
 syncing=true;
 try{
  const remoteRes=await db.from(TABLE).select('id,supplier,taken_at,due,items,total,paid,note,updated_at').order('id',{ascending:false});
  if(remoteRes.error)throw remoteRes.error;
  const remote=remoteRes.data||[],local=readLocal(),map=new Map();
  local.forEach(x=>{const r=toDb(x);if(r)map.set(String(r.id),r)});
  remote.forEach(x=>{const r=fromDb(x);if(Number.isSafeInteger(r.id)&&r.id>0)map.set(String(r.id),r)});
  const merged=[...map.values()].sort((a,b)=>Number(b.id)-Number(a.id));
  // Upload satu per satu agar satu record lama yang tidak valid tidak
  // menggagalkan seluruh histori PC.
  for(const row of merged){
   const up=await db.from(TABLE).upsert(row,{onConflict:'id'});
   if(up.error)console.warn('[Ambil Cloud] gagal upload ID '+row.id+':',up.error);
  }
  const latestRes=await db.from(TABLE).select('id,supplier,taken_at,due,items,total,paid,note,updated_at').order('id',{ascending:false});
  if(latestRes.error)throw latestRes.error;
  writeLocal((latestRes.data||[]).map(fromDb));
  refreshHistory();
  console.log('[Ambil Cloud] sinkron OK:',(latestRes.data||[]).length,'data');
 }catch(e){console.error('[Ambil Cloud] sync gagal:',e&&e.message?e.message:e,e)}finally{syncing=false}
}
function schedule(){clearTimeout(timer);timer=setTimeout(syncNow,250)}
function bindAuth(){
 if(authBound)return;
 db=getDb();if(!db||!db.auth||!db.auth.onAuthStateChange)return;
 authBound=true;
 try{db.auth.onAuthStateChange(event=>{if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED'||event==='INITIAL_SESSION')schedule()})}catch(e){console.warn('[Ambil Cloud] auth listener',e)}
}
function patchStorage(){
 if(Storage.prototype.__dutaAmbilCloudPatched)return;
 const original=Storage.prototype.setItem;
 Storage.prototype.setItem=function(k,v){const result=original.apply(this,arguments);if(this===localStorage&&k===KEY)schedule();return result};
 Storage.prototype.__dutaAmbilCloudPatched=true;
}
window.dutaAmbilSync=syncNow;
// Kompatibilitas dengan admin-final-fix.js
window.dutaSyncAmbilBarang=syncNow;
window.refreshAmbilBarangCloud=syncNow;
window.addEventListener('dutaAmbilCloudRefresh',schedule);
window.addEventListener('dutaAmbilRefreshCloud',schedule);
patchStorage();
function start(){bindAuth();setTimeout(()=>{bindAuth();syncNow()},500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
