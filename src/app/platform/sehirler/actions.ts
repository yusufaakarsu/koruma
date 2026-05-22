"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, secretVar } from "@/lib/supabase/admin";
import { mevcutPlatform } from "@/lib/oturum";
import { kayitEkle } from "@/lib/log";

export type SehirSonuc = { hata: string } | undefined;

export type SehirEkleGirdi = {
  slug: string;
  ad: string;
  sira: number;
};

/** Yeni şehir ekler. slug küçük harf + sayı + tire; benzersiz. */
export async function sehirEkle(g: SehirEkleGirdi): Promise<SehirSonuc> {
  const p = await mevcutPlatform();
  if (!p) return { hata: "Bu işlem için yetkiniz yok." };
  if (!secretVar()) return { hata: "Sunucu kurulumu eksik." };

  const slug = g.slug.trim().toLowerCase();
  const ad = g.ad.trim();
  if (!/^[a-z0-9-]+$/.test(slug))
    return {
      hata: "Slug yalnızca küçük harf, rakam ve tire içerebilir (örn. istanbul, mardin).",
    };
  if (!ad) return { hata: "Ad zorunludur." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("sehirler")
    .insert({ slug, ad, sira: g.sira || 100 });
  if (error) {
    if (error.code === "23505")
      return { hata: "Bu slug zaten kullanılıyor." };
    return { hata: error.message };
  }

  await kayitEkle(
    "sehir_ekle",
    "platform",
    p.email,
    `Şehir eklendi: ${ad} (${slug}).`,
  );
  revalidatePath("/platform/sehirler");
  revalidatePath("/", "layout"); // tüm sayfaların şehir cache'i tazelesin
}

/** Şehri günceller (ad/sira). slug değişmez (yabancı referanslar var). */
export async function sehirGuncelle(
  slug: string,
  ad: string,
  sira: number,
): Promise<SehirSonuc> {
  const p = await mevcutPlatform();
  if (!p) return { hata: "Bu işlem için yetkiniz yok." };
  if (!secretVar()) return { hata: "Sunucu kurulumu eksik." };
  if (!ad.trim()) return { hata: "Ad zorunludur." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("sehirler")
    .update({ ad: ad.trim(), sira })
    .eq("slug", slug);
  if (error) return { hata: error.message };

  await kayitEkle(
    "sehir_guncelle",
    "platform",
    p.email,
    `Şehir güncellendi: ${slug} → ${ad.trim()}.`,
  );
  revalidatePath("/platform/sehirler");
  revalidatePath("/", "layout");
}

/**
 * Şehri siler. Sadece kullanılmıyorsa silinebilir: hiçbir yöneticide,
 * hiçbir ajansta ve hiçbir ilanda bu slug olmamalı.
 */
export async function sehirSil(slug: string): Promise<SehirSonuc> {
  const p = await mevcutPlatform();
  if (!p) return { hata: "Bu işlem için yetkiniz yok." };
  if (!secretVar()) return { hata: "Sunucu kurulumu eksik." };

  const admin = createAdminClient();

  // İlanda kullanılıyor mu?
  const { count: ilanSayisi } = await admin
    .from("ilanlar")
    .select("id", { count: "exact", head: true })
    .eq("sehir", slug);
  if ((ilanSayisi ?? 0) > 0)
    return { hata: `Bu şehirde ${ilanSayisi} ilan var, önce kaldırın.` };

  // Yöneticide yetkilendirme var mı?
  const { data: yon } = await admin
    .from("yoneticiler")
    .select("id")
    .contains("sehirler", [slug])
    .limit(1);
  if (yon && yon.length > 0)
    return { hata: "Bu şehre yetkili yönetici var, önce yetkisini kaldırın." };

  // Ajansta kotalar içinde var mı? (jsonb anahtar varlığı)
  const { data: aj } = await admin
    .from("ajanslar")
    .select("id, kotalar")
    .limit(2000);
  const kullanan = (aj ?? []).find(
    (a) => (a.kotalar as Record<string, number>)?.[slug] !== undefined,
  );
  if (kullanan)
    return { hata: "Bu şehir bir ajansın kotasında, önce kaldırın." };

  const { error } = await admin.from("sehirler").delete().eq("slug", slug);
  if (error) return { hata: error.message };

  await kayitEkle(
    "sehir_sil",
    "platform",
    p.email,
    `Şehir silindi: ${slug}.`,
  );
  revalidatePath("/platform/sehirler");
  revalidatePath("/", "layout");
}
