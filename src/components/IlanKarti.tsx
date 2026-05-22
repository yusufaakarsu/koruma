"use client";

import { useState } from "react";
import Image from "next/image";
import type { IlanKart } from "@/lib/types";
import { ILAN_VER_GORSEL, type Sehir } from "@/lib/sehirler";
import { WhatsappButton } from "./WhatsappButton";
import { IlanVerModal } from "./IlanVerModal";

/** Kiralı koruma kartı — foto + sade overlay (sadece ad) + sağ alt yuvarlak WhatsApp. */
export function IlanKarti({
  ilan,
  onSec,
}: {
  ilan: IlanKart;
  onSec: () => void;
}) {
  const kapak = ilan.fotograflar[0];
  const isim = ilan.ad?.trim() || "Koruma";

  function ac(e: React.MouseEvent | React.KeyboardEvent) {
    if ("key" in e && e.key !== "Enter" && e.key !== " ") return;
    onSec();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={ac}
      onKeyDown={ac}
      aria-label={`${isim} — detayı aç`}
      className="group relative block aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
    >
      {kapak ? (
        <Image
          src={kapak}
          alt={isim}
          fill
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 220px"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-muted">
          Fotoğraf yok
        </div>
      )}

      {ilan.super && (
        <span className="absolute left-1.5 top-1.5 z-10 rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-black leading-none text-background shadow">
          ★
        </span>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent p-2 pr-12 sm:p-3 sm:pr-14">
        <p className="truncate text-sm font-bold text-white sm:text-base">
          {isim}
        </p>
      </div>

      {ilan.whatsapp && (
        <WhatsappButton
          numara={ilan.whatsapp}
          ilanId={ilan.id}
          mesaj={`Merhaba, ${isim} ilanı için bilgi almak istiyorum.`}
          iconOnly
          className="absolute bottom-2 right-2 h-9 w-9 rounded-full sm:h-11 sm:w-11"
        />
      )}
    </div>
  );
}

/**
 * Boş slot kartı — DB'de satır yok, UI üretir. Tıklayınca o şehre bakan
 * admin'in numarasıyla "İlan Ver" modalı açar.
 */
export function BosSlotKarti({
  sehir,
  adminTel,
}: {
  sehir: Sehir;
  adminTel: string | null;
}) {
  const [acik, setAcik] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAcik(true)}
        aria-label={`İlan Ver — ${sehir.ad}`}
        className="group relative block aspect-[3/4] w-full overflow-hidden rounded-xl border border-dashed border-border bg-surface transition hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <Image
          src={ILAN_VER_GORSEL}
          alt="İlan Ver"
          fill
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 220px"
          className="object-cover"
          unoptimized
        />
      </button>
      {acik && (
        <IlanVerModal
          sehir={sehir}
          adminTel={adminTel}
          onKapat={() => setAcik(false)}
        />
      )}
    </>
  );
}
