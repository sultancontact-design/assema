#!/usr/bin/env bun
/**
 * سكريبت قياس Web Vitals عبر Playwright
 * يقيس LCP, FID/INP, CLS, TTFB على 5 صفحات
 */
import { chromium } from "playwright";
import { writeFileSync } from "fs";

const URLS = [
  { name: "home", url: "http://localhost:3000/" },
  { name: "login", url: "http://localhost:3000/login" },
  { name: "community-fund", url: "http://localhost:3000/community/fund" },
  { name: "page-403", url: "http://localhost:3000/403?ip=192.168.1.100" },
  { name: "demo-access", url: "http://localhost:3000/demo-access" },
];

interface Vitals {
  lcp?: number;
  fid?: number;
  inp?: number;
  cls?: number;
  ttfb?: number;
  fcp?: number;
  loadTime?: number;
  domContentLoaded?: number;
  transferSize?: number;
  error?: string;
}

async function measurePage(page, url: string): Promise<Vitals> {
  const vitals: Vitals = {};

  // حقن سكريبت web-vitals قبل تحميل أي شيء
  await page.addInitScript(() => {
    (window as any).__vitals = {};
    // استخدام PerformanceObserver لقياس LCP, CLS, FID/INP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const last = entries[entries.length - 1];
        (window as any).__vitals.lcp = last.startTime;
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });

    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        let cls = 0;
        for (const entry of entries) {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        }
        (window as any).__vitals.cls = cls;
      }
    }).observe({ type: "layout-shift", buffered: true });

    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        (window as any).__vitals.inp = entries[0].processingStart - entries[0].startTime;
      }
    }).observe({ type: "first-input", buffered: true });
  });

  // الانتقال والقياس
  const start = Date.now();
  try {
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    const navTiming = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      const ttfb = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming)?.responseStart;
      const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime;
      const vitals = (window as any).__vitals || {};
      return {
        ttfb: nav?.responseStart,
        fcp: fcp,
        domContentLoaded: nav?.domContentLoadedEventEnd,
        loadTime: nav?.loadEventEnd,
        transferSize: nav?.transferSize,
        lcp: vitals.lcp,
        cls: vitals.cls,
        inp: vitals.inp,
      };
    });
    return {
      ...navTiming,
      lcp: navTiming.lcp,
      cls: navTiming.cls,
      inp: navTiming.inp,
      ttfb: navTiming.ttfb,
      fcp: navTiming.fcp,
      loadTime: navTiming.loadTime,
      domContentLoaded: navTiming.domContentLoaded,
      transferSize: navTiming.transferSize,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "navigation failed" };
  }
}

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║  📊 قياس Web Vitals — سيدي يوسف بن علي العاصمة                 ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const results: Record<string, Vitals> = {};

  for (const { name, url } of URLS) {
    const page = await context.newPage();
    console.log(`📊 قياس: ${name} (${url})`);
    const vitals = await measurePage(page, url);
    results[name] = vitals;

    if (vitals.error) {
      console.log(`   ❌ خطأ: ${vitals.error}\n`);
    } else {
      console.log(`   TTFB:  ${vitals.ttfb?.toFixed(0) ?? "—"} ms`);
      console.log(`   FCP:   ${vitals.fcp?.toFixed(0) ?? "—"} ms`);
      console.log(`   LCP:   ${vitals.lcp?.toFixed(0) ?? "—"} ms`);
      console.log(`   CLS:   ${vitals.cls?.toFixed(3) ?? "—"}`);
      console.log(`   INP:   ${vitals.inp?.toFixed(0) ?? "—"} ms`);
      console.log(`   Load:  ${vitals.loadTime?.toFixed(0) ?? "—"} ms`);
      console.log(`   Size:  ${(vitals.transferSize ?? 0).toLocaleString()} bytes\n`);
    }
    await page.close();
  }

  await browser.close();

  // حفظ النتائج في JSON
  writeFileSync("lighthouse-vitals.json", JSON.stringify(results, null, 2));
  console.log("✅ تم حفظ النتائج في lighthouse-vitals.json\n");

  // جدول نهائي
  console.log("┌──────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐");
  console.log("│ الصفحة            │ TTFB     │ FCP      │ LCP      │ CLS      │ INP      │");
  console.log("├──────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤");
  for (const [name, v] of Object.entries(results)) {
    const row = `│ ${name.padEnd(16)} │ ${(v.ttfb?.toFixed(0) ?? "—").padStart(8)} │ ${(v.fcp?.toFixed(0) ?? "—").padStart(8)} │ ${(v.lcp?.toFixed(0) ?? "—").padStart(8)} │ ${(v.cls?.toFixed(3) ?? "—").padStart(8)} │ ${(v.inp?.toFixed(0) ?? "—").padStart(8)} │`;
    console.log(row);
  }
  console.log("└──────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘");

  // تقييم النتائج
  console.log("\n📌 التقييم (حسب توصيات Google):");
  let allGood = true;
  for (const [name, v] of Object.entries(results)) {
    const issues: string[] = [];
    if (v.lcp && v.lcp > 2500) issues.push("LCP بطيء (>2.5s)");
    if (v.cls && v.cls > 0.1) issues.push("CLS مرتفع (>0.1)");
    if (v.ttfb && v.ttfb > 800) issues.push("TTFB بطيء (>800ms)");
    if (issues.length > 0) {
      console.log(`  ⚠️  ${name}: ${issues.join(", ")}`);
      allGood = false;
    } else {
      console.log(`  ✅ ${name}: جميع المقاييس ضمن المعدّل`);
    }
  }
  if (allGood) console.log("\n🎉 كل الصفحات ضمن المعدّل الموصى به!");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
