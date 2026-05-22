"use client";

import { useActionState, useEffect } from "react";
import {
  platformGiris,
  yoneticiGiris,
  ajansGiris,
  type GirisDurum,
} from "./actions";

export type GirisMod = "platform" | "admin" | "panel";

const baslik: Record<GirisMod, string> = {
  platform: "Platform Girişi",
  admin: "Admin Girişi",
  panel: "Panel Girişi",
};

const girdiSinifi =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-foreground outline-none focus:border-accent";

export function GirisFormu({ mod }: { mod: GirisMod }) {
  const aksiyon =
    mod === "platform"
      ? platformGiris
      : mod === "admin"
        ? yoneticiGiris
        : ajansGiris;
  const [durum, formAction, pending] = useActionState<GirisDurum, FormData>(
    aksiyon,
    undefined,
  );
  const epostaIle = mod === "platform";

  const basarili = durum !== undefined && "ok" in durum;
  const hata = durum !== undefined && "hata" in durum ? durum.hata : null;

  // Başarılı girişte tam sayfa yüklemesiyle yönlen: server action redirect'i
  // oturum çerezini görmeyen gömülü bir render ürettiğinden kullanılamıyor.
  useEffect(() => {
    if (durum !== undefined && "ok" in durum) {
      window.location.href = durum.hedef;
    }
  }, [durum]);

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
      <h1 className="text-lg font-bold">{baslik[mod]}</h1>
      <p className="mb-5 mt-1 text-sm text-muted">
        {epostaIle
          ? "Platform sahibi hesabıyla giriş yapın."
          : "Kullanıcı adı ve şifrenizle giriş yapın."}
      </p>

      {hata && (
        <p className="mb-4 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
          {hata}
        </p>
      )}

      <form action={formAction} className="space-y-3">
        {epostaIle ? (
          <input
            name="email"
            type="email"
            required
            placeholder="E-posta"
            className={girdiSinifi}
          />
        ) : (
          <input
            name="kullanici_adi"
            required
            placeholder="Kullanıcı adı"
            className={girdiSinifi}
          />
        )}
        <input
          name="sifre"
          type="password"
          required
          placeholder="Şifre"
          className={girdiSinifi}
        />
        <button
          type="submit"
          disabled={pending || basarili}
          className="w-full rounded-lg bg-accent py-2.5 font-semibold text-background hover:bg-accent-strong disabled:opacity-60"
        >
          {pending || basarili ? "Giriş yapılıyor…" : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
}
