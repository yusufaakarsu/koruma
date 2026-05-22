"use client";

import Image from "next/image";
import { useState } from "react";
import { ilanKaydet, fotoYukle } from "@/app/panel/actions";
import { FotoKirpModal } from "./FotoKirpModal";
import type { Ilan } from "@/lib/types";

const girdiSinifi =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-foreground outline-none focus:border-accent";
const etiketSinifi = "mb-1 block text-sm font-medium text-muted";

/**
 * İlan düzenleme formu. Ajans değiştirebilir:
 *  - Koruma adı
 *  - Kısa açıklama
 *  - WhatsApp numarası
 *  - Fotoğraflar
 * Şehir, kota, aktiflik vs. admin'in sorumluluğundadır.
 */
export function IlanFormu({ ilan }: { ilan: Ilan }) {
  const [ad, setAd] = useState(ilan.ad ?? "");
  const [aciklama, setAciklama] = useState(ilan.aciklama ?? "");
  const [whatsapp, setWhatsapp] = useState(ilan.whatsapp ?? "");
  const [fotograflar, setFotograflar] = useState<string[]>(ilan.fotograflar);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  // Kullanıcının seçtiği fotoğraflar sırayla kırpma modalında işlenir.
  const [kirpKuyruk, setKirpKuyruk] = useState<File[]>([]);
  const [kirpilmisler, setKirpilmisler] = useState<File[]>([]);

  function fotoSec(files: FileList | null) {
    if (!files || files.length === 0) return;
    setHata(null);
    setKirpilmisler([]);
    setKirpKuyruk(Array.from(files));
  }

  async function kirpmaTamam(f: File) {
    const yeniKirpilmisler = [...kirpilmisler, f];
    const kalan = kirpKuyruk.slice(1);
    if (kalan.length > 0) {
      // Sıradaki dosyaya geç
      setKirpilmisler(yeniKirpilmisler);
      setKirpKuyruk(kalan);
      return;
    }
    // Tüm fotoğraflar kırpıldı → yükle
    setKirpKuyruk([]);
    setKirpilmisler([]);
    setYukleniyor(true);
    const fd = new FormData();
    yeniKirpilmisler.forEach((d) => fd.append("dosya", d));
    const sonuc = await fotoYukle(fd);
    if ("hata" in sonuc) setHata(sonuc.hata);
    else setFotograflar((o) => [...o, ...sonuc.urller]);
    setYukleniyor(false);
  }

  function kirpmaIptal() {
    setKirpKuyruk([]);
    setKirpilmisler([]);
  }

  function fotoCikar(url: string) {
    setFotograflar((o) => o.filter((u) => u !== url));
  }
  function kapakYap(url: string) {
    setFotograflar((o) => [url, ...o.filter((u) => u !== url)]);
  }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setKaydediliyor(true);
    setHata(null);
    const sonuc = await ilanKaydet({
      id: ilan.id,
      ad,
      aciklama,
      whatsapp,
      fotograflar,
    });
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

      {/* Fotoğraflar */}
      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-1 font-bold">Fotoğraflar</h2>
        <p className="mb-3 text-sm text-muted">
          İlk fotoğraf kapak olur. Yükleme öncesi her fotoğrafın kırpma alanını
          kendin seçeceksin (dikey 3:4, 1080×1440 JPEG).
        </p>

        {fotograflar.length > 0 && (
          <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
            {fotograflar.map((url, i) => (
              <div
                key={url}
                className="relative aspect-square overflow-hidden rounded-lg border border-border"
              >
                <Image
                  src={url}
                  alt={`Fotoğraf ${i + 1}`}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-background">
                    Kapak
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-background/80 px-1 py-1 text-[11px]">
                  {i !== 0 ? (
                    <button
                      type="button"
                      onClick={() => kapakYap(url)}
                      className="text-accent hover:underline"
                    >
                      Kapak yap
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={() => fotoCikar(url)}
                    className="text-red-300 hover:underline"
                  >
                    Çıkar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <label className="inline-block cursor-pointer rounded-lg border border-dashed border-border px-4 py-2.5 text-sm hover:border-accent">
          {yukleniyor ? "Yükleniyor…" : "+ Fotoğraf Ekle"}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={yukleniyor || kirpKuyruk.length > 0}
            onChange={(e) => {
              fotoSec(e.target.files);
              e.target.value = "";
            }}
            className="hidden"
          />
        </label>
      </section>

      {kirpKuyruk.length > 0 && (
        <FotoKirpModal
          dosya={kirpKuyruk[0]}
          toplam={kirpilmisler.length + kirpKuyruk.length}
          sira={kirpilmisler.length + 1}
          onTamam={kirpmaTamam}
          onIptal={kirpmaIptal}
        />
      )}

      {/* Bilgiler */}
      <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
        <div>
          <label className={etiketSinifi}>Koruma Adı *</label>
          <input
            required
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            className={girdiSinifi}
            placeholder="Örn. Ahmet Y."
          />
        </div>
        <div>
          <label className={etiketSinifi}>Kısa Açıklama</label>
          <textarea
            value={aciklama}
            onChange={(e) => setAciklama(e.target.value)}
            rows={3}
            className={girdiSinifi}
            placeholder="Kısa bilgi (deneyim, hizmet alanı vb.)"
          />
        </div>
        <div>
          <label className={etiketSinifi}>WhatsApp * (10 hane, 0 olmadan)</label>
          <input
            required
            inputMode="numeric"
            maxLength={10}
            value={whatsapp}
            onChange={(e) =>
              setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            className={girdiSinifi}
            placeholder="5XXXXXXXXX"
          />
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={kaydediliyor || yukleniyor}
          className="w-full rounded-lg bg-accent px-6 py-2.5 font-semibold text-background hover:bg-accent-strong disabled:opacity-60 sm:w-auto"
        >
          {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </form>
  );
}
