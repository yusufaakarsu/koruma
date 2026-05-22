import Link from "next/link";

/** Panel sayfalarının üst kısmındaki "← X" geri dönüş bağlantısı. */
export function GeriLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent sm:px-4 sm:py-2.5 sm:text-base"
    >
      <span aria-hidden className="text-lg leading-none">
        ←
      </span>
      {children}
    </Link>
  );
}
