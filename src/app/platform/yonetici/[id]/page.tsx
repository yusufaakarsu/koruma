import { notFound, redirect } from "next/navigation";
import { mevcutPlatform } from "@/lib/oturum";
import { createAdminClient } from "@/lib/supabase/admin";
import { sehirleriGetir } from "@/lib/sehirler";
import { PlatformYoneticiFormu } from "@/components/PlatformYoneticiFormu";
import { GeriLink } from "@/components/GeriLink";
import { YoneticiSilButonu } from "../../YoneticiSilButonu";
import type { YoneticiGuvenli } from "@/lib/types";

export default async function YoneticiDuzenleSayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await mevcutPlatform();
  if (!p) redirect("/giris");

  const admin = createAdminClient();
  const { data } = await admin
    .from("yoneticiler")
    .select("id, ad, kullanici_adi, sehirler, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const yonetici = data as YoneticiGuvenli;
  const sehirler = await sehirleriGetir();

  return (
    <>
      <div className="mb-6">
        <GeriLink href="/platform">Yöneticiler</GeriLink>
        <h1 className="mt-3 text-2xl font-black">{yonetici.ad}</h1>
      </div>

      <PlatformYoneticiFormu yonetici={yonetici} sehirler={sehirler} />

      <div className="mt-10 border-t border-border pt-6">
        <h2 className="mb-3 font-bold text-red-300">Tehlikeli Bölge</h2>
        <YoneticiSilButonu id={yonetici.id} />
      </div>
    </>
  );
}
