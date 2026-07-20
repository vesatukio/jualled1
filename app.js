const API_URL = 'https://script.google.com/macros/s/AKfycbzow1xcIduyHnwMA0WmlCvkz_s81IBu0ALbZ70fxPoXqEsYwtESEMm-S8mg6TZSuw95/exec';

const isAdmin =
    new URLSearchParams(window.location.search)
    .get('role') === 'admin';


let cart =
    JSON.parse(localStorage.getItem("cart")) || {};

let allProducts = [];
let currentCategory = "Semua";



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
// KATEGORI & FILTER GABUNGAN
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

<button class="cat-btn ${cat === currentCategory ? 'active' : ''}"
onclick='filterCategory(${JSON.stringify(cat)})'>
${cat}
</button>


`).join("");


}





function filterCategory(kategori){

    currentCategory = kategori;

    document.querySelectorAll(".cat-btn").forEach(btn => {
        if(btn.textContent.trim() === kategori){
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    applyFilters();

}




function applyFilters(){

    const searchInput = document.getElementById("search");
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";

    let filtered = allProducts;

    if(currentCategory !== "Semua"){
        filtered = filtered.filter(p => p.Kategori === currentCategory);
    }

    if(keyword !== ""){
        filtered = filtered.filter(p =>
            p.Nama && p.Nama.toLowerCase().includes(keyword)
        );
    }

    renderProducts(filtered);

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

applyFilters();



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
function sendOrderWA(){

    let pesan = "Pesanan Baru:%0A%0A";

    let total = 0;
    let adaPesanan = false;


    Object.entries(cart).forEach(([nama, qty])=>{

        if(qty > 0){

            const produk =
            allProducts.find(
                p => p.Nama === nama
            );


            if(produk){

                const harga =
                Number(produk.HargaFinal) || 0;


                const subtotal =
                harga * qty;


                total += subtotal;

                adaPesanan = true;


                pesan +=
                `${nama} x ${qty} = Rp ${subtotal.toLocaleString()}%0A`;

            }

        }

    });


    if(!adaPesanan){

        alert("Keranjang masih kosong");

        return;

    }


    pesan +=
    `%0ATotal Belanja: Rp ${total.toLocaleString()}`;



    // GANTI NOMOR WA TOKO
    const nomorWA =
    "6283157925577";


    const url =
    `https://wa.me/${nomorWA}?text=${pesan}`;


    window.open(
        url,
        "_blank"
    );

}
// =========================
// CART
// =========================

function updateOrder(nama, jumlah){

    if(!cart[nama]){
        cart[nama] = 0;
    }


    cart[nama] += jumlah;


    if(cart[nama] <= 0){
        delete cart[nama];
    }


    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    applyFilters();

}
// =========================
// START APP
// =========================

document.addEventListener("DOMContentLoaded",()=>{

    fetchProducts();


    const search =
    document.getElementById("search");


    if(search){

        search.addEventListener("input", function(){
            applyFilters();
        });

    }

});
