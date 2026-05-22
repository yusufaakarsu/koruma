import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { mevcutYonetici } from "@/lib/oturum";
import { cikisYap } from "@/app/giris/actions";

export const metadata: Metadata = {
  title: "Admin Paneli",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const yonetici = await mevcutYonetici();
  if (!yonetici) redirect("/giris");

  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-accent font-black text-background">
              ES
            </span>
            <span className="font-bold leading-tight">
              Admin Paneli
              <span className="block text-xs font-normal text-muted">
                {yonetici.ad}
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <form action={cikisYap}>
              <button className="rounded-lg border border-border px-3 py-2 hover:border-accent">
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
    </>
  );
}
