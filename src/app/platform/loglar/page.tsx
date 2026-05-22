import { redirect } from "next/navigation";
import { mevcutPlatform } from "@/lib/oturum";
import { createAdminClient, secretVar } from "@/lib/supabase/admin";
import type { Kayit } from "@/lib/types";

const OLAY_ETIKET: Record<string, string> = {
  giris: "Giriş",
  ajans_olustur: "Ajans oluşturuldu",
  ajans_guncelle: "Ajans güncellendi",
  ajans_sil: "Ajans silindi",
  ilan_olustur: "İlan oluşturuldu",
  ilan_guncelle: "İlan güncellendi",
  ilan_sil: "İlan silindi",
  whatsapp_degisti: "WhatsApp değişti",
  yonetici_olustur: "Yönetici oluşturuldu",
  yonetici_guncelle: "Yönetici güncellendi",
  yonetici_sil: "Yönetici silindi",
};

export default async function LoglarSayfasi() {
  const p = await mevcutPlatform();
  if (!p) redirect("/giris");
  if (!secretVar()) {
    return (
      <p className="text-sm text-amber-300">
        SUPABASE_SECRET_KEY tanımlı değil.
      </p>
    );
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("kayitlar")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  const kayitlar = (data ?? []) as Kayit[];

  return (
    <>
      <h1 className="mb-1 text-2xl font-black">Loglar</h1>
      <p className="mb-6 text-sm text-muted">Son {kayitlar.length} kayıt</p>

      {kayitlar.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted">
          Henüz kayıt yok.
        </div>
      ) : (
        <ul className="space-y-2">
          {kayitlar.map((k) => (
            <li
              key={k.id}
              className="rounded-lg border border-border bg-surface px-3 py-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded bg-surface-2 px-2 py-0.5 text-xs font-medium text-accent">
                  {OLAY_ETIKET[k.olay] ?? k.olay}
                </span>
                <span className="text-xs text-muted">
                  {new Date(k.created_at).toLocaleString("tr-TR")}
                </span>
              </div>
              <p className="mt-1 text-sm">{k.aciklama}</p>
              {(k.aktor_tipi || k.aktor_ad) && (
                <p className="text-xs text-muted">
                  {k.aktor_tipi}
                  {k.aktor_ad ? ` · ${k.aktor_ad}` : ""}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
