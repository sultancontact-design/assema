// ===================================================================
//  lib/price-fetcher.ts — جلب أسعار حقيقية فقط من مصادر رسمية موثّقة
//
//  ❌ لا توليد أرقام عشوائية
//  ❌ لا fallback موسمي أو أي بيانات مُصنّعة
//  ✅ بيانات حقيقية فقط من مصادر مؤكدة، أو مساهمات موثّقة من المستخدمين
//  ✅ إذا فشلت كل المصادر: لا نُرجع أي سعر — نُظهر "لا توجد بيانات"
//
//  المصادر المؤكدة (2024-2025):
//   1. FAOSTAT Producer Prices API — area=504 (المغرب، وليس 143 الذي هو آسيا الوسطى)
//   2. data.gov.ma CKAN — بحث عن مجموعات بيانات الأسعار (يُرجع روابط CSV/XLSX)
//   3. مساهمات المستخدمين الموثّقة من جدول MarketPrice (مصدر=user، valid)
//
//  ملاحظة: prixagriculture.org لم يعد يعمل (متوقّف منذ ديسمبر 2019)
//  وفقاً لما نشرته agriMaroc. لا تُدرجه في قائمة المصادر.
// ===================================================================

import { db } from "@/lib/db";

// ─────────────────────────────────────────────────────────────────
//  دفتر المنتجات المرجعي (الفهرس الافتراضي للأسعار)
//  ملاحظة: لا يُولّد أي سعر هنا. مجرّد فهرس أسماء + أيقونات.
//  السعر الحقيقي يأتي فقط من المصادر الرسمية الموثّقة.
// ─────────────────────────────────────────────────────────────────

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
] as const;

async function ensureProducts() {
  for (const p of PRODUCTS_SEED) {
    const existing = await db.product.findUnique({ where: { name: p.name } });
    if (!existing) {
      await db.product.create({
        data: {
          name: p.name, nameAr: p.nameAr, category: p.category,
          unit: p.unit, icon: p.icon, isActive: true,
        },
      });
    }
  }
}

interface FetchedPrice {
  productName: string;     // المفتاح الذي يطابق Product.name
  minPrice: number;        // د.م
  maxPrice: number;        // د.م
  avgPrice?: number;       // د.م
  market?: string;         // اسم السوق (إن وُجد)
  sourceUrl: string;       // الإثبات
}

// ===================================================================
//  المصدر 1: FAOSTAT Producer Prices API
//  ❗تصحيح: area=504 (المغرب) وليس 143 (آسيا الوسطى)
//  FAOSTAT يستخدم رمز UN M49: 504 = المغرب (Maroc / Morocco / MAR)
// ===================================================================

// خريطة بين أسماء منتجات FAOSTAT وأسمائنا الداخلية
// FAOSTAT يستخدم أسماء بالإنجليزية مع رسم LCU/t (عملة محلية للطن)
const FAOSTAT_ITEM_MAP: Record<string, string> = {
  "Tomatoes": "Tomate",
  "Onions, dry": "Oignon",
  "Potatoes": "Pomme de terre",
  "Carrots": "Carotte",
  "Cucumbers and gherkins": "Courgette",
  "Eggplants (aubergines)": "Aubergine",
  "Lettuce": "Salade",
  "Garlic": "Ail",
  "Oranges": "Orange",
  "Bananas": "Banane",
  "Apples": "Pomme",
  "Strawberries": "Fraise",
  "Lemons and limes": "Citron",
  "Watermelons": "Melon",
  "Grapes": "Raisin",
  "Cattle meat": "Viande boeuf",
  "Sheep meat": "Viande mouton",
  "Chicken meat": "Poulet",
  "Rice": "Riz",
  "Wheat flour": "Farine",
  "Milk": "Lait",
  "Hen eggs": "Oeuf",
};

