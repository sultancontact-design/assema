// ===================================================================
//  lib/price-fetcher.ts — جلب أسعار حقيقية فقط من مصادر رسمية
//  ❌ لا توليد أرقام عشوائية
//  ❌ لا fallback موسمي
//  ✅ بيانات حقيقية فقط أو "لا توجد بيانات"
// ===================================================================

import { db } from "@/lib/db";

const PRODUCTS_SEED = [
  { name: "Tomate", nameAr: "طماطم", category: "VEGETABLE", unit: "KG", icon: "🍅" },
  { name: "Oignon", nameAr: "بصل", category: "VEGETABLE", unit: "KG", icon: "🧅" },
  { name: "Pomme de terre", nameAr: "بطاطا", category: "VEGETABLE", unit: "KG", icon: "🥔" },
  { name: "Carotte", nameAr: "جزر", category: "VEGETABLE", unit: "KG", icon: "🥕" },
  { name: "Courgette", nameAr: "كوسا", category: "VEGETABLE", unit: "KG", icon: "🥒" },
  { name: "Poivron", nameAr: "فلفل", category: "VEGETABLE", unit: "KG", icon: "🫑" },
  { name: "Aubergine", nameAr: "باذنجان", category: "VEGETABLE", unit: "KG", icon: "🍆" },
  { name: "Salade", nameAr: "خس", category: "VEGETABLE", unit: "PIECE", icon: "🥬" },
  { name: "Ail", nameAr: "ثوم", category: "VEGETABLE", unit: "KG", icon: "🧄" },
  { name: "Persil", nameAr: "بقدونس", category: "VEGETABLE", unit: "BUNCH", icon: "🌿" },
  { name: "Orange", nameAr: "برتقال", category: "FRUIT", unit: "KG", icon: "🍊" },
  { name: "Banane", nameAr: "موز", category: "FRUIT", unit: "KG", icon: "🍌" },
  { name: "Pomme", nameAr: "تفاح", category: "FRUIT", unit: "KG", icon: "🍎" },
  { name: "Fraise", nameAr: "فراولة", category: "FRUIT", unit: "KG", icon: "🍓" },
  { name: "Citron", nameAr: "ليمون", category: "FRUIT", unit: "KG", icon: "🍋" },
  { name: "Melon", nameAr: "بطيخ", category: "FRUIT", unit: "KG", icon: "🍈" },
  { name: "Raisin", nameAr: "عنب", category: "FRUIT", unit: "KG", icon: "🍇" },
  { name: "Viande boeuf", nameAr: "لحم بقري", category: "MEAT", unit: "KG", icon: "🥩" },
  { name: "Viande mouton", nameAr: "لحم غنم", category: "MEAT", unit: "KG", icon: "🍖" },
  { name: "Poulet", nameAr: "دجاج", category: "MEAT", unit: "KG", icon: "🍗" },
  { name: "Pain", nameAr: "خبز", category: "GRAIN", unit: "PIECE", icon: "🍞" },
  { name: "Riz", nameAr: "أرز", category: "GRAIN", unit: "KG", icon: "🍚" },
  { name: "Farine", nameAr: "دقيق", category: "GRAIN", unit: "KG", icon: "🌾" },
  { name: "Lait", nameAr: "حليب", category: "DAIRY", unit: "LITER", icon: "🥛" },
  { name: "Oeuf", nameAr: "بيض", category: "DAIRY", unit: "DOZEN", icon: "🥚" },
];

async function ensureProducts() {
  for (const p of PRODUCTS_SEED) {
    const existing = await db.product.findUnique({ where: { name: p.name } });
    if (!existing) {
      await db.product.create({
        data: { name: p.name, nameAr: p.nameAr, category: p.category, unit: p.unit, icon: p.icon, isActive: true },
      });
    }
  }
}

