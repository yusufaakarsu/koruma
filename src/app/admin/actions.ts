"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { mevcutYonetici } from "@/lib/oturum";
import { sifreHashle } from "@/lib/sifre";
import { kayitEkle } from "@/lib/log";
import { whatsappNormalize, whatsappGecerli } from "@/lib/format";
import { SUPER_KART_SAYISI } from "@/lib/sehirler";

export type AjansSonuc = { hata: string } | undefined;

/** Şehir → kota eşlemesi. Anahtarlar yöneticinin yetkili şehirleri içinde olmalı. */
export type Kotalar = Record<string, number>;

export type AjansOlusturGirdi = {
  firma_adi: string;
  kullanici_adi: string;
  sifre: string;
  telefon: string;
  kotalar: Kotalar;
  super_kotalar: Kotalar;
};

/**
 * Kotaları temizler: yetkili olmayan şehirleri reddeder, 0/negatif değerleri atar.
 * minToplam=1 ise en az bir şehirde >=1 değer ister.
 */
function kotalariTemizle(
  kotalar: Kotalar,
  izinli: string[],
  minToplam: number,
): { temiz: Kotalar; hata?: string } {
  const temiz: Kotalar = {};
  for (const [sehir, n] of Object.entries(kotalar)) {
    if (!izinli.includes(sehir))
      return { temiz, hata: `${sehir} şehrine atama yetkiniz yok.` };
    const sayi = Math.floor(Number(n));
    if (!Number.isFinite(sayi) || sayi < 0) continue;
    if (sayi > 0) temiz[sehir] = sayi;
  }
  if (Object.keys(temiz).length < minToplam)
    return { temiz, hata: "En az bir şehir için kota girin (≥ 1)." };
  return { temiz };
}

/** Yeni ajans + şehir başına (normal + süper) kota kadar ilan oluşturur. */
export async function ajansOlustur(
  g: AjansOlusturGirdi,
): Promise<AjansSonuc> {
  const yon = await mevcutYonetici();
  if (!yon) return { hata: "Bu işlem için yetkiniz yok." };
  if (!g.firma_adi.trim()) return { hata: "Firma adı zorunludur." };
  if (!g.kullanici_adi.trim()) return { hata: "Kullanıcı adı zorunludur." };
  if (g.sifre.length < 6) return { hata: "Şifre en az 6 karakter olmalıdır." };
  const telefon = whatsappNormalize(g.telefon);
  if (!whatsappGecerli(telefon))
    return { hata: "Telefon 10 hane olmalı ve 5 ile başlamalı." };

  const normal = kotalariTemizle(g.kotalar, yon.sehirler, 1);
  if (normal.hata) return { hata: normal.hata };
  const super_ = kotalariTemizle(g.super_kotalar, yon.sehirler, 0);
  if (super_.hata) return { hata: super_.hata };

  // Süper kotalar yalnız normal kotası olan şehirlerde olabilir.
  for (const s of Object.keys(super_.temiz)) {
    if (!(s in normal.temiz))
      return {
        hata: `${s} için süper kotası verdiniz ama normal kota yok.`,
      };
  }

  // Şehir başına süper limit kontrolü: mevcut aktif süper + verilecek ≤ 10.
  const admin = createAdminClient();
  for (const [sehir, ek] of Object.entries(super_.temiz)) {
    const { count } = await admin
      .from("ilanlar")
      .select("id", { count: "exact", head: true })
      .eq("sehir", sehir)
      .eq("super", true)
      .eq("aktif", true);
    if ((count ?? 0) + ek > SUPER_KART_SAYISI) {
      return {
        hata: `${sehir} şehrinde süper kapasitesi yetersiz (kalan ${SUPER_KART_SAYISI - (count ?? 0)}, istenen ${ek}).`,
      };
    }
  }

  const firma = g.firma_adi.trim();
  const { data: yeni, error } = await admin
    .from("ajanslar")
    .insert({
      yonetici_id: yon.id,
      firma_adi: firma,
      kullanici_adi: g.kullanici_adi.trim(),
      sifre_hash: await sifreHashle(g.sifre),
      iletisim_telefon: telefon,
      kotalar: normal.temiz,
      super_kotalar: super_.temiz,
    })
    .select("id")
    .single();
  if (error || !yeni) {
    if (error?.code === "23505")
      return { hata: "Bu kullanıcı adı zaten kullanılıyor." };
    return { hata: error?.message ?? "Ajans oluşturulamadı." };
  }

  // Her şehir için: önce süper, sonra normal kayıtlar.
  // whatsapp YAZILMIYOR — ajans paneline girip her ilanın korumasına ait
  // numarayı tek tek doldurur. Numara dolmadan ilan kartında WhatsApp butonu yok.
  const ilanlar: Array<Record<string, unknown>> = [];
  for (const [sehir, normalKota] of Object.entries(normal.temiz)) {
    const superKota = super_.temiz[sehir] ?? 0;
    let n = 1;
    for (let i = 0; i < superKota; i++, n++) {
      ilanlar.push({
        ajans_id: yeni.id,
        ad: `Koruma ${n}`,
        sehir,
        aciklama: `${firma} — deneyimli güvenlik personeli.`,
        aktif: true,
        super: true,
        fotograflar: [] as string[],
      });
    }
    for (let i = 0; i < normalKota; i++, n++) {
      ilanlar.push({
        ajans_id: yeni.id,
        ad: `Koruma ${n}`,
        sehir,
        aciklama: `${firma} — deneyimli güvenlik personeli.`,
        aktif: true,
        super: false,
        fotograflar: [] as string[],
      });
    }
  }
  const { error: ilanHata } = await admin.from("ilanlar").insert(ilanlar);
  if (ilanHata) {
    await admin.from("ajanslar").delete().eq("id", yeni.id);
    return { hata: "Ajans açıldı ama ilanlar eklenemedi: " + ilanHata.message };
  }

  const ozet = Object.entries(normal.temiz)
    .map(([s, n]) => {
      const sk = super_.temiz[s] ?? 0;
      return sk > 0 ? `${s}:${n}+${sk}★` : `${s}:${n}`;
    })
    .join(", ");
  await kayitEkle(
    "ajans_olustur",
    "yonetici",
    yon.ad,
    `"${firma}" ajansı oluşturuldu. Kotalar: ${ozet}.`,
  );
  revalidatePath("/admin");
  Object.keys(normal.temiz).forEach((s) => revalidatePath(`/${s}`));
  redirect("/admin");
}

