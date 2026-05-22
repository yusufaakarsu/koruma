import type { Metadata } from "next";
import { headers } from "next/headers";
import { GirisFormu, type GirisMod } from "./GirisFormu";

export const metadata: Metadata = {
  title: "Giriş",
};

function modBul(host: string): GirisMod {
  if (host.startsWith("platform.")) return "platform";
  if (host.startsWith("admin.")) return "admin";
  return "panel";
}

export default async function GirisSayfasi() {
  const h = await headers();
  const mod = modBul((h.get("host") ?? "").toLowerCase());

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-accent font-black text-background">
          ES
        </span>
        <span className="font-bold">İstanbul Koruma</span>
      </div>
      <GirisFormu mod={mod} />
    </main>
  );
}
