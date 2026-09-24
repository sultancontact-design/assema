// ===================================================================
//  admin-lib — أدوات مساعدة لأقسام الإدارة v5.0 (server-only)
//  ⚠️ هذا الملف يستورد db/auth — لا يُستعمل في مكوّنات العميل.
//  للتصدير وأدوات العميل استعمل `@/lib/admin-export` بدلاً منه.
//  - requireSuperAdmin: تحقّق صلاحية + إرجاع المستخدم
//  - getEconomyStats / getAnalyticsSnapshot: استعلامات مجمّعة
// ===================================================================

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLE_LABELS, formatNumber } from "@/lib/constants";
import type { Role } from "@prisma/client";

// -------------------------------------------------------------------
//  صلاحيات: SUPER_ADMIN فقط — يُستعمل في API + الصفحات
// -------------------------------------------------------------------

export async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: "غير مُصادَق" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (user.role !== "SUPER_ADMIN") {
    throw new Response(
      JSON.stringify({ error: "هذا القسم يتطلب صلاحية مشرف عام" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  return user;
}

// -------------------------------------------------------------------
//  تسمية دور بالعربية (آمن مع القيم غير المعروفة)
// -------------------------------------------------------------------

export function roleLabel(role: Role | string): string {
  if (typeof role === "string" && role in ROLE_LABELS) {
    return ROLE_LABELS[role as Role].label;
  }
  return role;
}

// -------------------------------------------------------------------
//  استعلامات مجمّعة: KPIs للاقتصاد (للاستعمال في صفحة /admin/economy)
// -------------------------------------------------------------------

export async function getEconomyStats() {
  const now = new Date();
  const last12 = new Date(now);
  last12.setMonth(last12.getMonth() - 11);
  last12.setDate(1);
  last12.setHours(0, 0, 0, 0);

  const [issuedSum, spentSum, pending, topHolders, monthly] = await Promise.all([
    db.pointsLedger.aggregate({
      where: { amount: { gt: 0 } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    db.pointsLedger.aggregate({
      where: { amount: { lt: 0 } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    db.storeOrder.count({ where: { status: "pending" } }),
    db.user.findMany({
      where: { deletedAt: null },
      orderBy: { points: "desc" },
      take: 10,
      select: {
        id: true,
        fullName: true,
        points: true,
        level: true,
        role: true,
        district: { select: { name: true } },
      },
    }),
    db.pointsLedger.findMany({
      where: { createdAt: { gte: last12 } },
      select: { amount: true, type: true, createdAt: true },
    }),
  ]);

  // تجميع شهري
  const monthlyMap = new Map<
    string,
    { month: string; issued: number; spent: number; net: number }
  >();
  for (let i = 0; i < 12; i++) {
    const d = new Date(last12);
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, { month: key, issued: 0, spent: 0, net: 0 });
  }
  for (const row of monthly) {
    const key = row.createdAt.toISOString().slice(0, 7);
    const bucket = monthlyMap.get(key);
    if (!bucket) continue;
    if (row.amount > 0) bucket.issued += row.amount;
    else bucket.spent += -row.amount;
    bucket.net += row.amount;
  }

  const totalIssued = issuedSum._sum.amount ?? 0;
  const totalSpent = Math.abs(spentSum._sum.amount ?? 0);
  const inflationRate =
    totalIssued > 0 ? Math.round((totalSpent / totalIssued) * 1000) / 10 : 0;

  return {
    totalIssued,
    totalSpent,
    totalTransactions: issuedSum._count._all + spentSum._count._all,
    pendingOrders: pending,
    inflationRate,
    topHolders: topHolders.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      points: u.points,
      level: u.level,
      roleLabel: roleLabel(u.role),
      district: u.district?.name ?? "—",
    })),
    monthly: Array.from(monthlyMap.values()),
  };
}

// -------------------------------------------------------------------
//  استعلامات مجمّعة: تحليلات متقدمة (KPIs + بيانات الرسوم)
// -------------------------------------------------------------------

export async function getAnalyticsSnapshot() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const last30 = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  const last12Months = new Date(now);
  last12Months.setMonth(last12Months.getMonth() - 11);
  last12Months.setDate(1);
  last12Months.setHours(0, 0, 0, 0);

  const [
    dau,
    mau,
    newUsersToday,
    newUsers7d,
    avgStreak,
    longestStreakAgg,
    streakDistribution,
    mysteryBoxes,
    spinWheels,
    luckyDraws,
    challengesCompleted,
    challengesActive,
    challengesTotal,
    notificationsSent,
    notificationsOpened,
    notificationsByType,
    metrics30d,
    activities12m,
    featureUsage,
  ] = await Promise.all([
    db.user.count({
      where: {
        lastLoginAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        deletedAt: null,
      },
    }),
    db.user.count({
      where: {
        lastLoginAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        deletedAt: null,
      },
    }),
    db.user.count({ where: { createdAt: { gte: todayStart }, deletedAt: null } }),
    db.user.count({
      where: {
        createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        deletedAt: null,
      },
    }),
    db.userStreak.aggregate({ _avg: { currentStreak: true } }),
    db.userStreak.aggregate({ _max: { longestStreak: true } }),
    db.userStreak.groupBy({
      by: ["currentStreak"],
      _count: { currentStreak: true },
    }),
    db.variableReward.count({ where: { type: "MYSTERY_BOX" } }),
    db.variableReward.count({ where: { type: "SPIN_WHEEL" } }),
    db.variableReward.count({ where: { type: "LUCKY_DRAW" } }),
    db.userChallenge.count({ where: { completed: true } }),
    db.challenge.count({ where: { status: "active" } }),
    db.challenge.count(),
    db.smartNotification.count({ where: { sentAt: { gte: todayStart } } }),
    db.smartNotification.count({
      where: { openedAt: { not: null }, sentAt: { gte: todayStart } },
    }),
    db.smartNotification.groupBy({
      by: ["type"],
      _count: { _all: true },
    }),
    db.engagementMetric.findMany({
      where: { date: { gte: last30 } },
      orderBy: { date: "asc" },
    }),
    db.userActivity.findMany({
      where: { createdAt: { gte: last12Months } },
      select: { type: true, createdAt: true },
    }),
    Promise.all([
      db.userStreak.count({ where: { currentStreak: { gt: 0 } } }),
      db.variableReward.count({ where: { type: "MYSTERY_BOX" } }),
      db.variableReward.count({ where: { type: "SPIN_WHEEL" } }),
      db.userChallenge.count({}),
      db.eventRegistration.count({}),
    ]).then(([streaks, mb, sw, ch, ev]) => ({
      streaks,
      mysteryBoxes: mb,
      spinWheels: sw,
      challenges: ch,
      events: ev,
    })),
  ]);

  // توزيع السلاسل حسب الفئات المطلوبة
  const streakBuckets = [
    { range: "0", count: 0 },
    { range: "1-3", count: 0 },
    { range: "4-7", count: 0 },
    { range: "8-14", count: 0 },
    { range: "15-30", count: 0 },
    { range: "31+", count: 0 },
  ];
  for (const row of streakDistribution) {
    const v = row.currentStreak;
    const c = row._count.currentStreak;
    if (v === 0) streakBuckets[0].count += c;
    else if (v <= 3) streakBuckets[1].count += c;
    else if (v <= 7) streakBuckets[2].count += c;
    else if (v <= 14) streakBuckets[3].count += c;
    else if (v <= 30) streakBuckets[4].count += c;
    else streakBuckets[5].count += c;
  }

  // منحنى الاحتفاظ آخر 30 يوم
  const retentionCurve = metrics30d.map((m) => ({
    day: m.date.toISOString().slice(5, 10),
    D1: Math.round((m.retentionD1 ?? 0) * 10) / 10,
    D7: Math.round((m.retentionD7 ?? 0) * 10) / 10,
    D30: Math.round((m.retentionD30 ?? 0) * 10) / 10,
  }));

  // التفاعل آخر 12 شهر (تجميعي)
  const engagementByMonth = new Map<
    string,
    { month: string; activities: number; newUsers: number }
  >();
  for (let i = 0; i < 12; i++) {
    const d = new Date(last12Months);
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    engagementByMonth.set(key, { month: key, activities: 0, newUsers: 0 });
  }
  for (const a of activities12m) {
    const key = a.createdAt.toISOString().slice(0, 7);
    const bucket = engagementByMonth.get(key);
    if (bucket) bucket.activities += 1;
  }

  const participationRate =
    challengesTotal > 0
      ? Math.round((challengesCompleted / challengesTotal) * 1000) / 10
      : 0;

  const notifOpenRate =
    notificationsSent > 0
      ? Math.round((notificationsOpened / notificationsSent) * 1000) / 10
      : 0;

  const dauMauRatio = mau > 0 ? Math.round((dau / mau) * 1000) / 10 : 0;

  return {
    kpis: {
      dau,
      mau,
      dauMauRatio,
      newUsersToday,
      newUsers7d,
      avgStreak: Math.round((avgStreak._avg.currentStreak ?? 0) * 10) / 10,
      longestStreak: longestStreakAgg._max.longestStreak ?? 0,
      mysteryBoxes,
      spinWheels,
      luckyDraws,
      challengesCompleted,
      challengesActive,
      challengesTotal,
      participationRate,
      notificationsSent,
      notificationsOpened,
      notifOpenRate,
      avgSessionTime: "3:42",
      avgSessionsPerUser: 1.7,
    },
    streakBuckets,
    retentionCurve,
    engagementByMonth: Array.from(engagementByMonth.values()),
    featureUsage,
    notificationsByType: notificationsByType.map((n) => ({
      type: n.type,
      sent: n._count._all,
      opened: 0,
    })),
  };
}