export type AjansGuncelleGirdi = {
  id: string;
  firma_adi: string;
  kullanici_adi: string;
  telefon: string;
  kotalar: Kotalar;
  super_kotalar: Kotalar;
  /** Doluysa ajansın şifresi sıfırlanır. */
  yeni_sifre: string;
};

/**
 * Ajans bilgilerini günceller. Kotalar/süper kotalar yeni hâliyle saklanır;
 * mevcut ilan kayıtları otomatik insert/delete edilmez — admin manuel olarak
 * ilanları süpere yükselt/normale çek butonu ile yönetir.
 */
export async function ajansGuncelle(
  g: AjansGuncelleGirdi,
): Promise<AjansSonuc> {
  const yon = await mevcutYonetici();
  if (!yon) return { hata: "Bu işlem için yetkiniz yok." };
  if (!g.firma_adi.trim()) return { hata: "Firma adı zorunludur." };
  if (!g.kullanici_adi.trim()) return { hata: "Kullanıcı adı zorunludur." };
  const telefon = whatsappNormalize(g.telefon);
  if (!whatsappGecerli(telefon))
    return { hata: "Telefon 10 hane olmalı ve 5 ile başlamalı." };

  const normal = kotalariTemizle(g.kotalar, yon.sehirler, 1);
  if (normal.hata) return { hata: normal.hata };
  const super_ = kotalariTemizle(g.super_kotalar, yon.sehirler, 0);
  if (super_.hata) return { hata: super_.hata };
  for (const s of Object.keys(super_.temiz)) {
    if (!(s in normal.temiz))
      return {
        hata: `${s} için süper kotası verdiniz ama normal kota yok.`,
      };
  }

  const admin = createAdminClient();
  const { data: mevcut } = await admin
    .from("ajanslar")
    .select("kotalar")
    .eq("id", g.id)
    .maybeSingle();
  if (!mevcut) return { hata: "Ajans bulunamadı." };
  const mevcutKotalar = (mevcut.kotalar ?? {}) as Kotalar;
  for (const sehir of Object.keys(mevcutKotalar)) {
    if (!yon.sehirler.includes(sehir))
      return {
        hata: `Bu ajansın ${sehir} şehri sizin yetkiniz dışında — düzenleyemezsiniz.`,
      };
  }

  const guncelleme: Record<string, unknown> = {
    firma_adi: g.firma_adi.trim(),
    kullanici_adi: g.kullanici_adi.trim(),
    iletisim_telefon: telefon,
    kotalar: normal.temiz,
    super_kotalar: super_.temiz,
  };
  if (g.yeni_sifre) {
    if (g.yeni_sifre.length < 6)
      return { hata: "Yeni şifre en az 6 karakter olmalıdır." };
    guncelleme.sifre_hash = await sifreHashle(g.yeni_sifre);
  }

  const { error } = await admin
    .from("ajanslar")
    .update(guncelleme)
    .eq("id", g.id);
  if (error) {
    if (error.code === "23505")
      return { hata: "Bu kullanıcı adı zaten kullanılıyor." };
    return { hata: error.message };
  }

  await kayitEkle(
    "ajans_guncelle",
    "yonetici",
    yon.ad,
    `"${g.firma_adi.trim()}" ajansı güncellendi.${g.yeni_sifre ? " (şifre sıfırlandı)" : ""}`,
  );
  revalidatePath("/admin");
  Object.keys(mevcutKotalar).forEach((s) => revalidatePath(`/${s}`));
  Object.keys(normal.temiz).forEach((s) => revalidatePath(`/${s}`));
  redirect("/admin");
}

