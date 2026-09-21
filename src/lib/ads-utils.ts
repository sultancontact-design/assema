// ===================================================================
//  ads-utils — أدوات مساعدة لقسم الإعلانات
//  - توليد رقم الفاتورة
//  - حساب CTR / RPM
//  - تجميع الإيرادات حسب الشهر/الباقة/الحالة
//  - إعدادات الباقات والأماكن من جدول Setting
// ===================================================================

import type { Ad, AdPackage, AdStatus } from "@prisma/client";
import {
  AD_PACKAGE_LABELS,
  AD_PLACEMENT_LABELS,
  AD_STATUS_LABELS,
} from "@/lib/constants";

const STATUS_LABELS: Record<AdStatus, string> = AD_STATUS_LABELS;

// ===================================================================
//  النوع العام للإعلان بعد تحويل التواريخ لـISO (للعميل)
// ===================================================================

export type AdRow = Omit<Ad, "startDate" | "endDate" | "createdAt" | "updatedAt"> & {
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
};

/** تحويل Ad الكامل (بـDate) إلى AdRow (بـstring) */
export function toAdRow(ad: Ad): AdRow {
  return {
    ...ad,
    startDate: ad.startDate.toISOString(),
    endDate: ad.endDate.toISOString(),
    createdAt: ad.createdAt.toISOString(),
    updatedAt: ad.updatedAt.toISOString(),
  };
}

// ===================================================================
//  رقم الفاتورة — INV-YYYY-NNN (مستمد من الـcreatedAt + معرّف)
// ===================================================================

export function generateInvoiceNumber(ad: { id: string; createdAt: Date }): string {
  const year = ad.createdAt.getFullYear();
  // استخراج آخر 6 أحرف من معرّف الإعلان (cuid) كرقم فريد
  const shortId = ad.id.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase();
  const num = shortId
    .split("")
    .map((c) => {
      const code = c.charCodeAt(0);
      // تحويل الحروف إلى أرقام (a-z → 10-35) ثم أخذ الباقي على 10
      return code > 57 ? String(code - 87) : c;
    })
    .join("")
    .slice(0, 4)
    .padStart(4, "0");
  return `INV-${year}-${num}`;
}

// ===================================================================
//  مؤشرات الأداء
// ===================================================================

export function computeCTR(views: number, clicks: number): number {
  if (!views || views <= 0) return 0;
  return (clicks / views) * 100;
}

export function computeRPM(revenue: number, views: number): number {
  if (!views || views <= 0) return 0;
  return (revenue / views) * 1000;
}

// ===================================================================
//  تجميع الإيرادات الشهرية (12 شهراً ماضية)
// ===================================================================

export function buildMonthlyRevenueSeries(
  ads: { amountPaid: number; status: AdStatus; startDate: Date }[]
): Array<{ month: string; revenue: number; impressions: number; clicks: number }> {
  const now = new Date();
  const buckets = new Map<string, { revenue: number; impressions: number; clicks: number }>();

  // تهيئة آخر 12 شهراً
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("ar-MA", { month: "short" }).format(d);
    buckets.set(key, { revenue: 0, impressions: 0, clicks: 0 });
    // نخزّن التسمية كـmeta-data
    (buckets.get(key) as { revenue: number; impressions: number; clicks: number; label?: string }).label = label;
  }

  for (const ad of ads) {
    if (ad.status !== "ACTIVE" && ad.status !== "EXPIRED") continue;
    const key = `${ad.startDate.getFullYear()}-${String(ad.startDate.getMonth() + 1).padStart(2, "0")}`;
    const b = buckets.get(key);
    if (b) {
      b.revenue += ad.amountPaid;
    }
  }

  return Array.from(buckets.entries()).map(([key, val]) => ({
    month: (val as { label?: string }).label ?? key,
    revenue: Math.round(val.revenue * 100) / 100,
    impressions: val.impressions,
    clicks: val.clicks,
  }));
}

// ===================================================================
//  تجميع الإيرادات حسب الباقة
// ===================================================================

