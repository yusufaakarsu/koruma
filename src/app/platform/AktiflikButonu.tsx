"use client";

import {
  ajansAktiflikDegistir,
  yoneticiAktiflikDegistir,
} from "./actions";

type Props = {
  tip: "ajans" | "yonetici";
  id: string;
  aktif: boolean;
  ad: string;
};

/** "Pasife al" / "Aktif et" — pasife alırken onay ister. */
export function AktiflikButonu({ tip, id, aktif, ad }: Props) {
  const aksiyon = tip === "ajans" ? ajansAktiflikDegistir : yoneticiAktiflikDegistir;
  const yeni = !aktif;
  const etiket = aktif ? "Pasife al" : "Aktif et";
  const renk = aktif
    ? "text-amber-300 hover:border-amber-400"
    : "text-emerald-300 hover:border-emerald-400";

  const uyari =
    tip === "ajans" && aktif
      ? `"${ad}" pasife alınsın mı? Tüm ilanları yayından kaldırılacak ve panele giremeyecek.`
      : tip === "ajans"
        ? `"${ad}" aktif edilsin mi? Tüm ilanları yeniden yayına alınacak.`
        : aktif
          ? `"${ad}" pasife alınsın mı? Süper yönetici paneline giremeyecek.`
          : `"${ad}" aktif edilsin mi?`;

  return (
    <form
      action={aksiyon.bind(null, id, yeni)}
      onSubmit={(e) => {
        if (!confirm(uyari)) e.preventDefault();
      }}
    >
      <button
        className={`rounded-lg border border-border px-3 py-1.5 text-sm ${renk}`}
      >
        {etiket}
      </button>
    </form>
  );
}
