import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { mevcutAjans } from "@/lib/oturum";
import { ajansIlanlari } from "@/lib/queries";
import { sehirleriGetir } from "@/lib/sehirler";
import type { Ilan } from "@/lib/types";

export default async function PanelAnasayfa() {
  const ajans = await mevcutAjans();
  if (!ajans) redirect("/giris");

  const ilanlar = await ajansIlanlari(ajans.id);
  const sehirler = await sehirleriGetir();
  const adAl = (slug: string) =>
    sehirler.find((x) => x.slug === slug)?.ad ?? slug;
  const toplamNormal = Object.values(ajans.kotalar).reduce(
    (t, n) => t + n,
    0,
  );
  const toplamSuper = Object.values(ajans.super_kotalar ?? {}).reduce(
    (t, n) => t + n,
    0,
  );
  const toplamKota = toplamNormal + toplamSuper;
  const toplamGoruntuleme = ilanlar.reduce(
    (t, i) => t + i.goruntuleme_sayisi,
    0,
  );
  const toplamWhatsapp = ilanlar.reduce((t, i) => t + i.whatsapp_tiklama, 0);

  // Şehir bazında grupla — sıralama ajansın kotalar sırasını korur.
  const sehirSirasi = Object.keys(ajans.kotalar);
  const gruplar = new Map<string, Ilan[]>();
  sehirSirasi.forEach((s) => gruplar.set(s, []));
  for (const i of ilanlar) {
    if (!gruplar.has(i.sehir)) gruplar.set(i.sehir, []);
    gruplar.get(i.sehir)!.push(i);
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black">İlanlarım</h1>
        <p className="text-sm text-muted">
          {sehirSirasi.length} şehir · {ilanlar.length} / {toplamKota} ilan
        </p>
      </div>

      {/* Özet istatistik */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-muted">Toplam görüntülenme</p>
          <p className="text-2xl font-black">{toplamGoruntuleme}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-muted">Toplam WhatsApp tıklama</p>
          <p className="text-2xl font-black text-whatsapp">{toplamWhatsapp}</p>
        </div>
      </div>

      {ilanlar.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted">
          Henüz ilanınız yok. Yönetici ile görüşün.
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(gruplar.entries()).map(([sehir, grup]) => {
            if (grup.length === 0) return null;
            const normalKota = ajans.kotalar[sehir] ?? 0;
            const superKota = ajans.super_kotalar?.[sehir] ?? 0;
            const kota = normalKota + superKota || grup.length;
            return (
              <section key={sehir}>
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
                  <h2 className="text-lg font-bold">
                    {adAl(sehir)}
                    {superKota > 0 && (
                      <span className="ml-2 text-xs font-semibold text-amber-300">
                        +{superKota}★ süper
                      </span>
                    )}
                  </h2>
                  <span className="text-xs text-muted">
                    {grup.length} / {kota} ilan
                  </span>
                </div>
                <ul className="grid grid-cols-2 gap-2">
                  {grup.map((ilan) => (
                    <li
                      key={ilan.id}
                      className={`flex items-center gap-2 rounded-lg border bg-surface p-2 ${
                        ilan.super
                          ? "border-amber-400/60 ring-1 ring-amber-400/30"
                          : "border-border"
                      }`}
                    >
                      <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-surface-2">
                        {ilan.fotograflar[0] && (
                          <Image
                            src={ilan.fotograflar[0]}
                            alt={ilan.ad ?? "Koruma"}
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        )}
                        {ilan.super && (
                          <span className="absolute left-0.5 top-0.5 rounded bg-amber-400 px-1 text-[9px] font-black leading-none text-background">
                            ★
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-semibold sm:text-sm">
                            {ilan.ad}
                          </p>
                          {ilan.super && (
                            <span className="rounded bg-amber-500/20 px-1 py-0.5 text-[9px] font-bold text-amber-300">
                              SÜPER
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted">
                          <span
                            className={
                              ilan.aktif ? "text-green-300" : "text-amber-300"
                            }
                          >
                            {ilan.aktif ? "Yayında" : "Pasif"}
                          </span>{" "}
                          · {ilan.goruntuleme_sayisi} gör ·{" "}
                          <span className="text-whatsapp">
                            {ilan.whatsapp_tiklama} wa
                          </span>
                        </p>
                      </div>

                      <Link
                        href={`/panel/ilan/${ilan.id}`}
                        className="shrink-0 rounded-md border border-border px-2 py-1 text-[10px] hover:border-accent sm:text-xs"
                      >
                        Düzenle
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