interface FetchedPrice {
  productName: string;
  minPrice: number;
  maxPrice: number;
  avgPrice?: number;
  market?: string;
  sourceUrl: string;
}

// ─── المصدر 1: prixagriculture.org ───
async function fetchFromPrixAgriculture(): Promise<{ prices: FetchedPrice[]; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch("https://www.prixagriculture.org/prix-des-produits", {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    clearTimeout(timeout);
    if (!res.ok) return { prices: [], error: `HTTP ${res.status}` };
    const html = await res.text();
    // Parse HTML table for prices
    // Pattern: product name + price columns (min, max, moy)
    const prices: FetchedPrice[] = [];
    // Look for table rows with price data
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(html)) !== null) {
      const cells: string[] = [];
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
        cells.push(cellMatch[1].replace(/<[^>]*>/g, "").trim());
      }
      // Look for rows with: product name, min price, max price
      if (cells.length >= 3) {
        const nameMatch = PRODUCTS_SEED.find(p =>
          cells[0].toLowerCase().includes(p.name.toLowerCase()) ||
          cells.some(c => c.includes(p.nameAr))
        );
        if (nameMatch) {
          const parseNum = (s: string) => {
            const m = s.match(/[\d,.]+/);
            if (!m) return null;
            return parseFloat(m[0].replace(",", "."));
          };
          const min = parseNum(cells[1]);
          const max = parseNum(cells[2]);
          const avg = cells.length > 3 ? parseNum(cells[3]) : null;
          if (min !== null && max !== null && min > 0 && max > 0) {
            prices.push({
              productName: nameMatch.name,
              minPrice: min, maxPrice: max,
              avgPrice: avg ?? undefined,
              market: "Marché national",
              sourceUrl: "https://www.prixagriculture.org/prix-des-produits",
            });
          }
        }
      }
    }
    return { prices };
  } catch (e) {
    return { prices: [], error: e instanceof Error ? e.message.substring(0, 100) : "fetch error" };
  }
}

// ─── المصدر 2: data.gov.ma CKAN ───
async function fetchFromDataGov(): Promise<{ prices: FetchedPrice[]; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch("https://data.gov.ma/api/3/action/package_search?q=prix+agricoles", {
      signal: controller.signal,
      headers: { "Accept": "application/json" },
    });
    clearTimeout(timeout);
    if (!res.ok) return { prices: [], error: `HTTP ${res.status}` };
    // CKAN returns dataset metadata, not prices directly
    // Would need to find the resource URL and download CSV/XLS
    // For now: check if datasets exist
    const data = await res.json();
    if (data?.result?.results?.length > 0) {
      // Datasets exist but need resource download + CSV parse
      return { prices: [], error: "Datasets found but resource parsing not implemented" };
    }
    return { prices: [], error: "No price datasets found" };
  } catch (e) {
    return { prices: [], error: e instanceof Error ? e.message.substring(0, 100) : "fetch error" };
  }
}

// ─── المصدر 3: FAOSTAT API ───
async function fetchFromFAOSTAT(): Promise<{ prices: FetchedPrice[]; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    // FAOSTAT Producer Prices for Morocco (area=143)
    const res = await fetch(
      "https://fenixservices.fao.org/faostat/api/v1/en/data/PP?area=143&item=..&element=..&year=2023",
      { signal: controller.signal, headers: { "Accept": "application/json" } }
    );
    clearTimeout(timeout);
    if (!res.ok) return { prices: [], error: `HTTP ${res.status}` };
    const data = await res.json();
    const prices: FetchedPrice[] = [];
    if (data?.data) {
      for (const row of data.data) {
        const productName = row?.Item;
        const priceValue = parseFloat(row?.Value);
        if (productName && priceValue > 0) {
          const matched = PRODUCTS_SEED.find(p =>
            productName.toLowerCase().includes(p.name.toLowerCase())
          );
          if (matched) {
            prices.push({
              productName: matched.name,
              minPrice: priceValue / 1000, // FAOSTAT uses per tonne
              maxPrice: priceValue / 1000,
              avgPrice: priceValue / 1000,
              market: "FAOSTAT",
              sourceUrl: "https://fenixservices.fao.org/faostat",
            });
          }
        }
      }
    }
    return { prices };
  } catch (e) {
    return { prices: [], error: e instanceof Error ? e.message.substring(0, 100) : "fetch error" };
  }
}

