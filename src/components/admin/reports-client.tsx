"use client";

// ===================================================================
//  ReportsClient — تقارير شاملة بتبويبات
//  - 4 تبويبات: مالي، نشاط، نمو، فعاليات
//  - لكل تبويب: جدول + رسم بياني + تصدير CSV/PDF
// ===================================================================

import * as React from "react";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  FileText,
  Wallet,
  Activity,
  TrendingUp,
  CalendarDays,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  formatMAD,
  formatNumber,
  formatPercent,
  EVENT_TYPE_LABELS,
} from "@/lib/constants";
import type { ReportsData } from "@/lib/reports-utils";
import type { EventType } from "@prisma/client";

// ===================================================================
//  الأنواع والثوابت
// ===================================================================

interface ReportsClientProps {
  data: ReportsData;
  defaultFrom: string;
  defaultTo: string;
}

const ACCENT = "#C8842A";
const NEUTRAL = "#6B5D4E";
const SECONDARY = "#2D5A3D";
const GRID = "rgba(31, 26, 23, 0.06)";

const TOOLTIP_STYLE = {
  direction: "rtl" as const,
  fontFamily: "inherit",
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
};

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  MONTHLY: "#C8842A",
  SEASONAL: "#2D5A3D",
  SPECIAL: "#B8492B",
  SOLIDARITY: "#7A5C3A",
  CULTURAL: "#6B5D4E",
};

// ===================================================================
//  المُكوّن
// ===================================================================

