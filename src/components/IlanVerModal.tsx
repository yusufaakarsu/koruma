"use client";

import { useEffect } from "react";
import type { Sehir } from "@/lib/sehirler";
import { WhatsappButton } from "./WhatsappButton";

/**
 * Boş slot kartının modalı — "İlan Ver".
 * adminTel doluysa numara + WhatsApp butonu; null ise iletişim yok bilgisi.
 */
export function IlanVerModal({
  sehir,
  adminTel,
  onKapat,
}: {
  sehir: Sehir;
  adminTel: string | null;
  onKapat: () => void;
}) {
  useEffect(() => {
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") onKapat();
    }
    document.addEventListener("keydown", esc);
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = eski;
    };
  }, [onKapat]);

  const formatli = adminTel
    ? `0${adminTel.slice(0, 3)} ${adminTel.slice(3, 6)} ${adminTel.slice(6, 8)} ${adminTel.slice(8, 10)}`
    : null;

  return (
    <div
      onClick={onKapat}
      className="fixed inset-0 z-50 grid place-items-center bg-background/85 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-6"
      >
        <button
          type="button"
          onClick={onKapat}
          aria-label="Kapat"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 text-foreground hover:bg-background"
        >
          ✕
        </button>

        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-muted">
            {sehir.ad}
          </p>
          <h2 className="mt-1 text-2xl font-black">İlan Ver</h2>

          {adminTel ? (
            <>
              <p className="mt-3 text-sm text-muted">
                İlan vermek için WhatsApp'tan iletişime geçin.
              </p>
              <p className="mt-4 font-mono text-lg font-bold">{formatli}</p>
              <p className="mt-3 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                Bu numara yalnızca <strong>ilan vermek</strong> isteyenler
                içindir. Koruma talepleri için ilan kartlarındaki WhatsApp
                butonunu kullanın.
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-amber-300">
              Bu şehir için henüz bir iletişim numarası tanımlanmamış. Lütfen
              daha sonra tekrar deneyin.
            </p>
          )}
        </div>

        {adminTel && (
          <div className="mt-6">
            <WhatsappButton
              numara={adminTel}
              mesaj={`Merhaba, ${sehir.ad} için ilan vermek istiyorum.`}
              label="WhatsApp'tan Yaz"
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
