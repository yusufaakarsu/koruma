"use client";

import { useEffect, useState } from "react";
import type { IlanKart } from "@/lib/types";
import {
  SEHIR_SLOT_SAYISI,
  SUPER_KART_SAYISI,
  type Sehir,
} from "@/lib/sehirler";
import { IlanKarti, BosSlotKarti } from "./IlanKarti";
import { IlanModal } from "./IlanModal";

const NORMAL_KART_SAYISI = SEHIR_SLOT_SAYISI - SUPER_KART_SAYISI;

/** Birleşik kart modeli — kiralı ilan veya boş slot ("İlan Ver"). */
type Kart =
  | { tip: "ilan"; ilan: IlanKart; anahtar: string }
  | { tip: "bos"; anahtar: string };

/**
 * Efraimidis–Spirakis weighted reservoir sampling.
 * weight = 1 / (1 + goruntuleme_sayisi)
 *   - hiç görüntülenmeyen ilan → en yüksek üst sıra şansı
 *   - çok görüntülenen ilan → ağırlığı düşer, alt sıralara kayar
 * Her ziyarette `random()` farklı; uzun vadede tüm ilanlar yaklaşık eşit
 * görüntülenme alır (gerçek hakkaniyet).
 */
function weightedShuffle(ilanlar: IlanKart[]): IlanKart[] {
  return ilanlar
    .map((i) => {
      const w = 1 / (1 + (i.goruntuleme_sayisi ?? 0));
      const key = -Math.log(Math.random()) / w;
      return { i, key };
    })
    .sort((a, b) => a.key - b.key)
    .map((x) => x.i);
}

/** İlan listesini boş slot'larla hedefe tamamlar. */
function bosTamamla(
  ilanlar: IlanKart[],
  hedef: number,
  prefix: string,
): Kart[] {
  const sonuc: Kart[] = ilanlar.slice(0, hedef).map((i) => ({
    tip: "ilan",
    ilan: i,
    anahtar: i.id,
  }));
  for (let k = sonuc.length; k < hedef; k++) {
    sonuc.push({ tip: "bos", anahtar: `${prefix}-${k}` });
  }
  return sonuc;
}

/**
 * Şehir sayfasının ilan ızgarası.
 *  - ÜST (10 kart): süper ilanlar → yatay scroll "Öne Çıkanlar"
 *  - ALT (90 kart): normal ilanlar → 3'lü dikey grid + boş "İlan Ver" kutuları
 * Her iki bölüm kendi içinde weighted shuffle — az görüntülenen ilan üste çıkar.
 */
export function IlanGrid({
  ilanlar,
  sehir,
  sehirAdminTel,
}: {
  ilanlar: IlanKart[];
  sehir: Sehir;
  sehirAdminTel: string | null;
}) {
  const [secili, setSecili] = useState<IlanKart | null>(null);

  // SSR güvenli deterministic başlangıç.
  const [ust, setUst] = useState<Kart[]>(() =>
    bosTamamla(
      ilanlar.filter((i) => i.super),
      SUPER_KART_SAYISI,
      "ust",
    ),
  );
  const [alt, setAlt] = useState<Kart[]>(() =>
    bosTamamla(
      ilanlar.filter((i) => !i.super),
      NORMAL_KART_SAYISI,
      "alt",
    ),
  );

  useEffect(() => {
    setUst(
      bosTamamla(
        weightedShuffle(ilanlar.filter((i) => i.super)),
        SUPER_KART_SAYISI,
        "ust",
      ),
    );
    setAlt(
      bosTamamla(
        weightedShuffle(ilanlar.filter((i) => !i.super)),
        NORMAL_KART_SAYISI,
        "alt",
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderKart(k: Kart) {
    if (k.tip === "ilan") {
      return <IlanKarti ilan={k.ilan} onSec={() => setSecili(k.ilan)} />;
    }
    return <BosSlotKarti sehir={sehir} adminTel={sehirAdminTel} />;
  }

  return (
    <>
      {/* ÜST — Öne Çıkanlar (yatay scroll, 10 süper kart) */}
      <section className="mb-6">
        <h2 className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-300">
          <span aria-hidden>★</span> Öne Çıkanlar
        </h2>
        <div className="-mx-4 overflow-x-auto px-4 pb-3 [scrollbar-width:thin] sm:-mx-0 sm:px-0">
          <div className="flex snap-x snap-mandatory gap-2 sm:gap-3">
            {ust.map((k) => (
              <div
                key={k.anahtar}
                className="w-[40%] shrink-0 snap-start sm:w-[28%] md:w-[22%] lg:w-[18%]"
              >
                {renderKart(k)}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ALT — Diğer İlanlar (3'lü grid, 90 kart) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
        {alt.map((k) => (
          <div key={k.anahtar}>{renderKart(k)}</div>
        ))}
      </div>

      {secili && (
        <IlanModal
          ilan={secili}
          sehir={sehir}
          onKapat={() => setSecili(null)}
        />
      )}
    </>
  );
}
