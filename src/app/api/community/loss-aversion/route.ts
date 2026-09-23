// ===================================================================
//  GET /api/community/loss-aversion
//  - تحذير السلسلة المعرّضة للكسر
//  - النقاط المعلّقة (للمساهمات غير المؤكّدة)
//  - الشارات المعرّضة للفقدان
//  - اتجاه الرصيد الشهري
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStreakStatus } from "@/lib/streak-engine";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    // 1) حالة السلسلة
    const streak = await getStreakStatus(user.id);

    // 2) مساهمات معلّقة (PENDING) لهذا المستخدم
    const pendingContribs = await db.contribution.aggregate({
      where: { userId: user.id, status: "PENDING" },
      _sum: { amount: true },
    });

    // 3) آخر 5 شارات للمستخدم
    const recentBadges = await db.userBadge.findMany({
      where: { userId: user.id },
      orderBy: { earnedAt: "desc" },
      take: 5,
      include: { badge: true },
    });

    // 4) اتجاه النقاط الشهري
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const lastMonthStart = new Date(monthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const thisMonthActivities = await db.userActivity.count({
      where: {
        userId: user.id,
        createdAt: { gte: monthStart },
      },
    });
    const lastMonthActivities = await db.userActivity.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: lastMonthStart,
          lt: monthStart,
        },
      },
    });

    let balanceTrendPct = 0;
    if (lastMonthActivities > 0) {
      balanceTrendPct =
        ((thisMonthActivities - lastMonthActivities) / lastMonthActivities) *
        100;
    } else if (thisMonthActivities > 0) {
      balanceTrendPct = 100;
    }

    return NextResponse.json({
      success: true,
      data: {
        streakAtRisk: streak.atRisk,
        streakHoursUntilBreak: streak.hoursUntilBreak,
        streakCurrent: streak.currentStreak,
        pendingPoints: pendingContribs._sum.amount ?? 0,
        recentBadges: recentBadges.map((ub) => ({
          id: ub.badge.id,
          name: ub.badge.name,
          icon: ub.badge.icon,
          rarity: ub.badge.rarity,
          earnedAt: ub.earnedAt.toISOString(),
        })),
        balanceTrendPct: Math.round(balanceTrendPct * 10) / 10,
        thisMonthActivities,
      } as const,
    });
  } catch (err) {
    console.error("[GET /api/community/loss-aversion]:", err);
    return NextResponse.json(
      { error: "تعذّر جلب البيانات" },
      { status: 500 }
    );
  }
}
