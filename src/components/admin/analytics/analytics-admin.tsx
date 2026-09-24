"use client";

// ===================================================================
//  AnalyticsAdmin — التحليلات المتقدمة
//  - KPIs (DAU/MAU/Retention/avg session/streak/open rate)
//  - منحنى الاحتفاظ (Line) + التفاعل عبر الأشهر (Area) + استخدام الميزات (Bar)
//  - أداء الإشعارات (Bar sent vs opened)
//  - تقارير وتوصيات + تصدير PDF/Excel/CSV
// ===================================================================

import * as React from "react";
import {
  BarChart3,
  Users,
  Repeat,
  Activity,
  Clock,
  Flame,
  Bell,
  Gift,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { exportSheet } from "@/lib/admin-export";
import { formatNumber } from "@/lib/constants";

// ------------------------- الأنواع -------------------------

interface Snapshot {
  kpis: {
    dau: number;
    mau: number;
    dauMauRatio: number;
    newUsersToday: number;
    newUsers7d: number;
    avgStreak: number;
    longestStreak: number;
    mysteryBoxes: number;
    spinWheels: number;
    luckyDraws: number;
    challengesCompleted: number;
    challengesActive: number;
    challengesTotal: number;
    participationRate: number;
    notificationsSent: number;
    notificationsOpened: number;
    notifOpenRate: number;
    avgSessionTime: string;
    avgSessionsPerUser: number;
  };
  streakBuckets: Array<{ range: string; count: number }>;
  retentionCurve: Array<{ day: string; D1: number; D7: number; D30: number }>;
  engagementByMonth: Array<{ month: string; activities: number; newUsers: number }>;
  featureUsage: {
    streaks: number;
    mysteryBoxes: number;
    spinWheels: number;
    challenges: number;
    events: number;
  };
  notificationsByType: Array<{ type: string; sent: number; opened: number }>;
}

interface Props {
  snapshot: Snapshot;
}

const NOTIF_TYPE_LABELS: Record<string, string> = {
  STREAK: "السلاسل",
  MYSTERY_BOX: "الصندوق الغامض",
  SOCIAL: "اجتماعي",
  URGENCY: "إلحاح",
  REWARD: "مكافأة",
  CHALLENGE: "تحدي",
  LOSS: "خسارة",
  ACHIEVEMENT: "إنجاز",
  RECOMMENDATION: "توصية",
  WELCOME_BACK: "ترحيب",
};

export function AnalyticsAdmin({ snapshot }: Props) {
  const { kpis } = snapshot;

  function exportExcel() {
    const rows = [
      { المؤشّر: "DAU (يومي)", القيمة: kpis.dau },
      { المؤشّر: "MAU (شهري)", القيمة: kpis.mau },
      { المؤشّر: "DAU/MAU نسبة", القيمة: `${kpis.dauMauRatio}%` },
      { المؤشّر: "مستخدمون جدد اليوم", القيمة: kpis.newUsersToday },
      { المؤشّر: "مستخدمون جدد آخر 7 أيام", القيمة: kpis.newUsers7d },
      { المؤشّر: "متوسط السلاسل", القيمة: kpis.avgStreak },
      { المؤشّر: "أطول سلسلة", القيمة: kpis.longestStreak },
      { المؤشّر: "صناديق مفتوحة", القيمة: kpis.mysteryBoxes },
      { المؤشّر: "عجلات دوّارة", القيمة: kpis.spinWheels },
      { المؤشّر: "قرعات", القيمة: kpis.luckyDraws },
      { المؤشّر: "تحديات مكتملة", القيمة: kpis.challengesCompleted },
      { المؤشّر: "تحديات نشطة", القيمة: kpis.challengesActive },
      { المؤشّر: "نسبة المشاركة", القيمة: `${kpis.participationRate}%` },
      { المؤشّر: "إشعارات اليوم", القيمة: kpis.notificationsSent },
      { المؤشّر: "معدّل فتح الإشعارات", القيمة: `${kpis.notifOpenRate}%` },
      { المؤشّر: "وقت الجلسة المتوسط", القيمة: kpis.avgSessionTime },
    ];
    exportSheet(rows, "analytics-kpis", "المؤشّرات", "xlsx");
    toast.success("تم تصدير Excel");
  }

  function exportCSV() {
    const rows = snapshot.engagementByMonth.map((e) => ({
      الشهر: e.month,
      الأنشطة: e.activities,
      مستخدمون_جدد: e.newUsers,
    }));
    exportSheet(rows, "analytics-engagement", "التفاعل", "csv");
    toast.success("تم تصدير CSV");
  }

  function exportPDF() {
    toast.info("سيتم إنشاء PDF — استعمل زر طباعة المتصفّح (Ctrl+P) أو صفحة /admin/reports");
  }

  // توصيات
  const recommendations: Array<{ title: string; severity: "info" | "warning" | "danger" }> = [];
  if (kpis.notifOpenRate < 20 && kpis.notificationsSent > 0) {
    recommendations.push({
      title: `معدّل فتح الإشعارات منخفض (${kpis.notifOpenRate}%). جرّب إعادة ضبط ساعات الهدوء أو إيقاف بعض الأنواع.`,
      severity: "warning",
    });
  }
  if (kpis.dauMauRatio < 15) {
    recommendations.push({
      title: `نسبة DAU/MAU منخفضة (${kpis.dauMauRatio}%). فكّر في تعزيز السلاسل اليومية والمكافآت المتغيرة.`,
      severity: "danger",
    });
  }
  if (kpis.mysteryBoxes > kpis.spinWheels && kpis.spinWheels > 0) {
    recommendations.push({
      title: "الصندوق الغامض أكثر استخداماً من عجلة الدوران. خصّص مزيداً من الترويج للعجلة.",
      severity: "info",
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      title: "كل المؤشّرات ضمن نطاقات صحية. واصل المراقبة اليومية.",
      severity: "info",
    });
  }

  // اكثر/اقل الميزات استخداماً
  const features = [
    { name: "السلاسل", value: snapshot.featureUsage.streaks },
    { name: "صندوق غامض", value: snapshot.featureUsage.mysteryBoxes },
    { name: "عجلة دوّارة", value: snapshot.featureUsage.spinWheels },
    { name: "تحديات", value: snapshot.featureUsage.challenges },
    { name: "فعاليات", value: snapshot.featureUsage.events },
  ].sort((a, b) => b.value - a.value);
  const mostUsed = features[0];
  const leastUsed = features[features.length - 1];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit border-accent/30 bg-accent/10 text-accent">
            <BarChart3 className="size-3" strokeWidth={1.5} />
            التحليلات v5.0
          </Badge>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
              التحليلات المتقدمة
            </h1>
            <p className="text-sm text-muted-foreground">
              مؤشّرات الاستخدام · الاحتفاظ · أداء الميزات والإشعارات
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="min-h-9" onClick={exportCSV}>
            <Download className="size-4" strokeWidth={1.5} />
            CSV
          </Button>
          <Button variant="outline" size="sm" className="min-h-9" onClick={exportExcel}>
            <FileSpreadsheet className="size-4" strokeWidth={1.5} />
            Excel
          </Button>
          <Button variant="outline" size="sm" className="min-h-9" onClick={exportPDF}>
            <FileText className="size-4" strokeWidth={1.5} />
            PDF
          </Button>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Kpi label="DAU (يومي)" value={formatNumber(kpis.dau)} icon={<Users className="size-4" strokeWidth={1.5} />} color="text-emerald-600" bg="bg-emerald-50" hint={`${kpis.newUsersToday} مستخدم جديد اليوم`} />
        <Kpi label="MAU (شهري)" value={formatNumber(kpis.mau)} icon={<Repeat className="size-4" strokeWidth={1.5} />} color="text-accent" bg="bg-accent/10" hint={`نسبة DAU/MAU: ${kpis.dauMauRatio}%`} />
        <Kpi label="مستخدمون جدد (7 أيام)" value={formatNumber(kpis.newUsers7d)} icon={<TrendingUp className="size-4" strokeWidth={1.5} />} color="text-blue-700" bg="bg-blue-50" hint={`${kpis.newUsersToday} منهم اليوم`} />
        <Kpi label="متوسط السلاسل" value={kpis.avgStreak.toFixed(1)} icon={<Flame className="size-4" strokeWidth={1.5} />} color="text-rose-600" bg="bg-rose-50" hint={`أطول سلسلة: ${kpis.longestStreak}`} />
        <Kpi label="صناديق مفتوحة" value={formatNumber(kpis.mysteryBoxes)} icon={<Gift className="size-4" strokeWidth={1.5} />} color="text-accent" bg="bg-accent/10" hint={`${formatNumber(kpis.spinWheels)} عجلة`} />
        <Kpi label="تحديات مكتملة" value={formatNumber(kpis.challengesCompleted)} icon={<CheckCircle2 className="size-4" strokeWidth={1.5} />} color="text-emerald-600" bg="bg-emerald-50" hint={`معدّل المشاركة ${kpis.participationRate}%`} />
        <Kpi label="إشعارات اليوم" value={formatNumber(kpis.notificationsSent)} icon={<Bell className="size-4" strokeWidth={1.5} />} color="text-amber-600" bg="bg-amber-50" hint={`معدّل الفتح: ${kpis.notifOpenRate}%`} />
        <Kpi label="وقت الجلسة (متوسط)" value={kpis.avgSessionTime} icon={<Clock className="size-4" strokeWidth={1.5} />} color="text-foreground" bg="bg-muted" hint={`${kpis.avgSessionsPerUser} جلسة/مستخدم`} />
      </div>

      <Tabs defaultValue="retention" dir="rtl">
        <TabsList>
          <TabsTrigger value="retention">الاحتفاظ</TabsTrigger>
          <TabsTrigger value="engagement">التفاعل</TabsTrigger>
          <TabsTrigger value="features">الميزات</TabsTrigger>
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
        </TabsList>

        {/* الاحتفاظ */}
        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">منحنّى الاحتفاظ — آخر 30 يوماً</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={snapshot.retentionCurve}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="D1" name="يوم 1" stroke="#B8492B" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="D7" name="يوم 7" stroke="#2D5A3D" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="D30" name="يوم 30" stroke="#C8842A" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">توزيع السلاسل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {snapshot.streakBuckets.map((b, i) => {
                  const max = Math.max(...snapshot.streakBuckets.map((x) => x.count), 1);
                  const pct = Math.round((b.count / max) * 100);
                  return (
                    <div key={i} className="rounded-md border border-border bg-muted/20 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground">{b.range} يوم</p>
                      <p className="font-mono text-lg font-bold text-accent">{b.count}</p>
                      <Progress value={pct} className="mt-1 h-1" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* التفاعل */}
        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">حركة التفاعل — آخر 12 شهراً</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={snapshot.engagementByMonth}>
                    <defs>
                      <linearGradient id="actsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#B8492B" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#B8492B" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="activities" name="الأنشطة" stroke="#B8492B" strokeWidth={2} fill="url(#actsGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* الميزات */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">استخدام الميزات (إجمالي)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={features}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={(v: number) => formatNumber(v)} />
                    <Bar dataKey="value" name="العدد" radius={[6, 6, 0, 0]} fill="#C8842A" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <TrendingUp className="size-5" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">الأكثر استخداماً</p>
                  <p className="font-heading text-base font-bold text-foreground">{mostUsed?.name ?? "—"}</p>
                </div>
                <Badge variant="outline" className="ms-auto text-accent">
                  {formatNumber(mostUsed?.value ?? 0)}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                  <Activity className="size-5" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">الأقل استخداماً</p>
                  <p className="font-heading text-base font-bold text-foreground">{leastUsed?.name ?? "—"}</p>
                </div>
                <Badge variant="outline" className="ms-auto">
                  {formatNumber(leastUsed?.value ?? 0)}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* الإشعارات */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">أداء الإشعارات حسب النوع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={snapshot.notificationsByType.map((n) => ({ ...n, name: NOTIF_TYPE_LABELS[n.type] ?? n.type }))}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sent" name="مُرسلة" fill="#C8842A" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="opened" name="مفتوحة" fill="#2D5A3D" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* توصيات */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">تقارير وتوصيات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recommendations.map((r, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
                r.severity === "danger"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : r.severity === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              <span className="mt-0.5 text-base">
                {r.severity === "danger" ? "🔴" : r.severity === "warning" ? "🟡" : "🟢"}
              </span>
              <p>{r.title}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
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
          <div className={`flex size-8 items-center justify-center rounded-lg ${bg} ${color}`}>{icon}</div>
        </div>
        <p className={`font-heading text-xl font-bold ${color}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground line-clamp-1">{hint}</p>
      </CardContent>
    </Card>
  );
}
