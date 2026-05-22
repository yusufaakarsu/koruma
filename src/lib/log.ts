import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Denetim logu kaydı ekler. Log yazımı kritik olmadığından hatalar
 * sessizce yutulur (asıl işlemi bozmamak için).
 */
export async function kayitEkle(
  olay: string,
  aktorTipi: string | null,
  aktorAd: string | null,
  aciklama: string,
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("kayitlar").insert({
      olay,
      aktor_tipi: aktorTipi,
      aktor_ad: aktorAd,
      aciklama,
    });
  } catch {
    // yoksay
  }
}
