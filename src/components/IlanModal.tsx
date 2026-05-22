"use client";

import { useEffect } from "react";
import type { IlanKart } from "@/lib/types";
import type { Sehir } from "@/lib/sehirler";
import { FotoGaleri } from "./FotoGaleri";
import { WhatsappButton } from "./WhatsappButton";
import { GoruntulemeSayaci } from "./GoruntulemeSayaci";

/** İlan detay modalı — ESC ve backdrop ile kapanır, sayfa scrollünü kilitler. */
export function IlanModal({
  ilan,
  sehir,
  onKapat,
}: {
  ilan: IlanKart;
  sehir: Sehir;
  onKapat: () => void;
}) {
  useEffect(() => {
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") onKapat();
    }
    document.addEventListener("keydown", esc);
    const eskiOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = eskiOverflow;
    };
  }, [onKapat]);

  const isim = ilan.ad?.trim() || "Koruma";
  const numara = ilan.whatsapp ?? "";
  const mesaj = `Merhaba, ${isim} (${sehir.ad}) ilanı için bilgi almak istiyorum.`;

  return (
    <div
      onClick={onKapat}
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/85 p-4 backdrop-blur-sm"
    >
      <GoruntulemeSayaci ilanId={ilan.id} />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl rounded-2xl border border-border bg-surface"
      >
        <button
          type="button"
          onClick={onKapat}
          aria-label="Kapat"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/80 text-foreground transition hover:bg-background"
        >
          ✕
        </button>

        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[360px_1fr]">
          <FotoGaleri fotograflar={ilan.fotograflar} ad={isim} />

          <div className="flex min-h-[200px] flex-col">
            <h2 className="text-2xl font-black sm:text-3xl">{isim}</h2>
            <p className="mt-1 text-sm text-muted">{sehir.ad}</p>

            {ilan.aciklama && (
              <p className="mt-4 whitespace-pre-line text-sm text-muted sm:text-base">
                {ilan.aciklama}
              </p>
            )}

            {numara && (
              <div className="mt-6 rounded-xl border border-border bg-surface-2 p-4 sm:mt-auto">
                <WhatsappButton
                  numara={numara}
                  ilanId={ilan.id}
                  mesaj={mesaj}
                  label="WhatsApp'tan İletişime Geç"
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
