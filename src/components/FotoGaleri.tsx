"use client";

import Image from "next/image";
import { useState } from "react";

/** İlan detayında fotoğraf galerisi — büyük görsel + küçük önizlemeler. */
export function FotoGaleri({
  fotograflar,
  ad,
}: {
  fotograflar: string[];
  ad: string;
}) {
  const [aktif, setAktif] = useState(0);

  if (fotograflar.length === 0) {
    return (
      <div className="grid aspect-[3/4] place-items-center rounded-xl border border-border bg-surface-2 text-muted">
        Fotoğraf yok
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-surface-2">
        <Image
          src={fotograflar[aktif]}
          alt={`${ad} — fotoğraf ${aktif + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 480px"
          className="object-cover"
        />
      </div>

      {fotograflar.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {fotograflar.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setAktif(i)}
              className={`relative aspect-square overflow-hidden rounded-lg border ${
                i === aktif ? "border-accent" : "border-border"
              }`}
            >
              <Image
                src={url}
                alt={`${ad} küçük görsel ${i + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
