const API_URL = 'https://script.google.com/macros/s/AKfycbzow1xcIduyHnwMA0WmlCvkz_s81IBu0ALbZ70fxPoXqEsYwtESEMm-S8mg6TZSuw95/exec';

const isAdmin =
    new URLSearchParams(window.location.search)
    .get('role') === 'admin';


let cart =
    JSON.parse(localStorage.getItem("cart")) || {};

let allProducts = [];



// =========================
// RENDER PRODUK
// =========================

function renderProducts(products){


const grid =
document.getElementById("product-grid");


if(!grid){
    console.error("product-grid tidak ditemukan");
    return;
}



if(!Array.isArray(products) || products.length===0){

    grid.innerHTML =
    `<p style="text-align:center">
    Produk tidak ditemukan
    </p>`;

    return;
}



grid.innerHTML = products.map(p=>{


const stok =
Number(p.Stok)||0;


const habis =
stok<=0;



return `

<div class="product-card ${habis?'out-of-stock':''}">


${!isAdmin ?

`
<div class="discount-badge">
${p.Diskon || 0}%
</div>
`

:""}



<img src="${p.Gambar || 'https://via.placeholder.com/300'}">



<h4>
${p.Nama}
</h4>



${isAdmin ?


`

<div class="admin-panel">


<p>
Modal :
Rp ${(Number(p.HargaModal)||0)
.toLocaleString()}
</p>


<p>
Untung :
Rp ${(Number(p.Untung)||0)
.toLocaleString()}
</p>


<p>
Stok :
<b>${stok}</b>


<button onclick='openModal(${JSON.stringify(p.Nama)})'>
Edit
</button>


</p>


</div>


`



:


`

<div class="price-old">
Rp ${(Number(p.HargaCoret)||0)
.toLocaleString()}
</div>



<div class="price-final">
Rp ${(Number(p.HargaFinal)||0)
.toLocaleString()}
</div>



<div class="stok-info">

<span>
Stok : ${stok}
</span>


${habis?
`
<span class="stok-habis">
HABIS
</span>
`
:""}


</div>



<div class="controls">


<button
onclick='updateOrder(${JSON.stringify(p.Nama)},-1)'
${habis?'disabled':''}>
-
</button>



<span>
${cart[p.Nama] || 0}
</span>



<button
onclick='updateOrder(${JSON.stringify(p.Nama)},1)'
${habis?'disabled':''}>
+
</button>


</div>


`}



</div>


`;


}).join("");

}



// =========================
// KATEGORI
// =========================

function renderCategories(){


const container =
document.getElementById(
"category-container"
);


if(!container)return;



const categories =
[
"Semua",
...new Set(
allProducts
.map(p=>p.Kategori)
.filter(Boolean)
)
];



container.innerHTML =
categories.map(cat=>`

<button class="cat-btn"
onclick='filterCategory(${JSON.stringify(cat)})'>
${cat}
</button>


`).join("");


}





function filterCategory(kategori){


if(kategori==="Semua"){

renderProducts(allProducts);

return;

}


renderProducts(
allProducts.filter(
p=>p.Kategori===kategori
)
);


}




// =========================
// FETCH DATA
// =========================


async function fetchProducts(){


try{


console.log("Mengambil data...");


const response =
await fetch(
`${API_URL}?role=${isAdmin?'admin':'user'}`
);



const data =
await response.json();



console.log("DATA API :",data);



// antisipasi format API

allProducts =
Array.isArray(data)
?
data
:
data.products || [];



console.log(
"Jumlah produk:",
allProducts.length
);



renderCategories();

renderProducts(allProducts);



}catch(error){


console.error(
"Gagal mengambil produk:",
error
);


const grid =
document.getElementById(
"product-grid"
);


if(grid){

grid.innerHTML =
`
<p>
Gagal memuat produk
</p>
`;

}


}



}
