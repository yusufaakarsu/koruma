// Cloudflare Worker — Geo-routing özü
// TR'den gelen → TR sayfası
// Diğer herkes → global sayfa
// /robots.txt ve /sitemap.xml her zaman aynı (bot/SEO için geo'dan bağımsız)

const ROOT = "https://istanbulkoruma.com";

export default {
  fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/robots.txt") {
      return new Response(robots(), {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=3600, s-maxage=86400",
        },
      });
    }

    if (url.pathname === "/sitemap.xml") {
      return new Response(sitemap(), {
        headers: {
          "content-type": "application/xml; charset=utf-8",
          "cache-control": "public, max-age=3600, s-maxage=86400",
        },
      });
    }

    const country = request.cf?.country;

    if (country === "TR") {
      return new Response(trSayfa(), { headers: { "content-type": "text/html; charset=utf-8" } });
    }

    return new Response(globalSayfa(), { headers: { "content-type": "text/html; charset=utf-8" } });
  }
};

function robots() {
  return [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${ROOT}/sitemap.xml`,
  ].join("\n");
}

function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap-0.9">
  <url>
    <loc>${ROOT}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
}

function trSayfa() {
  return ``;
}

function globalSayfa() {
  return ``;
}
