"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, secretVar } from "@/lib/supabase/admin";
import { oturumKur, oturumKapat } from "@/lib/oturum";
import { sifreDogrula } from "@/lib/sifre";
import { kayitEkle } from "@/lib/log";
import { platformSahibiMi } from "@/lib/platform";

export type GirisDurum =
  | { hata: string }
  | { ok: true; hedef: string }
  | undefined;

/** Platform sahibi girişi (Supabase Auth, e-posta + şifre). */
export async function platformGiris(
  _prev: GirisDurum,
  fd: FormData,
): Promise<GirisDurum> {
  const email = String(fd.get("email") ?? "").trim();
  const sifre = String(fd.get("sifre") ?? "");

  if (!platformSahibiMi(email)) {
    return { hata: "Bu hesabın platform yetkisi yok." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: sifre,
  });
  if (error) return { hata: "E-posta veya şifre hatalı." };

  await kayitEkle("giris", "platform", email, `Platform girişi: ${email}`);
  // redirect() KULLANMA: server action redirect'i hedef sayfayı action
  // yanıtına gömer ve o render az önce set edilen oturum çerezini görmez —
  // korumalı layout kullanıcıyı login'e geri atar. Bunun yerine başarı
  // dönüp istemci tam sayfa yüklemesiyle yönleniyor (bkz. GirisFormu).
  return { ok: true, hedef: "/platform" };
}

/** Süper yönetici girişi (custom — kullanıcı adı + şifre). */
export async function yoneticiGiris(
  _prev: GirisDurum,
  fd: FormData,
): Promise<GirisDurum> {
  if (!secretVar()) return { hata: "Sunucu kurulumu eksik." };
  const kullanici = String(fd.get("kullanici_adi") ?? "").trim();
  const sifre = String(fd.get("sifre") ?? "");

  const admin = createAdminClient();
  const { data } = await admin
    .from("yoneticiler")
    .select("id, ad, sifre_hash")
    .eq("kullanici_adi", kullanici)
    .eq("silindi", false)
    .maybeSingle();
  if (!data || !(await sifreDogrula(sifre, data.sifre_hash))) {
    return { hata: "Kullanıcı adı veya şifre hatalı." };
  }

  await oturumKur({ tip: "yonetici", id: data.id });
  await kayitEkle("giris", "yonetici", data.ad, `Süper yönetici girişi: ${data.ad}`);
  return { ok: true, hedef: "/admin" };
}

/** Ajans girişi (custom — kullanıcı adı + şifre). */
export async function ajansGiris(
  _prev: GirisDurum,
  fd: FormData,
): Promise<GirisDurum> {
  if (!secretVar()) return { hata: "Sunucu kurulumu eksik." };
  const kullanici = String(fd.get("kullanici_adi") ?? "").trim();
  const sifre = String(fd.get("sifre") ?? "");

  const admin = createAdminClient();
  const { data } = await admin
    .from("ajanslar")
    .select("id, firma_adi, sifre_hash")
    .eq("kullanici_adi", kullanici)
    .eq("silindi", false)
    .maybeSingle();
  if (!data || !(await sifreDogrula(sifre, data.sifre_hash))) {
    return { hata: "Kullanıcı adı veya şifre hatalı." };
  }

  await oturumKur({ tip: "ajans", id: data.id });
  await kayitEkle("giris", "ajans", data.firma_adi, `Ajans girişi: ${data.firma_adi}`);
  return { ok: true, hedef: "/panel" };
}

/** Oturumu kapatır (hem custom çerez hem Supabase). */
export async function cikisYap(): Promise<void> {
  await oturumKapat();
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // yoksay
  }
  // Çıkışta da aynı sebep: önbellekteki oturumlu içerik gösterilmesin.
  revalidatePath("/", "layout");
  redirect("/giris");
}
