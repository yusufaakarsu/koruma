import bcrypt from "bcryptjs";

/** Şifreyi bcrypt ile hash'ler (yalnızca sunucuda kullanılır). */
export function sifreHashle(sifre: string): Promise<string> {
  return bcrypt.hash(sifre, 10);
}

/** Düz metin şifreyi saklanan hash ile karşılaştırır. */
export function sifreDogrula(sifre: string, hash: string): Promise<boolean> {
  return bcrypt.compare(sifre, hash);
}
