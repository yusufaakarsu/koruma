import { notFound, redirect } from "next/navigation";
import { mevcutPlatform } from "@/lib/oturum";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sehirBul,
  SEHIR_SLOT_SAYISI,
  SUPER_KART_SAYISI,
} from "@/lib/sehirler";
import { GeriLink } from "@/components/GeriLink";

type Satir = {
  id: string;
  ad: string;
  ajans_id: string;
  aktif: boolean;
  super: boolean;
  whatsapp: string;
  aciklama: string | null;
  goruntuleme_sayisi: number;
  whatsapp_tiklama: number;
  created_at: string;
  ajans: { firma_adi: string } | null;
};

const rozetBos =
  "rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300";
const rozetAktif =
  "rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300";
const rozetPasif =
  "rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-300";

export default async function SehirIlanlariSayfasi({
  params,
}: {
  params: Promise<{ sehir: string }>;
}) {
  const p = await mevcutPlatform();
  if (!p) redirect("/giris");

  const { sehir } = await params;
  const s = await sehirBul(sehir);
  if (!s) notFound();

  const admin = createAdminClient();
  const { data } = await admin
    .from("ilanlar")
    .select(
      "id, ad, ajans_id, aktif, super, whatsapp, aciklama, goruntuleme_sayisi, whatsapp_tiklama, created_at, ajans:ajanslar(firma_adi)",
    )
    .eq("sehir", s.slug)
    .order("super", { ascending: false })
    .order("created_at", { ascending: true });
  const ilanlar = (data ?? []) as unknown as Satir[];

  const kiralananAktif = ilanlar.filter((i) => i.aktif).length;
  const superKiralanan = ilanlar.filter((i) => i.aktif && i.super).length;
  const bosSayisi = Math.max(0, SEHIR_SLOT_SAYISI - kiralananAktif);
  const superBos = Math.max(0, SUPER_KART_SAYISI - superKiralanan);

  return (
    <div>
      <div className="mb-4">
        <GeriLink href="/platform/ilanlar">Şehirler</GeriLink>
        <h1 className="mt-3 text-lg font-black sm:text-xl">{s.ad} İlanları</h1>
        <p className="text-[11px] text-muted sm:text-xs">
          Toplam {SEHIR_SLOT_SAYISI} ·{" "}
          <span className="text-emerald-300">{kiralananAktif}</span> kiralandı ·{" "}
          <span className="text-amber-300">{bosSayisi}</span> boş ·{" "}
          <span className="text-amber-300">
            ★ {superKiralanan}/{SUPER_KART_SAYISI}
          </span>{" "}
          süper ({superBos} kaldı)
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <ul className="divide-y divide-border">
          {ilanlar.map((i, idx) => (
            <li
              key={i.id}
              className={`flex items-center gap-3 px-3 py-2 text-xs sm:px-4 sm:text-sm ${
                i.aktif ? "" : "opacity-60"
              }`}
            >
              <span className="w-6 shrink-0 text-right font-mono text-[10px] text-muted">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate font-semibold">{i.ad}</span>
                  {i.super && (
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                      ★ Süper
                    </span>
                  )}
                  {i.aktif ? (
                    <span className={rozetAktif}>aktif</span>
                  ) : (
                    <span className={rozetPasif}>pasif</span>
                  )}
                </div>
                <p className="truncate text-[10px] text-muted sm:text-xs">
                  {i.ajans?.firma_adi ?? "—"} · {i.whatsapp}
                </p>
              </div>
              <div className="shrink-0 text-right text-[10px] text-muted sm:text-xs">
                <span>{i.goruntuleme_sayisi} gör.</span>
                <span className="ml-2 text-whatsapp">
                  {i.whatsapp_tiklama} wa
                </span>
              </div>
            </li>
          ))}
          {Array.from({ length: bosSayisi }).map((_, i) => (
            <li
              key={`bos-${i}`}
              className="flex items-center gap-3 px-3 py-2 text-xs text-muted opacity-70 sm:px-4 sm:text-sm"
            >
              <span className="w-6 shrink-0 text-right font-mono text-[10px]">
                {ilanlar.length + i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold">Boş slot</span>
                  <span className={rozetBos}>boş</span>
                </div>
                <p className="text-[10px] sm:text-xs">
                  Kiralanmamış — UI'da "İlan Ver" kartı gösterir.
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