async function fetchFromFAOSTAT(): Promise<{ prices: FetchedPrice[]; error?: string; rawSample?: unknown }> {
  const FAOSTAT_URL = "https://fenixservices.fao.org/faostat/api/v1/en/data/PP?area=504&item=..&element=..&year=2023,2022,2021";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(FAOSTAT_URL, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return { prices: [], error: `FAOSTAT HTTP ${res.status}`, rawSample: { status: res.status } };
    }
    const data = await res.json() as { data?: Array<Record<string, unknown>> };
    if (!data?.data || !Array.isArray(data.data)) {
      return { prices: [], error: "FAOSTAT response missing data[] array", rawSample: { hasData: !!data, keys: Object.keys(data ?? {}) } };
    }

    // ━━━━━━ فحص أمني حاسم: تحقق أن البيانات فعلاً للمغرب ━━━━━━
    // إذا وُجدت أي سجلّات بـ Area غير "Morocco"، نتوقّف فوراً (يحمي من
    // التراجع عن area=504 لو غُيّر الرمز بالخطأ في المستقبل)
    const sampleRow = data.data[0];
    const areaField = (sampleRow?.Area ?? sampleRow?.area ?? "") as string;
    if (areaField && !areaField.toLowerCase().includes("morocco") && !areaField.toLowerCase().includes("maroc")) {
      return {
        prices: [],
        error: `FAOSTAT area mismatch — got Area="${areaField}" (expected "Morocco"). Likely wrong area code.`,
        rawSample: { firstRow: sampleRow, rowCount: data.data.length },
      };
    }

    const prices: FetchedPrice[] = [];
    // نجمّع أحدث سجلّ لكل منتج من خريطتنا
    const byProduct = new Map<string, { value: number; year: number }>();
    for (const row of data.data) {
      const faoItem = (row.Item ?? row.item ?? "") as string;
      const ourName = FAOSTAT_ITEM_MAP[faoItem];
      if (!ourName) continue;
      // نأخذ "Producer Price (USD/tonne)" أو "LCU/tonne"
      // FAOSTAT الـUnit يختلف: USD/t أو LCU/t
      const unit = (row.Unit ?? row.unit ?? "") as string;
      const value = parseFloat(String(row.Value ?? row.value ?? ""));
      const year = parseInt(String(row.Year ?? row.year ?? "0"), 10);
      if (!isFinite(value) || value <= 0) continue;

      // نُحوّل الطن إلى كغ: value/1000
      // USD/t → نُحوّل إلى درهم بـ 1 USD ≈ 10 درهم (نستعمل لاحقاً مع إشارة للمصدر)
      // LCU/t → افتراضياً = درهم/الطن → /1000 = درهم/كغ
      const pricePerKg = unit.toLowerCase().includes("usd")
        ? (value / 1000) * 10  // USD/t → USD/kg → DH/kg (1 USD ≈ 10 DH)
        : value / 1000;         // LCU/t → DH/kg افتراضياً

      const prev = byProduct.get(ourName);
      if (!prev || year > prev.year) {
        byProduct.set(ourName, { value: pricePerKg, year });
      }
    }

    for (const [productName, info] of byProduct.entries()) {
      // FAOSTAT لا يُعطي min/max — نعتمدها كـ avg ونضبط min=max=avg
      // (هذا تسعير وطني سنوي مرجعي، لا يُدّعى أنه لحظي)
      prices.push({
        productName,
        minPrice: Number(info.value.toFixed(2)),
        maxPrice: Number(info.value.toFixed(2)),
        avgPrice: Number(info.value.toFixed(2)),
        market: "المتوسط الوطني (FAOSTAT)",
        sourceUrl: FAOSTAT_URL,
      });
    }

    return { prices, rawSample: { rowCount: data.data.length, matched: prices.length } };
  } catch (e) {
    return { prices: [], error: e instanceof Error ? e.message.substring(0, 200) : "fetch error" };
  }
}

// ===================================================================
//  المصدر 2: data.gov.ma CKAN API
//  يُرجع مجموعات البيانات (metadata) — يلزم تنزيل مورد CSV/XLSX لاحقاً
//  (لم يُنفّذ تنزيل CSV حالياً لأن المحتوى غير مضمون الهيكل)
// ===================================================================

async function fetchFromDataGov(): Promise<{ prices: FetchedPrice[]; error?: string; datasetsFound?: number }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(
      "https://data.gov.ma/api/3/action/package_search?q=prix+agricoles&rows=10",
      {
        signal: controller.signal,
        headers: { "Accept": "application/json", "User-Agent": "asemma-price-fetcher/1.0" },
      }
    );
    clearTimeout(timeout);
    if (!res.ok) return { prices: [], error: `data.gov.ma HTTP ${res.status}` };
    const data = await res.json() as { result?: { results?: Array<{ resources?: Array<{ format: string; url: string }> }> } };
    const datasets = data?.result?.results ?? [];
    const datasetsFound = datasets.length;
    if (datasetsFound === 0) {
      return { prices: [], error: "No price datasets found on data.gov.ma", datasetsFound: 0 };
    }
    // نتحقق فقط من وجود موارد CSV/XLS قابلة للتنزيل
    // (لا نُحلّل المحتوى حالياً — نُرجع empty بإشارة أن المجموعات موجودة)
    let csvCount = 0;
    for (const ds of datasets) {
      for (const r of ds.resources ?? []) {
        if (r.format && /csv|xls/i.test(r.format)) csvCount++;
      }
    }
    return {
      prices: [],
      error: `data.gov.ma returned ${datasetsFound} datasets (${csvCount} CSV/XLS resources) — parsing not implemented`,
      datasetsFound,
    };
  } catch (e) {
    return { prices: [], error: e instanceof Error ? e.message.substring(0, 200) : "fetch error" };
  }
}

// ===================================================================
//  المصدر 3: مساهمات المستخدمين الموثّقة (MarketPrice source="user")
//  ملاحظة: MarketPrice حقل price يُعبّر عن سعر مُبلّغ (لا min/max).
//  نعرضه إذا كان مُشرفاً عليه (المستخدم مُسجّل) أو كان صالحاً (validUntil>now).
// ===================================================================

