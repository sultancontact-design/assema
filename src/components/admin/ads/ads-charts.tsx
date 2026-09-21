"use client";

// ===================================================================
//  AdsCharts — رسوم بيانية لقسم الإعلانات
//  - رسم خطّي للإيرادات عبر 12 شهراً
//  - رسم أعمدة للإيرادات حسب الباقة
//  - رسم دائري لتوزيع الحملات حسب الحالة
//  النمط: MINIMAL REFINED — ذهبي #C8842A + رماديات
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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatMAD } from "@/lib/constants";
import { STATUS_COLORS, PACKAGE_COLORS } from "@/lib/ads-utils";
import type { AdStatus, AdPackage } from "@prisma/client";

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

// ===================================================================
//  الأنواع
// ===================================================================

export interface AdsOverviewData {
  monthlyRevenue: Array<{ month: string; revenue: number; impressions: number; clicks: number }>;
  packageRevenue: Array<{ name: string; revenue: number; count: number }>;
  statusDistribution: Array<{ name: string; value: number; status: AdStatus }>;
}

// ===================================================================
//  المُكوّن
// ===================================================================

export function AdsCharts({ data }: { data: AdsOverviewData }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
            <span>الإيرادات عبر 12 شهراً</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div dir="rtl" className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.monthlyRevenue}
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
                  formatter={(value: number, name: string) => {
                    if (name === "الإيراد") return [formatMAD(value), "الإيراد"];
                    return [formatNumber(value), name];
                  }}
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
          <div dir="rtl" className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.packageRevenue}
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
                  {data.packageRevenue.map((entry, i) => {
                    const keys = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "SPONSOR"] as AdPackage[];
                    const pkg = keys[i] ?? "GOLD";
                    return (
                      <Cell key={i} fill={PACKAGE_COLORS[pkg] ?? ACCENT} />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
            <span>توزيع الحملات حسب الحالة</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div dir="rtl" className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={36}
                  paddingAngle={2}
                >
                  {data.statusDistribution.map((entry, i) => (
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
          <ul className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
            {data.statusDistribution
              .filter((s) => s.value > 0)
              .map((s) => (
                <li key={s.status} className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[s.status] }}
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="font-medium text-foreground">{s.value}</span>
                </li>
              ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
