import { sehirleriGetir } from "@/lib/sehirler";
import { sehirUrl } from "@/lib/format";

export default async function AnaSayfa() {
  const sehirler = await sehirleriGetir();
  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:h-16">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-accent font-black text-background">
              ES
            </span>
            <span className="font-bold">İstanbul Koruma</span>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            Profesyonel Koruma ve <span className="text-accent">Özel Güvenlik</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
            Şehrinizdeki deneyimli korumalara ulaşın. Günlük koruma, etkinlik
            güvenliği ve kişisel koruma için WhatsApp&apos;tan saniyeler içinde
            iletişime geçin.
          </p>
        </section>

        {/* Şehir seçimi */}
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="mb-6 text-center text-xl font-bold">
            Şehrinizi Seçin
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {sehirler.map((s) => (
              <a
                key={s.slug}
                href={sehirUrl(s.slug)}
                className="group rounded-xl border border-border bg-surface p-6 text-center transition hover:border-accent hover:bg-surface-2"
              >
                <span className="block text-lg font-bold group-hover:text-accent">
                  {s.ad}
                </span>
                <span className="mt-1 block text-sm text-muted">
                  Koruma İlanları
                </span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
