"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Activity, RefreshCw, Users, Coins, CalendarDays, TrendingUp, TrendingDown,
  AlertTriangle, Lock, Bell, BookOpen, ShoppingCart, MessageSquare,
  Lightbulb, Tag, ShieldCheck, File, Flag, UsersRound, MapPin, Megaphone,
  Heart, MessageCircle, ArrowUpRight,
} from "lucide-react";
import {
  RetentionLineChart, EngagementBarChart, FeatureUsagePieChart, NotificationsAreaChart,
} from "@/components/admin/admin-charts";

// ===================================================================
//  DashboardClient v35.1 — Kiranism-inspired Bento Dashboard
//  - 4 KPI cards كبيرة في الأعلى (text-3xl + trend + icon)
//  - Bento Grid: 8-col (2×2 charts) + 4-col (live feed)
//  - Alerts banner (pending requests + locked users)
//  - 18 KPI compact grid في الأسفل
//  - fetch من /api/admin/dashboard + /api/admin/analytics
// ===================================================================

interface Section { key: string; nameAr: string; count: number; detail?: string }

interface AnalyticsData {
  kpis: {
    dau: number; mau: number; dauMauRatio: number;
    newUsersToday: number; newUsers7d: number;
    avgStreak: number; longestStreak: number;
    participationRate: number; notifOpenRate: number;
  };
  retentionCurve: Array<{ day: string; D1: number; D7: number; D30: number }>;
  engagementByMonth: Array<{ month: string; activities: number }>;
  featureUsage: { streaks: number; mysteryBoxes: number; spinWheels: number; challenges: number; events: number };
  notificationsByType: Array<{ type: string; sent: number; opened: number }>;
}

const FEATURE_LABELS: Record<string, string> = {
  streaks: "السلاسل",
  mysteryBoxes: "الصناديق الغامضة",
  spinWheels: "عجلات الحظ",
  challenges: "التحدّيات",
  events: "الفعاليات",
};

const NOTIF_LABELS: Record<string, string> = {
  STREAK_FREEZE: "تجميد السلسلة",
  CHALLENGE: "تحدّي",
  REWARD: "مكافأة",
  REMINDER: "تذكير",
  SOCIAL: "اجتماعي",
  INFO: "معلومات",
};

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  users: Users, families: UsersRound, districts: MapPin, groups: Users, fund_pending: Coins,
  contributions: Coins, events: CalendarDays, blog_posts: BookOpen, blog_comments: MessageCircle,
  blog_likes: Heart, ads: Megaphone, store: ShoppingCart, discussions: MessageSquare,
  initiatives: Lightbulb, price_reports: Tag, cndp: ShieldCheck, audit_logs: File, feature_flags: Flag,
};

const SECTION_LINKS: Record<string, string> = {
  users: "/admin/users/manage", families: "/admin/users/manage", districts: "/admin/feature-control",
  groups: "/admin/feature-control", fund_pending: "/admin/content", contributions: "/admin/content",
  events: "/admin/content", blog_posts: "/admin/content", blog_comments: "/admin/content",
  blog_likes: "/admin/content", ads: "/admin/feature-control", store: "/admin/feature-control",
  discussions: "/admin/content", initiatives: "/admin/content", price_reports: "/admin/content",
  cndp: "/admin/content", audit_logs: "/admin/content", feature_flags: "/admin/feature-control",
};

