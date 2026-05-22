"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { mevcutAjans } from "@/lib/oturum";
import { whatsappNormalize, whatsappGecerli } from "@/lib/format";
import { kayitEkle } from "@/lib/log";

const BUCKET = "ilan-fotograflari";

/** Ajansın ilanında değiştirebileceği alanlar: koruma adı, kısa açıklama, WhatsApp, fotoğraflar. */
export type IlanGirdi = {
  id: string;
  ad: string;
  aciklama: string;
  whatsapp: string;
  fotograflar: string[];
};
export type KayitSonuc = { hata: string } | undefined;

function tazele(sehir: string) {
  revalidatePath(`/${sehir}`);
  revalidatePath("/panel");
}

/** İlanı günceller — sadece numara ve fotoğraflar. Diğer alanlar admin'in sorumluluğunda. */
export async function ilanKaydet(girdi: IlanGirdi): Promise<KayitSonuc> {
  const ajans = await mevcutAjans();
  if (!ajans) return { hata: "Oturum bulunamadı. Tekrar giriş yapın." };
  if (!girdi.ad.trim()) return { hata: "Koruma adı zorunludur." };
  const yeniWhatsapp = whatsappNormalize(girdi.whatsapp);
  if (!whatsappGecerli(yeniWhatsapp))
    return { hata: "WhatsApp 10 hane olmalı ve 5 ile başlamalı." };

  const admin = createAdminClient();

  const { data: eski } = await admin
    .from("ilanlar")
    .select("whatsapp, ajans_id, sehir")
    .eq("id", girdi.id)
    .maybeSingle();
  if (!eski || eski.ajans_id !== ajans.id) {
    return { hata: "İlan bulunamadı." };
  }

  const { error } = await admin
    .from("ilanlar")
    .update({
      ad: girdi.ad.trim(),
      aciklama: girdi.aciklama.trim() || null,
      whatsapp: yeniWhatsapp,
      fotograflar: girdi.fotograflar,
    })
    .eq("id", girdi.id)
    .eq("ajans_id", ajans.id);
  if (error) return { hata: error.message };

  if (eski.whatsapp !== yeniWhatsapp) {
    await kayitEkle(
      "whatsapp_degisti",
      "ajans",
      ajans.firma_adi,
      `"${girdi.ad.trim()}" WhatsApp numarası: ${eski.whatsapp} → ${yeniWhatsapp}`,
    );
  } else {
    await kayitEkle(
      "ilan_guncelle",
      "ajans",
      ajans.firma_adi,
      `"${girdi.ad.trim()}" ilanı güncellendi.`,
    );
  }
  tazele(eski.sehir);
  redirect("/panel");
}

/** Fotoğraf(ları) yükler, public URL'lerini döndürür. */
export async function fotoYukle(
  fd: FormData,
): Promise<{ urller: string[] } | { hata: string }> {
  const ajans = await mevcutAjans();
  if (!ajans) return { hata: "Oturum bulunamadı." };
  const admin = createAdminClient();
  const dosyalar = fd
    .getAll("dosya")
    .filter((f): f is File => f instanceof File);

  const urller: string[] = [];
  for (const file of dosyalar) {
    const uzanti = (file.name.split(".").pop() ?? "jpg").toLowerCase();
    const yol = `${ajans.id}/${crypto.randomUUID()}.${uzanti}`;
    const { error } = await admin.storage.from(BUCKET).upload(yol, file, {
      cacheControl: "31536000",
      contentType: file.type || undefined,
    });
    if (error) return { hata: "Fotoğraf yüklenemedi: " + error.message };
    urller.push(admin.storage.from(BUCKET).getPublicUrl(yol).data.publicUrl);
  }
  return { urller };
}