// ─── Main fetch function ───
export async function fetchPrices(): Promise<{ source: string; count: number; status: string; error?: string }> {
  const startTime = Date.now();
  await ensureProducts();
  const products = await db.product.findMany({ where: { isActive: true } });
  const productMap = new Map(products.map(p => [p.name, p]));

  const sources = [
    { name: "PRIXAGRICULTURE", fetch: fetchFromPrixAgriculture },
    { name: "FAOSTAT", fetch: fetchFromFAOSTAT },
    { name: "DATA_GOV", fetch: fetchFromDataGov },
  ];

  let totalSaved = 0;
  let usedSource = "NONE";
  let lastError: string | undefined;

  for (const src of sources) {
    const result = await src.fetch();
    const duration = Date.now() - startTime;

    if (result.prices.length > 0) {
      // ✅ أسعار حقيقية — احفظها
      for (const fp of result.prices) {
        const product = productMap.get(fp.productName);
        if (product) {
          await db.price.create({
            data: {
              productId: product.id,
              minPrice: fp.minPrice,
              maxPrice: fp.maxPrice,
              avgPrice: fp.avgPrice ?? (fp.minPrice + fp.maxPrice) / 2,
              unit: product.unit,
              source: src.name,
              sourceUrl: fp.sourceUrl,
              verified: true,
              recordedAt: new Date(),
            },
          });
          totalSaved++;
        }
      }
      usedSource = src.name;
      await db.priceFetchLog.create({
        data: { source: src.name, status: "SUCCESS", productsCount: result.prices.length, durationMs: duration, fetchedAt: new Date() },
      });
      break; // نجح — لا حاجة لمصادر أخرى
    }

    // ❌ فشل — سجّل
    lastError = result.error;
    await db.priceFetchLog.create({
      data: { source: src.name, status: "FAILED", productsCount: 0, errorMessage: result.error, durationMs: duration, fetchedAt: new Date() },
    });
  }

  // إذا فشلت كل المصادر: لا نولّد أي بيانات
  if (totalSaved === 0) {
    await db.priceFetchLog.create({
      data: {
        source: "ALL_FAILED",
        status: "FAILED",
        productsCount: 0,
        errorMessage: `All sources failed. Last error: ${lastError ?? "unknown"}. No prices generated.`,
        durationMs: Date.now() - startTime,
        fetchedAt: new Date(),
      },
    });
  }

  return {
    source: usedSource,
    count: totalSaved,
    status: totalSaved > 0 ? "SUCCESS" : "FAILED",
    error: totalSaved > 0 ? undefined : lastError,
  };
}

export async function getLatestPrices() {
  const products = await db.product.findMany({
    where: { isActive: true },
    include: { prices: { orderBy: { recordedAt: "desc" }, take: 1 } },
  });
  return products.map(p => ({
    id: p.id, name: p.name, nameAr: p.nameAr, category: p.category,
    unit: p.unit, icon: p.icon,
    latestPrice: p.prices[0]?.avgPrice ?? null,
    minPrice: p.prices[0]?.minPrice ?? null,
    maxPrice: p.prices[0]?.maxPrice ?? null,
    source: p.prices[0]?.source ?? null,
    recordedAt: p.prices[0]?.recordedAt?.toISOString() ?? null,
  }));
}

export async function getFetchLogs(limit = 20) {
  return db.priceFetchLog.findMany({ orderBy: { fetchedAt: "desc" }, take: limit });
}
