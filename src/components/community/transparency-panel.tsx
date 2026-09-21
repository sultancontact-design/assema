"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Scale,
  FileText,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import {
  formatMAD,
  formatNumber,
  formatDateArabic,
  FUND_REQUEST_TYPE_LABELS,
  CONTRIBUTION_METHOD_LABELS,
  CONTRIBUTION_STATUS_LABELS,
  FUND_REQUEST_STATUS_LABELS,
} from "@/lib/constants";
import type {
  ContributionMethod,
  ContributionStatus,
  FundRequestType,
  FundRequestStatus,
} from "@prisma/client";

// ===================================================================
//  أنواع البيانات المستلمة من server
// ===================================================================

export interface TransparencyData {
  totalContributions: number;
  totalDisbursed: number;
  currentBalance: number;
  monthlyData: { month: string; total: number }[];
  typeCounts: { type: FundRequestType; count: number }[];
  methodCounts: { method: ContributionMethod; count: number }[];
  recentContributions: {
    id: string;
    receiptNumber: string | null;
    amount: number;
    method: ContributionMethod;
    status: ContributionStatus;
    createdAt: string;
  }[];
  recentRequests: {
    id: string;
    anonymousCode: string | null;
    type: FundRequestType;
    status: FundRequestStatus;
    amountRequested: number;
    createdAt: string;
  }[];
}

// ===================================================================
//  ألوان الرسوم (لوحة زليج مراكش)
// ===================================================================

const CHART_COLORS = ["#B8492B", "#2D5A3D", "#C8842A", "#8B5A2B", "#6B4E8E"];

// خريطة ألوان أنواع الطلبات
const TYPE_COLOR_MAP: Record<FundRequestType, string> = {
  MEDICAL: "#B91C1C",
  DEATH: "#6B5D4E",
  WEDDING: "#C8842A",
  EDUCATION: "#2D5A3D",
  EMERGENCY: "#B8492B",
  MICRO_PROJECT: "#8B5A2B",
};

// ===================================================================
//  مكوّن لوحة الشفافية الكامل
// ===================================================================

