"use client";

import { useState } from "react";
import type { Sehir } from "@/lib/sehirler";
import { yoneticiOlustur, yoneticiGuncelle } from "@/app/platform/actions";
import type { YoneticiGuvenli } from "@/lib/types";

const girdiSinifi =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-foreground outline-none focus:border-accent";
const etiketSinifi = "mb-1 block text-sm font-medium text-muted";

/** Platform sahibi için süper yönetici oluşturma / düzenleme formu. */
export function PlatformYoneticiFormu({
  yonetici,
  sehirler: tumSehirler,
}: {
  yonetici?: YoneticiGuvenli;
  sehirler: Sehir[];
}) {
  const duzenleme = !!yonetici;
  const [ad, setAd] = useState(yonetici?.ad ?? "");
  const [kullaniciAdi, setKullaniciAdi] = useState(
    yonetici?.kullanici_adi ?? "",
  );
  const [telefon, setTelefon] = useState(yonetici?.iletisim_telefon ?? "");
  const [sifre, setSifre] = useState("");
  const [sehirler, setSehirler] = useState<string[]>(
    yonetici?.sehirler ?? [],
  );
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  function sehirToggle(slug: string) {
    setSehirler((o) =>
      o.includes(slug) ? o.filter((s) => s !== slug) : [...o, slug],
    );
  }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setKaydediliyor(true);
    setHata(null);
    const ortak = { ad, kullanici_adi: kullaniciAdi, telefon, sehirler };
    const sonuc =
      duzenleme && yonetici
        ? await yoneticiGuncelle({
            id: yonetici.id,
            ...ortak,
            yeni_sifre: sifre,
          })
        : await yoneticiOlustur({ ...ortak, sifre });
    if (sonuc?.hata) {
      setHata(sonuc.hata);
      setKaydediliyor(false);
    }
  }

  return (
    <form onSubmit={kaydet} className="space-y-6">
      {hata && (
        <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
          {hata}
        </p>
      )}

      <section className="grid gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={etiketSinifi}>Ad Soyad *</label>
          <input
            required
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            className={girdiSinifi}
          />
        </div>
        <div>
          <label className={etiketSinifi}>Kullanıcı Adı * (giriş için)</label>
          <input
            required
            value={kullaniciAdi}
            onChange={(e) => setKullaniciAdi(e.target.value)}
            className={girdiSinifi}
          />
        </div>
        <div>
          <label className={etiketSinifi}>WhatsApp * (10 hane, 0 olmadan)</label>
          <input
            required
            inputMode="numeric"
            maxLength={10}
            value={telefon}
            onChange={(e) =>
              setTelefon(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            className={girdiSinifi}
            placeholder="5XXXXXXXXX"
          />
        </div>
        <div>
          <label className={etiketSinifi}>
            {duzenleme
              ? "Yeni Şifre (boş = değişmez)"
              : "Şifre * (en az 6 karakter)"}
          </label>
          <input
            required={!duzenleme}
            type="text"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            className={girdiSinifi}
            placeholder={duzenleme ? "••••••" : ""}
          />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-1 font-bold">Yetkili Şehirler</h2>
        <p className="mb-3 text-sm text-muted">
          Bu yönetici yalnızca seçili şehirlerde ajans oluşturabilir.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {tumSehirler.map((s) => (
            <label
              key={s.slug}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                sehirler.includes(s.slug)
                  ? "border-accent bg-surface-2"
                  : "border-border"
              }`}
            >
              <input
                type="checkbox"
                checked={sehirler.includes(s.slug)}
                onChange={() => sehirToggle(s.slug)}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              {s.ad}
            </label>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={kaydediliyor}
          className="rounded-lg bg-accent px-6 py-2.5 font-semibold text-background hover:bg-accent-strong disabled:opacity-60"
        >
          {kaydediliyor
            ? "Kaydediliyor…"
            : duzenleme
              ? "Değişiklikleri Kaydet"
              : "Yönetici Oluştur"}
        </button>
      </div>
    </form>
  );
}
