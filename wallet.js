(() => {
'use strict';
const KEY='DUTA_WALLET_V2';
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{tx:[],debt:[],bill:[]}}catch{return{tx:[],debt:[],bill:[]}}};
const save=d=>localStorage.setItem(KEY,JSON.stringify(d));
const rp=n=>'Rp'+Number(n||0).toLocaleString('id-ID');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const today=()=>new Date().toISOString().slice(0,10);
function wallet(){let d=load();const m=d.tx.filter(x=>x.type==='in').reduce((a,x)=>a+x.amount,0),k=d.tx.filter(x=>x.type==='out').reduce((a,x)=>a+x.amount,0);return{...d,m,k,s:m-k}}
function renderWallet(period='today'){const d=wallet(), now=new Date(), start=new Date(now);if(period==='week')start.setDate(now.getDate()-6);if(period==='month')start.setDate(1);const tx=d.tx.filter(x=>new Date(x.date+'T00:00:00')>=start&&new Date(x.date+'T00:00:00')<=now);const mi=tx.filter(x=>x.type==='in').reduce((a,x)=>a+x.amount,0),ko=tx.filter(x=>x.type==='out').reduce((a,x)=>a+x.amount,0);const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};set('walletBalance',rp(d.s));set('walletIn',rp(mi));set('walletOut',rp(ko));set('walletNet',rp(mi-ko));set('walletDebt',rp(d.debt.reduce((a,x)=>a+Math.max(0,x.amount-x.paid),0)));set('walletBill',rp(d.bill.reduce((a,x)=>a+Math.max(0,x.amount-x.paid),0)));const list=document.getElementById('walletHistory');if(list)list.innerHTML=tx.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30).map(x=>`<div class="wallet-item"><div><b>${esc(x.category)}</b><small>${x.date}${x.note?' · '+esc(x.note):''}</small></div><strong class="${x.type}">${x.type==='in'?'+':'−'} ${rp(x.amount)}</strong></div>`).join('')||'<div class="wallet-empty">Belum ada transaksi.</div>'}
function addTx(type){const amount=Number(prompt(type==='in'?'Jumlah uang masuk':'Jumlah uang keluar')||0);if(amount<=0)return;const category=prompt('Kategori',type==='in'?'Gaji':'Makan')||'Lainnya';const note=prompt('Keterangan (opsional)')||'';const d=load();d.tx.push({id:Date.now(),type,amount,category,note,date:today()});save(d);renderWallet(window.walletPeriod||'today')}
window.openWallet=()=>{document.getElementById('walletApp')?.classList.remove('hidden');renderWallet(window.walletPeriod||'today')};
window.closeWallet=()=>document.getElementById('walletApp')?.classList.add('hidden');
window.walletAddIn=()=>addTx('in');window.walletAddOut=()=>addTx('out');
window.walletPeriod=p=>{window.walletPeriod=p;document.querySelectorAll('.wallet-period').forEach(x=>x.classList.toggle('active',x.dataset.period===p));renderWallet(p)};
window.walletClear=()=>{if(confirm('Hapus semua catatan wallet di HP ini?')){localStorage.removeItem(KEY);renderWallet()}};
document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('.wallet-period').forEach(x=>x.onclick=()=>walletPeriod(x.dataset.period));renderWallet();});
})();