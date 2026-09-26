import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

/**
 * Serwist — PWA لـ Next.js 16 + Turbopack
 * - swSrc: الكود المصدري للـ Service Worker (TypeScript)
 * - swDest: المخرَج النهائي (public/sw.js) — يُخدَم من جذر الموقع
 * - يُعطّل في وضع التطوير لتفادي تخزين مؤقت مزعج أثناء الـ HMR
 *
 * ملاحظة Turbopack: Next 16 يستخدم Turbopack افتراضياً في الـ dev.
 * Serwist يضيف `webpack` config لـ SW build (يُستعمل أثناء `next build`
 * على Vercel حيث يبقى webpack هو المُجمِّع الافتراضي للإنتاج). نضيف
 * `turbopack: {}` فارغاً لإسكات تحذير Next حول webpack config تحت Turbopack.
 */
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  turbopack: {},
  // v32.0: redirect old flat map → 3D map
  async redirects() {
    return [
      { source: "/community/map", destination: "/community/map-3d", permanent: true },
    ];
  },
};

export default withSerwist(nextConfig);
