import { redirect } from "next/navigation";
import { mevcutPlatform } from "@/lib/oturum";
import { sehirleriGetir } from "@/lib/sehirler";
import { PlatformYoneticiFormu } from "@/components/PlatformYoneticiFormu";
import { GeriLink } from "@/components/GeriLink";

export default async function YeniYoneticiSayfasi() {
  const p = await mevcutPlatform();
  if (!p) redirect("/giris");

  const sehirler = await sehirleriGetir();

  return (
    <>
      <div className="mb-6">
        <GeriLink href="/platform">Yöneticiler</GeriLink>
        <h1 className="mt-3 text-2xl font-black">Yeni Süper Yönetici</h1>
      </div>
      <PlatformYoneticiFormu sehirler={sehirler} />
    </>
  );
}
