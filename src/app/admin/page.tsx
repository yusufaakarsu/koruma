import Link from "next/link";
import { redirect } from "next/navigation";
import { mevcutYonetici } from "@/lib/oturum";
import { createAdminClient } from "@/lib/supabase/admin";
import { sehirleriGetir } from "@/lib/sehirler";
import { sehirIlanIstatistik } from "@/lib/queries";
import type { Ajans } from "@/lib/types";
import { AjansAktiflikButonu } from "./AjansAktiflikButonu";

type Stat = { adet: number; goruntuleme: number; whatsapp: number };
type Filtre = "aktif" | "pasif";

const rozetPasif =
  "rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-300";
const rozetAktif =
  "rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300";

export default async function AdminAnasayfa({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const yon = await mevcutYonetici();
  if (!yon) redirect("/giris");

  const sp = await searchParams;
  const filtre: Filtre = sp.f === "pasif" ? "pasif" : "aktif";

  const admin = createAdminClient();
  // Tüm ajansları çek, JS tarafında "kotalar anahtarlarından biri yöneticinin
  // yetkili şehirlerinde mi" diye filtrele (jsonb operatörü yerine basit yol).
  const { data: ajanslarData } = await admin
    .from("ajanslar")
    .select("*")
    .order("created_at", { ascending: true });
  const ajanslar = ((ajanslarData ?? []) as Ajans[]).filter((a) =>
    Object.keys(a.kotalar ?? {}).some((s) => yon.sehirler.includes(s)),
  );

  const { data: ilanlar } = await admin
    .from("ilanlar")
    .select("ajans_id, goruntuleme_sayisi, whatsapp_tiklama")
    .in(
      "ajans_id",
      ajanslar.map((a) => a.id),
    );

  const stat = new Map<string, Stat>();
  (ilanlar ?? []).forEach((i) => {
    const s = stat.get(i.ajans_id) ?? { adet: 0, goruntuleme: 0, whatsapp: 0 };
    s.adet += 1;
    s.goruntuleme += i.goruntuleme_sayisi;
    s.whatsapp += i.whatsapp_tiklama;
    stat.set(i.ajans_id, s);
  });

  const tumSehirler = await sehirleriGetir();
  const adAl = (slug: string) =>
    tumSehirler.find((x) => x.slug === slug)?.ad ?? slug;

  const sehirAdlari = yon.sehirler.map((s) => adAl(s)).join(", ");

  // Yöneticinin her şehri için slot istatistikleri (toplam / kiralanan / kalan).
  const sehirIstat = await Promise.all(
    yon.sehirler.map(async (slug) => ({
      slug,
      ad: adAl(slug),
      ...(await sehirIlanIstatistik(slug)),
    })),
  );

  const aktifSayi = ajanslar.filter((a) => !a.silindi).length;
  const pasifSayi = ajanslar.length - aktifSayi;
  const gorunenler = ajanslar.filter((a) =>
    filtre === "aktif" ? !a.silindi : a.silindi,
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Ajanslar</h1>
          <p className="text-sm text-muted">
            Yetkili olduğun şehirler: {sehirAdlari || "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Sekmeler aktif={filtre} sayilar={{ aktif: aktifSayi, pasif: pasifSayi }} />
          <Link
            href="/admin/ajans/yeni"
            className="rounded-lg bg-accent px-4 py-2.5 font-semibold text-background hover:bg-accent-strong"
          >
            + Yeni
          </Link>
        </div>
      </div>

      {/* Şehir bazlı slot durumu (tek sıra kompakt çip) */}
      {sehirIstat.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {sehirIstat.map((s) => (
            <div
              key={s.slug}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs"
            >
              <span className="font-semibold">{s.ad}</span>
              <span className="text-emerald-300">{s.kiralanan}</span>
              <span className="text-muted">/ {s.toplam}</span>
              <span className="text-muted">·</span>
              <span className="text-amber-300">{s.bos} kaldı</span>
              <span className="text-muted">·</span>
              <span className="text-amber-300">★ {s.superKiralanan}</span>
              <span className="text-muted">/ {s.superToplam}</span>
            </div>
          ))}
        </div>
      )}

      {gorunenler.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted">
          {filtre === "aktif"
            ? 'Aktif ajans yok. "+ Yeni" ile firma oluşturun.'
            : "Pasif ajans yok."}
        </div>
      ) : (
        <ul className="space-y-2">
          {gorunenler.map((a) => {
            const s = stat.get(a.id) ?? {
              adet: 0,
              goruntuleme: 0,
              whatsapp: 0,
            };
            const aktif = !a.silindi;
            const toplamNormal = Object.values(a.kotalar).reduce(
              (t, n) => t + n,
              0,
            );
            const toplamSuper = Object.values(a.super_kotalar ?? {}).reduce(
              (t, n) => t + n,
              0,
            );
            const toplamKota = toplamNormal + toplamSuper;
            return (
              <li
                key={a.id}
                className={`rounded-xl border border-border bg-surface p-3 ${aktif ? "" : "opacity-60"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-semibold sm:text-base">
                        {a.firma_adi}
                      </p>
                      <span className={aktif ? rozetAktif : rozetPasif}>
                        {aktif ? "aktif" : "pasif"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {Object.entries(a.kotalar)
                        .map(([s, n]) => {
                          const sk = a.super_kotalar?.[s] ?? 0;
                          const ad = adAl(s);
                          return sk > 0 ? `${ad}:${n}+${sk}★` : `${ad}:${n}`;
                        })
                        .join(", ") || "şehir atanmamış"}{" "}
                      · kullanıcı:{" "}
                      <span className="font-mono text-foreground">
                        {a.kullanici_adi}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AjansAktiflikButonu
                      id={a.id}
                      aktif={aktif}
                      ad={a.firma_adi}
                    />
                    <Link
                      href={`/admin/ajans/${a.id}`}
                      className="rounded-lg border border-border px-2.5 py-1 text-xs hover:border-accent sm:text-sm"
                    >
                      Düzenle
                    </Link>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                  <span>
                    <span className="text-muted">İlan: </span>
                    <span className="font-semibold">
                      {s.adet} / {toplamKota}
                    </span>
                  </span>
                  <span>
                    <span className="text-muted">Görüntülenme: </span>
                    <span className="font-semibold">{s.goruntuleme}</span>
                  </span>
                  <span>
                    <span className="text-muted">WhatsApp: </span>
                    <span className="font-semibold text-whatsapp">
                      {s.whatsapp}
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/** Aktif/Pasif sekme çubuğu. */
function Sekmeler({
  aktif,
  sayilar,
}: {
  aktif: Filtre;
  sayilar: { aktif: number; pasif: number };
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-sm">
      {(["aktif", "pasif"] as const).map((f) => {
        const secili = aktif === f;
        return (
          <Link
            key={f}
            href={`?f=${f}`}
            scroll={false}
            className={`rounded-md px-3 py-1.5 ${
              secili
                ? "bg-surface-2 font-semibold"
                : "text-muted hover:text-foreground"
            }`}
          >
            {f === "aktif" ? "Aktif" : "Pasif"} ({sayilar[f]})
          </Link>
        );
      })}
    </div>
  );
}
