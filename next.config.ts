import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage'daki ilan fotoğrafları
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Kiralanmamış kartlar için placeholder
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
};

export default nextConfig;
