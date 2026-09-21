"use client";

// ===================================================================
//  DashboardCharts — مكوّن عميل لرسم بياني لـ3 رسوم
//  (نمو الأعضاء خطّي + توزيع الطلبات أعمدة + توزيع المساهمات دائري)
// ===================================================================

import * as React from "react";
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
import { TrendingUp, Scale, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatNumber,
  FUND_REQUEST_TYPE_LABELS,
  CONTRIBUTION_METHOD_LABELS,
} from "@/lib/constants";
import type {
  FundRequestType,
  ContributionMethod,
} from "@prisma/client";

// ===================================================================
//  الأنواع
// ===================================================================

export interface DashboardChartsData {
  userGrowth: Array<{ month: string; count: number }>;
  requestsByType: Array<{ type: string; count: number }>;
  contributionsByMethod: Array<{ method: string; count: number }>;
}

// ===================================================================
//  الألوان — لوحة الإدارة مُختصرة (ذهبي + رماديات)
// ===================================================================

const ACCENT = "#C8842A";
const NEUTRAL = "#6B5D4E";
const GRID = "rgba(31, 26, 23, 0.06)";

const TYPE_COLORS: Record<string, string> = {
  MEDICAL: "#B91C1C",
  DEATH: "#6B5D4E",
  WEDDING: "#C8842A",
  EDUCATION: "#2D5A3D",
  EMERGENCY: "#B8492B",
  MICRO_PROJECT: "#8B5A2B",
};

const METHOD_COLORS: Record<string, string> = {
  BANK_TRANSFER: ACCENT,
  CASH: "#2D5A3D",
  CMI: "#B8492B",
};

// ===================================================================
//  Tooltip contentStyle موحّد
// ===================================================================

const TOOLTIP_STYLE = {
  direction: "rtl" as const,
  fontFamily: "inherit",
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
};

// ===================================================================
//  المكوّن الرئيسي
// ===================================================================

export function DashboardCharts({ data }: { data: DashboardChartsData }) {
  // بيانات الطلبات حسب النوع — تحويل المفاتيح للعربية
  const typeChartData = data.requestsByType.map((d) => ({
    name:
      FUND_REQUEST_TYPE_LABELS[d.type as FundRequestType]?.label ?? d.type,
    count: d.count,
    color:
      TYPE_COLORS[d.type] ?? ACCENT,
  }));

  // بيانات طرق الدفع
  const methodChartData = data.contributionsByMethod.map((d) => ({
    name:
      CONTRIBUTION_METHOD_LABELS[d.method as ContributionMethod] ?? d.method,
    value: d.count,
    color:
      METHOD_COLORS[d.method] ?? NEUTRAL,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* رسم خطّي — نمو الأعضاء */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <TrendingUp className="size-4 text-accent" strokeWidth={1.5} />
            <span>نمو الأعضاء (12 شهراً)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div dir="rtl" className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.userGrowth}
                margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={GRID}
                  vertical={false}
                />
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
                  width={32}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: "var(--foreground)" }}
                  formatter={(v: number) => [
                    formatNumber(v),
                    "أعضاء جدد",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={ACCENT}
                  strokeWidth={2}
                  dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* رسم أعمدة — توزيع الطلبات حسب النوع */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Scale className="size-4 text-accent" strokeWidth={1.5} />
            <span>توزيع الطلبات حسب النوع</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div dir="rtl" className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={typeChartData}
                margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={GRID}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fontFamily: "inherit" }}
                  stroke={NEUTRAL}
                  tickLine={false}
                  axisLine={{ stroke: GRID }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={48}
                />
                <YAxis
                  tick={{ fontSize: 10, fontFamily: "inherit" }}
                  stroke={NEUTRAL}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: "var(--foreground)" }}
                  formatter={(v: number) => [
                    formatNumber(v),
                    "عدد الطلبات",
                  ]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {typeChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* رسم دائري — توزيع المساهمات حسب الطريقة */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Wallet className="size-4 text-accent" strokeWidth={1.5} />
            <span>توزيع المساهمات حسب الطريقة</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div dir="rtl" className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={methodChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={72}
                  innerRadius={32}
                  paddingAngle={2}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  labelLine={false}
                >
                  {methodChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: "var(--foreground)" }}
                  formatter={(v: number) => [formatNumber(v), "عدد"]}
                />
                <Legend
                  wrapperStyle={{
                    fontFamily: "inherit",
                    fontSize: 11,
                    direction: "rtl",
                  }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