export function DashboardClient() {
  const [sections, setSections] = React.useState<Section[]>([]);
  const [security, setSecurity] = React.useState<Section[]>([]);
  const [analytics, setAnalytics] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, anaRes] = await Promise.all([
        fetch("/api/admin/dashboard", { cache: "no-store" }),
        fetch("/api/admin/analytics", { cache: "no-store" }),
      ]);
      if (dashRes.ok) {
        const d = await dashRes.json();
        setSections(d.sections ?? []);
        setSecurity(d.security ?? []);
      }
      if (anaRes.ok) {
        setAnalytics(await anaRes.json());
      }
    } catch {
      toast.error("فشل تحميل اللوحة");
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 60000);
    return () => clearInterval(i);
  }, [fetchData]);

  // اشتقاق 4 KPIs رئيسية من sections
  const find = (key: string) => sections.find((s) => s.key === key);
  const usersSection = find("users");
  const contribSection = find("contributions");
  const eventsSection = find("events");
  const fundPendingSection = find("fund_pending");

  // مشتقّات للـ trend (من analytics.kpis.newUsers7d vs newUsersToday)
  const trend7d = analytics?.kpis.newUsers7d ?? 0;
  const trendToday = analytics?.kpis.newUsersToday ?? 0;
  const userTrend = trend7d > 0 ? `+${trend7d} هذا الأسبوع` : "—";

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8 max-w-[1400px]">
      {/* رأس اللوحة — يساري (لا text-center) */}
      <header className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl lg:text-3xl font-extrabold flex items-center gap-2 text-foreground">
            <Activity className="size-7 text-primary" />
            <span>اللوحة الشاملة</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            مؤشّرات حيّة · آخر تحديث: {new Date().toLocaleTimeString("ar-MA")}
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading} className="h-10">
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          <span>تحديث</span>
        </Button>
      </header>

      {/* Alerts banner — طلبات معلقة + مقفلون */}
      {(security.length > 0 || (fundPendingSection && fundPendingSection.count > 0)) && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {fundPendingSection && fundPendingSection.count > 0 && (
            <Link href="/admin/content" className="group">
              <Card className="border-amber-200 bg-amber-50/60 dark:bg-amber-950/10 dark:border-amber-900/40 lift-on-hover">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">طلبات صندوق معلّقة</p>
                    <p className="text-xs text-muted-foreground">بحاجة لمراجعة</p>
                  </div>
                  <Badge className="bg-amber-600 text-white">{fundPendingSection.count}</Badge>
                  <ArrowUpRight className="size-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                </CardContent>
              </Card>
            </Link>
          )}
          {security.map((s) => (
            <Link key={s.key} href="/admin/users/manage" className="group">
              <Card className="border-red-200 bg-red-50/60 dark:bg-red-950/10 dark:border-red-900/40 lift-on-hover">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-red-100 dark:bg-red-900/30">
                    <Lock className="size-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{s.nameAr}</p>
                    <p className="text-xs text-muted-foreground">حسابات مقيّدة</p>
                  </div>
                  <Badge className="bg-red-600 text-white">{s.count}</Badge>
                  <ArrowUpRight className="size-4 text-red-600 group-hover:translate-x-0.5 transition-transform" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* 4 KPI cards كبيرة (نمط Kiranism) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="إجمالي المستخدمين"
          value={usersSection?.count ?? 0}
          icon={<Users className="size-5" />}
          trend={userTrend}
          trendUp
          accent="primary"
          loading={loading}
        />
        <KpiCard
          label="إجمالي المساهمات"
          value={contribSection?.count ?? 0}
          unit="د.م"
          icon={<Coins className="size-5" />}
          trend="مُؤكَّد"
          accent="secondary"
          loading={loading}
        />
        <KpiCard
          label="الفعاليات"
          value={eventsSection?.count ?? 0}
          icon={<CalendarDays className="size-5" />}
          trend={analytics?.kpis.participationRate ? `${analytics.kpis.participationRate}% مشاركة` : "—"}
          trendUp
          accent="accent"
          loading={loading}
        />
        <KpiCard
          label="الالتصاق (DAU/MAU)"
          value={analytics?.kpis.dauMauRatio ?? 0}
          unit="%"
          icon={<TrendingUp className="size-5" />}
          trend={`${analytics?.kpis.dau ?? 0} DAU`}
          trendUp
          accent="primary"
          loading={loading}
        />
      </div>

      {/* Bento Grid: 8-col charts + 4-col live feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        {/* Charts 2×2 في 8 أعمدة */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="منحنى الاحتفاظ (30 يوم)" subtitle="D1 / D7 / D30">
            {analytics ? <RetentionLineChart data={analytics.retentionCurve} /> : <ChartSkeleton />}
          </ChartCard>
          <ChartCard title="التفاعل الشهري" subtitle="12 شهراً — عدد الأنشطة">
            {analytics ? <EngagementBarChart data={analytics.engagementByMonth} /> : <ChartSkeleton />}
          </ChartCard>
          <ChartCard title="استخدام الميزات" subtitle="توزيع التفاعل">
            {analytics ? (
              <FeatureUsagePieChart
                data={Object.entries(analytics.featureUsage).map(([k, v]) => ({
                  name: FEATURE_LABELS[k] ?? k,
                  value: v,
                }))}
              />
            ) : <ChartSkeleton />}
          </ChartCard>
          <ChartCard title="الإشعارات" subtitle="مُرسَلة مقابل مفتوحة">
            {analytics ? (
              <NotificationsAreaChart
                data={analytics.notificationsByType.map((n) => ({
                  type: NOTIF_LABELS[n.type] ?? n.type,
                  sent: n.sent,
                  opened: n.opened,
                }))}
              />
            ) : <ChartSkeleton />}
          </ChartCard>
        </div>

        {/* Live Feed في 4 أعمدة */}
        <div className="lg:col-span-4">
          <LiveFeed loading={loading} />
        </div>
      </div>

      {/* 18 KPI compact grid — في الأسفل */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-heading text-lg font-bold text-foreground">كل المؤشّرات</h2>
          <Badge variant="secondary">{sections.length} قسم</Badge>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 18 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {sections.map((s) => {
              const Icon = SECTION_ICONS[s.key] ?? Activity;
              const href = SECTION_LINKS[s.key] ?? "#";
              return (
                <Link key={s.key} href={href} className="group">
                  <Card className="lift-on-hover h-full">
                    <CardContent className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Icon className="size-5 text-primary" />
                        <span className="font-heading text-xl font-extrabold text-foreground tabular-nums">
                          {new Intl.NumberFormat("ar-MA").format(s.count)}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-foreground">{s.nameAr}</p>
                      {s.detail && <p className="text-xs text-muted-foreground">{s.detail}</p>}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ━━━ بطاقة KPI كبيرة (نمط Kiranism) ━━━
function KpiCard({
  label, value, unit, icon, trend, trendUp, accent, loading,
}: {
  label: string;
  value: number;
  unit?: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  accent: "primary" | "secondary" | "accent";
  loading?: boolean;
}) {
  const accentClasses = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/15 text-accent-foreground",
  };
  const valueColor = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
  };
  if (loading) {
    return <Card><CardContent className="p-5"><Skeleton className="h-24 rounded" /></CardContent></Card>;
  }
  return (
    <Card className="lift-on-hover relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`grid size-10 place-items-center rounded-xl ${accentClasses[accent]}`}>
            {icon}
          </div>
          {trend && (
            <Badge variant="outline" className={`gap-1 ${trendUp ? "text-secondary border-secondary/30" : "text-muted-foreground"}`}>
              {trendUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              <span className="text-xs">{trend}</span>
            </Badge>
          )}
        </div>
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <p className={`font-heading font-extrabold tabular-nums ${valueColor[accent]}`} style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}>
          {new Intl.NumberFormat("ar-MA").format(value)}
          {unit && <span className="text-sm font-normal text-muted-foreground ms-1">{unit}</span>}
        </p>
      </CardContent>
    </Card>
  );
}

// ━━━ Chart Card wrapper ━━━
function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="lift-on-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-foreground">{title}</CardTitle>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-[240px] rounded" />;
}

// ━━━ Live Feed — آخر 10 أنشطة (من /api/public/activity-feed) ━━━
function LiveFeed({ loading }: { loading: boolean }) {
  const [activities, setActivities] = React.useState<Array<{ type: string; description: string; timeAgo: string }>>([]);

  React.useEffect(() => {
    fetch("/api/public/activity-feed", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setActivities(Array.isArray(d) ? d : (d.activities ?? [])))
      .catch(() => setActivities([]));
  }, [loading]);

  const typeIcon: Record<string, string> = {
    login: " دخول",
    contribution: "مساهمة",
    event_registration: "تسجيل فعالية",
    post: "منشور",
    comment: "تعليق",
    join_group: "انضمام",
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold text-foreground">النشاط المباشر</CardTitle>
          <p className="text-xs text-muted-foreground">آخر 10 أنشطة عمومية</p>
        </div>
        <span className="size-2 rounded-full bg-secondary animate-pulse" />
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {activities.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}
          </div>
        ) : (
          <ul className="space-y-2 max-h-[480px] overflow-y-auto pe-1">
            {activities.map((a, i) => (
              <li key={i} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/40 transition-colors">
                <span className="size-2 rounded-full mt-1.5 shrink-0 bg-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground line-clamp-2">{a.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{a.timeAgo}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default DashboardClient;
