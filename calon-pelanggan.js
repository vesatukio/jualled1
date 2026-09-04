/* DUTA LED - Pencarian Calon Pelanggan dari Google Maps */
(function(){
'use strict';
const SUPA='https://opgeeqnucxrdqcgwcuge.supabase.co';
const KEY='sb_publishable_uqah55SK8ZjyugWprFnFMA_QnyVdCLA';
let dbClient=null, mapsReady=null, lastResults=[];
function db(){if(dbClient)return dbClient;if(!window.supabase?.createClient)return null;return dbClient=window.supabase.createClient(SUPA,KEY)}
function esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
function rupJarak(m){if(m==null)return '';return m<1000?Math.round(m)+' m':(m/1000).toFixed(1).replace('.',',')+' km'}
const TYPES={
  toko_listrik:'electrician',
  elektronik:'electronics_store',
  bengkel_motor:'motorcycle_repair',
  bengkel_mobil:'car_repair',
  toko_bangunan:'hardware_store',
  toko_lampu:'home_goods_store',
  sparepart:'auto_parts_store',
  toko_umum:'store'
};
function loadMaps(){
  if(window.google?.maps?.importLibrary)return Promise.resolve();
  if(mapsReady)return mapsReady;
  const el=document.getElementById('calonPelangganApp');
  const key=el?.dataset.googleMapsKey||'';
  if(!key||key==='GANTI_DENGAN_GOOGLE_MAPS_API_KEY')return Promise.reject(new Error('Google Maps API Key belum dipasang.'));
  mapsReady=new Promise((resolve,reject)=>{
    window.__dutaMapsReady=()=>resolve();
    const s=document.createElement('script');s.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(key)+'&v=weekly&loading=async&callback=__dutaMapsReady';s.async=true;s.defer=true;s.onerror=()=>reject(new Error('Google Maps gagal dimuat.'));
    document.head.appendChild(s);
  });
  return mapsReady;
}
async function getCenter(){
  const input=document.getElementById('calonLokasi');
  if(input?.value.trim()){
    const {Geocoder}=await google.maps.importLibrary('geocoding');
    const g=new Geocoder();
    const r=await g.geocode({address:input.value.trim()+', Indonesia'});
    if(!r.results?.length)throw new Error('Lokasi tidak ditemukan.');
    const p=r.results[0].geometry.location;
    return {lat:p.lat(),lng:p.lng(),label:r.results[0].formatted_address};
  }
  if(!navigator.geolocation)throw new Error('Browser tidak mendukung lokasi. Ketik nama kota/daerah pada Lokasi.');
  return new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(p=>resolve({lat:p.coords.latitude,lng:p.coords.longitude,label:'Lokasi saya'}),()=>reject(new Error('Lokasi tidak diizinkan. Ketik nama kota/daerah pada Lokasi.')), {enableHighAccuracy:true,timeout:10000,maximumAge:300000}));
}
function renderResults(){
 const box=document.getElementById('calonHasil'),status=document.getElementById('calonStatus');if(!box)return;
 if(!lastResults.length){box.innerHTML='<div class="calon-empty">Tidak ada usaha ditemukan pada radius tersebut.</div>';return}
 box.innerHTML=lastResults.map((p,i)=>`<article class="calon-card"><div class="calon-card-top"><div><span class="calon-cat">${esc(p.kategoriLabel)}</span><h3>${esc(p.nama)}</h3></div><strong>${rupJarak(p.jarak)}</strong></div><p>📍 ${esc(p.alamat||'-')}</p>${p.telepon?`<p>📞 ${esc(p.telepon)}</p>`:''}${p.website?`<p>🌐 ${esc(p.website)}</p>`:''}<div class="calon-actions"><a href="${esc(p.maps_url)}" target="_blank" rel="noopener">📍 Buka Maps</a><button type="button" data-save="${i}" ${p.saved?'disabled':''}>${p.saved?'✅ Tersimpan':'💾 Simpan Calon Pelanggan'}</button></div></article>`).join('');
 box.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>saveOne(Number(b.dataset.save),b));
 if(status)status.textContent=lastResults.length+' usaha ditemukan';
}
async function search(){
 const status=document.getElementById('calonStatus'),btn=document.getElementById('calonCari'),box=document.getElementById('calonHasil');
 btn.disabled=true;if(status)status.textContent='Memuat Google Maps...';box.innerHTML='';
 try{
   await loadMaps();
   const center=await getCenter();
   const radius=Math.min(Math.max(Number(document.getElementById('calonRadius').value||5000),100),50000);
   const type=document.getElementById('calonKategori').value;
   const label=document.getElementById('calonKategori').selectedOptions[0].textContent;
   const {Place,SearchNearbyRankPreference}=await google.maps.importLibrary('places');
   if(status)status.textContent='Mencari usaha di sekitar '+center.label+'...';
   const request={fields:['displayName','location','formattedAddress','googleMapsURI','nationalPhoneNumber','websiteURI','id'],locationRestriction:{center:{lat:center.lat,lng:center.lng},radius},includedPrimaryTypes:[type],maxResultCount:20,rankPreference:SearchNearbyRankPreference.DISTANCE};
   const r=await Place.searchNearby(request);
   lastResults=(r.places||[]).map(p=>({google_place_id:p.id||null,nama:p.displayName||'Tanpa nama',kategori:type,kategoriLabel:label,alamat:p.formattedAddress||'',telepon:p.nationalPhoneNumber||'',website:p.websiteURI||'',maps_url:p.googleMapsURI||'',latitude:p.location?.lat?.()??p.location?.lat??null,longitude:p.location?.lng?.()??p.location?.lng??null,jarak:null,saved:false}));
   // Haversine distance from search center.
   lastResults.forEach(p=>{if(p.latitude!=null&&p.longitude!=null){const R=6371000,a=(p.latitude-center.lat)*Math.PI/180,b=(p.longitude-center.lng)*Math.PI/180;const x=Math.sin(a/2)**2+Math.cos(center.lat*Math.PI/180)*Math.cos(p.latitude*Math.PI/180)*Math.sin(b/2)**2;p.jarak=2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}});
   renderResults();
 }catch(e){if(status)status.textContent='';box.innerHTML='<div class="calon-error">❌ '+esc(e.message||e)+'</div>';}finally{btn.disabled=false}
}
async function saveOne(i,button){
 const p=lastResults[i],d=db();if(!p||!d)return;button.disabled=true;button.textContent='Menyimpan...';
 try{
   if(p.google_place_id){const q=await d.from('calon_pelanggan_google').select('id').eq('google_place_id',p.google_place_id).maybeSingle();if(q.data){p.saved=true;button.textContent='✅ Sudah tersimpan';return}if(q.error)throw q.error;}
   const {error}=await d.from('calon_pelanggan_google').insert({google_place_id:p.google_place_id,nama_usaha:p.nama,kategori:p.kategoriLabel,alamat:p.alamat,telepon:p.telepon,website:p.website,maps_url:p.maps_url,latitude:p.latitude,longitude:p.longitude,jarak_meter:p.jarak,status:'belum_dihubungi'});
   if(error)throw error;p.saved=true;button.textContent='✅ Tersimpan';
 }catch(e){button.disabled=false;button.textContent='💾 Simpan Calon Pelanggan';alert('Gagal menyimpan: '+(e.message||e));}
}
async function saveAll(){const unsaved=lastResults.map((p,i)=>({p,i})).filter(x=>!x.p.saved);if(!unsaved.length)return alert('Semua hasil sudah tersimpan.');for(const x of unsaved){const b=document.querySelector(`[data-save="${x.i}"]`);await saveOne(x.i,b)}alert('Selesai menyimpan calon pelanggan.');}
function init(){const app=document.getElementById('calonPelangganApp');if(!app)return;document.getElementById('calonCari')?.addEventListener('click',search);document.getElementById('calonSimpanSemua')?.addEventListener('click',saveAll);document.getElementById('calonLokasiSaya')?.addEventListener('click',()=>{document.getElementById('calonLokasi').value='';search()});}
window.cariCalonPelanggan=search;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
