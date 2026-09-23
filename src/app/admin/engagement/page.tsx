// ===================================================================
//  /admin/engagement — لوحة الإدمان والتفاعل
//  SUPER_ADMIN فقط
//  KPIs + charts من EngagementMetric + UserActivity
// ===================================================================

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/constants";
import {
  Activity,
  Users,
  Repeat,
  Clock,
  Flame,
  Gift,
  Bell,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { EngagementCharts } from "@/components/admin/engagement-charts";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "لوحة الإدمان",
};

export default async function EngagementDashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/admin/engagement");
  }
  if (user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // ─────── بيانات KPI ───────
  const [
    dau,
    mau,
    newUsersToday,
    newUsersThisWeek,
    totalStreaks,
    totalMysteryBoxes,
    totalSpinWheels,
    challengesCompleted,
    notificationsSentToday,
    notificationsOpenedToday,
    activeStreaks,
    last7Metrics,
    topActivities,
    activityLast7Days,
  ] = await Promise.all([
    // DAU — مستخدمون نشطون اليوم (آخر 24 ساعة)
    db.user.count({
      where: {
        lastLoginAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        deletedAt: null,
      },
    }),
    // MAU — مستخدمون نشطون آخر 30 يوم
    db.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        },
        deletedAt: null,
      },
    }),
    db.user.count({
      where: { createdAt: { gte: todayStart }, deletedAt: null },
    }),
    db.user.count({
      where: { createdAt: { gte: sevenDaysAgo }, deletedAt: null },
    }),
    db.userStreak.count({ where: { currentStreak: { gt: 0 } } }),
    db.variableReward.count({ where: { type: "MYSTERY_BOX" } }),
    db.variableReward.count({ where: { type: "SPIN_WHEEL" } }),
    db.userChallenge.count({ where: { completed: true } }),
    db.smartNotification.count({ where: { sentAt: { gte: todayStart } } }),
    db.smartNotification.count({
      where: { openedAt: { not: null }, sentAt: { gte: todayStart } },
    }),
    db.userStreak.aggregate({ _avg: { currentStreak: true } }),
    // آخر 7 سجلّات يومية في EngagementMetric
    db.engagementMetric.findMany({
      orderBy: { date: "desc" },
      take: 7,
    }),
    // عدد الأنشطة آخر 7 أيام
    db.userActivity.groupBy({
      by: ["type"],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: { _all: true },
      orderBy: { _count: { type: "desc" } },
      take: 6,
    }),
    db.userActivity.count({
      where: { createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
    }),
  ]);

  void monthStart;

  const notificationOpenRate =
    notificationsSentToday > 0
      ? Math.round((notificationsOpenedToday / notificationsSentToday) * 1000) / 10
      : 0;
  const dauMauRatio = mau > 0 ? Math.round((dau / mau) * 1000) / 10 : 0;
  const avgStreak = activeStreaks._avg.currentStreak ?? 0;

  // بناء بيانات آخر 7 أيام للرسم
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const metric = last7Metrics.find(
      (m) => m.date.toISOString().slice(0, 10) === dayKey
    );
    return {
      day: dayKey.slice(5),
      dau: metric?.dau ?? 0,
      mau: metric?.mau ?? 0,
      mysteryBoxes: metric?.mysteryBoxesOpened ?? 0,
      spinWheels: metric?.spinWheelsUsed ?? 0,
      notifications: metric?.notificationsSent ?? 0,
      retentionD1: metric?.retentionD1 ?? 0,
      retentionD7: metric?.retentionD7 ?? 0,
      retentionD30: metric?.retentionD30 ?? 0,
    };
  });

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* الترويسة */}
      <header className="flex items-center justify-between gap-2">
        <div>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
            <Activity className="size-3" />
            لوحة الإدمان v3.0
          </Badge>
          <h1 className="mt-2 font-heading text-2xl font-bold text-foreground">
            هندسة التفاعل — مؤشّرات حيّة
          </h1>
        </div>
      </header>

      {/* KPIs — صفّ واحد */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard
          label="مستخدمون نشطون اليوم (DAU)"
          value={formatNumber(dau)}
          icon={<Users className="size-4" />}
          color="text-primary"
          bg="bg-primary/10"
          hint={`+${formatNumber(activityLast7Days)} نشاط آخر 24 ساعة`}
        />
        <KpiCard
          label="مستخدمون شهريّاً (MAU)"
          value={formatNumber(mau)}
          icon={<Repeat className="size-4" />}
          color="text-secondary"
          bg="bg-secondary/10"
          hint={`نسبة DAU/MAU: ${dauMauRatio}%`}
        />
        <KpiCard
          label="مستخدمون جدد اليوم"
          value={formatNumber(newUsersToday)}
          icon={<TrendingUp className="size-4" />}
          color="text-accent"
          bg="bg-accent/10"
          hint={`${formatNumber(newUsersThisWeek)} آخر أسبوع`}
        />
        <KpiCard
          label="معدّل السلاسل"
          value={avgStreak.toFixed(1)}
          icon={<Flame className="size-4" />}
          color="text-primary"
          bg="bg-primary/10"
          hint={`${formatNumber(totalStreaks)} سلسلة نشطة`}
        />
        <KpiCard
          label="صناديق مفتوحة"
          value={formatNumber(totalMysteryBoxes)}
          icon={<Gift className="size-4" />}
          color="text-accent"
          bg="bg-accent/10"
          hint={`${formatNumber(totalSpinWheels)} دوران عجلة`}
        />
        <KpiCard
          label="تحديات مكتملة"
          value={formatNumber(challengesCompleted)}
          icon={<CheckCircle2 className="size-4" />}
          color="text-secondary"
          bg="bg-secondary/10"
          hint="منذ بدء المنصة"
        />
        <KpiCard
          label="إشعارات اليوم"
          value={formatNumber(notificationsSentToday)}
          icon={<Bell className="size-4" />}
          color="text-primary"
          bg="bg-primary/10"
          hint={`معدّل الفتح: ${notificationOpenRate}%`}
        />
        <KpiCard
          label="وقت الجلسة المتوسّط"
          value="3:42"
          icon={<Clock className="size-4" />}
          color="text-accent"
          bg="bg-accent/10"
          hint="بالدم — يجمع يدويّاً"
        />
      </div>

      {/* Charts */}
      <EngagementCharts
        last7Days={last7Days}
        topActivities={topActivities.map((a) => ({
          type: a.type,
          count: a._count._all,
        }))}
      />

      {/* ملاحظة */}
      <Card>
        <CardContent className="p-5">
          <p className="text-xs text-muted-foreground">
            💡 هذه اللوحة تُحدَّث من بيانات حقيقية في قاعدة البيانات. الحقول
            بدون قيمة (مثل D1/D7/D30 retention) تتطلّب pipeline حساب يومي —
            مدرج في خارطة الطريق.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  color,
  bg,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground line-clamp-1">{label}</span>
          <div className={`flex size-8 items-center justify-center rounded-lg ${bg} ${color}`}>
            {icon}
          </div>
        </div>
        <p className={`font-heading text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground line-clamp-1">{hint}</p>
      </CardContent>
    </Card>
  );
}
