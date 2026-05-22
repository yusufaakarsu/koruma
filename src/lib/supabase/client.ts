import { createBrowserClient } from "@supabase/ssr";

/** Tarayıcı tarafı Supabase istemcisi (panel formları, dosya yükleme). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
