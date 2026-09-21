// ===================================================================
//  صفحة تقارير الإعلانات — /admin/ads/reports
//  Server Component — يقرأ from/to/period من البحث، يجمع البيانات
// ===================================================================

import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import { ReportsClient, type ReportsData } from "@/components/admin/ads/reports-client";
import { AD_PACKAGE_LABELS, AD_STATUS_LABELS } from "@/lib/constants";
import {
  buildPackageRevenueSeries,
  buildStatusDistribution,
  computeCTR,
  computeRPM,
} from "@/lib/ads-utils";
import type { NextRequest } from "next/server";
import type { AdPackage, AdStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminAdsReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; period?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!hasPermission(user.role, "ad.view")) return null;

  const params = await searchParams;
  const now = new Date();
  const defaultTo = now.toISOString().slice(0, 10);
  const defaultFrom = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
  const fromStr = params.from ?? defaultFrom;
  const toStr = params.to ?? defaultTo;
  const period = params.period ?? "monthly";

  const from = new Date(fromStr);
  const to = new Date(toStr);

  // حساب الفترة السابقة (نفس الطول)
  const durationMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - durationMs);

  // جلب كل الإعلانات (للجدول الزمني الكامل)
  const allAds = await db.ad.findMany({
    where: { districtId: user.districtId ?? "" },
    take: 500,
  });

  // فلترة للفترة الحالية
  const currentAds = allAds.filter((a) => {
    const c = new Date(a.createdAt);
    return c >= from && c <= to;
  });

  // فلترة للفترة السابقة
  const previousAds = allAds.filter((a) => {
    const c = new Date(a.createdAt);
    return c >= prevFrom && c <= prevTo;
  });

  function computeStats(ads: typeof allAds) {
    const revenue = ads
      .filter((a) => a.status === "ACTIVE" || a.status === "EXPIRED")
      .reduce((s, a) => s + a.amountPaid, 0);
    const impressions = ads.reduce((s, a) => s + a.views, 0);
    const clicks = ads.reduce((s, a) => s + a.clicks, 0);
    const ctr = computeCTR(impressions, clicks);
    const rpm = computeRPM(revenue, impressions);
    return { revenue, impressions, clicks, ctr, rpm };
  }

  const stats = computeStats(currentAds);
  const previousStats = computeStats(previousAds);

  // السلاسل الزمنية حسب الفترة
  const monthsMap = new Map<string, number>();
  const months: string[] = [];
  // نولّد 12 شهراً افتراضياً قبل تاريخ to
  for (let i = 11; i >= 0; i--) {
    const d = new Date(to.getFullYear(), to.getMonth() - i, 1);
    const label = new Intl.DateTimeFormat("ar-MA", { month: "short" }).format(d);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push(key);
    monthsMap.set(key, 0);
  }
  for (const ad of currentAds) {
    const key = `${ad.createdAt.getFullYear()}-${String(ad.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (monthsMap.has(key)) {
      monthsMap.set(key, (monthsMap.get(key) ?? 0) + ad.amountPaid);
    }
  }
  const monthlySeries = months.map((key) => {
    const d = new Date(`${key}-01T00:00:00Z`);
    const label = new Intl.DateTimeFormat("ar-MA", { month: "short" }).format(d);
    return { month: label, revenue: Math.round((monthsMap.get(key) ?? 0) * 100) / 100 };
  });

  // أعلى الإعلانات أداءً
  const topAds = currentAds
    .filter((a) => a.amountPaid > 0)
    .sort((a, b) => b.views - a.views || b.amountPaid - a.amountPaid)
    .slice(0, 10)
    .map((a) => ({
      title: a.title,
      advertiser: a.advertiserName,
      package: a.package,
      status: a.status,
      amount: a.amountPaid,
      views: a.views,
      clicks: a.clicks,
    }));

  // حسب الباقة + الحالة
  const byPackage = buildPackageRevenueSeries(currentAds).map((p, i) => ({
    ...p,
    key: (Object.keys(AD_PACKAGE_LABELS) as AdPackage[])[i] ?? ("GOLD" as AdPackage),
  }));
  const byStatus = buildStatusDistribution(currentAds).map((s) => ({
    name: s.name,
    value: s.value,
    status: s.status,
  }));

  // الضمان أن byStatus يستعمل الـlabels العربية
  void AD_STATUS_LABELS;

  const data: ReportsData = {
    stats,
    previousStats,
    byPackage,
    byStatus,
    monthlySeries,
    topAds,
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          تقارير الإعلانات
        </h1>
        <p className="text-sm text-muted-foreground">
          الفترة: {from.toLocaleDateString("ar-MA")} — {to.toLocaleDateString("ar-MA")} ({currentAds.length} حملة)
        </p>
      </header>

      <ReportsClient
        data={data}
        defaultFrom={fromStr}
        defaultTo={toStr}
        period={period}
      />
    </div>
  );
}

// نُلغي قيد NextRequest غير المستعمل لتفادي أي تحذير
void (undefined as unknown as NextRequest);
