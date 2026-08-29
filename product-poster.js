/* Duta LED - Product Social Poster Generator */
(function(){
  function rupiah(n){return 'Rp'+Number(n||0).toLocaleString('id-ID');}
  function esc(s){return String(s||'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}
  function productUrl(p){return location.origin+'/produk/'+encodeURIComponent(p.id||'');}
  function caption(p){
    const price=Number(p.hargaDiskon||0)>0&&Number(p.hargaDiskon)<Number(p.hargaJual||0)?p.hargaDiskon:p.hargaJual;
    const old=Number(p.hargaDiskon||0)>0&&Number(p.hargaDiskon)<Number(p.hargaJual||0)?`\n💥 Harga normal ${rupiah(p.hargaJual)}`:'';
    return `⚡ ${p.nama||'Produk Duta LED'}\n\n${p.deskripsi||'Produk LED dan sparepart berkualitas untuk kebutuhan rumah, toko, teknisi, dan usaha.'}\n\n💰 ${rupiah(price)}${old}\n📦 Eceran & grosir\n🚚 Siap diproses setelah konfirmasi stok\n\n🛒 Pesan sekarang:\n${productUrl(p)}\n\n#DutaLED #LED #SparepartLED #LampuLED #Elektronik`;
  }
  function openPoster(p){
    let modal=document.getElementById('posterModal');
    if(!modal){modal=document.createElement('div');modal.id='posterModal';modal.className='poster-modal';document.body.appendChild(modal);}
    const img=p.gambar1||p.gambar||''; const price=Number(p.hargaDiskon||0)>0&&Number(p.hargaDiskon)<Number(p.hargaJual||0)?p.hargaDiskon:p.hargaJual;
    modal.innerHTML=`<div class="poster-dialog"><button class="poster-close" type="button">×</button><div class="poster-preview"><div class="poster-image">${img?`<img src="${esc(img)}" alt="${esc(p.nama)}">`:'<div>⚡ DUTA LED</div>'}</div><div class="poster-copy"><span>DUTA LED</span><strong>${esc(p.nama)}</strong><b>${rupiah(price)}</b><small>${esc((p.deskripsi||'LED & sparepart untuk kebutuhan Anda.').slice(0,150))}</small><em>Pesan Sekarang ›</em></div></div><textarea class="poster-caption" readonly>${caption(p)}</textarea><div class="poster-actions"><button data-action="copy">📋 Salin Caption</button><button data-action="share">🔗 Bagikan Link</button><button data-action="fb">📘 Facebook</button><button data-action="tt">🎵 TikTok</button></div><p class="poster-note">Facebook/TikTok: generator menyiapkan caption dan link. Upload gambar produk/poster lalu tempel caption agar akun Anda tetap aman.</p></div>`;
    modal.classList.add('show');
    modal.querySelector('.poster-close').onclick=()=>modal.classList.remove('show');
    modal.querySelector('[data-action="copy"]').onclick=()=>navigator.clipboard?.writeText(caption(p));
    modal.querySelector('[data-action="share"]').onclick=async()=>{try{await navigator.share({title:p.nama,text:caption(p),url:productUrl(p)})}catch(e){navigator.clipboard?.writeText(productUrl(p));}};
    modal.querySelector('[data-action="fb"]').onclick=()=>window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(productUrl(p)),'_blank','noopener');
    modal.querySelector('[data-action="tt"]').onclick=()=>{navigator.clipboard?.writeText(caption(p));window.open('https://www.tiktok.com/upload','_blank','noopener');};
  }
  window.DutaPoster={open:openPoster,caption:caption};
})();
