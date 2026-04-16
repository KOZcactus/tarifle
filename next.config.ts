import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // bf-cache: allow browsers to cache pages for back/forward navigation.
  // NextAuth's Set-Cookie still prevents full bfcache on dynamic pages,
  // but static assets and prefetch responses benefit. BfCacheRestore
  // component handles stale-session refresh client-side.
  headers: async () => [
    {
      source: "/((?!api|_next).*)",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    },
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