export function ReportsClient({
  data,
  defaultFrom,
  defaultTo,
}: ReportsClientProps) {
  const [from, setFrom] = React.useState(defaultFrom);
  const [to, setTo] = React.useState(defaultTo);
  const [downloading, setDownloading] = React.useState<string | null>(null);

  function applyFilters() {
    const params = new URLSearchParams({ from, to });
    window.location.search = params.toString();
  }

  function resetFilters() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    setFrom(start.toISOString().slice(0, 10));
    setTo(now.toISOString().slice(0, 10));
    setTimeout(() => {
      const params = new URLSearchParams({
        from: start.toISOString().slice(0, 10),
        to: now.toISOString().slice(0, 10),
      });
      window.location.search = params.toString();
    }, 0);
  }

  // ─────────── تصدير CSV ───────────
  function exportFinancialCsv() {
    const rows = data.financial.rows.map((r) => ({
      "الفترة": r.period,
      "المساهمات": r.contributions,
      "الصرف": r.disbursed,
      "الرصيد": r.balance,
      "العمليات": r.operations,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 24 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المالي");
    XLSX.writeFile(wb, `financial-report-${to}.csv`);
    toast.success("تم تصدير التقرير المالي");
  }

  function exportActivityCsv() {
    const rows = data.activity.rows.map((r) => ({
      "الأسبوع": r.week,
      "أعضاء جدد": r.newMembers,
      "مساهمات": r.newContributions,
      "طلبات": r.newRequests,
      "فعاليات": r.events,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 28 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "النشاط");
    XLSX.writeFile(wb, `activity-report-${to}.csv`);
    toast.success("تم تصدير تقرير النشاط");
  }

  function exportGrowthCsv() {
    const rows = data.growth.memberSeries.map((r) => ({
      "الشهر": r.month,
      "الأعضاء": r.members,
      "العائلات": r.families,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "النمو");
    XLSX.writeFile(wb, `growth-report-${to}.csv`);
    toast.success("تم تصدير تقرير النمو");
  }

  function exportEventsCsv() {
    const rows = data.events.rows.map((r) => ({
      "الفعالية": r.title,
      "النوع": EVENT_TYPE_LABELS[r.type].label,
      "المسجلون": r.registrations,
      "الحضور": r.attended,
      "الغياب": r.absent,
      "نسبة الحضور": `${r.attendanceRate.toFixed(1)}%`,
      "التكلفة": r.cost,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الفعاليات");
    XLSX.writeFile(wb, `events-report-${to}.csv`);
    toast.success("تم تصدير تقرير الفعاليات");
  }

  // ─────────── تصدير PDF ───────────
  async function downloadPdf(type: "financial" | "activity" | "growth" | "events") {
    setDownloading(type);
    try {
      const res = await fetch(
        `/api/admin/reports/${type}/pdf?from=${from}&to=${to}`,
        { method: "GET" }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? "فشل توليد التقرير");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report-${to}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("تم تنزيل التقرير (PDF)");
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setDownloading(null);
    }
  }

  // ─────────── Stat Cards ───────────
  const growthCards = [
    {
      label: "نمو هذا الشهر",
      value: formatPercent(data.growth.summary.growthThisMonth),
      hint: "مقارنة بالشهر السابق",
    },
    {
      label: "متوسط النمو الشهري",
      value: formatPercent(data.growth.summary.avgMonthlyGrowth),
      hint: "متوسط آخر 6 أشهر",
    },
    {
      label: "إجمالي الأعضاء",
      value: formatNumber(data.growth.summary.totalMembers),
      hint: "الإجمالي التراكمي",
    },
    {
      label: "إجمالي العائلات",
      value: formatNumber(data.growth.summary.totalFamilies),
      hint: "الإجمالي التراكمي",
    },
  ];

  return (
    <div className="space-y-6">
      {/* أدوات الفلترة */}
      <Card className="border border-border bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="from-date">من تاريخ</Label>
              <Input
                id="from-date"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to-date">إلى تاريخ</Label>
              <Input
                id="to-date"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={applyFilters}
                className="h-10 flex-1"
              >
                تطبيق الفلترة
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-10"
                aria-label="إعادة ضبط"
              >
                <RefreshCw className="size-4" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-muted/40 p-1">
          <TabsTrigger
            value="financial"
            className="flex min-h-10 flex-1 items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Wallet className="size-4" strokeWidth={1.5} />
            <span>تقرير مالي</span>
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="flex min-h-10 flex-1 items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Activity className="size-4" strokeWidth={1.5} />
            <span>تقرير نشاط</span>
          </TabsTrigger>
          <TabsTrigger
            value="growth"
            className="flex min-h-10 flex-1 items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <TrendingUp className="size-4" strokeWidth={1.5} />
            <span>تقرير نمو</span>
          </TabsTrigger>
          <TabsTrigger
            value="events"
            className="flex min-h-10 flex-1 items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <CalendarDays className="size-4" strokeWidth={1.5} />
            <span>تقرير فعاليات</span>
          </TabsTrigger>
        </TabsList>

        {/* ─────────── التقرير المالي ─────────── */}
        <TabsContent value="financial" className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {[
                { label: "إجمالي المساهمات", value: formatMAD(data.financial.summary.totalContributions) },
                { label: "إجمالي الصرف", value: formatMAD(data.financial.summary.totalDisbursed) },
                { label: "الرصيد", value: formatMAD(data.financial.summary.balance) },
                { label: "العمليات", value: formatNumber(data.financial.summary.operationsCount) },
              ].map((c) => (
                <Card key={c.label} className="border border-border bg-card p-0">
                  <CardContent className="p-3">
                    <p className="text-[11px] font-medium text-muted-foreground">{c.label}</p>
                    <p className="mt-1 font-heading text-lg font-bold text-foreground">
                      {c.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportFinancialCsv}
                className="h-9"
              >
                <Download className="size-4" strokeWidth={1.5} />
                <span>CSV</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadPdf("financial")}
                disabled={downloading === "financial"}
                className="h-9"
              >
                <FileText className="size-4" strokeWidth={1.5} />
                <span>{downloading === "financial" ? "..." : "PDF"}</span>
              </Button>
            </div>
          </div>

          {/* الرسم البياني */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
                <span>المساهمات مقابل الصرف عبر 12 شهراً</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div dir="rtl" className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.financial.monthlySeries}
                    margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fontFamily: "inherit" }}
                      stroke={NEUTRAL}
                      tickLine={false}
                      axisLine={{ stroke: GRID }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fontFamily: "inherit" }}
                      stroke={NEUTRAL}
                      tickLine={false}
                      axisLine={false}
                      width={56}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value: number, name: string) => [formatMAD(value), name]}
                    />
                    <Legend
                      wrapperStyle={{
                        fontSize: 11,
                        paddingTop: 8,
                        fontFamily: "inherit",
                        direction: "rtl" as const,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="contributions"
                      stroke={ACCENT}
                      strokeWidth={2}
                      dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                      name="المساهمات"
                    />
                    <Line
                      type="monotone"
                      dataKey="disbursed"
                      stroke={SECONDARY}
                      strokeWidth={2}
                      dot={{ r: 3, fill: SECONDARY, strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                      name="الصرف"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* الجدول */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">
                تفصيل الفترات
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-start text-xs text-muted-foreground">الفترة</TableHead>
                      <TableHead className="text-start text-xs text-muted-foreground">المساهمات</TableHead>
                      <TableHead className="text-start text-xs text-muted-foreground">الصرف</TableHead>
                      <TableHead className="text-start text-xs text-muted-foreground">الرصيد</TableHead>
                      <TableHead className="text-start text-xs text-muted-foreground">العمليات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.financial.rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          لا توجد بيانات لهذه الفترة
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.financial.rows.map((r, i) => (
                        <TableRow key={i} className="text-sm">
                          <TableCell className="text-foreground">{r.period}</TableCell>
                          <TableCell className="text-foreground">{formatMAD(r.contributions)}</TableCell>
                          <TableCell className="text-foreground">{formatMAD(r.disbursed)}</TableCell>
                          <TableCell className="font-medium text-foreground">{formatMAD(r.balance)}</TableCell>
                          <TableCell className="text-muted-foreground">{r.operations}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─────────── تقرير النشاط ─────────── */}
        <TabsContent value="activity" className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {[
                { label: "أعضاء جدد", value: formatNumber(data.activity.summary.newMembers) },
                { label: "مساهمات جديدة", value: formatNumber(data.activity.summary.newContributions) },
                { label: "طلبات جديدة", value: formatNumber(data.activity.summary.newRequests) },
                { label: "الفعاليات", value: formatNumber(data.activity.summary.eventsCount) },
              ].map((c) => (
                <Card key={c.label} className="border border-border bg-card p-0">
                  <CardContent className="p-3">
                    <p className="text-[11px] font-medium text-muted-foreground">{c.label}</p>
                    <p className="mt-1 font-heading text-lg font-bold text-foreground">
                      {c.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportActivityCsv} className="h-9">
                <Download className="size-4" strokeWidth={1.5} />
                <span>CSV</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadPdf("activity")}
                disabled={downloading === "activity"}
                className="h-9"
              >
                <FileText className="size-4" strokeWidth={1.5} />
                <span>{downloading === "activity" ? "..." : "PDF"}</span>
              </Button>
            </div>
          </div>

          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
                <span>النشاط الأسبوعي (آخر 8 أسابيع)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div dir="rtl" className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.activity.weeklySeries}
                    margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 9, fontFamily: "inherit" }}
                      stroke={NEUTRAL}
                      tickLine={false}
                      axisLine={{ stroke: GRID }}
                      interval={0}
                      angle={-12}
                      textAnchor="end"
                      height={48}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fontFamily: "inherit" }}
                      stroke={NEUTRAL}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v: number, n: string) => [formatNumber(v), n]}
                    />
                    <Legend
                      wrapperStyle={{
                        fontSize: 11,
                        paddingTop: 8,
                        fontFamily: "inherit",
                        direction: "rtl" as const,
                      }}
                    />
                    <Bar dataKey="newMembers" name="أعضاء جدد" fill={ACCENT} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="newContributions" name="مساهمات" fill={SECONDARY} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="newRequests" name="طلبات" fill="#B8492B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">تفصيل النشاط الأسبوعي</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-start text-xs text-muted-foreground">الأسبوع</TableHead>
                      <TableHead className="text-start text-xs text-muted-foreground">أعضاء جدد</TableHead>
                      <TableHead className="text-start text-xs text-muted-foreground">مساهمات</TableHead>
                      <TableHead className="text-start text-xs text-muted-foreground">طلبات</TableHead>
                      <TableHead className="text-start text-xs text-muted-foreground">فعاليات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.activity.rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          لا توجد بيانات
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.activity.rows.map((r, i) => (
                        <TableRow key={i} className="text-sm">
                          <TableCell className="text-foreground">{r.week}</TableCell>
                          <TableCell className="text-foreground">{r.newMembers}</TableCell>
                          <TableCell className="text-foreground">{r.newContributions}</TableCell>
                          <TableCell className="text-foreground">{r.newRequests}</TableCell>
                          <TableCell className="text-muted-foreground">{r.events}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─────────── تقرير النمو ─────────── */}
        <TabsContent value="growth" className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {growthCards.map((c) => (
                <Card key={c.label} className="border border-border bg-card p-0">
                  <CardContent className="p-3">
                    <p className="text-[11px] font-medium text-muted-foreground">{c.label}</p>
                    <p className="mt-1 font-heading text-lg font-bold text-foreground">
                      {c.value}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{c.hint}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportGrowthCsv} className="h-9">
                <Download className="size-4" strokeWidth={1.5} />
                <span>CSV</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadPdf("growth")}
                disabled={downloading === "growth"}
                className="h-9"
              >
                <FileText className="size-4" strokeWidth={1.5} />
                <span>{downloading === "growth" ? "..." : "PDF"}</span>
              </Button>
            </div>
          </div>

          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
                <span>نمو الأعضاء والعائلات عبر 6 أشهر</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div dir="rtl" className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.growth.memberSeries}
                    margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fontFamily: "inherit" }}
                      stroke={NEUTRAL}
                      tickLine={false}
                      axisLine={{ stroke: GRID }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fontFamily: "inherit" }}
                      stroke={NEUTRAL}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v: number, n: string) => [formatNumber(v), n]}
                    />
                    <Legend
                      wrapperStyle={{
                        fontSize: 11,
                        paddingTop: 8,
                        fontFamily: "inherit",
                        direction: "rtl" as const,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="members"
                      stroke={ACCENT}
                      strokeWidth={2}
                      dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }}
                      name="الأعضاء"
                    />
                    <Line
                      type="monotone"
                      dataKey="families"
                      stroke={SECONDARY}
                      strokeWidth={2}
                      dot={{ r: 3, fill: SECONDARY, strokeWidth: 0 }}
                      name="العائلات"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─────────── تقرير الفعاليات ─────────── */}
        <TabsContent value="events" className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {[
                { label: "عدد الفعاليات", value: formatNumber(data.events.summary.totalEvents) },
                { label: "المسجلون", value: formatNumber(data.events.summary.totalRegistrations) },
                { label: "الحضور", value: formatNumber(data.events.summary.totalAttended) },
                { label: "نسبة الحضور", value: formatPercent(data.events.summary.attendanceRate) },
              ].map((c) => (
                <Card key={c.label} className="border border-border bg-card p-0">
                  <CardContent className="p-3">
                    <p className="text-[11px] font-medium text-muted-foreground">{c.label}</p>
                    <p className="mt-1 font-heading text-lg font-bold text-foreground">
                      {c.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportEventsCsv} className="h-9">
                <Download className="size-4" strokeWidth={1.5} />
                <span>CSV</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadPdf("events")}
                disabled={downloading === "events"}
                className="h-9"
              >
                <FileText className="size-4" strokeWidth={1.5} />
                <span>{downloading === "events" ? "..." : "PDF"}</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border border-border bg-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-foreground">تفصيل الفعاليات</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto custom-scrollbar max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="text-start text-xs text-muted-foreground">الفعالية</TableHead>
                        <TableHead className="text-start text-xs text-muted-foreground">المسجلون</TableHead>
                        <TableHead className="text-start text-xs text-muted-foreground">الحضور</TableHead>
                        <TableHead className="text-start text-xs text-muted-foreground">الغياب</TableHead>
                        <TableHead className="text-start text-xs text-muted-foreground">النسبة</TableHead>
                        <TableHead className="text-start text-xs text-muted-foreground">التكلفة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.events.rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            لا توجد فعاليات في هذه الفترة
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.events.rows.map((r) => (
                          <TableRow key={r.id} className="text-sm">
                            <TableCell className="text-foreground">
                              <div className="flex flex-col gap-0.5">
                                <span>{r.title}</span>
                                <Badge variant="outline" className="w-fit border-accent/30 bg-accent/10 text-accent text-[10px]">
                                  {EVENT_TYPE_LABELS[r.type].label}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-foreground">{r.registrations}</TableCell>
                            <TableCell className="text-foreground">{r.attended}</TableCell>
                            <TableCell className="text-muted-foreground">{r.absent}</TableCell>
                            <TableCell className="font-medium text-foreground">
                              {r.attendanceRate.toFixed(1)}%
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {r.cost > 0 ? formatMAD(r.cost) : "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
                  <span>توزيع الحضور حسب النوع</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div dir="rtl" className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.events.distribution}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={32}
                        paddingAngle={2}
                      >
                        {data.events.distribution.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={EVENT_TYPE_COLORS[entry.type] ?? ACCENT}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(v: number, n: string) => [formatNumber(v), n]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
                  {data.events.distribution.map((s) => (
                    <li key={s.type} className="flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: EVENT_TYPE_COLORS[s.type] ?? ACCENT }}
                        aria-hidden="true"
                      />
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-medium text-foreground">{s.value}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
