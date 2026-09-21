// ===================================================================
//  منطق مشترك لجمع إحصائيات لوحة الإدارة
//  يُستخدم من طرف:
//  - src/app/admin/page.tsx (server component)
//  - src/app/api/admin/stats/route.ts (API endpoint)
// ===================================================================

import { subMonths, format } from "date-fns";
import { db } from "@/lib/db";
import type {
  ContributionMethod,
  FundRequestType,
  AuditLog,
} from "@prisma/client";

// ===================================================================
//  الأنواع
// ===================================================================

export interface AdminStats {
  users: number;
  families: number;
  contributionsThisMonth: number;
  disbursedThisMonth: number;
  currentBalance: number;
  pendingRequests: number;
  upcomingEvents: number;
  activeAds: number;
  openComplaints: number;
  totalPoints: number;
  userGrowth: Array<{ month: string; count: number }>;
  requestsByType: Array<{ type: string; count: number }>;
  contributionsByMethod: Array<{ method: string; count: number }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entity: string | null;
    entityId: string | null;
    severity: string;
    createdAt: string;
    actor: { id: string; name: string | null } | null;
  }>;
  urgentAlerts: {
    pendingEthicsRequests: number;
    pendingAds: number;
    openComplaints: number;
  };
}

// ===================================================================
//  دوال مساعدة
// ===================================================================

/** بداية الشهر الحالي (UTC) */
function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

/** شهر سابق بصيغة "YYYY-MM" */
function monthKey(d: Date): string {
  return format(d, "yyyy-MM");
}

/** تنسيق الشهر للعرض العربي القصير */
function shortMonthLabel(d: Date): string {
  return new Intl.DateTimeFormat("ar-MA", { month: "short" }).format(d);
}

// ===================================================================
//  الدالة الرئيسية — تجلب كل KPIs دفعةً واحدة
// ===================================================================

export async function getAdminStats(districtId: string): Promise<AdminStats> {
  const now = new Date();
  const monthStart = startOfMonth(now);

  // 1) العدّادات الأساسية
  const [
    usersCount,
    familiesCount,
    contributionsThisMonthAgg,
    disbursedThisMonthAgg,
    totalContributedAgg,
    totalDisbursedAgg,
    pendingRequestsCount,
    upcomingEventsCount,
    activeAdsCount,
    openComplaintsCount,
    totalPointsAgg,
    pendingEthicsRequestsCount,
    pendingAdsCount,
  ] = await Promise.all([
    db.user.count({
      where: { districtId, deletedAt: null },
    }),
    db.family.count({
      where: { districtId, deletedAt: null },
    }),
    db.contribution.aggregate({
      where: {
        districtId,
        status: "CONFIRMED",
        createdAt: { gte: monthStart },
      },
      _sum: { amount: true },
    }),
    db.fundRequest.aggregate({
      where: {
        districtId,
        status: { in: ["DISBURSED", "COMPLETED"] },
        disbursedAt: { gte: monthStart },
      },
      _sum: { amountDisbursed: true },
    }),
    db.contribution.aggregate({
      where: { districtId, status: "CONFIRMED" },
      _sum: { amount: true },
    }),
    db.fundRequest.aggregate({
      where: {
        districtId,
        status: { in: ["DISBURSED", "COMPLETED"] },
      },
      _sum: { amountDisbursed: true },
    }),
    db.fundRequest.count({
      where: {
        districtId,
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      },
    }),
    db.event.count({
      where: {
        districtId,
        startDate: { gt: now },
        status: "PUBLISHED",
        deletedAt: null,
      },
    }),
    db.ad.count({
      where: { districtId, status: "ACTIVE" },
    }),
    db.complaint.count({
      where: {
        districtId,
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    }),
    db.user.aggregate({
      where: { districtId, deletedAt: null },
      _sum: { points: true },
    }),
    db.fundRequest.count({
      where: {
        districtId,
        requiresEthics: true,
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      },
    }),
    db.ad.count({
      where: { districtId, status: "PENDING" },
    }),
  ]);

  // 2) نمو الأعضاء — آخر 12 شهراً
  const userGrowthPromises = Array.from({ length: 12 }).map((_, i) => {
    const d = subMonths(now, 11 - i);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return db.user
      .count({
        where: {
          districtId,
          createdAt: { gte: start, lt: end },
          deletedAt: null,
        },
      })
      .then((count) => ({
        month: shortMonthLabel(d),
        key: monthKey(d),
        count,
      }));
  });
  const userGrowth = await Promise.all(userGrowthPromises);

  // 3) توزيع الطلبات حسب النوع (6 أنواع ثابتة)
  const allTypes: FundRequestType[] = [
    "MEDICAL",
    "DEATH",
    "WEDDING",
    "EDUCATION",
    "EMERGENCY",
    "MICRO_PROJECT",
  ];
  const requestsByTypeRaw = await db.fundRequest.groupBy({
    by: ["type"],
    where: { districtId },
    _count: { _all: true },
  });
  const typeCountMap = new Map(
    requestsByTypeRaw.map((r) => [r.type, r._count._all] as const)
  );
  const requestsByType = allTypes.map((type) => ({
    type,
    count: typeCountMap.get(type) ?? 0,
  }));

  // 4) توزيع المساهمات حسب الطريقة (3 طرق ثابتة)
  const allMethods: ContributionMethod[] = [
    "BANK_TRANSFER",
    "CASH",
    "CMI",
  ];
  const contributionsByMethodRaw = await db.contribution.groupBy({
    by: ["method"],
    where: { districtId, status: "CONFIRMED" },
    _count: { _all: true },
  });
  const methodCountMap = new Map(
    contributionsByMethodRaw.map((c) => [c.method, c._count._all] as const)
  );
  const contributionsByMethod = allMethods.map((method) => ({
    method,
    count: methodCountMap.get(method) ?? 0,
  }));

  // 5) آخر 10 أنشطة (AuditLogs)
  const recentLogsRaw: AuditLog[] = await db.auditLog.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      actor: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  }) as unknown as AuditLog[];

  // تعديل الصيغة للإرجاع (actor منفصل، تواريخ بصيغة ISO)
  const recentActivity = recentLogsRaw.map((log) => ({
    id: log.id,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    severity: log.severity,
    createdAt:
      log.createdAt instanceof Date
        ? log.createdAt.toISOString()
        : String(log.createdAt),
    actor: log.actor
      ? {
          id: log.actor.id,
          name: (log.actor as { fullName?: string }).fullName ?? null,
        }
      : null,
  }));

  return {
    users: usersCount,
    families: familiesCount,
    contributionsThisMonth: contributionsThisMonthAgg._sum.amount ?? 0,
    disbursedThisMonth: disbursedThisMonthAgg._sum.amountDisbursed ?? 0,
    currentBalance:
      (totalContributedAgg._sum.amount ?? 0) -
      (totalDisbursedAgg._sum.amountDisbursed ?? 0),
    pendingRequests: pendingRequestsCount,
    upcomingEvents: upcomingEventsCount,
    activeAds: activeAdsCount,
    openComplaints: openComplaintsCount,
    totalPoints: totalPointsAgg._sum.points ?? 0,
    userGrowth: userGrowth.map((g) => ({
      month: g.month,
      count: g.count,
    })),
    requestsByType,
    contributionsByMethod,
    recentActivity,
    urgentAlerts: {
      pendingEthicsRequests: pendingEthicsRequestsCount,
      pendingAds: pendingAdsCount,
      openComplaints: openComplaintsCount,
    },
  };
}
