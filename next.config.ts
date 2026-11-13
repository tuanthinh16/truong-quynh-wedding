import type { NextConfig } from "next";
import { imageSettings } from "./src/lib/image-settings.mjs";

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
    return [
      { source: "/:path*", headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }, { key: "X-Content-Type-Options", value: "nosniff" }] },
      // Added 2026-11-13: hashed responsive images and UUID uploads are versioned, safe for browser/CDN immutable caching.
      { source: "/optimized/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/uploads/editor/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
  // Added 2026-11-13: match build-time responsive variants; newly uploaded preview images retain the Next optimizer fallback.
  images: { deviceSizes: imageSettings.deviceSizes, imageSizes: imageSettings.imageSizes, minimumCacheTTL: 86400 },
  // Added 2026-11-13: ship server-read wedding content to Vercel without importing editable JSON into the HMR graph.
  outputFileTracingIncludes: { "/*": ["./src/data/wedding.json"] },
};

export default nextConfig;
