import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Sitenin hizmet verdiği şehirler.
 * Veritabanından okunur — platform sahibi `sehirler` tablosunda yönetir.
 * Her şehir bir alt alana karşılık gelir: <slug>.istanbulkoruma.com
 */
export type Sehir = {
  /** URL ve alt alan adında kullanılan kısa ad — küçük harf, türkçe karaktersiz. */
  slug: string;
  /** Görünen ad. */
  ad: string;
};

/** Her şehirde sabit kart sayısı. Kiralanmamış slot'lar UI'da "İlan Ver" olur. */
export const SEHIR_SLOT_SAYISI = 100;

/** Şehirdeki "süper" (öne çıkan) kart sayısı — üst yatay scroll. */
export const SUPER_KART_SAYISI = 10;

/** Boş "İlan Ver" kartının kapak görseli — placehold.co (1080x1920, dikey). */
export const ILAN_VER_GORSEL =
  "https://placehold.co/1080x1920?text=İlan%5CnVer";

/**
 * Tüm şehirleri sıraya göre döndürür. React cache ile aynı render'da tek
 * DB sorgusu — birden çok yer çağırsa bile network'e bir kez gider.
 */
export const sehirleriGetir = cache(async (): Promise<Sehir[]> => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("sehirler")
    .select("slug, ad")
    .order("sira", { ascending: true });
  return (data ?? []) as Sehir[];
});

/** Slug → Sehir objesi (async — DB'den çeker). */
export async function sehirBul(slug: string): Promise<Sehir | undefined> {
  const list = await sehirleriGetir();
  return list.find((s) => s.slug === slug.toLowerCase());
}

/** Slug DB'de var mı? (async — proxy'de değil, server component'lerde kullan.) */
export async function gecerliSehir(slug: string): Promise<boolean> {
  return !!(await sehirBul(slug));
}
