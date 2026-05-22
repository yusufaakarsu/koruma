import { redirect } from "next/navigation";
import { mevcutPlatform } from "@/lib/oturum";
import { sehirleriGetir } from "@/lib/sehirler";
import { SehirYonet } from "./SehirYonet";

export default async function SehirlerSayfasi() {
  const p = await mevcutPlatform();
  if (!p) redirect("/giris");
  const sehirler = await sehirleriGetir();

  return (
    <div>
      <h1 className="mb-1 text-lg font-black sm:text-xl">Şehirler</h1>
      <p className="mb-4 text-xs text-muted sm:text-sm">
        Her şehir bir alt alana karşılık gelir:{" "}
        <code>&lt;slug&gt;.istanbulkoruma.com</code>. Slug değiştirilemez —
        yanlış yazarsanız silip yeniden ekleyin. Yalnızca hiçbir yöneticide,
        ajansta ve ilanda kullanılmayan şehirler silinebilir.
      </p>
      <SehirYonet sehirler={sehirler} />
    </div>
  );
}
