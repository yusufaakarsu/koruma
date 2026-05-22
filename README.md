# İstanbul Koruma

Çok şehirli koruma / özel güvenlik ilan sitesi. Her şehir kendi alt alan adında
yayınlanır; ilan veren firmalar fotoğraf ve WhatsApp numaralarını panelden anlık
günceller.

- **Next.js 16** (App Router) + **Tailwind CSS** — Vercel'de host
- **Supabase** — Postgres veritabanı, Auth, Storage (fotoğraflar)
- Halka açık sayfalar ISR ile önbelleğe alınır; panelden değişiklikte
  `revalidatePath` ile site **anında** güncellenir.

## Mimari

| Adres | İçerik |
|-------|--------|
| `koruma.com` | Şehirler indexi (şu an tüm site `noindex`) |
| `<sehir>.koruma.com` | O şehrin ilan listesi (`src/app/[sehir]`) |
| `<sehir>.koruma.com/ilan/<id>` | İlan detayı |
| `panel.koruma.com` | **Ajans** girişi + paneli |
| `admin.koruma.com` | **Süper yönetici** girişi + paneli |

Alt alan adı → route eşlemesi `src/proxy.ts` içinde yapılır (iframe yok).
Şehir listesi `src/lib/sehirler.ts` dosyasındadır.

### Roller

- **Süper yönetici** — `src/lib/yoneticiler.ts` içinde **kod ile sabit**
  (e-posta + yetkili olduğu şehirler). `admin.koruma.com` üzerinden, yalnızca
  kendi şehirlerinde ajans hesabı oluşturur; her ajansa bir şehir ve ilan
  kotası atar, şifresini belirler.
- **Ajans** — süper yönetici tarafından oluşturulur. Tek bir şehre bağlıdır;
  yalnızca o şehirde, kotası kadar ilan girer. Herkese açık kayıt yoktur.

## Kurulum

### 1. Supabase projesi

1. [supabase.com](https://supabase.com) üzerinde proje oluşturun.
2. **SQL Editor**'de sırayla şu dosyaları çalıştırın:
   - `supabase/schema.sql`
   - `supabase/02-yonetici-kota.sql`
   - `supabase/03-tek-sehir.sql`
3. **Project Settings → API**'den `Project URL`, `anon`/`publishable` ve
   `secret` anahtarlarını alın.

### 2. Ortam değişkenleri

`.env.local` dosyasını doldurun:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
```

`SUPABASE_SECRET_KEY` yalnızca sunucuda kullanılır (ajans hesabı oluşturma).

### 3. Çalıştırma

```bash
npm install
npm run dev
```

- Ana sayfa: <http://localhost:3000>
- Şehir: <http://istanbul.localhost:3000> (tarayıcılar `*.localhost`'u çözer)
- Ajans paneli: <http://panel.localhost:3000>
- Süper yönetici: <http://admin.localhost:3000>

### 4. İlk süper yöneticiyi tanımlama

1. Supabase **Authentication → Users → Add user** ile bir hesap oluşturun
   (e-posta + şifre, "Auto Confirm User" işaretli).
2. Aynı e-postayı `src/lib/yoneticiler.ts` içindeki `SUPER_YONETICILER`
   listesine, yetkili olacağı şehir slug'larıyla ekleyin.

Bu yönetici `admin.koruma.com` üzerinden tüm ajansları oluşturur.

## Vercel'e yayınlama

1. Projeyi Vercel'e import edin, ortam değişkenlerini ekleyin
   (`NEXT_PUBLIC_ROOT_DOMAIN` = gerçek alan adınız).
2. **Settings → Domains**: ana alan adını ve joker `*.<alan adı>` kaydını
   ekleyin. Joker, `panel`, `admin` ve şehir alt alan adlarını kapsar.
3. Supabase **Authentication → URL Configuration**'a alan adlarını ekleyin.

## Proje yapısı

```
src/
  proxy.ts               Alt alan adı yönlendirmesi + oturum tazeleme
  lib/
    sehirler.ts          Şehir listesi
    yoneticiler.ts       Süper yöneticiler (kod ile sabit)
    queries.ts           Veri okuma fonksiyonları
    oturum.ts            Ajans / süper yönetici oturum yardımcıları
    format.ts            URL / WhatsApp / TL yardımcıları
    supabase/            client · server · public · admin (secret key)
  components/            SiteHeader, IlanKarti, FotoGaleri, IlanFormu ...
  app/
    page.tsx             Ana sayfa (şehirler indexi)
    [sehir]/             Şehir listesi + ilan detayı
    giris/               Giriş (ajans + yönetici ortak)
    panel/               Ajans paneli + sunucu eylemleri
    admin/               Süper yönetici paneli + sunucu eylemleri
supabase/                schema.sql + 02 + 03 migrasyonları
```
