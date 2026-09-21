// ===================================================================
//  GET /api/fund/reports/[period]/pdf — توليد PDF التقرير الدوري للصندوق
//  - period: daily | weekly | monthly | yearly
//  - يتسلّم from/to (YYYY-MM-DD) كـquery params
//  - يتطلّب صلاحية fund.report.view
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import {
  FundPeriodicReportPdfDocument,
  type FundPeriodicReportPdfData,
  type PeriodicTransaction,
  type PeriodicMonthlyPoint,
} from "@/lib/pdf/fund-periodic-report-pdf";
import {
  CONTRIBUTION_STATUS_LABELS,
  CONTRIBUTION_METHOD_LABELS,
  FUND_REQUEST_TYPE_LABELS,
  FUND_REQUEST_STATUS_LABELS,
  formatDateTimeArabic,
} from "@/lib/constants";
import type {
  ContributionStatus,
  ContributionMethod,
  FundRequestType,
  FundRequestStatus,
} from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_PERIODS = ["daily", "weekly", "monthly", "yearly"] as const;
type PeriodKind = (typeof VALID_PERIODS)[number];

const PERIOD_LABELS: Record<PeriodKind, string> = {
  daily: "التقرير اليومي",
  weekly: "التقرير الأسبوعي",
  monthly: "التقرير الشهري",
  yearly: "التقرير السنوي",
};

interface RawContribution {
  id: string;
  amount: number;
  status: string;
  receiptNumber: string | null;
  method: string;
  createdAt: Date;
  user: { fullName: string } | null;
}

