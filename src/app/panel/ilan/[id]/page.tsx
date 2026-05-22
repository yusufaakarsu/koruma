import { notFound, redirect } from "next/navigation";
import { mevcutAjans } from "@/lib/oturum";
import { createAdminClient } from "@/lib/supabase/admin";
import { IlanFormu } from "@/components/IlanFormu";
import { GeriLink } from "@/components/GeriLink";
import type { Ilan } from "@/lib/types";

export default async function IlanDuzenleSayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ajans = await mevcutAjans();
  if (!ajans) redirect("/giris");

  const admin = createAdminClient();
  const { data: ilan } = await admin
    .from("ilanlar")
    .select("*")
    .eq("id", id)
    .eq("ajans_id", ajans.id)
    .maybeSingle();
  if (!ilan) notFound();

  return (
    <>
      <div className="mb-6">
        <GeriLink href="/panel">İlanlarım</GeriLink>
        <h1 className="mt-3 text-2xl font-black">İlanı Düzenle</h1>
        <p className="text-sm text-muted">
          Koruma adı, kısa açıklama, WhatsApp ve fotoğrafları düzenleyin.
        </p>
      </div>
      <IlanFormu ilan={ilan as Ilan} />
    </>
  );
}
