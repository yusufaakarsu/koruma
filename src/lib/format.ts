const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
const PROTO = ROOT_DOMAIN.includes("localhost") ? "http" : "https";

/** Bir şehrin alt alan adı URL'i: https://ankara.istanbulkoruma.com */
export function sehirUrl(slug: string, yol = ""): string {
  return `${PROTO}://${slug}.${ROOT_DOMAIN}${yol}`;
}

/** Ana alan adı URL'i (logo, ana sayfa). */
export function anaUrl(yol = ""): string {
  return `${PROTO}://${ROOT_DOMAIN}${yol}`;
}

/** Ajans paneli alt alan adı URL'i: https://panel.koruma.com */
export function panelUrl(yol = ""): string {
  return `${PROTO}://panel.${ROOT_DOMAIN}${yol}`;
}

/** Süper yönetici alt alan adı URL'i: https://admin.koruma.com */
export function adminUrl(yol = ""): string {
  return `${PROTO}://admin.${ROOT_DOMAIN}${yol}`;
}

/**
 * Türkiye WhatsApp link'i.
 * Veritabanında 10 hane saklarız (5XXXXXXXXX); link'te 90 prefix ekleriz.
 * Numara zaten 90 ile başlıyorsa olduğu gibi kullanılır (geri uyumluluk).
 */
export function whatsappLink(numara: string, mesaj?: string): string {
  const temiz = numara.replace(/\D/g, "");
  const tam = temiz.length === 10 ? `90${temiz}` : temiz;
  const q = mesaj ? `?text=${encodeURIComponent(mesaj)}` : "";
  return `https://wa.me/${tam}${q}`;
}

/** 1500 -> "1.500 ₺" */
export function tlFormat(tutar: number | null | undefined): string | null {
  if (tutar == null) return null;
  return new Intl.NumberFormat("tr-TR").format(tutar) + " ₺";
}

/**
 * WhatsApp numarasını sade 10 haneye indirir:
 *   "0532 123 45 67"  → "5321234567"
 *   "+90 532 123 45 67" → "5321234567"
 *   "905321234567"    → "5321234567"
 * Geçersiz girişlerde 10'dan kısa/uzun string dönebilir; doğrulama için
 * whatsappGecerli() kullanın.
 */
export function whatsappNormalize(girdi: string): string {
  let s = girdi.replace(/\D/g, "");
  if (s.startsWith("90") && s.length > 10) s = s.slice(2);
  if (s.startsWith("0")) s = s.slice(1);
  return s.slice(0, 10);
}

/** Tam 10 hane ve ilk hane 5 (Türkiye mobil) → geçerli. */
export function whatsappGecerli(numara: string): boolean {
  return /^5\d{9}$/.test(numara);
}
