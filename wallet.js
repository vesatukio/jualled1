(() => {
'use strict';
const KEY='DUTA_WALLET_V2';
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{tx:[],debt:[],bill:[]}}catch{return{tx:[],debt:[],bill:[]}}};
const save=d=>localStorage.setItem(KEY,JSON.stringify(d));
const rp=n=>'Rp'+Number(n||0).toLocaleString('id-ID');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const localDate=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const dateText=s=>{const [y,m,d]=String(s).split('-');return d&&m&&y?`${d}/${m}/${y}`:s};
function wallet(){const d=load();const m=d.tx.filter(x=>x.type==='in').reduce((a,x)=>a+Number(x.amount||0),0),k=d.tx.filter(x=>x.type==='out').reduce((a,x)=>a+Number(x.amount||0),0);return{...d,m,k,s:m-k}}
function periodTx(tx,period){const now=new Date();const end=new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59);let start=new Date(end);if(period==='week')start.setDate(start.getDate()-6);if(period==='month')start=new Date(now.getFullYear(),now.getMonth(),1);return tx.filter(x=>{const d=new Date(`${x.date}T00:00:00`);return d>=start&&d<=end})}
function renderWallet(period='today'){const d=wallet(),tx=periodTx(d.tx,period),mi=tx.filter(x=>x.type==='in').reduce((a,x)=>a+Number(x.amount||0),0),ko=tx.filter(x=>x.type==='out').reduce((a,x)=>a+Number(x.amount||0),0);const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};set('walletBalance',rp(d.s));set('walletIn',rp(mi));set('walletOut',rp(ko));set('walletNet',rp(mi-ko));set('walletDebt',rp(d.debt.reduce((a,x)=>a+Math.max(0,Number(x.amount||0)-Number(x.paid||0)),0)));set('walletBill',rp(d.bill.reduce((a,x)=>a+Math.max(0,Number(x.amount||0)-Number(x.paid||0)),0));const list=document.getElementById('walletHistory');if(list)list.innerHTML=tx.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,50).map(x=>`<div class="wallet-item"><div><b>${esc(x.category)}</b><small>${dateText(x.date)}${x.note?' · '+esc(x.note):''}</small></div><strong class="${x.type}">${x.type==='in'?'+':'−'} ${rp(x.amount)}</strong></div>`).join('')||'<div class="wallet-empty">Belum ada transaksi.</div>'}
function addTx(type){const amount=Number(prompt(type==='in'?'Jumlah uang masuk':'Jumlah uang keluar')||0);if(amount<=0)return;const category=prompt('Kategori',type==='in'?'Gaji':'Makan')||'Lainnya';const note=prompt('Keterangan (opsional)')||'';const d=load();d.tx.push({id:Date.now(),type,amount,category,note,date:localDate()});save(d);renderWallet(window.walletPeriod||'today')}
window.openWallet=()=>{document.getElementById('walletApp')?.classList.remove('hidden');renderWallet(window.walletPeriod||'today')};
window.closeWallet=()=>document.getElementById('walletApp')?.classList.add('hidden');
window.walletAddIn=()=>addTx('in');window.walletAddOut=()=>addTx('out');
window.walletPeriod=p=>{window.walletPeriod=p;document.querySelectorAll('.wallet-period').forEach(x=>x.classList.toggle('active',x.dataset.period===p));renderWallet(p)};
window.walletClear=()=>{if(confirm('Hapus semua catatan wallet di HP ini?')){localStorage.removeItem(KEY);renderWallet()}};
document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('.wallet-period').forEach(x=>x.onclick=()=>window.walletPeriod(x.dataset.period));renderWallet();});
})();