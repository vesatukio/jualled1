const API =
"https://script.google.com/macros/s/AKfycbxO1ItQclyBRHKSRso9yDL7WMLowhP1cJHXNtXXEiA8uiBrZnBVYW_fq__nGCcCSES4/exec";

const WA =
"6283157925577";

let products=[];
let cart=[];

loadProducts();

async function loadProducts(){

const res = await fetch(API);

products = await res.json();
console.log(products[0]);
renderProducts(products);

}

function renderProducts(data){

const container =
document.getElementById("products");

container.innerHTML="";

data.forEach((p,index)=>{

const harga =
Number(p.Harga || p[" Harga"] || 0);

const diskon =
Number(p.Diskon || p[" Diskon"] || 0);

const stok =
p.Stok || p[" Stok"] || 0;

const finalPrice =
Math.round(
harga - (harga*diskon/100)
);

container.innerHTML += `

<div class="card">

<div class="badge">
-${diskon}%
</div>

<img
class="slider"
loading="lazy"
src="${p.gambar1}">

<div class="nama">
${p.Barang}
</div>

<div class="kategori">
${p.Kategori}
</div>

<div class="price-old">
Rp ${harga.toLocaleString("id-ID")}
</div>

<div class="price">
Rp ${finalPrice.toLocaleString("id-ID")}
</div>

<div class="stock">
Stok : ${stok}
</div>

<div class="qty">

<button onclick="minus(${index})">-</button>

<input
id="qty${index}"
value="1">

<button onclick="plus(${index})">+</button>

</div>

<button
class="order-btn"
onclick="addCart(${index})">

📞 Klik Order

</button>

</div>

`;

});

}

function plus(id){

let qty =
document.getElementById(
"qty"+id
);

qty.value =
parseInt(qty.value)+1;

}

function minus(id){

let qty =
document.getElementById(
"qty"+id
);

if(qty.value>1)
qty.value--;

}

function addCart(index){

const qty =
parseInt(
document.getElementById(
"qty"+index
).value
);

for(let i=0;i<qty;i++){

cart.push(products[index]);

}

updateCart();

localStorage.setItem(
"duta_cart",
JSON.stringify(cart)
);

}

function updateCart(){

let total=0;

cart.forEach(item=>{

const harga =
Number(item.Harga);

const diskon =
Number(item.Diskon);

total +=
harga - (harga*diskon/100);

});

document.getElementById(
"cartCount"
).innerText =
cart.length;

document.getElementById(
"total"
).innerText =
"Rp "+
Math.round(total)
.toLocaleString("id-ID");

}

function searchProduct(){

const key =
document.getElementById(
"search"
).value.toLowerCase();

const result =
products.filter(item=>

(item.Barang || "")
.toLowerCase()
.includes(key)

||

(item.Kategori || "")
.toLowerCase()
.includes(key)

);

renderProducts(result);

}

function checkoutWA(){

if(cart.length===0){

alert("Keranjang kosong");

return;

}

let pesan =
"Halo Admin DUTAKITA ELECTRONIC%0A%0A";

pesan +=
"Pesanan Saya:%0A%0A";

let total=0;

cart.forEach((item,i)=>{

const harga =
Number(item.Harga);

const diskon =
Number(item.Diskon);

const finalPrice =
harga-(harga*diskon/100);

total += finalPrice;

pesan +=
`${i+1}. ${item.Barang}%0A`;

pesan +=
`Rp ${finalPrice}%0A%0A`;

});

pesan +=
`Total : Rp ${Math.round(total)}%0A%0A`;

pesan +=
`Nama : %0A`;

pesan +=
`Alamat :`;

window.open(
`https://wa.me/${WA}?text=${pesan}`
);

}

const saved =
localStorage.getItem(
"duta_cart"
);

if(saved){

cart =
JSON.parse(saved);

updateCart();

}

if("serviceWorker" in navigator){

navigator.serviceWorker
.register("service-worker.js");

}
