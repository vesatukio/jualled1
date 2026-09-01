(function(){
'use strict';
function esc(s){return String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));}
function getSavedEmail(){
  const keys=['email','customer_email','user_email','DUTA_EMAIL','duta_email'];
  for(const k of keys){const v=localStorage.getItem(k);if(v&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return v.trim();}
  try{const u=window.supabaseClient?.auth?.getUser?.(); if(u?.data?.user?.email)return u.data.user.email;}catch(e){}
  return '';
}
window.renderAccountFeedback=function(container){
  if(!container)return;
  const email=getSavedEmail();
  container.innerHTML='<div class="account-feedback"><h3>💬 Saran & Masukan</h3><p>Bantu kami membuat web Duta LED lebih mudah dan nyaman digunakan.</p>'+
    '<textarea id="webFeedback" rows="4" maxlength="1000" placeholder="Tulis saran, kritik, atau kendala yang Anda temukan..."></textarea>'+
    (email?'<small>Email tersimpan: '+esc(email)+'</small>':'')+
    '<button type="button" id="sendWebFeedback">Kirim Saran</button><div id="feedbackMsg"></div></div>';
  document.getElementById('sendWebFeedback')?.addEventListener('click',async()=>{
    const text=document.getElementById('webFeedback')?.value.trim(), msg=document.getElementById('feedbackMsg');
    if(!text){msg.textContent='Tulis saran terlebih dahulu.';return;}
    const btn=document.getElementById('sendWebFeedback');btn.disabled=true;btn.textContent='Mengirim...';
    try{
      const client=window.supabaseClient||window.supabase;
      if(!client?.from)throw new Error('Koneksi database belum tersedia');
      const payload={saran:text}; if(email)payload.email=email;
      const {error}=await client.from('saran_masukan').insert(payload); if(error)throw error;
      document.getElementById('webFeedback').value='';msg.textContent='✓ Terima kasih, saran Anda sudah terkirim.';
    }catch(e){msg.textContent='Gagal mengirim saran: '+(e.message||'coba lagi');}
    finally{btn.disabled=false;btn.textContent='Kirim Saran';}
  });
};
})();