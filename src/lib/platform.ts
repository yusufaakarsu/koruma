/**
 * Platform sahipleri — en üst katman, KOD İLE SABİT.
 * Bu hesaplar Supabase Auth ile (e-posta + şifre) giriş yapar.
 * Onları yönetecek bir üst kademe olmadığı için kodda tutulurlar.
 */
export const PLATFORM_SAHIPLERI = ["test@test.com"];

export function platformSahibiMi(email: string | null | undefined): boolean {
  if (!email) return false;
  return PLATFORM_SAHIPLERI.includes(email.toLowerCase());
}