/**
 * İlanı süper yap / normale çek. Yetki: ilanın şehrinde yöneticinin yetkili olması.
 * Süpere çıkarırken şehir limiti (SUPER_KART_SAYISI) kontrol edilir.
 */
export async function ilanSuperDegistir(
  id: string,
  yapSuper: boolean,
): Promise<AjansSonuc> {
  const yon = await mevcutYonetici();
  if (!yon) return { hata: "Bu işlem için yetkiniz yok." };
  const admin = createAdminClient();

  const { data: ilan } = await admin
    .from("ilanlar")
    .select("ad, sehir, ajans_id, super")
    .eq("id", id)
    .maybeSingle();
  if (!ilan) return { hata: "İlan bulunamadı." };
  if (!yon.sehirler.includes(ilan.sehir))
    return { hata: "Bu ilanın şehrine yetkiniz yok." };
  if (ilan.super === yapSuper) return;

  if (yapSuper) {
    const { count } = await admin
      .from("ilanlar")
      .select("id", { count: "exact", head: true })
      .eq("sehir", ilan.sehir)
      .eq("super", true)
      .eq("aktif", true);
    if ((count ?? 0) >= SUPER_KART_SAYISI) {
      return {
        hata: `${ilan.sehir} şehrinde süper kotası dolu (${SUPER_KART_SAYISI}). Önce başka bir süper ilanı normale çekin.`,
      };
    }
  }

  const { error } = await admin
    .from("ilanlar")
    .update({ super: yapSuper })
    .eq("id", id);
  if (error) return { hata: error.message };

  await kayitEkle(
    yapSuper ? "ilan_super" : "ilan_normal",
    "yonetici",
    yon.ad,
    `"${ilan.ad}" ilanı ${yapSuper ? "süpere yükseltildi" : "normale çekildi"} (${ilan.sehir}).`,
  );
  revalidatePath("/admin");
  revalidatePath(`/${ilan.sehir}`);
}

/**
 * Ajansı aktif/pasif yapar. Pasifte: tüm ilanları aktif=false → şehir
 * sayfalarında o satırlar gizlenir, UI'da "İlan Ver" kartlarına dönüşür.
 */
export async function ajansAktiflikDegistir(
  id: string,
  aktif: boolean,
): Promise<void> {
  const yon = await mevcutYonetici();
  if (!yon) return;
  const admin = createAdminClient();
  const { data: ajans } = await admin
    .from("ajanslar")
    .select("firma_adi, kotalar")
    .eq("id", id)
    .maybeSingle();
  if (!ajans) return;
  const kotalar = (ajans.kotalar ?? {}) as Kotalar;
  for (const sehir of Object.keys(kotalar)) {
    if (!yon.sehirler.includes(sehir)) return;
  }

  await admin.from("ajanslar").update({ silindi: !aktif }).eq("id", id);
  await admin.from("ilanlar").update({ aktif }).eq("ajans_id", id);

  await kayitEkle(
    aktif ? "ajans_aktif" : "ajans_pasif",
    "yonetici",
    yon.ad,
    `Ajans ${aktif ? "aktif edildi" : "pasife alındı"}: ${ajans.firma_adi}.`,
  );
  revalidatePath("/admin");
  Object.keys(kotalar).forEach((s) => revalidatePath(`/${s}`));
}
