import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Updated 2026-11-13: reject online editor writes; the local editor server intercepts these URLs before Next.js.
  async rewrites() {
    return [{ source: "/__editor/:path*", destination: "/api/editor/:path*" }];
  },
  // Added 2026-11-13: retain same-origin visual preview and clickjacking protection without the dev server.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }, { key: "X-Content-Type-Options", value: "nosniff" }] }];
  },
};

export default nextConfig;