export function TransparencyPanel({ data }: { data: TransparencyData }) {
  return (
    <div className="space-y-8">
      {/* البطاقات الكبيرة — إجمالي/صرف/رصيد */}
      <section aria-labelledby="trans-stats" className="space-y-4">
        <h2
          id="trans-stats"
          className="font-heading text-2xl font-bold text-foreground"
        >
          لوحة الشفافية — صندوق المعروف الرقمي
        </h2>
        <p className="text-sm text-muted-foreground">
          لوحة عامة مفتوحة لكل أبناء الحي. كل درهم له إيصال رقمي وأثر قابل
          للمراجعة. لا تُذكر أسماء المستفيدين حفاظاً على الكرامة.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="إجمالي المساهمات"
            value={formatMAD(data.totalContributions)}
            icon={<TrendingUp className="size-6" />}
            iconColor="text-secondary"
            hint="منذ انطلاق الصندوق"
          />
          <StatCard
            label="إجمالي الصرف"
            value={formatMAD(data.totalDisbursed)}
            icon={<TrendingDown className="size-6" />}
            iconColor="text-accent"
            hint="للطلبات الموافَق عليها"
          />
          <StatCard
            label="الرصيد الحالي"
            value={formatMAD(data.currentBalance)}
            icon={<Wallet className="size-6" />}
            iconColor="text-primary"
            hint="جاهز للصرف على المستحقّين"
          />
        </div>
      </section>

      <ZelligeDivider variant="diamond" />

      {/* الرسوم البيانية */}
      <section
        aria-labelledby="trans-charts"
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <h2 id="trans-charts" className="sr-only">
          الرسوم البيانية للصندوق
        </h2>

        {/* رسم خطّي — المساهمات الشهرية */}
        <Card className="warm-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="size-5 text-primary" />
              المساهمات في آخر 12 شهراً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div dir="rtl" className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.monthlyData}
                  margin={{ top: 10, right: 8, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(31, 26, 23, 0.08)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fontFamily: "inherit" }}
                    stroke="#6B5D4E"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fontFamily: "inherit" }}
                    stroke="#6B5D4E"
                    width={48}
                  />
                  <Tooltip
                    contentStyle={{
                      direction: "rtl",
                      fontFamily: "inherit",
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #E8DCC4",
                      background: "#FBF6EE",
                    }}
                    labelStyle={{ color: "#1F1A17" }}
                    formatter={(v: number) => [formatMAD(v), "المساهمات"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#B8492B"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#C8842A" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* رسم أعمدة — الطلبات حسب النوع */}
        <Card className="warm-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scale className="size-5 text-secondary" />
              الطلبات حسب النوع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div dir="rtl" className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.typeCounts.map((d) => ({
                    name: FUND_REQUEST_TYPE_LABELS[d.type].label,
                    emoji: FUND_REQUEST_TYPE_LABELS[d.type].emoji,
                    count: d.count,
                    color: TYPE_COLOR_MAP[d.type],
                  }))}
                  margin={{ top: 10, right: 8, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(31, 26, 23, 0.08)"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fontFamily: "inherit" }}
                    stroke="#6B5D4E"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fontFamily: "inherit" }}
                    stroke="#6B5D4E"
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      direction: "rtl",
                      fontFamily: "inherit",
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #E8DCC4",
                      background: "#FBF6EE",
                    }}
                    formatter={(v: number) => [formatNumber(v), "عدد الطلبات"]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {data.typeCounts.map((entry) => (
                      <Cell
                        key={entry.type}
                        fill={TYPE_COLOR_MAP[entry.type]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* رسم دائري — توزيع طرق الدفع */}
        <Card className="warm-shadow lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="size-5 text-accent" />
              توزيع طرق الدفع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div dir="rtl" className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.methodCounts.map((d) => ({
                      name: CONTRIBUTION_METHOD_LABELS[d.method],
                      value: d.count,
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => entry.name}
                    labelLine={false}
                  >
                    {data.methodCounts.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={CHART_COLORS[idx % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      direction: "rtl",
                      fontFamily: "inherit",
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #E8DCC4",
                      background: "#FBF6EE",
                    }}
                    formatter={(v: number) => [formatNumber(v), "عدد"]}
                  />
                  <Legend
                    wrapperStyle={{
                      fontFamily: "inherit",
                      fontSize: 12,
                      direction: "rtl",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      <ZelligeDivider variant="wave" />

      {/* آخر 10 مساهمات */}
      <section aria-labelledby="trans-contribs" className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="trans-contribs"
            className="font-heading text-xl font-bold text-foreground"
          >
            آخر 10 مساهمات
          </h2>
          <Badge variant="outline" className="text-secondary">
            مجهولة المصدر حفاظاً على الكرامة
          </Badge>
        </div>
        <Card className="warm-shadow">
          <CardContent className="p-0">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-start text-sm">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">
                      رقم الإيصال
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      المبلغ
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      الطريقة
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      الحالة
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      التاريخ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.recentContributions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        لا توجد مساهمات بعد
                      </td>
                    </tr>
                  ) : (
                    data.recentContributions.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/40">
                        <td className="px-4 py-3 font-mono text-xs text-primary">
                          {c.receiptNumber ?? "متبرّع كريم"}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {formatMAD(c.amount)}
                        </td>
                        <td className="px-4 py-3">
                          {CONTRIBUTION_METHOD_LABELS[c.method]}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            color={
                              c.status === "CONFIRMED"
                                ? "emerald"
                                : c.status === "PENDING"
                                  ? "amber"
                                  : "rose"
                            }
                            label={CONTRIBUTION_STATUS_LABELS[c.status]}
                          />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDateArabic(c.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* آخر 5 طلبات */}
      <section aria-labelledby="trans-requests" className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="trans-requests"
            className="font-heading text-xl font-bold text-foreground"
          >
            آخر 5 طلبات معلومة الحالة
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="h-11"
            onClick={() => toast.info("سيتم توليد التقرير قريباً")}
          >
            <Download className="size-4" />
            <span>تحميل التقرير الشهري</span>
          </Button>
        </div>
        <Card className="warm-shadow">
          <CardContent className="p-0">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">
                      الرمز
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      النوع
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      الحالة
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      المبلغ
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      التاريخ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.recentRequests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        لا توجد طلبات بعد
                      </td>
                    </tr>
                  ) : (
                    data.recentRequests.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/40">
                        <td className="px-4 py-3 font-mono text-xs text-accent">
                          {r.anonymousCode ?? "SY-???"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1">
                            <span aria-hidden>
                              {FUND_REQUEST_TYPE_LABELS[r.type].emoji}
                            </span>
                            <span>{FUND_REQUEST_TYPE_LABELS[r.type].label}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            color={FUND_REQUEST_STATUS_LABELS[r.status].color}
                            label={FUND_REQUEST_STATUS_LABELS[r.status].label}
                          />
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {formatMAD(r.amountRequested)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDateArabic(r.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* زر التقرير الكامل */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="flex flex-col gap-3 sm:flex-row items-start sm:items-center justify-between p-6">
          <div className="flex items-start gap-3">
            <FileText className="size-8 text-accent shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground">
                تقرير الصندوق الشهري
              </h3>
              <p className="text-sm text-muted-foreground">
                ملخّص شامل بكل المساهمات والطلبات الموافَق عليها وأثر التدقيق.
                يُصدَر في نهاية كل شهر.
              </p>
            </div>
          </div>
          <Button
            variant="default"
            size="lg"
            className="h-11 w-full sm:w-auto"
            onClick={() => toast.info("سيتم توليد التقرير قريباً")}
          >
            <Download className="size-4" />
            <span>تحميل PDF</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ===================================================================
//  بطاقة إحصائية صغيرة (محلية للوحة)
// ===================================================================

function StatCard({
  label,
  value,
  icon,
  iconColor,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconColor: string;
  hint?: string;
}) {
  return (
    <Card className="warm-shadow relative overflow-hidden">
      <CardContent className="flex items-start gap-4 p-6">
        <div
          className={`shrink-0 rounded-lg bg-muted/60 p-2 ${iconColor}`}
          aria-hidden
        >
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-heading text-2xl font-bold text-foreground">
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ===================================================================
//  شارة حالة ملوّنة
// ===================================================================

function StatusBadge({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  const colorMap: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rose: "bg-rose-100 text-rose-700 border-rose-200",
    secondary: "bg-secondary/10 text-secondary border-secondary/20",
  };
  const cls = colorMap[color] ?? colorMap.slate;
  return (
    <Badge variant="outline" className={cls}>
      {label}
    </Badge>
  );
}
