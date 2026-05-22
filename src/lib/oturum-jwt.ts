import { SignJWT, jwtVerify } from "jose";

/**
 * Ajans / süper yönetici oturumu için imzalı çerez (JWT).
 * Edge-uyumlu (proxy.ts buradan içe aktarır) — bcrypt gibi node-only
 * bağımlılık ASLA bu dosyaya girmemeli.
 */
export const OTURUM_COOKIE = "koruma_oturum";

export type OturumTipi = "ajans" | "yonetici";
export type OturumPayload = { tip: OturumTipi; id: string };

function anahtar(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET tanımlı değil.");
  return new TextEncoder().encode(s);
}

export async function oturumImzala(p: OturumPayload): Promise<string> {
  return new SignJWT({ tip: p.tip, id: p.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(anahtar());
}

export async function oturumCoz(
  token: string | undefined,
): Promise<OturumPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, anahtar());
    if (
      (payload.tip === "ajans" || payload.tip === "yonetici") &&
      typeof payload.id === "string"
    ) {
      return { tip: payload.tip, id: payload.id };
    }
    return null;
  } catch {
    return null;
  }
}
