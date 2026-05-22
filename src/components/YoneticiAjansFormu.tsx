"use client";

import { useState } from "react";
import type { Sehir } from "@/lib/sehirler";
import {
  ajansOlustur,
  ajansGuncelle,
  type Kotalar,
} from "@/app/admin/actions";
import type { AjansGuvenli } from "@/lib/types";

const girdiSinifi =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-foreground outline-none focus:border-accent";
const etiketSinifi = "mb-1 block text-sm font-medium text-muted";

/**
 * Süper yönetici için ajans oluşturma / düzenleme formu.
 * Her seçili şehir için iki sayı: normal kota + süper kota (★).
 * Süper ilanlar üst yatay sıraya çıkar; ajans karar veremez, admin belirler.
 */
export function YoneticiAjansFormu({
  ajans,
  izinliSehirler,
}: {
  ajans?: AjansGuvenli;
  izinliSehirler: Sehir[];
}) {
  const duzenleme = !!ajans;

  const [firmaAdi, setFirmaAdi] = useState(ajans?.firma_adi ?? "");
  const [kullaniciAdi, setKullaniciAdi] = useState(ajans?.kullanici_adi ?? "");
  const [sifre, setSifre] = useState("");
  const [telefon, setTelefon] = useState(ajans?.iletisim_telefon ?? "");
  const [kotalar, setKotalar] = useState<Kotalar>(() => ({
    ...(ajans?.kotalar ?? {}),
  }));
  const [superKotalar, setSuperKotalar] = useState<Kotalar>(() => ({
    ...(ajans?.super_kotalar ?? {}),
  }));
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  function sehirToggle(slug: string) {
    if (slug in kotalar) {
      // İşareti kaldır
      setKotalar((o) => {
        const yeni = { ...o };
        delete yeni[slug];
        return yeni;
      });
      setSuperKotalar((o) => {
        const yeni = { ...o };
        delete yeni[slug];
        return yeni;
      });
    } else {
      setKotalar((o) => ({ ...o, [slug]: 1 }));
    }
  }

  function kotaDegistir(slug: string, deger: string) {
    const temiz = deger.replace(/\D/g, "");
    const sayi = temiz === "" ? 0 : Math.floor(Number(temiz));
    // Anahtarı koru (checkbox seçili kalsın); 0 input'ta boş gösterilir.
    setKotalar((o) => ({ ...o, [slug]: sayi }));
  }

  function superKotaDegistir(slug: string, deger: string) {
    const temiz = deger.replace(/\D/g, "");
    const sayi = temiz === "" ? 0 : Math.floor(Number(temiz));
    setSuperKotalar((o) => ({ ...o, [slug]: sayi }));
  }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setKaydediliyor(true);
    setHata(null);
    const ortak = {
      firma_adi: firmaAdi,
      kullanici_adi: kullaniciAdi,
      telefon,
      kotalar,
      super_kotalar: superKotalar,
    };
    const sonuc =
      duzenleme && ajans
        ? await ajansGuncelle({ id: ajans.id, ...ortak, yeni_sifre: sifre })
        : await ajansOlustur({ ...ortak, sifre });
    if (sonuc?.hata) {
      setHata(sonuc.hata);
      setKaydediliyor(false);
    }
  }

  const toplamNormal = Object.values(kotalar).reduce(
    (t, n) => t + (Number.isFinite(n) ? n : 0),
    0,
  );
  const toplamSuper = Object.values(superKotalar).reduce(
    (t, n) => t + (Number.isFinite(n) ? n : 0),
    0,
  );

  return (
    <form onSubmit={kaydet} className="space-y-6">
      {hata && (
        <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
          {hata}
        </p>
      )}

      <section className="grid gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={etiketSinifi}>Firma Adı *</label>
          <input
            required
            value={firmaAdi}
            onChange={(e) => setFirmaAdi(e.target.value)}
            className={girdiSinifi}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={etiketSinifi}>
            WhatsApp * (10 hane, 0 olmadan)
          </label>
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
          <label className={etiketSinifi}>Kullanıcı Adı * (giriş için)</label>
          <input
            required
            value={kullaniciAdi}
            onChange={(e) => setKullaniciAdi(e.target.value)}
            className={girdiSinifi}
            placeholder="ornek_ajans"
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
        <div className="mb-3">
          <h2 className="font-bold">Şehirler</h2>
          <p className="text-xs text-muted">
            Normal + ★ süper kota (şehir başına en fazla 10 süper)
          </p>
        </div>
        {izinliSehirler.length === 0 ? (
          <p className="text-sm text-red-300">
            Bu hesabın yetkili olduğu şehir yok.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {izinliSehirler.map((sehir) => {
              const slug = sehir.slug;
              const secili = slug in kotalar;
              const normalDeger = kotalar[slug] ?? 0;
              const superDeger = superKotalar[slug] ?? 0;
              return (
                <li
                  key={slug}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${
                    secili ? "border-accent bg-surface-2" : "border-border"
                  }`}
                >
                  <label className="flex flex-1 cursor-pointer items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={secili}
                      onChange={() => sehirToggle(slug)}
                      className="h-4 w-4 accent-[var(--color-accent)]"
                    />
                    <span className="truncate font-medium">{sehir.ad}</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={secili && normalDeger > 0 ? String(normalDeger) : ""}
                    disabled={!secili}
                    onChange={(e) => kotaDegistir(slug, e.target.value)}
                    className="w-12 rounded-md border border-border bg-surface-2 px-1.5 py-1 text-center text-sm outline-none focus:border-accent disabled:opacity-40"
                    placeholder="—"
                    title="Normal kota"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={secili && superDeger > 0 ? String(superDeger) : ""}
                    disabled={!secili}
                    onChange={(e) => superKotaDegistir(slug, e.target.value)}
                    className="w-12 rounded-md border border-amber-400/40 bg-surface-2 px-1.5 py-1 text-center text-sm text-amber-300 outline-none focus:border-amber-400 disabled:opacity-40"
                    placeholder="★"
                    title="Süper kota (★)"
                  />
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-2 text-right text-xs text-muted">
          Toplam: <span className="font-semibold text-foreground">{toplamNormal}</span>
          {" + "}
          <span className="font-semibold text-amber-300">{toplamSuper}★</span>
        </p>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={kaydediliyor || izinliSehirler.length === 0}
          className="rounded-lg bg-accent px-6 py-2.5 font-semibold text-background hover:bg-accent-strong disabled:opacity-60"
        >
          {kaydediliyor
            ? "Kaydediliyor…"
            : duzenleme
              ? "Değişiklikleri Kaydet"
              : "Ajans Oluştur"}
        </button>
      </div>
    </form>
  );
}
