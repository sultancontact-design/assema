// @ts-nocheck — @react-pdf/renderer types incompatible with React 19; runtime verified
// ===================================================================
//  GET /api/admin/ads/reports/pdf — توليد تقرير PDF للفترة المحدّدة
//  - يقرأ from/to/period من الـquery
//  - يستعمل ReportPdfDocument من lib/pdf/report-pdf
//  - يتطلّب صلاحية ad.view
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { ReportPdfDocument, type ReportPdfData } from "@/lib/pdf/report-pdf";
import {
  buildPackageRevenueSeries,
  buildStatusDistribution,
  computeCTR,
  computeRPM,
} from "@/lib/ads-utils";

export const dynamic = "force-dynamic";

const PERIOD_LABELS: Record<string, string> = {
  daily: "يومي",
  weekly: "أسبوعي",
  monthly: "شهري",
  yearly: "سنوي",
};

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
    }
    if (!hasPermission(user.role, "ad.view")) {
      return NextResponse.json({ error: "ممنوع" }, { status: 403 });
    }

    const url = new URL(request.url);
    const now = new Date();
    const defaultTo = now.toISOString().slice(0, 10);
    const defaultFrom = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
    const fromStr = url.searchParams.get("from") ?? defaultFrom;
    const toStr = url.searchParams.get("to") ?? defaultTo;
    const period = url.searchParams.get("period") ?? "monthly";

    const from = new Date(fromStr);
    const to = new Date(toStr);

    // جلب كل الإعلانات ثم فلترة
    const allAds = await db.ad.findMany({
      where: { districtId: user.districtId ?? "" },
      take: 500,
    });

    const currentAds = allAds.filter((a) => {
      const c = new Date(a.createdAt);
      return c >= from && c <= to;
    });

    const revenue = currentAds
      .filter((a) => a.status === "ACTIVE" || a.status === "EXPIRED")
      .reduce((s, a) => s + a.amountPaid, 0);
    const impressions = currentAds.reduce((s, a) => s + a.views, 0);
    const clicks = currentAds.reduce((s, a) => s + a.clicks, 0);
    const ctr = computeCTR(impressions, clicks);
    const rpm = computeRPM(revenue, impressions);

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

    const monthlyMap = new Map<string, number>();
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(to.getFullYear(), to.getMonth() - i, 1);
      const label = new Intl.DateTimeFormat("ar-MA", { month: "short" }).format(d);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push(key);
      monthlyMap.set(key, 0);
      // نخزّن التسمية في property جانبية
      (monthlyMap as unknown as { _labels?: Record<string, string> })._labels = {
        ...((monthlyMap as unknown as { _labels?: Record<string, string> })._labels ?? {}),
        [key]: label,
      };
    }
    for (const ad of currentAds) {
      const key = `${ad.createdAt.getFullYear()}-${String(ad.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap.has(key)) {
        monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + ad.amountPaid);
      }
    }
    const monthlySeries = months.map((key) => {
      const labels = (monthlyMap as unknown as { _labels?: Record<string, string> })._labels ?? {};
      return {
        month: labels[key] ?? key,
        revenue: Math.round((monthlyMap.get(key) ?? 0) * 100) / 100,
      };
    });

    const district = await db.district.findUnique({
      where: { id: user.districtId ?? "" },
      select: { name: true },
    });

    const periodLabel = `${from.toLocaleDateString("ar-MA")} — ${to.toLocaleDateString("ar-MA")}`;
    const filtersLabel = PERIOD_LABELS[period] ?? period;

    const reportData: ReportPdfData = {
      organization: district?.name ?? "سيدي يوسف بن علي",
      periodLabel,
      filtersLabel,
      stats: { revenue, impressions, clicks, ctr, rpm },
      byPackage: buildPackageRevenueSeries(currentAds),
      byStatus: buildStatusDistribution(currentAds),
      monthlySeries,
      topAds,
    };

    const pdfBuffer = await renderToBuffer(
      React.createElement(ReportPdfDocument, { data: reportData })
    );

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdfBuffer.length),
        "Content-Disposition": `inline; filename="ads-report-${toStr}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/ads/reports/pdf]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء توليد التقرير" },
      { status: 500 }
    );
  }
}
