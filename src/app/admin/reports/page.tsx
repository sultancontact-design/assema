// ===================================================================
//  صفحة التقارير الشاملة — /admin/reports
//  Server Component — يجمع بيانات 4 تقارير ويمرّرها للعميل
//  - التقرير المالي (مساهمات/صرف/رصيد)
//  - تقرير النشاط (تسجيلات/مساهمات/فعاليات)
//  - تقرير النمو (أعضاء/عائلات)
//  - تقرير الفعاليات (حضور/تكلفة/رضا)
// ===================================================================

import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import { ReportsClient } from "@/components/admin/reports-client";
import {
  lastNMonthKeys,
  lastNWeekLabels,
  monthKeyToLabel,
  eventTypeLabel,
  toISODate,
  type ReportsData,
} from "@/lib/reports-utils";
import type { EventType } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 500;

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!hasPermission(user.role, "admin.reports") && !hasPermission(user.role, "fund.report.view")) {
    return null;
  }

  const districtId = user.districtId ?? "";

  const params = await searchParams;
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), 0, 1);
  const fromStr = params.from ?? toISODate(defaultFrom);
  const toStr = params.to ?? toISODate(now);
  const from = new Date(fromStr);
  const to = new Date(toStr);
  to.setHours(23, 59, 59, 999);

  // ===================================================================
  //  التقرير المالي
  // ===================================================================

  const [contributions, fundRequests] = await Promise.all([
    db.contribution.findMany({
      where: {
        districtId,
        createdAt: { gte: from, lte: to },
      },
      select: { amount: true, status: true, createdAt: true },
      take: PAGE_SIZE,
    }),
    db.fundRequest.findMany({
      where: {
        districtId,
        createdAt: { gte: from, lte: to },
      },
      select: { amountRequested: true, amountDisbursed: true, status: true, createdAt: true },
      take: PAGE_SIZE,
    }),
  ]);

  const confirmedContribs = contributions.filter((c) => c.status === "CONFIRMED");
  const totalContributions = confirmedContribs.reduce((s, c) => s + c.amount, 0);
  const totalDisbursed = fundRequests
    .filter((r) => r.status === "DISBURSED" || r.status === "COMPLETED")
    .reduce((s, r) => s + (r.amountDisbursed ?? 0), 0);

  // بناء سلسلة 12 شهراً قبل `to`
  const monthKeys = lastNMonthKeys(12, to);
  const monthlyMap = new Map<string, { contributions: number; disbursed: number }>();
  for (const k of monthKeys) monthlyMap.set(k, { contributions: 0, disbursed: 0 });

  for (const c of confirmedContribs) {
    const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap.has(key)) {
      const e = monthlyMap.get(key)!;
      e.contributions += c.amount;
    }
  }
  for (const r of fundRequests) {
    if (r.status !== "DISBURSED" && r.status !== "COMPLETED") continue;
    const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap.has(key)) {
      const e = monthlyMap.get(key)!;
      e.disbursed += r.amountDisbursed ?? 0;
    }
  }
  const monthlySeries = monthKeys.map((k) => ({
    month: monthKeyToLabel(k),
    contributions: Math.round((monthlyMap.get(k)?.contributions ?? 0) * 100) / 100,
    disbursed: Math.round((monthlyMap.get(k)?.disbursed ?? 0) * 100) / 100,
  }));

  // بناء صفوف الفترات: نقسّم الفترة المختارة إلى أرباع (أو وحدات متساوية)
  // للتبسيط نستخدم: يومي (إذا ≤ 31 يوم)، أسبوعي (إذا ≤ 90 يوم)، شهري (إذا ≤ 365 يوم)، سنوي (باقي)
  const daysDiff = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000));
  let bucketMode: "daily" | "weekly" | "monthly" | "yearly";
  if (daysDiff <= 31) bucketMode = "daily";
  else if (daysDiff <= 90) bucketMode = "weekly";
  else if (daysDiff <= 365) bucketMode = "monthly";
  else bucketMode = "yearly";

  const bucketsMap = new Map<string, { contributions: number; disbursed: number; operations: number }>();
  function bucketKey(d: Date): string {
    if (bucketMode === "daily") return toISODate(d);
    if (bucketMode === "weekly") {
      const week = new Date(d);
      // الإثنين كأول الأسبوع
      const day = (week.getDay() + 6) % 7;
      week.setDate(week.getDate() - day);
      return toISODate(week);
    }
    if (bucketMode === "monthly") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return `${d.getFullYear()}`;
  }

  for (const c of confirmedContribs) {
    const k = bucketKey(c.createdAt);
    const e = bucketsMap.get(k) ?? { contributions: 0, disbursed: 0, operations: 0 };
    e.contributions += c.amount;
    e.operations += 1;
    bucketsMap.set(k, e);
  }
  for (const r of fundRequests) {
    if (r.status !== "DISBURSED" && r.status !== "COMPLETED") continue;
    const k = bucketKey(r.createdAt);
    const e = bucketsMap.get(k) ?? { contributions: 0, disbursed: 0, operations: 0 };
    e.disbursed += r.amountDisbursed ?? 0;
    e.operations += 1;
    bucketsMap.set(k, e);
  }

  const sortedBucketKeys = Array.from(bucketsMap.keys()).sort();
  // حساب الرصيد التراكمي عبر reduce (بدون تحويل متغيّر في map)
  const financialRows = sortedBucketKeys.reduce<
    Array<{
      period: string;
      contributions: number;
      disbursed: number;
      balance: number;
      operations: number;
    }>
  >((acc, k) => {
    const e = bucketsMap.get(k)!;
    const prevBalance = acc.length > 0 ? acc[acc.length - 1].balance : 0;
    const newBalance = prevBalance + (e.contributions - e.disbursed);
    let label = k;
    if (bucketMode === "monthly") label = monthKeyToLabel(k);
    else if (bucketMode === "yearly") label = k;
    else {
      // daily / weekly: حوّل التاريخ لصيغة عربية قصيرة
      try {
        const d = new Date(k);
        label = new Intl.DateTimeFormat("ar-MA", { day: "numeric", month: "short", year: "numeric" }).format(d);
      } catch {
        label = k;
      }
    }
    acc.push({
      period: label,
      contributions: Math.round(e.contributions * 100) / 100,
      disbursed: Math.round(e.disbursed * 100) / 100,
      balance: Math.round(newBalance * 100) / 100,
      operations: e.operations,
    });
    return acc;
  }, []);

  // ===================================================================
  //  تقرير النشاط (آخر 8 أسابيع)
  // ===================================================================

  const weeks = lastNWeekLabels(8, to);
  const weekMap = new Map<string, { newMembers: number; newContributions: number; newRequests: number; events: number }>();
  for (const w of weeks) {
    weekMap.set(w.key, { newMembers: 0, newContributions: 0, newRequests: 0, events: 0 });
  }

  // الأعضاء الجدد: ننظر في createdAt خلال آخر 8 أسابيع
  const newUsers = await db.user.findMany({
    where: { districtId, createdAt: { gte: new Date(to.getTime() - 8 * 7 * 86400000), lte: to } },
    select: { createdAt: true },
    take: PAGE_SIZE,
  });
  // المساهمات الجديدة: ننظر في createdAt خلال آخر 8 أسابيع
  const newContribs = await db.contribution.findMany({
    where: { districtId, createdAt: { gte: new Date(to.getTime() - 8 * 7 * 86400000), lte: to } },
    select: { createdAt: true },
    take: PAGE_SIZE,
  });
  // الطلبات الجديدة
  const newReq = await db.fundRequest.findMany({
    where: { districtId, createdAt: { gte: new Date(to.getTime() - 8 * 7 * 86400000), lte: to } },
    select: { createdAt: true },
    take: PAGE_SIZE,
  });
  // الفعاليات (المُنشَأة)
  const newEvents = await db.event.findMany({
    where: { districtId, createdAt: { gte: new Date(to.getTime() - 8 * 7 * 86400000), lte: to } },
    select: { createdAt: true },
    take: PAGE_SIZE,
  });

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

  const activityRows = weeks.map((w) => ({
    week: w.label,
    newMembers: weekMap.get(w.key)!.newMembers,
    newContributions: weekMap.get(w.key)!.newContributions,
    newRequests: weekMap.get(w.key)!.newRequests,
    events: weekMap.get(w.key)!.events,
  }));

  // ===================================================================
  //  تقرير النمو (آخر 6 أشهر)
  // ===================================================================

  const growthMonths = lastNMonthKeys(6, to);
  // إجمالي تراكمي للأعضاء والعائلات نهاية كل شهر
  const memberSeriesPromises = growthMonths.map(async (k) => {
    const [y, m] = k.split("-").map((s) => parseInt(s, 10));
    const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999); // آخر يوم في الشهر
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
    return { month: monthKeyToLabel(k), members, families };
  });
  const memberSeries = await Promise.all(memberSeriesPromises);

  const totalMembersNow = memberSeries[memberSeries.length - 1]?.members ?? 0;
  const totalFamiliesNow = memberSeries[memberSeries.length - 1]?.families ?? 0;
  const lastMonth = memberSeries[memberSeries.length - 1]?.members ?? 0;
  const prevMonth = memberSeries[memberSeries.length - 2]?.members ?? lastMonth;
  const growthThisMonth = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;
  const growths: number[] = [];
  for (let i = 1; i < memberSeries.length; i++) {
    const prev = memberSeries[i - 1].members;
    const curr = memberSeries[i].members;
    if (prev > 0) growths.push(((curr - prev) / prev) * 100);
  }
  const avgMonthlyGrowth = growths.length > 0 ? growths.reduce((s, x) => s + x, 0) / growths.length : 0;

  // ===================================================================
  //  تقرير الفعاليات
  // ===================================================================

  const events = await db.event.findMany({
    where: {
      districtId,
      startDate: { gte: from, lte: to },
    },
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

  // التكلفة: لا يوجد حقل cost في Event — نحسب كحصة من المساهمات أو نصنع قيمة وهمية ثابتة
  // لتجنّب إرباك العميل نستعمل 0 (لا يوجد تكلفة مسجّلة في النموذج الحالي)
  const eventsRows = events.map((ev) => {
    const registrations = ev.registrations.length;
    const attended = ev.registrations.filter((r) => r.status === "ATTENDED" || r.attendedAt !== null).length;
    const absent = ev.registrations.filter((r) => r.status === "NO_SHOW").length;
    const attendanceRate = registrations > 0 ? (attended / registrations) * 100 : 0;
    return {
      id: ev.id,
      title: ev.title,
      type: ev.type,
      registrations,
      attended,
      absent,
      attendanceRate,
      cost: 0,
    };
  });

  // توزيع الحضور حسب النوع
  const distMap = new Map<EventType, number>();
  for (const ev of events) {
    const att = ev.registrations.filter((r) => r.status === "ATTENDED" || r.attendedAt !== null).length;
    distMap.set(ev.type, (distMap.get(ev.type) ?? 0) + att);
  }
  const distribution = Array.from(distMap.entries()).map(([type, value]) => ({
    type,
    label: eventTypeLabel(type),
    value,
  }));

  const totalReg = eventsRows.reduce((s, r) => s + r.registrations, 0);
  const totalAtt = eventsRows.reduce((s, r) => s + r.attended, 0);
  const attendanceRate = totalReg > 0 ? (totalAtt / totalReg) * 100 : 0;

  // ===================================================================
  //  تجميع البيانات
  // ===================================================================

  const data: ReportsData = {
    financial: {
      summary: {
        totalContributions,
        totalDisbursed,
        balance: totalContributions - totalDisbursed,
        operationsCount: confirmedContribs.length + fundRequests.filter((r) => r.status === "DISBURSED" || r.status === "COMPLETED").length,
      },
      rows: financialRows,
      monthlySeries,
    },
    activity: {
      summary: {
        newMembers: newUsers.length,
        newContributions: newContribs.length,
        newRequests: newReq.length,
        eventsCount: newEvents.length,
      },
      rows: activityRows,
      weeklySeries: activityRows,
    },
    growth: {
      summary: {
        growthThisMonth,
        avgMonthlyGrowth,
        totalMembers: totalMembersNow,
        totalFamilies: totalFamiliesNow,
      },
      memberSeries,
    },
    events: {
      summary: {
        totalEvents: eventsRows.length,
        totalRegistrations: totalReg,
        totalAttended: totalAtt,
        attendanceRate,
      },
      rows: eventsRows,
      distribution,
    },
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          التقارير الشاملة
        </h1>
        <p className="text-sm text-muted-foreground">
          الفترة: {from.toLocaleDateString("ar-MA")} — {to.toLocaleDateString("ar-MA")} — تقارير دورية قابلة للتصدير CSV/PDF.
        </p>
      </header>

      <ReportsClient
        data={data}
        defaultFrom={fromStr}
        defaultTo={toStr}
      />
    </div>
  );
}
