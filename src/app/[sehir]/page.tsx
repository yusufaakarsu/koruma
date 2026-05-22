import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sehirBul } from "@/lib/sehirler";
import { sehirIlanlari, sehirAdminTel } from "@/lib/queries";
import { SiteHeader } from "@/components/SiteHeader";
import { IlanGrid } from "@/components/IlanGrid";

// ISR — sayfa ilk istekte üretilip önbelleğe alınır; panelden değişiklik
// olduğunda revalidatePath ile anında tazelenir.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sehir: string }>;
}): Promise<Metadata> {
  const { sehir } = await params;
  const s = await sehirBul(sehir);
  if (!s) return {};
  return { title: `${s.ad} Koruma` };
}

export default async function SehirSayfasi({
  params,
}: {
  params: Promise<{ sehir: string }>;
}) {
  const { sehir } = await params;
  const s = await sehirBul(sehir);
  if (!s) notFound();

  const [ilanlar, adminTel] = await Promise.all([
    sehirIlanlari(s.slug),
    sehirAdminTel(s.slug),
  ]);

  return (
    <>
      <SiteHeader aktifSehir={s} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        <IlanGrid ilanlar={ilanlar} sehir={s} sehirAdminTel={adminTel} />
      </main>
    </>
  );
}
