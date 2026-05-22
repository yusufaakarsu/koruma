import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import { SEHIR_SLOT_SAYISI, SUPER_KART_SAYISI } from "@/lib/sehirler";
import type { Ilan, IlanKart } from "@/lib/types";

const KART_ALANLARI =
  "id, ad, sehir, whatsapp, fotograflar, aciklama, super, goruntuleme_sayisi";

/**
 * Bir şehirde yayında olan ilanlar (kiralanmış olanlar). Public — anon ile okunur.
 * Bunlar UI'da kartlar olarak görünür; şehirde gerekirse 100'e tamamlayan
 * "İlan Ver" kartlarını UI üretir.
 */
export async function sehirIlanlari(sehir: string): Promise<IlanKart[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("ilanlar")
    .select(KART_ALANLARI)
    .eq("sehir", sehir)
    .eq("aktif", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as IlanKart[];
}

/** Bir ajansın tüm ilanları (aktif + pasif). Panel için — service-role. */
export async function ajansIlanlari(ajansId: string): Promise<Ilan[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ilanlar")
    .select("*")
    .eq("ajans_id", ajansId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Ilan[];
}

/**
 * O şehre yetkili aktif yöneticilerden en eskisinin WhatsApp numarası.
 * "İlan Ver" kartları bu numaraya yönlenir. Bulamazsa null.
 */
export async function sehirAdminTel(sehir: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("yoneticiler")
    .select("iletisim_telefon, created_at")
    .contains("sehirler", [sehir])
    .eq("silindi", false)
    .order("created_at", { ascending: true })
    .limit(1);
  const tel = data?.[0]?.iletisim_telefon as string | undefined;
  return tel ?? null;
}

/**
 * Bir şehir için ilan istatistikleri:
 *  - toplam sabit 100, kiralanan = aktif ilan sayısı, bos = 100 - kiralanan
 *  - superToplam sabit 10, superKiralanan = aktif & super=true sayısı, superBos = 10 - superKiralanan
 */
export async function sehirIlanIstatistik(sehir: string): Promise<{
  toplam: number;
  kiralanan: number;
  bos: number;
  superToplam: number;
  superKiralanan: number;
  superBos: number;
}> {
  const admin = createAdminClient();
  const [genel, super_] = await Promise.all([
    admin
      .from("ilanlar")
      .select("id", { count: "exact", head: true })
      .eq("sehir", sehir)
      .eq("aktif", true),
    admin
      .from("ilanlar")
      .select("id", { count: "exact", head: true })
      .eq("sehir", sehir)
      .eq("aktif", true)
      .eq("super", true),
  ]);
  const kiralanan = genel.count ?? 0;
  const superKiralanan = super_.count ?? 0;
  return {
    toplam: SEHIR_SLOT_SAYISI,
    kiralanan,
    bos: Math.max(0, SEHIR_SLOT_SAYISI - kiralanan),
    superToplam: SUPER_KART_SAYISI,
    superKiralanan,
    superBos: Math.max(0, SUPER_KART_SAYISI - superKiralanan),
  };
}
