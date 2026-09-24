// @ts-expect-error — أنواع Serwist للـ worker
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

/**
 * Service Worker — سيدي يوسف بن علي العاصمة
 *
 * - يُخزّن مسبقاً كل أصول Next.js المجمّعة (precache)
 * - يخزّن مؤقتاً طلبات الشبكة (runtime caching عبر defaultCache)
 * - يوفّر صفحة /~offline كصفحة احتياطية عند انقطاع الشبكة
 * - يُفعّل فوراً (clientsClaim + skipWaiting) لضمان آخر إصدار
 * - يدعم navigation preload لتسريع التنقّل
 *
 * يُجمّع بواسطة @serwist/next أثناء الـ build ويُكتب في public/sw.js
 */

declare global {
  interface WorkerOptions extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [{ url: "/~offline", matcher: /^https:\/\/.*\/.*/ }],
  },
});

serwist.addEventListeners();
