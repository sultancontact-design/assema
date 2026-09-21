// ===================================================================
//  صفحة لوحة الإدارة الرئيسية — /admin
//  Server Component — تجلب كل الإحصائيات + الأنشطة + التنبيهات
// ===================================================================

import * as React from "react";
import Link from "next/link";
import {
  Users as UsersIcon,
  Users2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  CalendarDays,
  Megaphone,
  MessageSquareWarning,
  Award,
  ArrowLeft,
  Activity,
  ShieldAlert,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getAdminStats } from "@/lib/admin/stats";
import { db } from "@/lib/db";
import {
  formatMAD,
  formatNumber,
  formatDateTimeArabic,
  FUND_REQUEST_TYPE_LABELS,
  ROLE_LABELS,
} from "@/lib/constants";
import type { Role } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { DistrictHeatmap } from "@/components/admin/district-heatmap";

export const dynamic = "force-dynamic";

// ===================================================================
//  خريطة ترجمة أحداث سجل التدقيق
// ===================================================================

const AUDIT_ACTION_LABELS: Record<string, string> = {
  "user.login": "تسجيل دخول",
  "user.logout": "تسجيل خروج",
  "user.register": "تسجيل مستخدم جديد",
  "user.role_changed": "تغيير دور مستخدم",
  "user.status_changed": "تغيير حالة مستخدم",
  "fund.contribution.created": "إنشاء مساهمة",
  "fund.contribution.confirmed": "تأكيد مساهمة",
  "fund.contribution.rejected": "رفض مساهمة",
  "fund.request.created": "إنشاء طلب صرف",
  "fund.request.approved": "موافقة على طلب",
  "fund.request.rejected": "رفض طلب",
  "fund.request.disbursed": "صرف طلب",
  "system.fraud_detected": "كشف احتيال",
  "admin.settings.updated": "تحديث الإعدادات",
  "admin.backup.downloaded": "تنزيل نسخة احتياطية",
};

function actionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

// ===================================================================
//  شارة الخطور
// ===================================================================

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    info: "bg-muted text-muted-foreground border-border",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    critical: "bg-rose-100 text-rose-700 border-rose-200",
  };
  const labels: Record<string, string> = {
    info: "معلومة",
    warning: "تحذير",
    critical: "حرج",
  };
  return (
    <Badge variant="outline" className={styles[severity] ?? styles.info}>
      {labels[severity] ?? severity}
    </Badge>
  );
}

// ===================================================================
//  بطاقة KPI صغيرة
// ===================================================================

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  href?: string;
}

