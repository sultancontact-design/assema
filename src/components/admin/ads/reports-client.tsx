"use client";

// ===================================================================
//  ReportsClient — صفحة تقارير الإعلانات (عميل)
//  - فلتر نطاق تاريخ (from/to)
//  - اختيار فترة (يومي/أسبوعي/شهري/سنوي)
//  - بطاقات إحصاءات
//  - 3 رسوم بيانية
//  - مقارنة بالفترة السابقة
//  - تصدير CSV + PDF
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
import { Download, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import {
  AD_PACKAGE_LABELS,
  AD_STATUS_LABELS,
  formatMAD,
  formatNumber,
  formatPercent,
} from "@/lib/constants";
import {
  STATUS_COLORS,
  PACKAGE_COLORS,
} from "@/lib/ads-utils";
import { cn } from "@/lib/utils";
import type { AdPackage, AdStatus } from "@prisma/client";

// ===================================================================
//  الأنواع
// ===================================================================

export interface ReportsData {
  stats: {
    revenue: number;
    impressions: number;
    clicks: number;
    ctr: number;
    rpm: number;
  };
  previousStats: {
    revenue: number;
    impressions: number;
    clicks: number;
    ctr: number;
    rpm: number;
  };
  byPackage: Array<{ name: string; revenue: number; count: number; key: AdPackage }>;
  byStatus: Array<{ name: string; value: number; status: AdStatus }>;
  monthlySeries: Array<{ month: string; revenue: number }>;
  topAds: Array<{
    title: string;
    advertiser: string;
    package: AdPackage;
    status: AdStatus;
    amount: number;
    views: number;
    clicks: number;
  }>;
}

interface ReportsClientProps {
  data: ReportsData;
  defaultFrom: string;
  defaultTo: string;
  period: string;
}

const ACCENT = "#C8842A";
const NEUTRAL = "#6B5D4E";
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

const PERIOD_OPTIONS = [
  { value: "daily", label: "يومي" },
  { value: "weekly", label: "أسبوعي" },
  { value: "monthly", label: "شهري" },
  { value: "yearly", label: "سنوي" },
];

// ===================================================================
//  مكوّن
// ===================================================================

export function ReportsClient({
  data,
  defaultFrom,
  defaultTo,
  period: defaultPeriod,
}: ReportsClientProps) {
  const [from, setFrom] = React.useState(defaultFrom);
  const [to, setTo] = React.useState(defaultTo);
  const [period, setPeriod] = React.useState(defaultPeriod);
  const [downloading, setDownloading] = React.useState(false);

  function applyFilters() {
    const params = new URLSearchParams({ from, to, period });
    window.location.search = params.toString();
  }

  function resetFilters() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    setFrom(start.toISOString().slice(0, 10));
    setTo(now.toISOString().slice(0, 10));
    setPeriod("monthly");
    setTimeout(() => {
      const params = new URLSearchParams({
        from: start.toISOString().slice(0, 10),
        to: now.toISOString().slice(0, 10),
        period: "monthly",
      });
      window.location.search = params.toString();
    }, 0);
  }

  // مقارنة مع الفترة السابقة
  const delta = {
    revenue: data.stats.revenue - data.previousStats.revenue,
    impressions: data.stats.impressions - data.previousStats.impressions,
    clicks: data.stats.clicks - data.previousStats.clicks,
    ctr: data.stats.ctr - data.previousStats.ctr,
    rpm: data.stats.rpm - data.previousStats.rpm,
  };

  function deltaPercent(curr: number, prev: number): number {
    if (!prev) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  }

  function handleExportCsv() {
    const rows = data.topAds.map((ad) => ({
      "الحملة": ad.title,
      "المعلن": ad.advertiser,
      "الباقة": AD_PACKAGE_LABELS[ad.package].label,
      "الحالة": AD_STATUS_LABELS[ad.status],
      "المبلغ": ad.amount,
      "المشاهدات": ad.views,
      "النقرات": ad.clicks,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 28 }, { wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "التقرير");
    XLSX.writeFile(wb, `ads-report-${to}.csv`);
    toast.success("تم تصدير التقرير (CSV)");
  }

  async function handleExportPdf() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/admin/ads/reports/pdf?from=${from}&to=${to}&period=${period}`, {
        method: "GET",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? "فشل توليد التقرير");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ads-report-${to}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("تم تنزيل التقرير (PDF)");
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setDownloading(false);
    }
  }

  const statCards = [
    {
      label: "الإيرادات",
      value: formatMAD(data.stats.revenue),
      delta: delta.revenue,
      deltaPct: deltaPercent(data.stats.revenue, data.previousStats.revenue),
    },
    {
      label: "المشاهدات",
      value: formatNumber(data.stats.impressions),
      delta: delta.impressions,
      deltaPct: deltaPercent(data.stats.impressions, data.previousStats.impressions),
    },
    {
      label: "النقرات",
      value: formatNumber(data.stats.clicks),
      delta: delta.clicks,
      deltaPct: deltaPercent(data.stats.clicks, data.previousStats.clicks),
    },
    {
      label: "CTR",
      value: formatPercent(data.stats.ctr, 2),
      delta: delta.ctr,
      deltaPct: deltaPercent(data.stats.ctr, data.previousStats.ctr),
    },
    {
      label: "RPM",
      value: formatMAD(data.stats.rpm),
      delta: delta.rpm,
      deltaPct: deltaPercent(data.stats.rpm, data.previousStats.rpm),
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
            <div className="space-y-1.5">
              <Label>الفترة</Label>
              <div className="flex flex-wrap gap-1">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPeriod(opt.value)}
                    aria-pressed={period === opt.value}
                    className={cn(
                      "h-10 rounded-md border px-3 text-[12px] font-medium transition-colors",
                      period === opt.value
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-card text-muted-foreground hover:bg-muted/30"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={resetFilters}
            >
              إعادة تعيين
            </Button>
            <Button
              className="h-10 gap-2 bg-foreground text-background hover:bg-foreground/90"
              onClick={applyFilters}
            >
              تطبيق الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* بطاقات الإحصاءات */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {statCards.map((card) => {
          const isUp = card.delta >= 0;
          return (
            <Card key={card.label} className="border border-border bg-card p-0">
              <CardContent className="p-3">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {card.label}
                </p>
                <p className="mt-1 font-heading text-lg font-bold text-foreground md:text-xl">
                  {card.value}
                </p>
                <div className="mt-1 flex items-center gap-1 text-[11px]">
                  {isUp ? (
                    <TrendingUp className="size-3 text-emerald-600" strokeWidth={1.5} />
                  ) : (
                    <TrendingDown className="size-3 text-rose-600" strokeWidth={1.5} />
                  )}
                  <span
                    className={cn(
                      isUp ? "text-emerald-600" : "text-rose-600"
                    )}
                  >
                    {isUp ? "+" : ""}
                    {card.deltaPct.toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground">عن السابق</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* أزرار التصدير */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          className="h-10 gap-2"
          onClick={handleExportCsv}
        >
          <Download className="size-4" strokeWidth={1.5} />
          <span>تصدير CSV</span>
        </Button>
        <Button
          variant="outline"
          className="h-10 gap-2"
          onClick={handleExportPdf}
          disabled={downloading}
        >
          <FileText className="size-4" strokeWidth={1.5} />
          <span>{downloading ? "جارٍ التوليد…" : "تنزيل PDF عربي"}</span>
        </Button>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
              <span>الإيرادات عبر الفترة المحدّدة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div dir="rtl" className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.monthlySeries}
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
                    width={48}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number) => [formatMAD(v), "الإيراد"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={ACCENT}
                    strokeWidth={2}
                    dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    name="الإيراد"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
              <span>الإيرادات حسب الباقة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div dir="rtl" className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.byPackage}
                  margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis
                    dataKey="name"
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
                    width={48}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number) => [formatMAD(v), "الإيراد"]}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {data.byPackage.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={PACKAGE_COLORS[entry.key] ?? ACCENT}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
            <span>توزيع الحملات حسب الحالة</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div dir="rtl" className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={36}
                    paddingAngle={2}
                  >
                    {data.byStatus.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={STATUS_COLORS[entry.status] ?? ACCENT}
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
            <ul className="space-y-1.5 text-[12px]">
              {data.byStatus.map((s) => (
                <li key={s.status} className="flex items-center justify-between rounded-md border border-border p-2">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[s.status] }}
                      aria-hidden="true"
                    />
                    <span className="text-muted-foreground">{s.name}</span>
                  </span>
                  <Badge variant="outline">{formatNumber(s.value)}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