export function buildPackageRevenueSeries(
  ads: { amountPaid: number; package: AdPackage; status: AdStatus }[]
): Array<{ name: string; revenue: number; count: number }> {
  const map = new Map<AdPackage, { revenue: number; count: number }>();
  (Object.keys(AD_PACKAGE_LABELS) as AdPackage[]).forEach((p) =>
    map.set(p, { revenue: 0, count: 0 })
  );
  for (const ad of ads) {
    if (ad.status !== "ACTIVE" && ad.status !== "EXPIRED") continue;
    const entry = map.get(ad.package);
    if (entry) {
      entry.revenue += ad.amountPaid;
      entry.count += 1;
    }
  }
  return Array.from(map.entries()).map(([pkg, val]) => ({
    name: AD_PACKAGE_LABELS[pkg].label,
    revenue: Math.round(val.revenue * 100) / 100,
    count: val.count,
  }));
}

// ===================================================================
//  توزيع الحملات حسب الحالة
// ===================================================================

export function buildStatusDistribution(
  ads: { status: AdStatus }[]
): Array<{ name: string; value: number; status: AdStatus }> {
  const map = new Map<AdStatus, number>();
  const allStatuses: AdStatus[] = [
    "DRAFT",
    "PENDING",
    "ACTIVE",
    "PAUSED",
    "EXPIRED",
    "REJECTED",
  ];
  allStatuses.forEach((s) => map.set(s, 0));
  for (const ad of ads) {
    map.set(ad.status, (map.get(ad.status) ?? 0) + 1);
  }
  // استيراد هنا يُحدث دائرية لو وضعناه بأعلى — استخدمنا AD_STATUS_LABELS داخل المُعالِج مباشرة
  return Array.from(map.entries()).map(([status, value]) => ({
    name: STATUS_LABELS[status],
    value,
    status,
  }));
}

// ===================================================================
//  ألوان الحالات للرسوم البيانية
// ===================================================================

export const STATUS_COLORS: Record<AdStatus, string> = {
  DRAFT: "#9CA3AF",
  PENDING: "#C8842A",
  ACTIVE: "#2D5A3D",
  PAUSED: "#B45309",
  EXPIRED: "#6B5D4E",
  REJECTED: "#B91C1C",
};

export const PACKAGE_COLORS: Record<AdPackage, string> = {
  BRONZE: "#8B5A2B",
  SILVER: "#9CA3AF",
  GOLD: "#C8842A",
  PLATINUM: "#6B7280",
  SPONSOR: "#2D5A3D",
};

// ===================================================================
//  الحصول على الباقة المُعدَّلة (من Settings إن وُجدت)
// ===================================================================

export interface PackageMeta {
  label: string;
  price: number;
  duration: string;
}

export function getPackageMeta(
  pkg: AdPackage,
  overrides: { price?: number; duration?: string } | null
): PackageMeta {
  const base = AD_PACKAGE_LABELS[pkg];
  return {
    label: base.label,
    price: overrides?.price ?? base.price,
    duration: overrides?.duration ?? base.duration,
  };
}

// ===================================================================
//  أماكن الإعلانات — قائمة ثابتة كاملة
// ===================================================================

export const ALL_PLACEMENTS = Object.keys(AD_PLACEMENT_LABELS);

/** أبعاد العرض المرئية لكل مكان (نسبة قُربانية) */
export const PLACEMENT_PREVIEW: Record<string, { w: number; h: number; label: string }> = {
  header: { w: 728, h: 90, label: "728×90" },
  sidebar: { w: 300, h: 250, label: "300×250" },
  "in-feed": { w: 600, h: 200, label: "600×200" },
  "in-article": { w: 468, h: 120, label: "468×120" },
  footer: { w: 728, h: 90, label: "728×90" },
  popup: { w: 400, h: 300, label: "400×300" },
  sticky: { w: 320, h: 50, label: "320×50" },
  "event-page": { w: 300, h: 250, label: "300×250" },
  "group-page": { w: 300, h: 250, label: "300×250" },
  "market-page": { w: 250, h: 250, label: "250×250" },
  newsletter: { w: 600, h: 100, label: "600×100" },
};

// ===================================================================
//  اختصار للنص الطويل
// ===================================================================

export function truncate(str: string, max = 40): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "…";
}

// ===================================================================
//  أسماء الأدوار/الأذونات المعتمدة في قسم الإعلانات
// ===================================================================

export const ADS_ROLES = ["SUPER_ADMIN", "ADS_MANAGER"] as const;