interface RawRequest {
  id: string;
  amountDisbursed: number | null;
  status: string;
  anonymousCode: string | null;
  type: string;
  title: string;
  disbursedAt: Date | null;
  createdAt: Date;
  user: { fullName: string } | null;
  disbursedById: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ period: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
    }
    if (!hasPermission(user.role, "fund.report.view")) {
      return NextResponse.json({ error: "ممنوع" }, { status: 403 });
    }

    const { period: rawPeriod } = await params;
    if (!VALID_PERIODS.includes(rawPeriod as PeriodKind)) {
      return NextResponse.json(
        { error: "نوع الفترة غير صالح" },
        { status: 400 }
      );
    }
    const period = rawPeriod as PeriodKind;

    const url = new URL(request.url);
    const now = new Date();

    // نطاق التاريخ حسب نوع الفترة
    let from: Date;
    let to: Date = new Date(now);
    to.setHours(23, 59, 59, 999);

    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    if (fromParam && toParam) {
      from = new Date(fromParam);
      to = new Date(toParam);
      to.setHours(23, 59, 59, 999);
      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        return NextResponse.json(
          { error: "صيغة التاريخ غير صحيحة" },
          { status: 400 }
        );
      }
      if (to < from) {
        return NextResponse.json(
          { error: "الفترة غير صالحة" },
          { status: 400 }
        );
      }
    } else {
      switch (period) {
        case "daily":
          from = new Date(now);
          from.setHours(0, 0, 0, 0);
          break;
        case "weekly":
          from = new Date(now);
          from.setDate(from.getDate() - 6);
          from.setHours(0, 0, 0, 0);
          break;
        case "monthly":
          from = new Date(now);
          from.setDate(from.getDate() - 29);
          from.setHours(0, 0, 0, 0);
          break;
        case "yearly":
          from = new Date(now);
          from.setFullYear(from.getFullYear() - 1);
          from.setHours(0, 0, 0, 0);
          break;
      }
    }

    const districtId = user.districtId ?? "";

    const [contributions, fundRequests] = await Promise.all([
      db.contribution.findMany({
        where: {
          districtId,
          createdAt: { gte: from, lte: to },
        },
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
        take: 500,
      }) as Promise<RawContribution[]>,
      db.fundRequest.findMany({
        where: {
          districtId,
          OR: [
            { createdAt: { gte: from, lte: to } },
            { disbursedAt: { gte: from, lte: to } },
          ],
        },
        include: {
          user: { select: { fullName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      }) as Promise<RawRequest[]>,
    ]);

    // جلب أسماء المُصرّفين دفعة واحدة
    const disbursedByIds = Array.from(
      new Set(
        fundRequests
          .map((r) => r.disbursedById)
          .filter((id): id is string => !!id)
      )
    );
    const disbursers = disbursedByIds.length
      ? await db.user.findMany({
          where: { id: { in: disbursedByIds } },
          select: { id: true, fullName: true },
        })
      : [];
    const disbursersMap = new Map(disbursers.map((u) => [u.id, u.fullName]));

    // بناء جدول العمليات
    const transactions: PeriodicTransaction[] = [];

    for (const c of contributions) {
      transactions.push({
        date: formatDateTimeArabic(c.createdAt),
        type: "مساهمة",
        reference: c.receiptNumber ?? "—",
        amount: c.amount,
        status:
          CONTRIBUTION_STATUS_LABELS[c.status as ContributionStatus] ??
          c.status,
        by: c.user?.fullName ?? "—",
      });
    }

    for (const r of fundRequests) {
      const typeMeta = FUND_REQUEST_TYPE_LABELS[r.type as FundRequestType];
      const statusMeta = FUND_REQUEST_STATUS_LABELS[r.status as FundRequestStatus];
      // إذا كان الصرف ضمن الفترة
      if (r.disbursedAt && r.disbursedAt >= from && r.disbursedAt <= to) {
        transactions.push({
          date: formatDateTimeArabic(r.disbursedAt),
          type: `صرف — ${typeMeta?.label ?? r.type}`,
          reference: r.anonymousCode ?? "—",
          amount: r.amountDisbursed ?? 0,
          status: statusMeta?.label ?? r.status,
          by: r.disbursedById ? (disbursersMap.get(r.disbursedById) ?? "—") : "—",
        });
      } else {
        // تقديم الطلب
        transactions.push({
          date: formatDateTimeArabic(r.createdAt),
          type: `طلب — ${typeMeta?.label ?? r.type}`,
          reference: r.anonymousCode ?? "—",
          amount: r.amountDisbursed ?? 0,
          status: statusMeta?.label ?? r.status,
          by: r.user?.fullName ?? "—",
        });
      }
    }

    // ترتيب زمني تنازلي
    transactions.sort((a, b) => (a.date < b.date ? 1 : -1));

    // الإجماليات
    const confirmedContributions = contributions.filter((c) => c.status === "CONFIRMED");
    const contributionsAmount = confirmedContributions.reduce(
      (s, c) => s + c.amount,
      0
    );
    const disbursedRequests = fundRequests.filter(
      (r) => r.status === "DISBURSED" || r.status === "COMPLETED"
    );
    const disbursedAmount = disbursedRequests.reduce(
      (s, r) => s + (r.amountDisbursed ?? 0),
      0
    );
    const balance = contributionsAmount - disbursedAmount;

    // السلسلة الشهرية: آخر 12 شهراً قبل "to"
    const monthlySeries: PeriodicMonthlyPoint[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(to.getFullYear(), to.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const cAgg = await db.contribution.aggregate({
        where: {
          districtId,
          status: "CONFIRMED",
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      });
      const dAgg = await db.fundRequest.aggregate({
        where: {
          districtId,
          status: { in: ["DISBURSED", "COMPLETED"] },
          disbursedAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amountDisbursed: true },
      });
      const monthLabel = new Intl.DateTimeFormat("ar-MA", {
        month: "short",
        year: "2-digit",
      }).format(d);
      monthlySeries.push({
        month: monthLabel,
        contributions: cAgg._sum.amount ?? 0,
        disbursed: dAgg._sum.amountDisbursed ?? 0,
      });
      void key; // مهمل
    }

    const district = await db.district.findUnique({
      where: { id: districtId },
      select: { name: true },
    });
    const organization = district?.name ?? "سيدي يوسف بن علي";

    const periodLabel = `${new Intl.DateTimeFormat("ar-MA").format(from)} — ${new Intl.DateTimeFormat("ar-MA").format(to)}`;

    const data: FundPeriodicReportPdfData = {
      organization,
      generatedAt: formatDateTimeArabic(new Date()),
      periodLabel,
      periodKind: period,
      periodKindLabel: PERIOD_LABELS[period],
      summary: {
        contributionsCount: confirmedContributions.length,
        contributionsAmount,
        requestsCount: fundRequests.length,
        disbursedAmount,
        balance,
      },
      transactions,
      monthlySeries,
    };

    const pdfBuffer = await renderToBuffer(
      React.createElement(FundPeriodicReportPdfDocument, { data })
    );

    const filename = `fund-report-${period}-${from.toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdfBuffer.length),
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[GET /api/fund/reports/[period]/pdf]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء توليد التقرير" },
      { status: 500 }
    );
  }
}

// إرضاء eslint لـ unused imports
void CONTRIBUTION_METHOD_LABELS;
