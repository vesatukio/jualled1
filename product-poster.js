/* Duta LED - Product Social Poster Generator */
(function(){
  const DEFAULT_DESC='Produk LED dan sparepart berkualitas untuk kebutuhan rumah, toko, teknisi, dan usaha.';
  function rupiah(n){return 'Rp'+Number(n||0).toLocaleString('id-ID');}
  function esc(s){return String(s||'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}
  function productUrl(p){const u=new URL(location.href);u.search='';u.hash='';if(p.id)u.searchParams.set('id',p.id);return u.toString();}
  function priceInfo(p){const normal=Number(p.hargaJual||0);const sale=Number(p.hargaDiskon||0);const promo=sale>0&&sale<normal;return {price:promo?sale:normal,normal,promo};}
  function caption(p){const x=priceInfo(p);return `⚡ ${p.nama||'Produk Duta LED'}\n\n${p.deskripsi||DEFAULT_DESC}\n\n💰 ${rupiah(x.price)}${x.promo?`\n💥 Harga normal ${rupiah(x.normal)}`:''}\n📦 Eceran & grosir\n🚚 Siap diproses setelah konfirmasi stok\n\n🛒 Pesan sekarang:\n${productUrl(p)}\n\n#DutaLED #LED #SparepartLED #LampuLED #Elektronik`;}
  function imagesOf(p){return [p.gambar1,p.gambar2,p.gambar3,p.gambar].map(x=>String(x||'').trim()).filter((x,i,a)=>x&&a.indexOf(x)===i);}
  function openPoster(p){
    let modal=document.getElementById('posterModal');
    if(!modal){modal=document.createElement('div');modal.id='posterModal';modal.className='poster-modal';document.body.appendChild(modal);}
    const imgs=imagesOf(p), x=priceInfo(p), img=imgs[0]||'';
    modal.innerHTML=`<div class="poster-dialog"><button class="poster-close" type="button">×</button><div class="poster-preview"><div class="poster-image">${img?`<img src="${esc(img)}" crossorigin="anonymous" alt="${esc(p.nama)}">`:'<div>⚡ DUTA LED</div>'}</div><div class="poster-copy"><span>DUTA LED</span><strong>${esc(p.nama)}</strong><b>${rupiah(x.price)}</b>${x.promo?`<del>${rupiah(x.normal)}</del>`:''}<small>${esc((p.deskripsi||DEFAULT_DESC).slice(0,150))}</small><em>Pesan Sekarang ›</em></div></div><textarea class="poster-caption" readonly>${caption(p)}</textarea><div class="poster-actions"><button data-action="image">🖼️ Buat Gambar</button><button data-action="share">📤 Bagikan Gambar</button><button data-action="copy">📋 Salin Caption</button><button data-action="fb">📘 Facebook</button><button data-action="tt">🎵 TikTok</button><button data-action="link">🔗 Salin Link</button></div><p class="poster-note">Gunakan <b>Bagikan Gambar</b> untuk mengirim poster + caption dari HP yang mendukung berbagi file. Facebook/TikTok tetap dapat memakai gambar poster yang dibuat.</p></div>`;
    modal.classList.add('show');
    modal.querySelector('.poster-close').onclick=()=>modal.classList.remove('show');
    modal.querySelector('[data-action="copy"]').onclick=()=>copy(caption(p),'Caption sudah disalin.');
    modal.querySelector('[data-action="link"]').onclick=()=>copy(productUrl(p),'Link produk sudah disalin.');
    modal.querySelector('[data-action="image"]').onclick=()=>makePoster(p).then(blob=>{if(blob)downloadBlob(blob,slug(p.nama)+'.png');});
    modal.querySelector('[data-action="share"]').onclick=()=>shareImage(p);
    modal.querySelector('[data-action="fb"]').onclick=()=>{copy(caption(p),'Caption sudah disalin.');window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(productUrl(p)),'_blank','noopener');};
    modal.querySelector('[data-action="tt"]').onclick=()=>{copy(caption(p),'Caption sudah disalin.');window.open('https://www.tiktok.com/upload','_blank','noopener');};
  }
  function slug(s){return String(s||'produk').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50)||'produk';}
  async function copy(text,msg){try{await navigator.clipboard.writeText(text);}catch(e){const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();}if(msg)alert(msg);}
  function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});}
  async function makePoster(p){
    const W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');ctx.fillStyle='#fff7ed';ctx.fillRect(0,0,W,H);
    const imgs=imagesOf(p);let im=null;if(imgs[0]){try{im=await loadImage(imgs[0]);}catch(e){}}
    ctx.fillStyle='#ffffff';ctx.fillRect(50,50,980,1250);ctx.fillStyle='#ff7200';ctx.fillRect(50,50,980,90);
    ctx.fillStyle='#ffffff';ctx.font='800 40px Arial';ctx.fillText('DUTA LED',85,110);
    if(im){const box={x:90,y:180,w:900,h:600};const r=Math.min(box.w/im.width,box.h/im.height);const w=im.width*r,h=im.height*r;ctx.drawImage(im,box.x+(box.w-w)/2,box.y+(box.h-h)/2,w,h);}else{ctx.fillStyle='#ff7200';ctx.font='800 55px Arial';ctx.textAlign='center';ctx.fillText('⚡ DUTA LED',540,470);ctx.textAlign='left';}
    const x=priceInfo(p);ctx.fillStyle='#222';ctx.font='800 48px Arial';wrap(ctx,String(p.nama||'Produk'),90,850,900,58,4);ctx.fillStyle='#e65100';ctx.font='900 62px Arial';ctx.fillText(rupiah(x.price),90,1100);if(x.promo){ctx.fillStyle='#888';ctx.font='600 30px Arial';ctx.fillText('Harga normal '+rupiah(x.normal),90,1145);}ctx.fillStyle='#16a34a';ctx.fillRect(90,1180,330,65);ctx.fillStyle='#fff';ctx.font='800 30px Arial';ctx.fillText('Pesan Sekarang ›',125,1223);return new Promise(r=>c.toBlob(r,'image/png',.92));
  }
  function wrap(ctx,text,x,y,max,lh,maxLines){const words=text.split(/\s+/);let line='',n=0;for(const w of words){const test=line?line+' '+w:w;if(ctx.measureText(test).width>max&&line){ctx.fillText(line,x,y);y+=lh;line=w;n++;if(n>=maxLines-1)break;}else line=test;}if(line)ctx.fillText(line,x,y);}
  function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
  async function shareImage(p){const blob=await makePoster(p);if(!blob)return;const file=new File([blob],slug(p.nama)+'.png',{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({title:p.nama,text:caption(p),files:[file]});return;}catch(e){if(e.name==='AbortError')return;}}downloadBlob(blob,file.name);await copy(caption(p),'Gambar dibuat. Caption sudah disalin; upload gambar ke Facebook/TikTok.');}
  window.DutaPoster={open:openPoster,caption:caption,makePoster:makePoster};
})();