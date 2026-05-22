import Link from "next/link";
import { redirect } from "next/navigation";
import { mevcutPlatform } from "@/lib/oturum";
import { createAdminClient, secretVar } from "@/lib/supabase/admin";
import { sehirleriGetir } from "@/lib/sehirler";
import { sehirIlanIstatistik } from "@/lib/queries";
import type { Ajans, Yonetici } from "@/lib/types";
import { AktiflikButonu } from "./AktiflikButonu";

/** Ajans satırı yöneticisiyle JOIN. */
type AjansSatir = Ajans & { yonetici: { ad: string } | null };

type Filtre = "aktif" | "pasif";

const rozetPasif =
  "rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300";
const rozetAktif =
  "rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300";

function tarih(t: string): string {
  return new Date(t).toLocaleDateString("tr-TR");
}

function filtreOku(v: string | string[] | undefined): Filtre {
  return v === "pasif" ? "pasif" : "aktif";
}

export default async function PlatformAnasayfa({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await mevcutPlatform();
  if (!p) redirect("/giris");

  if (!secretVar()) {
    return (
      <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-6 text-sm text-amber-200">
        <p className="font-bold">Kurulum eksik</p>
        <p className="mt-1">
          Yönetim için <code>.env.local</code> dosyasına{" "}
          <code>SUPABASE_SECRET_KEY</code> eklenmeli.
        </p>
      </div>
    );
  }

  const sp = await searchParams;
  const yF = filtreOku(sp.y);
  const aF = filtreOku(sp.a);

  // Tüm şehirler için slot istatistikleri.
  const sehirler = await sehirleriGetir();
  const adAl = (slug: string) =>
    sehirler.find((x) => x.slug === slug)?.ad ?? slug;
  const sehirIstat = await Promise.all(
    sehirler.map(async (s) => ({
      slug: s.slug,
      ad: s.ad,
      ...(await sehirIlanIstatistik(s.slug)),
    })),
  );

  // Yöneticiler + ajanslar paralel — tüm satırlar (aktif + pasif).
  const admin = createAdminClient();
  const [yRes, aRes] = await Promise.all([
    admin
      .from("yoneticiler")
      .select(
        "id, ad, kullanici_adi, sehirler, iletisim_telefon, silindi, created_at",
      )
      .order("created_at", { ascending: true }),
    admin
      .from("ajanslar")
      .select(
        "id, firma_adi, kullanici_adi, kotalar, super_kotalar, iletisim_telefon, silindi, created_at, yonetici_id, yonetici:yoneticiler(ad)",
      )
      .order("created_at", { ascending: false }),
  ]);

  const yoneticiler = (yRes.data ?? []) as Yonetici[];
  const ajanslar = (aRes.data ?? []) as unknown as AjansSatir[];

  const ySay = { aktif: 0, pasif: 0 };
  yoneticiler.forEach((y) => (y.silindi ? ySay.pasif++ : ySay.aktif++));
  const aSay = { aktif: 0, pasif: 0 };
  ajanslar.forEach((a) => (a.silindi ? aSay.pasif++ : aSay.aktif++));

  const yGor = yoneticiler.filter((y) =>
    yF === "aktif" ? !y.silindi : y.silindi,
  );
  const aGor = ajanslar.filter((a) =>
    aF === "aktif" ? !a.silindi : a.silindi,
  );

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* ----- Şehir bazlı slot durumu (tek sıra kompakt çip) ----- */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-base font-bold sm:text-lg">Şehir İlan Durumu</h2>
          <Link
            href="/platform/ilanlar"
            className="text-xs text-muted hover:text-accent"
          >
            Tümünü gör →
          </Link>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sehirIstat.map((s) => (
            <Link
              key={s.slug}
              href={`/platform/ilanlar/${s.slug}`}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs hover:border-accent"
            >
              <span className="font-semibold">{s.ad}</span>
              <span className="text-emerald-300">{s.kiralanan}</span>
              <span className="text-muted">/{s.toplam}</span>
              <span className="text-amber-300">· {s.bos} boş</span>
              <span className="text-muted">·</span>
              <span className="text-amber-300">★ {s.superKiralanan}/{s.superToplam}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ----- Süper Yöneticiler ----- */}
      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-black sm:text-xl">
              Süper Yöneticiler
            </h2>
            <p className="text-[11px] text-muted sm:text-xs">
              Toplam {yoneticiler.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Sekmeler param="y" mevcut={yF} sp={sp} sayilar={ySay} />
            <Link
              href="/platform/yonetici/yeni"
              className="rounded-lg bg-accent px-2.5 py-1.5 text-xs font-semibold text-background hover:bg-accent-strong sm:px-3 sm:py-2 sm:text-sm"
            >
              + Yeni
            </Link>
          </div>
        </div>
        {yGor.length === 0 ? (
          <BosKutu>
            {yF === "aktif" ? "Aktif" : "Pasif"} süper yönetici yok.
          </BosKutu>
        ) : (
          <ul className="space-y-2">
            {yGor.map((y) => {
              const aktif = !y.silindi;
              return (
                <li
                  key={y.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface p-3 sm:p-4 ${
                    aktif ? "" : "opacity-60"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold sm:text-base">
                        {y.ad}
                      </p>
                      <span className={aktif ? rozetAktif : rozetPasif}>
                        {aktif ? "aktif" : "pasif"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted sm:text-sm">
                      kullanıcı:{" "}
                      <span className="font-mono text-foreground">
                        {y.kullanici_adi}
                      </span>{" "}
                      · şehir:{" "}
                      {y.sehirler.map((s) => adAl(s)).join(", ") ||
                        "atanmamış"}{" "}
                      · {tarih(y.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AktiflikButonu
                      tip="yonetici"
                      id={y.id}
                      aktif={aktif}
                      ad={y.ad}
                    />
                    <Link
                      href={`/platform/yonetici/${y.id}`}
                      className="rounded-lg border border-border px-2.5 py-1 text-xs hover:border-accent sm:px-3 sm:py-1.5 sm:text-sm"
                    >
                      Düzenle
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ----- Ajanslar ----- */}
      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-black sm:text-xl">Ajanslar</h2>
            <p className="text-[11px] text-muted sm:text-xs">
              Toplam {ajanslar.length}
            </p>
          </div>
          <Sekmeler param="a" mevcut={aF} sp={sp} sayilar={aSay} />
        </div>
        {aGor.length === 0 ? (
          <BosKutu>{aF === "aktif" ? "Aktif" : "Pasif"} ajans yok.</BosKutu>
        ) : (
          <ul className="space-y-2">
            {aGor.map((a) => {
              const aktif = !a.silindi;
              return (
                <li
                  key={a.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface p-3 sm:p-4 ${
                    aktif ? "" : "opacity-60"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold sm:text-base">
                        {a.firma_adi}
                      </p>
                      <span className={aktif ? rozetAktif : rozetPasif}>
                        {aktif ? "aktif" : "pasif"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted sm:text-sm">
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
                      </span>{" "}
                      · yönetici: {a.yonetici?.ad ?? "—"} ·{" "}
                      {tarih(a.created_at)}
                    </p>
                  </div>
                  <AktiflikButonu
                    tip="ajans"
                    id={a.id}
                    aktif={aktif}
                    ad={a.firma_adi}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

/** Bölüm filtresi için aktif/pasif sekme çubuğu. */
function Sekmeler({
  param,
  mevcut,
  sp,
  sayilar,
}: {
  param: "y" | "a";
  mevcut: Filtre;
  sp: Record<string, string | string[] | undefined>;
  sayilar: { aktif: number; pasif: number };
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-xs sm:text-sm">
      {(["aktif", "pasif"] as const).map((f) => {
        const aktif = mevcut === f;
        const q = new URLSearchParams();
        for (const [k, v] of Object.entries(sp)) {
          if (typeof v === "string") q.set(k, v);
        }
        q.set(param, f);
        return (
          <Link
            key={f}
            href={`?${q.toString()}`}
            scroll={false}
            className={`rounded-md px-2 py-1 sm:px-3 sm:py-1.5 ${
              aktif
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

function BosKutu({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted sm:p-8 sm:text-sm">
      {children}
    </div>
  );
}
