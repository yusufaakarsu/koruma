drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.rol_getir() cascade;
drop function if exists public.sehirlerim() cascade;
drop function if exists public.sehirim() cascade;
drop function if exists public.ilan_goruntulendi(uuid) cascade;
drop function if exists public.ilan_whatsapp_tiklandi(uuid) cascade;
drop table if exists public.ilanlar cascade;
drop table if exists public.kayitlar cascade;
drop table if exists public.ajanslar cascade;
drop table if exists public.yoneticiler cascade;
drop table if exists public.sehirler cascade;

create table public.sehirler (
  slug       text primary key check (slug ~ '^[a-z0-9-]+$'),
  ad         text not null,
  sira       int  not null default 100,
  created_at timestamptz not null default now()
);
insert into public.sehirler (slug, ad, sira) values
  ('istanbul', 'İstanbul', 1),
  ('ankara',   'Ankara',   2),
  ('izmir',    'İzmir',    3),
  ('bursa',    'Bursa',    4),
  ('antalya',  'Antalya',  5);
alter table public.sehirler enable row level security;
create policy sehirler_genel_select on public.sehirler for select using (true);

create table public.yoneticiler (
  id               uuid primary key default gen_random_uuid(),
  ad               text not null,
  kullanici_adi    text not null unique,
  sifre_hash       text not null,
  sehirler         text[] not null default '{}',
  iletisim_telefon text not null,
  silindi          boolean not null default false,
  created_at       timestamptz not null default now()
);

create table public.ajanslar (
  id               uuid primary key default gen_random_uuid(),
  yonetici_id      uuid references public.yoneticiler (id) on delete set null,
  firma_adi        text not null,
  kullanici_adi    text not null unique,
  sifre_hash       text not null,
  iletisim_telefon text,
  kotalar          jsonb not null default '{}'::jsonb,
  super_kotalar    jsonb not null default '{}'::jsonb,
  silindi          boolean not null default false,
  created_at       timestamptz not null default now()
);
create index ajanslar_yonetici_idx on public.ajanslar (yonetici_id);

create table public.ilanlar (
  id                 uuid primary key default gen_random_uuid(),
  ajans_id           uuid not null references public.ajanslar (id) on delete cascade,
  ad                 text not null,
  sehir              text not null,
  whatsapp           text,
  aciklama           text,
  fotograflar        text[] not null default '{}',
  aktif              boolean not null default true,
  super              boolean not null default false,
  goruntuleme_sayisi int not null default 0,
  whatsapp_tiklama   int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index ilanlar_sehir_aktif_idx on public.ilanlar (sehir) where aktif;
create index ilanlar_sehir_super_idx on public.ilanlar (sehir) where aktif and super;
create index ilanlar_ajans_idx       on public.ilanlar (ajans_id);

create table public.kayitlar (
  id         uuid primary key default gen_random_uuid(),
  olay       text not null,
  aktor_tipi text,
  aktor_ad   text,
  aciklama   text not null,
  created_at timestamptz not null default now()
);
create index kayitlar_tarih_idx on public.kayitlar (created_at desc);

create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger ilanlar_updated_at
  before update on public.ilanlar
  for each row execute function public.set_updated_at();

alter table public.yoneticiler enable row level security;
alter table public.ajanslar    enable row level security;
alter table public.ilanlar     enable row level security;
alter table public.kayitlar    enable row level security;

create policy ilanlar_genel_select on public.ilanlar
  for select using (aktif = true);

create function public.ilan_goruntulendi(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.ilanlar
    set goruntuleme_sayisi = goruntuleme_sayisi + 1
    where id = p_id;
$$;

create function public.ilan_whatsapp_tiklandi(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.ilanlar
    set whatsapp_tiklama = whatsapp_tiklama + 1
    where id = p_id;
$$;

grant execute on function public.ilan_goruntulendi(uuid)      to anon;
grant execute on function public.ilan_whatsapp_tiklandi(uuid) to anon;

insert into storage.buckets (id, name, public)
values ('ilan-fotograflari', 'ilan-fotograflari', true)
on conflict (id) do update set public = true;
