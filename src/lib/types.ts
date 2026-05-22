/** Veritabanı satır tipleri — supabase/schema.sql ile birebir eşleşir. */

/** Süper yönetici (custom auth: kullanıcı adı + şifre). */
export type Yonetici = {
  id: string;
  ad: string;
  kullanici_adi: string;
  sifre_hash: string;
  sehirler: string[];
  /** 10 hane WhatsApp — şehrindeki boş slot'lardaki "İlan Ver" buraya yönlenir. */
  iletisim_telefon: string;
  silindi: boolean;
  created_at: string;
};

/** Ajans / firma (custom auth: kullanıcı adı + şifre). */
export type Ajans = {
  id: string;
  yonetici_id: string | null;
  firma_adi: string;
  kullanici_adi: string;
  sifre_hash: string;
  iletisim_telefon: string | null;
  /** { sehir_slug: kota } — normal ilan kotaları. */
  kotalar: Record<string, number>;
  /** { sehir_slug: kota } — süper (öne çıkan) ilan kotaları. Admin verir, ajans değiştiremez. */
  super_kotalar: Record<string, number>;
  silindi: boolean;
  created_at: string;
};

/** Koruma ilanı — her satır bir ajansa aittir; "boş slot" UI'da üretilir. */
export type Ilan = {
  id: string;
  ajans_id: string;
  ad: string;
  sehir: string;
  /** Ajans panelden doldurur; null = henüz girmemiş. */
  whatsapp: string | null;
  aciklama: string | null;
  fotograflar: string[];
  aktif: boolean;
  super: boolean;
  goruntuleme_sayisi: number;
  whatsapp_tiklama: number;
  created_at: string;
  updated_at: string;
};

/** İlan listesi kartlarında ve modalda kullanılan hafif görünüm. */
export type IlanKart = Pick<
  Ilan,
  | "id"
  | "ad"
  | "sehir"
  | "whatsapp"
  | "fotograflar"
  | "aciklama"
  | "super"
  | "goruntuleme_sayisi"
>;

/** Denetim logu kaydı. */
export type Kayit = {
  id: string;
  olay: string;
  aktor_tipi: string | null;
  aktor_ad: string | null;
  aciklama: string;
  created_at: string;
};

/** sifre_hash içermeyen, istemciye gönderilebilir ajans görünümü. */
export type AjansGuvenli = Omit<Ajans, "sifre_hash">;
/** sifre_hash içermeyen, istemciye gönderilebilir yönetici görünümü. */
export type YoneticiGuvenli = Omit<Yonetici, "sifre_hash">;