function KpiCard({ label, value, hint, icon: Icon, href }: KpiCardProps) {
  const inner = (
    <Card className="h-full border border-border bg-card transition-colors hover:border-accent/30">
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon
            className="size-4 text-accent"
            strokeWidth={1.5}
          />
        </div>
        <span className="font-heading text-2xl font-bold text-foreground">
          {value}
        </span>
        {hint && (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

// ===================================================================
//  بطاقة "تنبيه عاجل"
// ===================================================================

interface AlertItem {
  href: string;
  label: string;
  count: number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

function UrgentAlerts({ items }: { items: AlertItem[] }) {
  return (
    <Card className="border border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ShieldAlert className="size-4 text-accent" strokeWidth={1.5} />
          <span>تنبيهات عاجلة</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.every((i) => i.count === 0) ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            لا توجد تنبيهات عاجلة الآن — الحالة مستقرة.
          </p>
        ) : (
          items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3 transition-colors hover:border-accent/30 hover:bg-muted/50"
              >
                <Icon className="size-4 text-accent" strokeWidth={1.5} />
                <span className="flex-1 text-sm text-foreground">
                  {item.label}
                </span>
                <Badge
                  variant="outline"
                  className="border-accent/30 bg-accent/10 text-accent"
                >
                  {formatNumber(item.count)}
                </Badge>
                <ArrowLeft className="size-3 text-muted-foreground" strokeWidth={1.5} />
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// ===================================================================
//  بطاقة آخر الأنشطة
// ===================================================================

function RecentActivity({
  logs,
}: {
  logs: Array<{
    id: string;
    action: string;
    entity: string | null;
    entityId: string | null;
    severity: string;
    createdAt: string;
    actor: { id: string; name: string | null } | null;
  }>;
}) {
  return (
    <Card className="border border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Activity className="size-4 text-accent" strokeWidth={1.5} />
          <span>آخر 10 أنشطة</span>
        </CardTitle>
        <Button asChild variant="ghost" size="sm" className="h-9">
          <Link href="/admin/audit">عرض الكل</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {logs.length === 0 ? (
            <li className="px-6 py-8 text-center text-sm text-muted-foreground">
              لا يوجد نشاط مسجّل بعد
            </li>
          ) : (
            logs.map((log) => (
              <li
                key={log.id}
                className="flex items-start gap-3 px-6 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    {actionLabel(log.action)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {log.actor?.name ?? "النظام"}
                    {log.entity ? ` · ${log.entity}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <SeverityBadge severity={log.severity} />
                  <span className="text-[10px] text-muted-foreground">
                    {formatDateTimeArabic(log.createdAt)}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

// ===================================================================
//  صفحة لوحة الإدارة الرئيسية
// ===================================================================

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null; // الـlayout يتعامل مع إعادة التوجيه

  // 1) جلب كل الإحصائيات دفعةً واحدة
  const stats = await getAdminStats(user.districtId);

  // 2) جلب التنبيهات العاجلة المفصّلة (آخر 5 من كل نوع)
  const [ethicsRequests, openComplaints, pendingAds] = await Promise.all([
    db.fundRequest.findMany({
      where: {
        districtId: user.districtId,
        requiresEthics: true,
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        anonymousCode: true,
        type: true,
        amountRequested: true,
        createdAt: true,
      },
    }),
    db.complaint.findMany({
      where: {
        districtId: user.districtId,
        status: "OPEN",
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        subject: true,
        createdAt: true,
      },
    }),
    db.ad.findMany({
      where: {
        districtId: user.districtId,
        status: "PENDING",
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        advertiserName: true,
        package: true,
        createdAt: true,
      },
    }),
  ]);

  // 3) بناء قائمة التنبيهات العاجلة
  const alertItems: AlertItem[] = [
    {
      href: "/admin/fund?tab=requests",
      label: "طلبات تنتظر تصويت لجنة النزاهة",
      count: stats.urgentAlerts.pendingEthicsRequests,
      icon: ShieldAlert,
    },
    {
      href: "/admin/complaints",
      label: "شكاوى مفتوحة بحاجة لمعالجة",
      count: stats.urgentAlerts.openComplaints,
      icon: MessageSquareWarning,
    },
    {
      href: "/admin/ads",
      label: "إعلانات تنتظر الموافقة",
      count: stats.urgentAlerts.pendingAds,
      icon: Megaphone,
    },
  ];

  // 4) بناء بطاقات KPI الـ10
  const kpiCards: KpiCardProps[] = [
    {
      label: "أعضاء إجمالي",
      value: formatNumber(stats.users),
      hint: "في الحي",
      icon: UsersIcon,
      href: "/admin/users",
    },
    {
      label: "أسر مسجّلة",
      value: formatNumber(stats.families),
      hint: "أسرة نشطة",
      icon: Users2,
      href: "/admin/families",
    },
    {
      label: "مساهمات الشهر",
      value: formatMAD(stats.contributionsThisMonth),
      hint: "مؤكَّدة هذا الشهر",
      icon: TrendingUp,
      href: "/admin/fund?tab=contributions",
    },
    {
      label: "صرف الشهر",
      value: formatMAD(stats.disbursedThisMonth),
      hint: "مصروف هذا الشهر",
      icon: TrendingDown,
      href: "/admin/fund?tab=requests",
    },
    {
      label: "الرصيد الحالي",
      value: formatMAD(stats.currentBalance),
      hint: "إجمالي منذ الانطلاق",
      icon: Wallet,
      href: "/admin/fund",
    },
    {
      label: "طلبات معلّقة",
      value: formatNumber(stats.pendingRequests),
      hint: "بانتظار المراجعة",
      icon: Clock,
      href: "/admin/fund?tab=requests",
    },
    {
      label: "فعاليات قادمة",
      value: formatNumber(stats.upcomingEvents),
      hint: "منشورة",
      icon: CalendarDays,
      href: "/admin/events",
    },
    {
      label: "إعلانات نشطة",
      value: formatNumber(stats.activeAds),
      hint: "تشغيل فعلي",
      icon: Megaphone,
      href: "/admin/ads",
    },
    {
      label: "شكاوى مفتوحة",
      value: formatNumber(stats.openComplaints),
      hint: "بحاجة لمعالجة",
      icon: MessageSquareWarning,
      href: "/admin/complaints",
    },
    {
      label: "نقاط اللعب",
      value: formatNumber(stats.totalPoints),
      hint: "مجموع نقاط الأعضاء",
      icon: Award,
      href: "/admin/users",
    },
  ];

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            لوحة الإدارة
          </h1>
          <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
            {ROLE_LABELS[user.role as Role]?.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          نظرة شاملة على نشاط حيّ سيدي يوسف بن علي — الأعضاء، الصندوق، الفعاليات،
          الإعلانات، الشكاوى.
        </p>
      </header>

      {/* KPIs — شبكة متجاوبة */}
      <section
        aria-label="مؤشرات الأداء"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        {kpiCards.map((card, i) => (
          <KpiCard key={i} {...card} />
        ))}
      </section>

      {/* الرسوم البيانية */}
      <section aria-labelledby="charts-title">
        <h2
          id="charts-title"
          className="mb-3 font-heading text-lg font-semibold text-foreground"
        >
          تحليلات بصرية
        </h2>
        <DashboardCharts
          data={{
            userGrowth: stats.userGrowth,
            requestsByType: stats.requestsByType,
            contributionsByMethod: stats.contributionsByMethod,
          }}
        />
      </section>

      {/* صف آخر: النشاط + التنبيهات */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentActivity logs={stats.recentActivity} />
        <UrgentAlerts items={alertItems} />
      </section>

      {/* خريطة الحي الحرارية */}
      <section aria-labelledby="heatmap-title">
        <h2
          id="heatmap-title"
          className="mb-3 font-heading text-lg font-semibold text-foreground"
        >
          خريطة الحي الحرارية
        </h2>
        <Card className="border border-border bg-card">
          <CardContent className="p-6">
            <DistrictHeatmap districtName="سيدي يوسف بن علي" />
          </CardContent>
        </Card>
      </section>

      {/* تفصيل التنبيهات (للطلبات الأخيرة التي تنتظر معالجة) */}
      {(ethicsRequests.length > 0 ||
        openComplaints.length > 0 ||
        pendingAds.length > 0) && (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {ethicsRequests.length > 0 && (
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ShieldAlert className="size-4 text-accent" strokeWidth={1.5} />
                  <span>طلبات لجنة النزاهة</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ethicsRequests.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 p-2.5 text-xs"
                  >
                    <div>
                      <span className="font-mono text-accent">
                        {r.anonymousCode}
                      </span>
                      <span className="ms-2 text-foreground">
                        {FUND_REQUEST_TYPE_LABELS[r.type].label}
                      </span>
                    </div>
                    <span className="font-semibold">
                      {formatMAD(r.amountRequested)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {openComplaints.length > 0 && (
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MessageSquareWarning className="size-4 text-accent" strokeWidth={1.5} />
                  <span>شكاوى مفتوحة</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {openComplaints.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-md border border-border bg-muted/30 p-2.5 text-xs"
                  >
                    <p className="font-medium text-foreground">{c.subject}</p>
                    <p className="text-muted-foreground">
                      {c.type} · {formatDateTimeArabic(c.createdAt)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {pendingAds.length > 0 && (
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Megaphone className="size-4 text-accent" strokeWidth={1.5} />
                  <span>إعلانات تنتظر الموافقة</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingAds.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-md border border-border bg-muted/30 p-2.5 text-xs"
                  >
                    <p className="font-medium text-foreground">{a.title}</p>
                    <p className="text-muted-foreground">
                      {a.advertiserName} · {a.package}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </section>
      )}
    </div>
  );
}
