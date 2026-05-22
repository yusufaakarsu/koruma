"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient, secretVar } from "@/lib/supabase/admin";
import { mevcutPlatform } from "@/lib/oturum";
import { sifreHashle } from "@/lib/sifre";
import { kayitEkle } from "@/lib/log";
import { whatsappNormalize, whatsappGecerli } from "@/lib/format";

export type YoneticiSonuc = { hata: string } | undefined;

export type YoneticiOlusturGirdi = {
  ad: string;
  kullanici_adi: string;
  sifre: string;
  telefon: string;
  sehirler: string[];
};

/** Yeni süper yönetici oluşturur. */
export async function yoneticiOlustur(
  g: YoneticiOlusturGirdi,
): Promise<YoneticiSonuc> {
  const p = await mevcutPlatform();
  if (!p) return { hata: "Bu işlem için yetkiniz yok." };
  if (!secretVar()) return { hata: "Sunucu kurulumu eksik." };
  if (!g.ad.trim()) return { hata: "Ad zorunludur." };
  if (!g.kullanici_adi.trim()) return { hata: "Kullanıcı adı zorunludur." };
  if (g.sifre.length < 6) return { hata: "Şifre en az 6 karakter olmalıdır." };
  const telefon = whatsappNormalize(g.telefon);
  if (!whatsappGecerli(telefon))
    return { hata: "WhatsApp 10 hane olmalı ve 5 ile başlamalı." };

  const admin = createAdminClient();
  const { error } = await admin.from("yoneticiler").insert({
    ad: g.ad.trim(),
    kullanici_adi: g.kullanici_adi.trim(),
    sifre_hash: await sifreHashle(g.sifre),
    iletisim_telefon: telefon,
    sehirler: g.sehirler,
  });
  if (error) {
    if (error.code === "23505")
      return { hata: "Bu kullanıcı adı zaten kullanılıyor." };
    return { hata: error.message };
  }

  await kayitEkle(
    "yonetici_olustur",
    "platform",
    p.email,
    `Süper yönetici oluşturuldu: ${g.ad.trim()} (${g.kullanici_adi.trim()}).`,
  );
  revalidatePath("/platform");
  redirect("/platform");
}

export type YoneticiGuncelleGirdi = {
  id: string;
  ad: string;
  kullanici_adi: string;
  telefon: string;
  sehirler: string[];
  /** Doluysa şifre sıfırlanır. */
  yeni_sifre: string;
};

/** Süper yöneticiyi günceller. */
export async function yoneticiGuncelle(
  g: YoneticiGuncelleGirdi,
): Promise<YoneticiSonuc> {
  const p = await mevcutPlatform();
  if (!p) return { hata: "Bu işlem için yetkiniz yok." };
  if (!secretVar()) return { hata: "Sunucu kurulumu eksik." };
  if (!g.ad.trim()) return { hata: "Ad zorunludur." };
  if (!g.kullanici_adi.trim()) return { hata: "Kullanıcı adı zorunludur." };
  const telefon = whatsappNormalize(g.telefon);
  if (!whatsappGecerli(telefon))
    return { hata: "WhatsApp 10 hane olmalı ve 5 ile başlamalı." };

  const guncelleme: Record<string, unknown> = {
    ad: g.ad.trim(),
    kullanici_adi: g.kullanici_adi.trim(),
    iletisim_telefon: telefon,
    sehirler: g.sehirler,
  };
  if (g.yeni_sifre) {
    if (g.yeni_sifre.length < 6)
      return { hata: "Yeni şifre en az 6 karakter olmalıdır." };
    guncelleme.sifre_hash = await sifreHashle(g.yeni_sifre);
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("yoneticiler")
    .update(guncelleme)
    .eq("id", g.id);
  if (error) {
    if (error.code === "23505")
      return { hata: "Bu kullanıcı adı zaten kullanılıyor." };
    return { hata: error.message };
  }

  await kayitEkle(
    "yonetici_guncelle",
    "platform",
    p.email,
    `Süper yönetici güncellendi: ${g.ad.trim()}.`,
  );
  revalidatePath("/platform");
  redirect("/platform");
}

/**
 * Ajansı aktif/pasif yapar. Pasifte:
 *  - `mevcutAjans()` ajansı bulamadığı için panele giremez (silindi=true filtresi).
 *  - Tüm ilanları toplu olarak `aktif=false` yapılır → şehir sayfalarında görünmez.
 * Aktife alınca tüm ilanları yeniden `aktif=true` olur.
 */
export async function ajansAktiflikDegistir(
  id: string,
  aktif: boolean,
): Promise<void> {
  const p = await mevcutPlatform();
  if (!p || !secretVar()) return;
  const admin = createAdminClient();

  const { data: ajans } = await admin
    .from("ajanslar")
    .select("firma_adi, kotalar")
    .eq("id", id)
    .maybeSingle();
  if (!ajans) return;

  // silindi=true = pasif.
  await admin.from("ajanslar").update({ silindi: !aktif }).eq("id", id);
  await admin.from("ilanlar").update({ aktif }).eq("ajans_id", id);

  await kayitEkle(
    aktif ? "ajans_aktif" : "ajans_pasif",
    "platform",
    p.email,
    `Ajans ${aktif ? "aktif edildi" : "pasife alındı"}: ${ajans.firma_adi}. Tüm ilanları ${aktif ? "yayında" : "pasif"} yapıldı.`,
  );
  revalidatePath("/platform");
  const kotalar = (ajans.kotalar ?? {}) as Record<string, number>;
  Object.keys(kotalar).forEach((s) => revalidatePath(`/${s}`));
}

/**
 * Süper yöneticiyi aktif/pasif yapar. Pasifte admin paneline giremez
 * (`mevcutYonetici()` silindi=false filtreli).
 */
export async function yoneticiAktiflikDegistir(
  id: string,
  aktif: boolean,
): Promise<void> {
  const p = await mevcutPlatform();
  if (!p || !secretVar()) return;
  const admin = createAdminClient();
  const { data } = await admin
    .from("yoneticiler")
    .select("ad")
    .eq("id", id)
    .maybeSingle();
  await admin.from("yoneticiler").update({ silindi: !aktif }).eq("id", id);
  await kayitEkle(
    aktif ? "yonetici_aktif" : "yonetici_pasif",
    "platform",
    p.email,
    `Süper yönetici ${aktif ? "aktif edildi" : "pasife alındı"}: ${data?.ad ?? id}.`,
  );
  revalidatePath("/platform");
}

/** Süper yöneticiyi siler (ajansları silinmez, sahipsiz kalır). */
export async function yoneticiSil(id: string): Promise<void> {
  const p = await mevcutPlatform();
  if (!p || !secretVar()) return;
  const admin = createAdminClient();
  const { data } = await admin
    .from("yoneticiler")
    .select("ad")
    .eq("id", id)
    .maybeSingle();
  // Kalıcı silme yok — soft delete.
  await admin.from("yoneticiler").update({ silindi: true }).eq("id", id);
  await kayitEkle(
    "yonetici_sil",
    "platform",
    p.email,
    `Süper yönetici kaldırıldı (veri saklanır): ${data?.ad ?? id}.`,
  );
  revalidatePath("/platform");
  redirect("/platform");
}
