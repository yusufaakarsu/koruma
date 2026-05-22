"use client";

import { useState, useTransition } from "react";
import { ilanSuperDegistir } from "./actions";

/** Bir ilanı süpere yükselt / normale çek — admin'in ajans detay sayfasında kullanılır. */
export function IlanSuperButonu({
  id,
  isSuper,
}: {
  id: string;
  isSuper: boolean;
}) {
  const [super_, setSuper] = useState(isSuper);
  const [pending, start] = useTransition();
  const [hata, setHata] = useState<string | null>(null);

  function tikla() {
    setHata(null);
    const hedef = !super_;
    start(async () => {
      const sonuc = await ilanSuperDegistir(id, hedef);
      if (sonuc?.hata) setHata(sonuc.hata);
      else setSuper(hedef);
    });
  }

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={tikla}
        disabled={pending}
        className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold transition disabled:opacity-50 sm:text-xs ${
          super_
            ? "border-amber-400/60 bg-amber-500/15 text-amber-300 hover:border-amber-400"
            : "border-border text-muted hover:border-accent hover:text-foreground"
        }`}
      >
        {pending ? "…" : super_ ? "★ Süper" : "Normal"}
      </button>
      {hata && (
        <span className="text-[10px] text-red-300">{hata}</span>
      )}
    </span>
  );
}
