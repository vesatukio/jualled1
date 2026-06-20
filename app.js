const API_URL =
"https://script.google.com/macros/s/AKfycbxO1ItQclyBRHKSRso9yDL7WMLowhP1cJHXNtXXEiA8uiBrZnBVYW_fq__nGCcCSES4/exec";

let products = [];
let selectedProduct = null;

const produkContainer =
document.getElementById("produkContainer");

const kategoriContainer =
document.getElementById("kategoriContainer");

const searchInput =
document.getElementById("searchInput");

loadProducts();

async function loadProducts() {

  try {

    const response = await fetch(API_URL);

    products = await response.json();

    renderKategori();

    renderProducts(products);

  } catch (error) {

    produkContainer.innerHTML = `
      <div class="loading">
      Gagal memuat produk
      </div>
    `;

    console.log(error);

  }

}

function renderKategori() {

  const kategori = [
    "Semua",
    ...new Set(products.map(x => x.Kategori))
  ];

  kategoriContainer.innerHTML = "";

  kategori.forEach(item => {

    const btn =
      document.createElement("button");

    btn.innerText = item;

    if(item === "Semua")
      btn.classList.add("active");

    btn.onclick = () => {

      document
      .querySelectorAll(".kategori button")
      .forEach(b =>
        b.classList.remove("active")
      );

      btn.classList.add("active");

      if(item === "Semua"){

        renderProducts(products);

      }else{

        renderProducts(
          products.filter(
            p => p.Kategori === item
          )
        );

      }

    };

    kategoriContainer.appendChild(btn);

  });

}

function renderProducts(data){

  if(data.length === 0){

    produkContainer.innerHTML =
    `<div class="loading">
      Produk tidak ditemukan
    </div>`;

    return;

  }

  produkContainer.innerHTML = "";

  data.forEach(item => {

    const harga =
      Number(item.Harga || 0);

    const diskon =
      Number(item.Diskon || 0);

    const hargaDiskon =
      harga - (harga * diskon / 100);

    const card =
    document.createElement("div");

    card.className = "card";

    card.innerHTML = `

      <img src="${item.gambar1}" loading="lazy">

      <div class="card-body">

        <div class="card-title">
          ${item.Barang}
        </div>

        <div class="card-category">
          ${item.Kategori}
        </div>

        <div>

          ${
            diskon > 0
            ?
            `
            <span class="old-price">
            Rp ${formatRupiah(harga)}
            </span>

            <span class="discount">
            -${diskon}%
            </span>
            `
            : ""
          }

        </div>

        <div class="price">
          Rp ${formatRupiah(hargaDiskon)}
        </div>

        <div class="stock">
          Stok : ${item.Stok}
        </div>

      </div>

    `;

    card.onclick =
    () => openDetail(item);

    produkContainer.appendChild(card);

  });

}

searchInput.addEventListener(
"keyup",
function(){

  const keyword =
  this.value.toLowerCase();

  const hasil =
  products.filter(item =>
    item.Barang
    .toLowerCase()
    .includes(keyword)
  );

  renderProducts(hasil);

});

function openDetail(item){

  selectedProduct = item;

  const harga =
  Number(item.Harga || 0);

  const diskon =
  Number(item.Diskon || 0);

  const hargaDiskon =
  harga - (harga * diskon / 100);

  document.getElementById(
  "modalImage"
  ).src = item.gambar1;

  document.getElementById(
  "modalNama"
  ).innerText = item.Barang;

  document.getElementById(
  "modalHarga"
  ).innerText =
  "Rp " +
  formatRupiah(hargaDiskon);

  document.getElementById(
  "modalKategori"
  ).innerText =
  "Kategori : " +
  item.Kategori;

  document.getElementById(
  "modalStok"
  ).innerText =
  "Stok : " +
  item.Stok;

  document.getElementById(
  "detailModal"
  ).style.display =
  "block";

}

document.querySelector(".close")
.onclick = function(){

  document.getElementById(
  "detailModal"
  ).style.display =
  "none";

};

window.onclick = function(e){

  const modal =
  document.getElementById(
  "detailModal"
  );

  if(e.target == modal){

    modal.style.display = "none";

  }

};

function tambahQty(){

  const qty =
  document.getElementById(
  "qtyInput"
  );

  qty.value =
  parseInt(qty.value) + 1;

}

function kurangQty(){

  const qty =
  document.getElementById(
  "qtyInput"
  );

  if(qty.value > 1){

    qty.value =
    parseInt(qty.value) - 1;

  }

}

function formatRupiah(number){

  return Number(number)
  .toLocaleString("id-ID");

}

document.getElementById(
"orderBtn"
).onclick = function(){

  if(!selectedProduct)
    return;

  const qty =
  document.getElementById(
  "qtyInput"
  ).value;

  const nama =
  prompt("Nama Pembeli");

  if(!nama) return;

  const wa =
  prompt("Nomor WhatsApp");

  if(!wa) return;

  const alamat =
  prompt("Alamat");

  if(!alamat) return;

  kirimOrder(
    nama,
    wa,
    alamat,
    qty,
    selectedProduct
  );

};

async function kirimOrder(
nama,
wa,
alamat,
qty,
produk
){

  try{

    const response =
    await fetch(API_URL,{

      method:"POST",

      headers:{
        "Content-Type":
        "application/json"
      },

      body:JSON.stringify({

        action:"order",

        nama:nama,

        wa:wa,

        alamat:alamat,

        produk:produk.Barang,

        harga:produk.Harga,

        qty:qty

      })

    });

    const result =
    await response.json();

    alert(
    "Pesanan berhasil dikirim"
    );

  }
  catch(error){

    alert(
    "Gagal mengirim pesanan"
    );

    console.log(error);

  }

}
