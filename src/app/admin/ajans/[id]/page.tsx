import { notFound, redirect } from "next/navigation";
import { mevcutYonetici } from "@/lib/oturum";
import { createAdminClient } from "@/lib/supabase/admin";
import { sehirleriGetir } from "@/lib/sehirler";
import { YoneticiAjansFormu } from "@/components/YoneticiAjansFormu";
import { GeriLink } from "@/components/GeriLink";
import { AjansAktiflikButonu } from "../../AjansAktiflikButonu";
import { IlanSuperButonu } from "../../IlanSuperButonu";
import type { AjansGuvenli, Ilan } from "@/lib/types";

const GUVENLI_ALANLAR =
  "id, yonetici_id, firma_adi, kullanici_adi, iletisim_telefon, kotalar, super_kotalar, created_at";

export default async function AjansDuzenleSayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const yon = await mevcutYonetici();
  if (!yon) redirect("/giris");

  const admin = createAdminClient();
  const { data } = await admin
    .from("ajanslar")
    .select(`${GUVENLI_ALANLAR}, silindi`)
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const ajans = data as AjansGuvenli & { silindi: boolean };
  // Yetki: ajansın kotalar'daki TÜM şehirlerinde yönetici yetkili olmalı.
  const ajansSehirleri = Object.keys(ajans.kotalar ?? {});
  const yetkili = ajansSehirleri.every((s) => yon.sehirler.includes(s));
  if (!yetkili) notFound();

  const { data: ilanlarData } = await admin
    .from("ilanlar")
    .select("*")
    .eq("ajans_id", id)
    .order("created_at", { ascending: false });
  const ilanlar = (ilanlarData ?? []) as Ilan[];
  const aktif = !ajans.silindi;

  const tumSehirler = await sehirleriGetir();
  const izinli = tumSehirler.filter((s) => yon.sehirler.includes(s.slug));
  const adAl = (slug: string) =>
    tumSehirler.find((x) => x.slug === slug)?.ad ?? slug;

  return (
    <>
      <div className="mb-6">
        <GeriLink href="/admin">Ajanslar</GeriLink>
        <h1 className="mt-3 text-2xl font-black">{ajans.firma_adi}</h1>
        <p className="text-sm text-muted">
          Giriş kullanıcı adı:{" "}
          <span className="font-mono text-foreground">
            {ajans.kullanici_adi}
          </span>
        </p>
      </div>

      <YoneticiAjansFormu ajans={ajans} izinliSehirler={izinli} />

      {/* İlan istatistikleri */}
      <section className="mt-8">
        <h2 className="mb-3 font-bold">
          İlan İstatistikleri ({ilanlar.length})
        </h2>
        {ilanlar.length === 0 ? (
          <p className="text-sm text-muted">Bu ajansın henüz ilanı yok.</p>
        ) : (
          <ul className="space-y-2">
            {ilanlar.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{i.ad}</span>
                  <span className="ml-2 text-xs text-muted">
                    {adAl(i.sehir)}
                  </span>
                  {!i.aktif && (
                    <span className="ml-2 text-xs text-muted">
                      (yayında değil)
                    </span>
                  )}
                  <div className="mt-0.5 text-xs text-muted">
                    {i.goruntuleme_sayisi} görüntülenme ·{" "}
                    <span className="text-whatsapp">
                      {i.whatsapp_tiklama} WhatsApp
                    </span>
                  </div>
                </div>
                <IlanSuperButonu id={i.id} isSuper={i.super} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10 border-t border-border pt-6">
        <h2 className="mb-1 font-bold">Aktiflik</h2>
        <p className="mb-3 text-sm text-muted">
          Pasife alınınca ajans panele giremez ve tüm ilanları yayından kalkar.
          Aktif edilince ilanlar yeniden yayına alınır.
        </p>
        <AjansAktiflikButonu
          id={ajans.id}
          aktif={aktif}
          ad={ajans.firma_adi}
        />
      </div>
    </>
  );
}
