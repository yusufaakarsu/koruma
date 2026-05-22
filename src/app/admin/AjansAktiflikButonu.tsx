"use client";

import { ajansAktiflikDegistir } from "./actions";

/** Ajans için "Pasife al" / "Aktif et" — pasife alırken onay ister. */
export function AjansAktiflikButonu({
  id,
  aktif,
  ad,
}: {
  id: string;
  aktif: boolean;
  ad: string;
}) {
  const yeni = !aktif;
  const etiket = aktif ? "Pasife al" : "Aktif et";
  const renk = aktif
    ? "text-amber-300 hover:border-amber-400"
    : "text-emerald-300 hover:border-emerald-400";
  const uyari = aktif
    ? `"${ad}" pasife alınsın mı? Tüm ilanları yayından kaldırılacak ve panele giremeyecek.`
    : `"${ad}" aktif edilsin mi? Tüm ilanları yeniden yayına alınacak.`;

  return (
    <form
      action={ajansAktiflikDegistir.bind(null, id, yeni)}
      onSubmit={(e) => {
        if (!confirm(uyari)) e.preventDefault();
      }}
    >
      <button
        className={`rounded-lg border border-border px-2.5 py-1 text-xs sm:text-sm ${renk}`}
      >
        {etiket}
      </button>
    </form>
  );
}
