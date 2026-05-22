import { createClient } from "@supabase/supabase-js";

/** SUPABASE_SECRET_KEY tanımlı mı? */
export function secretVar(): boolean {
  return !!process.env.SUPABASE_SECRET_KEY;
}

/**
 * Service-role Supabase istemcisi — RLS'i atlar.
 * Panel/admin/platform veri işlemleri ve dosya yükleme bunu kullanır.
 * SADECE sunucu kodunda; asla istemci bileşenine import edilmez.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SECRET_KEY tanımlı değil. .env.local dosyasına ekleyin.",
    );
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
