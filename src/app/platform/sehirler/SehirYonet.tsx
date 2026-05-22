"use client";

import { useState, useTransition } from "react";
import type { Sehir } from "@/lib/sehirler";
import { sehirEkle, sehirGuncelle, sehirSil } from "./actions";

const girdi =
  "rounded-md border border-border bg-surface-2 px-2 py-1 text-sm outline-none focus:border-accent";

/** Platform şehir CRUD — ekle, güncelle, sil. Client component (server actions çağırır). */
export function SehirYonet({ sehirler }: { sehirler: Sehir[] }) {
  const [slug, setSlug] = useState("");
  const [ad, setAd] = useState("");
  const [sira, setSira] = useState("100");
  const [hata, setHata] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function ekle(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);
    start(async () => {
      const sonuc = await sehirEkle({
        slug,
        ad,
        sira: Number(sira) || 100,
      });
      if (sonuc?.hata) setHata(sonuc.hata);
      else {
        setSlug("");
        setAd("");
        setSira("100");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Yeni şehir formu */}
      <form
        onSubmit={ekle}
        className="rounded-xl border border-border bg-surface p-4"
      >
        <h2 className="mb-3 font-bold">Yeni Şehir</h2>
        {hata && (
          <p className="mb-3 rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-300">
            {hata}
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-[2fr_2fr_1fr_auto]">
          <div>
            <label className="mb-1 block text-xs text-muted">
              Slug (URL, küçük harf)
            </label>
            <input
              required
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              placeholder="istanbul"
              className={`${girdi} w-full font-mono`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Görünen Ad</label>
            <input
              required
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              placeholder="İstanbul"
              className={`${girdi} w-full`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Sıra</label>
            <input
              type="text"
              inputMode="numeric"
              value={sira}
              onChange={(e) =>
                setSira(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className={`${girdi} w-full`}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-background hover:bg-accent-strong disabled:opacity-60"
            >
              {pending ? "…" : "Ekle"}
            </button>
          </div>
        </div>
      </form>

      {/* Mevcut şehirler */}
      <div>
        <h2 className="mb-2 font-bold">Mevcut Şehirler ({sehirler.length})</h2>
        {sehirler.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
            Henüz şehir yok.
          </div>
        ) : (
          <ul className="space-y-1.5">
            {sehirler.map((s) => (
              <SatirDuzenle key={s.slug} sehir={s} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SatirDuzenle({ sehir }: { sehir: Sehir }) {
  const [ad, setAd] = useState(sehir.ad);
  const [pending, start] = useTransition();
  const [hata, setHata] = useState<string | null>(null);

  function kaydet() {
    setHata(null);
    start(async () => {
      const sonuc = await sehirGuncelle(sehir.slug, ad, 0);
      if (sonuc?.hata) setHata(sonuc.hata);
    });
  }

  function sil() {
    if (
      !confirm(
        `"${sehir.ad}" şehri silinsin mi? Sadece kullanılmıyorsa silinebilir.`,
      )
    )
      return;
    setHata(null);
    start(async () => {
      const sonuc = await sehirSil(sehir.slug);
      if (sonuc?.hata) setHata(sonuc.hata);
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
      <span className="w-24 shrink-0 font-mono text-xs text-muted">
        {sehir.slug}
      </span>
      <input
        value={ad}
        onChange={(e) => setAd(e.target.value)}
        className={`${girdi} flex-1`}
      />
      <button
        onClick={kaydet}
        disabled={pending || ad === sehir.ad}
        className="rounded-md border border-border px-2 py-1 text-xs hover:border-accent disabled:opacity-40"
      >
        Kaydet
      </button>
      <button
        onClick={sil}
        disabled={pending}
        className="rounded-md border border-red-400/50 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-40"
      >
        Sil
      </button>
      {hata && (
        <span className="basis-full text-xs text-red-300">{hata}</span>
      )}
    </li>
  );
}
