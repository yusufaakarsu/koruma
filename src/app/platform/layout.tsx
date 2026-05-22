import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { mevcutPlatform } from "@/lib/oturum";
import { cikisYap } from "@/app/giris/actions";

export const metadata: Metadata = {
  title: "Platform",
};

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const platform = await mevcutPlatform();
  if (!platform) redirect("/giris");

  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/platform" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-accent font-black text-background">
              ES
            </span>
            <span className="font-bold leading-tight">
              Platform
              <span className="block text-xs font-normal text-muted">
                {platform.email}
              </span>
            </span>
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/platform/ilanlar"
              className="text-muted hover:text-foreground"
            >
              İlanlar
            </Link>
            <Link
              href="/platform/sehirler"
              className="text-muted hover:text-foreground"
            >
              Şehirler
            </Link>
            <Link
              href="/platform/loglar"
              className="text-muted hover:text-foreground"
            >
              Loglar
            </Link>
            <form action={cikisYap}>
              <button className="rounded-lg border border-border px-3 py-2 hover:border-accent">
                Çıkış
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
    </>
  );
}
