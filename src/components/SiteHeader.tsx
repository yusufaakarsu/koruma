import type { Sehir } from "@/lib/sehirler";
import { sehirUrl, anaUrl } from "@/lib/format";

/**
 * Şehir sayfalarının üst çubuğu — sade: marka + şehir.
 * Marka linki: o şehrin kökü ("/" — Google'da bu alt alana indexlenen).
 * Şehir bilgisi yoksa ana sayfaya gider.
 */
export function SiteHeader({ aktifSehir }: { aktifSehir?: Sehir }) {
  const href = aktifSehir ? sehirUrl(aktifSehir.slug) : anaUrl();
  const ad = aktifSehir ? `${aktifSehir.ad} Koruma` : "İstanbul Koruma";
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:h-16">
        <a href={href} className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-accent font-black text-background">
            ES
          </span>
          <span className="font-bold leading-tight">{ad}</span>
        </a>
      </div>
    </header>
  );
}
