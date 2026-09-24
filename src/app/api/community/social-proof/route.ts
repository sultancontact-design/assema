// ===================================================================
//  GET /api/community/social-proof
//  - X عضواً نشطاً الآن (آخر 15 دقيقة)
//  - X مساهمة هذا الأسبوع
//  - X فعالية قادمة
//  - آخر 5 أنشطة علنية
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

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

    const districtId = user.districtId;
    const now = new Date();
    const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      activeNowCount,
      weeklyContributions,
      upcomingEvents,
      recentActivitiesRaw,
    ] = await Promise.all([
      db.user.count({
        where: {
          districtId,
          lastLoginAt: { gte: fifteenMinAgo },
          status: "ACTIVE",
          deletedAt: null,
        },
      }),
      db.contribution.count({
        where: {
          districtId,
          createdAt: { gte: weekAgo },
          status: "CONFIRMED",
        },
      }),
      db.event.count({
        where: {
          districtId,
          startDate: { gt: now },
          status: { in: ["PUBLISHED", "ONGOING"] },
          deletedAt: null,
        },
      }),
      db.userActivity.findMany({
        where: {
          isPublic: true,
          user: { districtId, deletedAt: null },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          type: true,
          description: true,
          createdAt: true,
          user: { select: { fullName: true } },
        },
      }),
    ]);

    const recentActivities = recentActivitiesRaw.map((a) => ({
      id: a.id,
      type: a.type,
      description: a.description,
      createdAt: a.createdAt.toISOString(),
      user: { name: a.user.fullName },
    }));

    return NextResponse.json({
      success: true,
      data: {
        activeNowCount,
        weeklyContributions,
        upcomingEvents,
        recentActivities,
      } as const,
    });
  } catch (err) {
    console.error("[GET /api/community/social-proof]:", err);
    return NextResponse.json(
      { error: "تعذّر جلب البيانات" },
      { status: 500 }
    );
  }
}
