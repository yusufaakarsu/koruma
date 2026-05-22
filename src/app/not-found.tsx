import Link from "next/link";
import { anaUrl } from "@/lib/format";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-5xl font-black text-accent">404</p>
      <h1 className="mt-3 text-xl font-bold">Sayfa bulunamadı</h1>
      <p className="mt-2 text-muted">
        Aradığınız ilan ya da sayfa kaldırılmış olabilir.
      </p>
      <Link
        href={anaUrl()}
        className="mt-6 rounded-lg bg-accent px-4 py-2.5 font-semibold text-background hover:bg-accent-strong"
      >
        Ana sayfaya dön
      </Link>
    </main>
  );
}
