"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { fotoKirp, FOTO_ORANI, type KirpAlani } from "@/lib/foto";

/**
 * Foto kırpma modalı — react-easy-crop ile dokunmatik/mouse uyumlu.
 * Kullanıcı pan & zoom yapar, "Kırp ve Yükle" → standart 1080×1440 JPEG.
 */
export function FotoKirpModal({
  dosya,
  toplam,
  sira,
  onTamam,
  onIptal,
}: {
  dosya: File;
  /** Sıralı seçimde toplam dosya (örn. 3 fotoğraf yüklenecekse 3). */
  toplam: number;
  sira: number;
  onTamam: (kirpilmis: File) => void;
  onIptal: () => void;
}) {
  const [kaynakUrl, setKaynakUrl] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [alan, setAlan] = useState<Area | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(dosya);
    setKaynakUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [dosya]);

  useEffect(() => {
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") onIptal();
    }
    document.addEventListener("keydown", esc);
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = eski;
    };
  }, [onIptal]);

  const onCropComplete = useCallback((_alan: Area, alanPx: Area) => {
    setAlan(alanPx);
  }, []);

  async function kirp() {
    if (!alan) return;
    setCalisiyor(true);
    setHata(null);
    try {
      const kirpAlani: KirpAlani = {
        x: alan.x,
        y: alan.y,
        width: alan.width,
        height: alan.height,
      };
      const f = await fotoKirp(kaynakUrl, kirpAlani, dosya.name);
      onTamam(f);
    } catch (e) {
      setHata(e instanceof Error ? e.message : "İşlenemedi");
      setCalisiyor(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">
            Fotoğraf {sira}/{toplam}
          </p>
          <h2 className="text-lg font-bold">Kırpma Alanını Seç</h2>
        </div>
        <button
          type="button"
          onClick={onIptal}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-accent"
        >
          İptal
        </button>
      </header>

      <div className="relative flex-1 bg-black">
        {kaynakUrl && (
          <Cropper
            image={kaynakUrl}
            crop={crop}
            zoom={zoom}
            aspect={FOTO_ORANI}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
            showGrid
          />
        )}
      </div>

      <footer className="space-y-3 border-t border-border bg-surface px-4 py-3">
        {hata && (
          <p className="rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-300">
            {hata}
          </p>
        )}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">Yakınlaştır</span>
          <input
            type="range"
            min={1}
            max={5}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-[var(--color-accent)]"
          />
        </div>
        <button
          type="button"
          onClick={kirp}
          disabled={calisiyor || !alan}
          className="w-full rounded-lg bg-accent py-2.5 font-semibold text-background hover:bg-accent-strong disabled:opacity-60"
        >
          {calisiyor
            ? "İşleniyor…"
            : sira < toplam
              ? "Kırp ve Sonraki Fotoğraf"
              : "Kırp ve Yükle"}
        </button>
      </footer>
    </div>
  );
}
