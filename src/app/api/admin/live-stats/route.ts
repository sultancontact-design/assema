import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "admin.dashboard")) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last15Min = new Date(now.getTime() - 15 * 60 * 1000);

  try {
    // مستخدمون نشطون (آخر دخول خلال 15 دقيقة)
    const activeUsers = await db.user.count({
      where: {
        lastLoginAt: { gte: last15Min },
        deletedAt: null,
        status: "ACTIVE",
      },
    });

    // مساهمات اليوم
    const contributionsToday = await db.contribution.count({
      where: { createdAt: { gte: todayStart } },
    });

    // فعاليات اليوم
    const eventsToday = await db.event.count({
      where: {
        OR: [
          { startDate: { gte: todayStart, lte: now } },
          { status: "ONGOING" },
        ],
      },
    });

    // نسبة الانتماء: (مساهمات + فعاليات + دخول اليوم) / إجمالي الأعضاء
    const totalUsers = await db.user.count({ where: { deletedAt: null, status: "ACTIVE" } });
    const loginsToday = await db.user.count({
      where: { lastLoginAt: { gte: todayStart } },
    });
    const engagementRate = totalUsers > 0
      ? Math.round(((contributionsToday + eventsToday + loginsToday) / totalUsers) * 100)
      : 0;

    // آخر 20 نشاط من AuditLog
    const recentLogs = await db.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        action: true,
        severity: true,
        createdAt: true,
        actorId: true,
        actor: { select: { fullName: true } },
      },
    });

    const recentActivities = recentLogs.map((log) => ({
      id: log.id,
      action: log.action,
      user: log.actor?.fullName ?? "النظام",
      time: new Intl.DateTimeFormat("ar-MA", { hour: "2-digit", minute: "2-digit" }).format(log.createdAt),
      severity: log.severity,
    }));

    return NextResponse.json({
      activeUsers,
      contributionsToday,
      eventsToday,
      engagementRate,
      totalUsers,
      loginsToday,
      recentActivities,
    });
  } catch (error) {
    return NextResponse.json(
      {
        activeUsers: 0,
        contributionsToday: 0,
        eventsToday: 0,
        engagementRate: 0,
        recentActivities: [],
        error: "فشل جلب البيانات",
      },
      { status: 500 }
    );
  }
}
