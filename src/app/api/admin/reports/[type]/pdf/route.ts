// ===================================================================
//  GET /api/admin/reports/[type]/pdf — توليد تقرير PDF شامل
//  - type: financial | activity | growth | events
//  - يتسلّم from/to (YYYY-MM-DD) كـquery params
//  - يتطلّب صلاحية admin.reports أو fund.report.view
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import {
  FinancialReportPdfDocument,
  type FinancialReportPdfData,
} from "@/lib/pdf/financial-report-pdf";
import {
  ActivityReportPdfDocument,
  type ActivityReportPdfData,
} from "@/lib/pdf/activity-report-pdf";
import {
  GrowthReportPdfDocument,
  type GrowthReportPdfData,
} from "@/lib/pdf/growth-report-pdf";
import {
  EventsReportPdfDocument,
  type EventsReportPdfData,
} from "@/lib/pdf/events-report-pdf";
import {
  lastNMonthKeys,
  lastNWeekLabels,
  monthKeyToLabel,
  eventTypeLabel,
  toISODate,
} from "@/lib/reports-utils";
import type { EventType } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["financial", "activity", "growth", "events"] as const;
type ReportType = (typeof VALID_TYPES)[number];

const PAGE_SIZE = 500;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
    }
    if (
      !hasPermission(user.role, "admin.reports") &&
      !hasPermission(user.role, "fund.report.view")
    ) {
      return NextResponse.json({ error: "ممنوع" }, { status: 403 });
    }

    const { type: rawType } = await params;
    if (!VALID_TYPES.includes(rawType as ReportType)) {
      return NextResponse.json({ error: "نوع التقرير غير صالح" }, { status: 400 });
    }
    const type = rawType as ReportType;

    const url = new URL(request.url);
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), 0, 1);
    const fromStr = url.searchParams.get("from") ?? toISODate(defaultFrom);
    const toStr = url.searchParams.get("to") ?? toISODate(now);
    const from = new Date(fromStr);
    const to = new Date(toStr);
    to.setHours(23, 59, 59, 999);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json({ error: "صيغة التاريخ غير صحيحة" }, { status: 400 });
    }
    if (to < from) {
      return NextResponse.json({ error: "الفترة غير صالحة" }, { status: 400 });
    }

    const districtId = user.districtId ?? "";
    const district = await db.district.findUnique({
      where: { id: districtId },
      select: { name: true },
    });
    const organization = district?.name ?? "سيدي يوسف بن علي";
    const periodLabel = `${from.toLocaleDateString("ar-MA")} — ${to.toLocaleDateString("ar-MA")}`;
    const filtersLabel = "شهري";

    let pdfBuffer: Buffer;

    if (type === "financial") {
      const [contributions, fundRequests] = await Promise.all([
        db.contribution.findMany({
          where: { districtId, createdAt: { gte: from, lte: to } },
          select: { amount: true, status: true, createdAt: true },
          take: PAGE_SIZE,
        }),
        db.fundRequest.findMany({
          where: { districtId, createdAt: { gte: from, lte: to } },
          select: { amountDisbursed: true, status: true, createdAt: true },
          take: PAGE_SIZE,
        }),
      ]);
      const confirmedContribs = contributions.filter((c) => c.status === "CONFIRMED");
      const totalContributions = confirmedContribs.reduce((s, c) => s + c.amount, 0);
      const totalDisbursed = fundRequests
        .filter((r) => r.status === "DISBURSED" || r.status === "COMPLETED")
        .reduce((s, r) => s + (r.amountDisbursed ?? 0), 0);

      const monthKeys = lastNMonthKeys(12, to);
      const monthlyMap = new Map<string, { contributions: number; disbursed: number }>();
      for (const k of monthKeys) monthlyMap.set(k, { contributions: 0, disbursed: 0 });
      for (const c of confirmedContribs) {
        const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, "0")}`;
        if (monthlyMap.has(key)) {
          monthlyMap.get(key)!.contributions += c.amount;
        }
      }
      for (const r of fundRequests) {
        if (r.status !== "DISBURSED" && r.status !== "COMPLETED") continue;
        const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, "0")}`;
        if (monthlyMap.has(key)) {
          monthlyMap.get(key)!.disbursed += r.amountDisbursed ?? 0;
        }
      }
      const monthlySeries = monthKeys.map((k) => ({
        month: monthKeyToLabel(k),
        contributions: Math.round((monthlyMap.get(k)?.contributions ?? 0) * 100) / 100,
        disbursed: Math.round((monthlyMap.get(k)?.disbursed ?? 0) * 100) / 100,
      }));

      const data: FinancialReportPdfData = {
        organization,
        periodLabel,
        filtersLabel,
        summary: {
          totalContributions,
          totalDisbursed,
          balance: totalContributions - totalDisbursed,
          operationsCount:
            confirmedContribs.length +
            fundRequests.filter((r) => r.status === "DISBURSED" || r.status === "COMPLETED").length,
        },
        rows: monthlySeries.map((m, i) => ({
          period: m.month,
          contributions: m.contributions,
          disbursed: m.disbursed,
          balance: monthlySeries
            .slice(0, i + 1)
            .reduce((s, x) => s + x.contributions - x.disbursed, 0),
          operations: 0,
        })),
        monthlySeries,
      };
      pdfBuffer = await renderToBuffer(
        React.createElement(FinancialReportPdfDocument, { data })
      );
    } else if (type === "activity") {
      const since = new Date(to.getTime() - 8 * 7 * 86400000);
      const [newUsers, newContribs, newReq, newEvents] = await Promise.all([
        db.user.findMany({
          where: { districtId, createdAt: { gte: since, lte: to } },
          select: { createdAt: true },
          take: PAGE_SIZE,
        }),
        db.contribution.findMany({
          where: { districtId, createdAt: { gte: since, lte: to } },
          select: { createdAt: true },
          take: PAGE_SIZE,
        }),
        db.fundRequest.findMany({
          where: { districtId, createdAt: { gte: since, lte: to } },
          select: { createdAt: true },
          take: PAGE_SIZE,
        }),
        db.event.findMany({
          where: { districtId, createdAt: { gte: since, lte: to } },
          select: { createdAt: true },
          take: PAGE_SIZE,
        }),
      ]);
      const weeks = lastNWeekLabels(8, to);
      const weekMap = new Map<
        string,
        { newMembers: number; newContributions: number; newRequests: number; events: number }
      >();
      for (const w of weeks) {
        weekMap.set(w.key, { newMembers: 0, newContributions: 0, newRequests: 0, events: 0 });
      }
      function findWeekKey(d: Date): string | null {
        for (const w of weeks) {
          const [s, e] = w.key.split("_").map((p) => new Date(p));
          if (d >= s && d <= e) return w.key;
        }
        return null;
      }
      for (const u of newUsers) {
        const k = findWeekKey(u.createdAt);
        if (k) weekMap.get(k)!.newMembers += 1;
      }
      for (const c of newContribs) {
        const k = findWeekKey(c.createdAt);
        if (k) weekMap.get(k)!.newContributions += 1;
      }
      for (const r of newReq) {
        const k = findWeekKey(r.createdAt);
        if (k) weekMap.get(k)!.newRequests += 1;
      }
      for (const ev of newEvents) {
        const k = findWeekKey(ev.createdAt);
        if (k) weekMap.get(k)!.events += 1;
      }
      const rows = weeks.map((w) => ({
        week: w.label,
        newMembers: weekMap.get(w.key)!.newMembers,
        newContributions: weekMap.get(w.key)!.newContributions,
        newRequests: weekMap.get(w.key)!.newRequests,
        events: weekMap.get(w.key)!.events,
      }));
      const data: ActivityReportPdfData = {
        organization,
        periodLabel,
        filtersLabel,
        summary: {
          newMembers: newUsers.length,
          newContributions: newContribs.length,
          newRequests: newReq.length,
          eventsCount: newEvents.length,
        },
        rows,
      };
      pdfBuffer = await renderToBuffer(
        React.createElement(ActivityReportPdfDocument, { data })
      );
    } else if (type === "growth") {
      const growthMonths = lastNMonthKeys(6, to);
      const memberSeries: Array<{ month: string; members: number; families: number }> = [];
      for (const k of growthMonths) {
        const [y, m] = k.split("-").map((s) => parseInt(s, 10));
        const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);
        const [members, families] = await Promise.all([
          db.user.count({
            where: {
              districtId,
              createdAt: { lte: endOfMonth },
              deletedAt: null,
            },
          }),
          db.family.count({
            where: {
              districtId,
              createdAt: { lte: endOfMonth },
              deletedAt: null,
            },
          }),
        ]);
        memberSeries.push({ month: monthKeyToLabel(k), members, families });
      }
      const lastMonth = memberSeries[memberSeries.length - 1]?.members ?? 0;
      const prevMonth = memberSeries[memberSeries.length - 2]?.members ?? lastMonth;
      const growthThisMonth = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;
      const growths: number[] = [];
      for (let i = 1; i < memberSeries.length; i++) {
        const prev = memberSeries[i - 1].members;
        const curr = memberSeries[i].members;
        if (prev > 0) growths.push(((curr - prev) / prev) * 100);
      }
      const avgMonthlyGrowth =
        growths.length > 0 ? growths.reduce((s, x) => s + x, 0) / growths.length : 0;

      const data: GrowthReportPdfData = {
        organization,
        periodLabel,
        summary: {
          growthThisMonth,
          avgMonthlyGrowth,
          totalMembers: lastMonth,
          totalFamilies: memberSeries[memberSeries.length - 1]?.families ?? 0,
        },
        memberSeries,
      };
      pdfBuffer = await renderToBuffer(
        React.createElement(GrowthReportPdfDocument, { data })
      );
    } else {
      // events
      const events = await db.event.findMany({
        where: { districtId, startDate: { gte: from, lte: to } },
        select: {
          id: true,
          title: true,
          type: true,
          startDate: true,
          registrations: {
            select: { status: true, attendedAt: true },
          },
        },
        orderBy: { startDate: "desc" },
        take: 100,
      });
      const rows = events.map((ev) => {
        const registrations = ev.registrations.length;
        const attended = ev.registrations.filter(
          (r) => r.status === "ATTENDED" || r.attendedAt !== null
        ).length;
        const absent = ev.registrations.filter((r) => r.status === "NO_SHOW").length;
        const attendanceRate = registrations > 0 ? (attended / registrations) * 100 : 0;
        return {
          title: ev.title,
          type: ev.type,
          registrations,
          attended,
          absent,
          attendanceRate,
          cost: 0,
        };
      });
      const distMap = new Map<EventType, number>();
      for (const ev of events) {
        const att = ev.registrations.filter(
          (r) => r.status === "ATTENDED" || r.attendedAt !== null
        ).length;
        distMap.set(ev.type, (distMap.get(ev.type) ?? 0) + att);
      }
      const distribution = Array.from(distMap.entries()).map(([type, value]) => ({
        type,
        label: eventTypeLabel(type),
        value,
      }));

      const totalReg = rows.reduce((s, r) => s + r.registrations, 0);
      const totalAtt = rows.reduce((s, r) => s + r.attended, 0);
      const attendanceRate = totalReg > 0 ? (totalAtt / totalReg) * 100 : 0;

      const data: EventsReportPdfData = {
        organization,
        periodLabel,
        summary: {
          totalEvents: rows.length,
          totalRegistrations: totalReg,
          totalAttended: totalAtt,
          attendanceRate,
        },
        rows,
        distribution,
      };
      pdfBuffer = await renderToBuffer(
        React.createElement(EventsReportPdfDocument, { data })
      );
    }

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdfBuffer.length),
        "Content-Disposition": `inline; filename="${type}-report-${toStr}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error(`[GET /api/admin/reports/[type]/pdf]:`, err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء توليد التقرير" },
      { status: 500 }
    );
  }
}
