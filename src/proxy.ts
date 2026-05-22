import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { OTURUM_COOKIE, oturumCoz } from "@/lib/oturum-jwt";
import { platformSahibiMi } from "@/lib/platform";

const ROOT_DOMAIN = (
  process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000"
).toLowerCase();

const PANEL_ALT = "panel"; // ajans
const ADMIN_ALT = "admin"; // süper yönetici
const PLATFORM_ALT = "platform"; // platform sahibi

function altAlanAdiCikar(host: string): string | null {
  const temizHost = host.split(":")[0];
  const temizRoot = ROOT_DOMAIN.split(":")[0];
  if (temizHost.endsWith(".vercel.app")) return null;
  if (temizHost === temizRoot || temizHost === `www.${temizRoot}`) return null;
  if (temizHost.endsWith(`.${temizRoot}`)) {
    const alt = temizHost.slice(0, -(temizRoot.length + 1));
    return alt === "www" ? null : alt;
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const host = (request.headers.get("host") ?? "").toLowerCase();
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  const altAlan = altAlanAdiCikar(host);

  const kok = (alt: string) => `${proto}://${alt}.${ROOT_DOMAIN}`;
  const girise = (alt: string, yonlendir: string) => {
    const g = new URL(`${kok(alt)}/giris`);
    g.searchParams.set("yonlendir", yonlendir);
    return NextResponse.redirect(g);
  };
  const kokeRewrite = (segment: string) => {
    const hedef = url.clone();
    hedef.pathname = segment;
    return NextResponse.rewrite(hedef);
  };

  // === PLATFORM (platform.koruma.com) — Supabase Auth ===
  if (altAlan === PLATFORM_ALT) {
    if (
      url.pathname.startsWith("/panel") ||
      url.pathname.startsWith("/admin")
    ) {
      const hedefAlt = url.pathname.startsWith("/panel")
        ? PANEL_ALT
        : ADMIN_ALT;
      return NextResponse.redirect(new URL(`${kok(hedefAlt)}${url.pathname}`));
    }

    let response = NextResponse.next({ request });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (toSet) => {
            toSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({ request });
            toSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const korumali =
      url.pathname === "/" || url.pathname.startsWith("/platform");
    if (korumali && !platformSahibiMi(user?.email)) {
      const r = girise(
        PLATFORM_ALT,
        url.pathname === "/" ? "/platform" : url.pathname,
      );
      response.cookies.getAll().forEach((c) => r.cookies.set(c));
      return r;
    }
    if (url.pathname === "/") {
      const r = kokeRewrite("/platform");
      response.cookies.getAll().forEach((c) => r.cookies.set(c));
      return r;
    }
    return response;
  }

  // === SÜPER YÖNETİCİ (admin.koruma.com) — custom oturum ===
  if (altAlan === ADMIN_ALT) {
    if (url.pathname.startsWith("/panel"))
      return NextResponse.redirect(new URL(`${kok(PANEL_ALT)}${url.pathname}`));
    if (url.pathname.startsWith("/platform"))
      return NextResponse.redirect(
        new URL(`${kok(PLATFORM_ALT)}${url.pathname}`),
      );

    const o = await oturumCoz(request.cookies.get(OTURUM_COOKIE)?.value);
    const korumali =
      url.pathname === "/" || url.pathname.startsWith("/admin");
    if (korumali && o?.tip !== "yonetici")
      return girise(ADMIN_ALT, url.pathname === "/" ? "/admin" : url.pathname);
    if (url.pathname === "/") return kokeRewrite("/admin");
    return NextResponse.next();
  }

  // === AJANS (panel.koruma.com) — custom oturum ===
  if (altAlan === PANEL_ALT) {
    if (url.pathname.startsWith("/admin"))
      return NextResponse.redirect(new URL(`${kok(ADMIN_ALT)}${url.pathname}`));
    if (url.pathname.startsWith("/platform"))
      return NextResponse.redirect(
        new URL(`${kok(PLATFORM_ALT)}${url.pathname}`),
      );

    const o = await oturumCoz(request.cookies.get(OTURUM_COOKIE)?.value);
    const korumali =
      url.pathname === "/" || url.pathname.startsWith("/panel");
    if (korumali && o?.tip !== "ajans")
      return girise(PANEL_ALT, url.pathname === "/" ? "/panel" : url.pathname);
    if (url.pathname === "/") return kokeRewrite("/panel");
    return NextResponse.next();
  }

  // === ŞEHİR ALT ALAN ADI ===
  // Edge'de DB sorgusu yok; geçerli olmayan alt alanlar da rewrite olur,
  // [sehir]/page.tsx içinde notFound() ile 404 döner.
  if (altAlan) {
    if (url.pathname.startsWith("/panel"))
      return NextResponse.redirect(
        new URL(`${kok(PANEL_ALT)}${url.pathname}${url.search}`),
      );
    if (url.pathname.startsWith("/admin"))
      return NextResponse.redirect(
        new URL(`${kok(ADMIN_ALT)}${url.pathname}${url.search}`),
      );
    if (url.pathname.startsWith("/platform"))
      return NextResponse.redirect(
        new URL(`${kok(PLATFORM_ALT)}${url.pathname}${url.search}`),
      );
    if (url.pathname.startsWith("/giris"))
      return NextResponse.redirect(
        new URL(`${kok(PANEL_ALT)}/giris${url.search}`),
      );
    const ek = url.pathname === "/" ? "" : url.pathname;
    return kokeRewrite(`/${altAlan}${ek}`);
  }

  // === ANA ALAN ADI ===
  if (url.pathname.startsWith("/platform"))
    return NextResponse.redirect(
      new URL(`${kok(PLATFORM_ALT)}${url.pathname}`),
    );
  if (url.pathname.startsWith("/admin"))
    return NextResponse.redirect(new URL(`${kok(ADMIN_ALT)}${url.pathname}`));
  if (url.pathname.startsWith("/panel") || url.pathname.startsWith("/giris"))
    return NextResponse.redirect(
      new URL(`${kok(PANEL_ALT)}${url.pathname}${url.search}`),
    );

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
