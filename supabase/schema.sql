-- DUTA LED - Supabase database
-- Project: opgeeqnucxrdqcgwcuge
-- Produk utama menggantikan sumber Google Sheet.

create table if not exists public.produk (
  id text primary key,
  kode text,
  nama text not null,
  kategori text not null default 'Lainnya',
  harga_modal numeric(14,2) not null default 0,
  laba numeric(14,2) not null default 0,
  harga_jual numeric(14,2) not null default 0,
  diskon numeric(5,2) not null default 0,
  harga_diskon numeric(14,2) not null default 0,
  stok integer not null default 0,
  deskripsi text not null default '',
  gambar1 text not null default '',
  gambar2 text not null default '',
  gambar3 text not null default '',
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists produk_kategori_idx
  on public.produk (kategori);

create index if not exists produk_aktif_idx
  on public.produk (aktif);

create index if not exists produk_nama_idx
  on public.produk (nama);

-- Aktifkan Row Level Security.
alter table public.produk enable row level security;

-- Katalog publik boleh dibaca website.
drop policy if exists "produk_public_read" on public.produk;
create policy "produk_public_read"
on public.produk
for select
to anon, authenticated
using (aktif = true);

-- Jangan membuka INSERT/UPDATE/DELETE untuk anon.
-- Perubahan produk nantinya dilakukan melalui admin/authenticated backend.

-- Trigger updated_at.
create or replace function public.set_produk_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists produk_updated_at on public.produk;
create trigger produk_updated_at
before update on public.produk
for each row
execute function public.set_produk_updated_at();

-- Contoh data uji (opsional):
-- insert into public.produk (id, kode, nama, kategori, harga_jual, stok)
-- values ('TEST001', 'TEST001', 'Produk Uji Duta LED', 'Modul LED', 5000, 10);
