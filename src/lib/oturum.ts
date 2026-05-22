import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, secretVar } from "@/lib/supabase/admin";
import {
  OTURUM_COOKIE,
  oturumImzala,
  oturumCoz,
  type OturumPayload,
} from "@/lib/oturum-jwt";
import { platformSahibiMi } from "@/lib/platform";
import type { Ajans, Yonetici } from "@/lib/types";

const OTUZ_GUN = 60 * 60 * 24 * 30;

/** Custom oturum çerezini kurar (ajans / süper yönetici girişi sonrası). */
export async function oturumKur(p: OturumPayload): Promise<void> {
  const token = await oturumImzala(p);
  const c = await cookies();
  c.set(OTURUM_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OTUZ_GUN,
  });
}

/** Custom oturum çerezini siler. */
export async function oturumKapat(): Promise<void> {
  const c = await cookies();
  c.delete(OTURUM_COOKIE);
}

async function oturumOku(): Promise<OturumPayload | null> {
  const c = await cookies();
  return oturumCoz(c.get(OTURUM_COOKIE)?.value);
}

/** Giriş yapmış ajansın kaydını döndürür (panel tarafı). */
export async function mevcutAjans(): Promise<Ajans | null> {
  const o = await oturumOku();
  if (o?.tip !== "ajans" || !secretVar()) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("ajanslar")
    .select("*")
    .eq("id", o.id)
    .eq("silindi", false)
    .maybeSingle();
  return (data as Ajans) ?? null;
}

/** Giriş yapmış süper yöneticinin kaydını döndürür (admin tarafı). */
export async function mevcutYonetici(): Promise<Yonetici | null> {
  const o = await oturumOku();
  if (o?.tip !== "yonetici" || !secretVar()) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("yoneticiler")
    .select("*")
    .eq("id", o.id)
    .eq("silindi", false)
    .maybeSingle();
  return (data as Yonetici) ?? null;
}

/** Giriş yapmış platform sahibini döndürür (Supabase Auth). */
export async function mevcutPlatform(): Promise<{ email: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email && platformSahibiMi(user.email)) {
    return { email: user.email };
  }
  return null;
}