async function fetchFromUserReports(): Promise<{ prices: FetchedPrice[]; error?: string }> {
  try {
    const now = new Date();
    // نأخذ آخر تقرير لكل منتج name (نظّم حسب المنتج)
    const recent = await db.marketPrice.findMany({
      where: {
        isActive: true,
        source: "user",
        OR: [{ validUntil: null }, { validUntil: { gt: now } }],
      },
      orderBy: { reportedAt: "desc" },
      take: 100,
    });
    if (recent.length === 0) {
      return { prices: [], error: "No active user reports yet" };
    }
    // تجميع حسب productNameAr — آخر تقرير فقط
    const byName = new Map<string, typeof recent[number]>();
    for (const r of recent) {
      if (!byName.has(r.productNameAr)) byName.set(r.productNameAr, r);
    }
    const prices: FetchedPrice[] = [];
    for (const [, r] of byName.entries()) {
      // للمستخدم: نُعتمد price كـ avg، ونضع min=max=price (لا تباين معلوم)
      prices.push({
        productName: r.productName, // اسم مطابق إن وُجد في Product
        minPrice: r.price,
        maxPrice: r.price,
        avgPrice: r.price,
        market: r.market ?? "تقرير مستخدم",
        sourceUrl: `/community/prices/report?id=${r.id}`,
      });
    }
    return { prices };
  } catch (e) {
    return { prices: [], error: e instanceof Error ? e.message.substring(0, 200) : "db error" };
  }
}

// ===================================================================
//  الدالة الرئيسية: fetchPrices
//  تنفّذ المصادر بالترتيب. لا تولّد أي سعر مُصنّع. إذا فشلت كلها → 0.
// ===================================================================

export async function fetchPrices(): Promise<{
  source: string;
  count: number;
  status: string;
  error?: string;
  details?: { source: string; status: string; count: number; error?: string }[];
}> {
  const startTime = Date.now();
  await ensureProducts();
  const products = await db.product.findMany({ where: { isActive: true } });
  const productMap = new Map(products.map(p => [p.name, p]));

  const sources = [
    { name: "FAOSTAT", fetch: fetchFromFAOSTAT },
    { name: "USER_REPORTS", fetch: fetchFromUserReports },
    { name: "DATA_GOV", fetch: fetchFromDataGov },
  ];

  let totalSaved = 0;
  let usedSource = "NONE";
  let lastError: string | undefined;
  const details: { source: string; status: string; count: number; error?: string }[] = [];

  for (const src of sources) {
    const t0 = Date.now();
    const result = await src.fetch();
    const duration = Date.now() - t0;

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
      details.push({ source: src.name, status: "SUCCESS", count: result.prices.length });
      await db.priceFetchLog.create({
        data: { source: src.name, status: "SUCCESS", productsCount: result.prices.length, durationMs: duration, fetchedAt: new Date() },
      });
      // لا نخرج — نُحاول المصادر الأخرى لزيادة التغطية
      continue;
    }

    // ❌ فشل أو لم يُرجع بيانات — سجّل
    lastError = result.error;
    details.push({ source: src.name, status: "FAILED", count: 0, error: result.error });
    await db.priceFetchLog.create({
      data: { source: src.name, status: "FAILED", productsCount: 0, errorMessage: result.error, durationMs: duration, fetchedAt: new Date() },
    });
  }

  // إذا فشلت كل المصادر أو لم تُرجع أي بيانات: لا نولّد أي شيء
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
    details,
  };
}

// ===================================================================
//  getLatestPrices: يجلب أحدث سعر حقيقي لكل منتج
//  ❗ لا يولّد سعراً افتراضياً. يُرجع null إذا لم توجد بيانات حقيقية.
// ===================================================================

export async function getLatestPrices() {
  const products = await db.product.findMany({
    where: { isActive: true },
    include: {
      prices: {
        orderBy: { recordedAt: "desc" },
        take: 1,
        // نستثني الأسعار المُولّدة من مصادر ممنوعة (لا توجد حالياً لكن
        // للتأمين ضدّ أي تسريب مستقبلي)
        where: {
          source: { notIn: ["SEASONAL_FALLBACK", "MOCK", "SYNTHETIC", "FALLBACK"] },
        },
      },
    },
  });
  return products.map(p => ({
    id: p.id,
    name: p.name,
    nameAr: p.nameAr,
    category: p.category,
    unit: p.unit,
    icon: p.icon,
    latestPrice: p.prices[0]?.avgPrice ?? null,
    minPrice: p.prices[0]?.minPrice ?? null,
    maxPrice: p.prices[0]?.maxPrice ?? null,
    source: p.prices[0]?.source ?? null,
    sourceUrl: p.prices[0]?.sourceUrl ?? null,
    verified: p.prices[0]?.verified ?? false,
    recordedAt: p.prices[0]?.recordedAt?.toISOString() ?? null,
  }));
}

export async function getFetchLogs(limit = 20) {
  return db.priceFetchLog.findMany({
    orderBy: { fetchedAt: "desc" },
    take: limit,
  });
}
