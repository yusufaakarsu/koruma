import { redirect } from "next/navigation";
import { mevcutYonetici } from "@/lib/oturum";
import { sehirleriGetir } from "@/lib/sehirler";
import { YoneticiAjansFormu } from "@/components/YoneticiAjansFormu";
import { GeriLink } from "@/components/GeriLink";

export default async function YeniAjansSayfasi() {
  const yon = await mevcutYonetici();
  if (!yon) redirect("/giris");

  const tumSehirler = await sehirleriGetir();
  const izinli = tumSehirler.filter((s) => yon.sehirler.includes(s.slug));

  return (
    <>
      <div className="mb-6">
        <GeriLink href="/admin">Ajanslar</GeriLink>
        <h1 className="mt-3 text-2xl font-black">Yeni Ajans</h1>
        <p className="text-sm text-muted">
          Firmaya kullanıcı adı + şifre, şehir ve ilan kotası verin.
        </p>
      </div>
      <YoneticiAjansFormu izinliSehirler={izinli} />
    </>
  );
}
