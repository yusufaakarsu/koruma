import Link from "next/link";
import { redirect } from "next/navigation";
import { mevcutPlatform } from "@/lib/oturum";
import { sehirleriGetir } from "@/lib/sehirler";
import { sehirIlanIstatistik } from "@/lib/queries";

export default async function IlanlarSecimSayfasi() {
  const p = await mevcutPlatform();
  if (!p) redirect("/giris");

  const sehirler = await sehirleriGetir();
  const sehirIstat = await Promise.all(
    sehirler.map(async (s) => ({
      slug: s.slug,
      ad: s.ad,
      ...(await sehirIlanIstatistik(s.slug)),
    })),
  );

  return (
    <div>
      <h1 className="mb-1 text-lg font-black sm:text-xl">İlanlar</h1>
      <p className="mb-4 text-xs text-muted sm:text-sm">
        Şehir seçin — sabit 100 ilan slot'u listelenir.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sehirIstat.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/platform/ilanlar/${s.slug}`}
              className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 hover:border-accent"
            >
              <span className="font-semibold">{s.ad}</span>
              <span className="text-xs text-muted">
                <span className="text-emerald-300">{s.kiralanan}</span>
                <span> / {s.toplam}</span>
                <span className="ml-1 text-amber-300">· {s.bos} boş</span>
                <span className="ml-1 text-amber-300">
                  · ★ {s.superKiralanan}/{s.superToplam}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
