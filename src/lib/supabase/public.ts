import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Çerez okumayan, anonim Supabase istemcisi.
 * Halka açık sayfalarda kullanılır — böylece sayfalar dinamik olmaya
 * zorlanmaz ve ISR ile önbelleğe alınıp çok hızlı sunulabilir.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
