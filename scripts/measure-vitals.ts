// @ts-nocheck
import { chromium } from "playwright";
import { writeFileSync } from "fs";

const URLS = [
  { name: "home", url: "https://my-project-beta-ochre.vercel.app/" },
  { name: "login", url: "https://my-project-beta-ochre.vercel.app/login" },
  { name: "community-fund", url: "https://my-project-beta-ochre.vercel.app/community/fund" },
  { name: "ethics", url: "https://my-project-beta-ochre.vercel.app/ethics" },
  { name: "blog", url: "https://my-project-beta-ochre.vercel.app/blog" },
];

const PROFILES = {
  "4G": { label: "4G (9 Mbps ↓)", downloadThroughput: 9 * 1024 * 1024 / 8, uploadThroughput: 3 * 1024 * 1024 / 8, latency: 20 },
  "3G": { label: "3G (1.6 Mbps ↓)", downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 300 },
};

async function measurePage(page, url) {
  const navPromise = page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  const response = await navPromise;
  await page.waitForTimeout(2000);
  const vitals = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime;
    const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
    const lcp = lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : undefined;
    const clsEntries = performance.getEntriesByType("layout-shift");
    let cls = 0;
    for (const e of clsEntries) { if (!e.hadRecentInput) cls += e.value; }
    return { ttfb: nav?.responseStart, fcp, lcp, cls, loadTime: nav?.loadEventEnd, transferSize: nav?.transferSize };
  });
  return vitals;
}

async function runProfile(profileName, profile) {
  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║  📊 قياس Web Vitals — ${profile.label.padEnd(45)}║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝\n`);

  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const results = {};

  for (const { name, url } of URLS) {
    const page = await context.newPage();
    // Use CDP session for network emulation
    try {
      const client = await context.newCDPSession(page);
      await client.send("Network.emulateNetworkConditions", {
        offline: false,
        downloadThroughput: profile.downloadThroughput,
        uploadThroughput: profile.uploadThroughput,
        latency: profile.latency,
      });
    } catch (e) { console.log("  (network emulation not available, using default)"); }

    console.log(`📊 ${name}...`);
    try {
      const vitals = await measurePage(page, url);
      results[name] = vitals;
      console.log(`   TTFB: ${(vitals.ttfb ?? 0).toFixed(0)}ms | FCP: ${(vitals.fcp ?? 0).toFixed(0)}ms | LCP: ${(vitals.lcp ?? 0).toFixed(0)}ms | CLS: ${(vitals.cls ?? 0).toFixed(3)} | Size: ${(vitals.transferSize ?? 0).toLocaleString()}B`);
    } catch (e) {
      results[name] = { error: e.message?.substring(0, 80) };
      console.log(`   ❌ ${e.message?.substring(0, 80)}`);
    }
    await page.close();
  }

  await browser.close();
  writeFileSync(`lighthouse-vitals-${profileName}.json`, JSON.stringify(results, null, 2));
  return results;
}

async function main() {
  const results4G = await runProfile("4G", PROFILES["4G"]);
  const results3G = await runProfile("3G", PROFILES["3G"]);

  console.log("\n┌──────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐");
  console.log("│ الصفحة            │ TTFB 4G  │ FCP 4G   │ LCP 4G   │ LCP 3G   │ CLS 4G   │");
  console.log("├──────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤");
  for (const name of Object.keys(results4G)) {
    const v4 = results4G[name] ?? {};
    const v3 = results3G[name] ?? {};
    const ttfb = (v4.ttfb ?? 0).toFixed(0);
    const fcp = (v4.fcp ?? 0).toFixed(0);
    const lcp4 = (v4.lcp ?? 0).toFixed(0);
    const lcp3 = (v3.lcp ?? 0).toFixed(0);
    const cls = (v4.cls ?? 0).toFixed(3);
    console.log(`│ ${name.padEnd(16)} │ ${ttfb.padStart(8)} │ ${fcp.padStart(8)} │ ${lcp4.padStart(8)} │ ${lcp3.padStart(8)} │ ${cls.padStart(8)} │`);
  }
  console.log("└──────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘");

  console.log("\n📌 تقييم Google:");
  console.log("  LCP < 2500ms = جيد | CLS < 0.1 = جيد | TTFB < 800ms = جيد");
}

main().catch(e => { console.error("Fatal:", e.message?.substring(0, 100)); process.exit(1); });
