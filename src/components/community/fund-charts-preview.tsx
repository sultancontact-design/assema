"use client";

// ===================================================================
//  FundChartsPreview — v59.0
//  معاينة رسوم بيانية مدمجة لصفحة /community/fund
//  - LineChart صغير: المساهمات آخر 12 شهراً
//  - PieChart صغير: توزيع الطلبات حسب النوع
//  - يظهر فوق FundTabs مباشرة (Bento: 8/4 columns)
// ===================================================================

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp, PieChart as PieIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMAD, formatNumber, FUND_REQUEST_TYPE_LABELS } from "@/lib/constants";
import type { FundRequestType } from "@prisma/client";

export interface FundPreviewData {
  monthlyData: { month: string; total: number }[];
  typeCounts: { type: FundRequestType; count: number }[];
}

const TYPE_COLOR_MAP: Record<string, string> = {
  MEDICAL: "#B91C1C",
  DEATH: "#6B5D4E",
  WEDDING: "#C8842A",
  EDUCATION: "#2D5A3D",
  EMERGENCY: "#B8492B",
  MICRO_PROJECT: "#8B5A2B",
};

export function FundChartsPreview({ data }: { data: FundPreviewData }) {
  const hasMonthlyData = data.monthlyData && data.monthlyData.length > 0;
  const hasTypeData = data.typeCounts && data.typeCounts.some((t) => t.count > 0);

  // إذا لا توجد بيانات: عرض empty state موحّد
  if (!hasMonthlyData && !hasTypeData) {
    return null;
  }

  const pieData = data.typeCounts
    .filter((t) => t.count > 0)
    .map((t) => ({
      name: FUND_REQUEST_TYPE_LABELS[t.type]?.label ?? t.type,
      value: t.count,
      color: TYPE_COLOR_MAP[t.type] ?? "#B8492B",
    }));

  return (
    <section
      className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6"
      aria-label="معاينة الرسوم البيانية للصندوق"
    >
      {/* LineChart — المساهمات الشهرية (8/12 أعمدة) */}
      <div className="lg:col-span-8">
        <Card className="card-2026 h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <TrendingUp className="size-5 text-primary" />
              المساهمات في آخر 12 شهراً
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div dir="rtl" className="h-56 md:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.monthlyData}
                  margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#B8492B" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#C8842A" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(31, 26, 23, 0.06)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fontFamily: "inherit" }}
                    stroke="#6B5D4E"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fontFamily: "inherit" }}
                    stroke="#6B5D4E"
                    width={40}
                    tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
                  />
                  <Tooltip
                    contentStyle={{
                      direction: "rtl",
                      fontFamily: "inherit",
                      fontSize: 12,
                      borderRadius: 12,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                    }}
                    labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                    formatter={(v: number) => [formatMAD(v), "المساهمات"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="url(#lineGradient)"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "#C8842A", strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "#B8492B" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PieChart — توزيع الطلبات (4/12 أعمدة) */}
      <div className="lg:col-span-4">
        <Card className="card-2026 h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <PieIcon className="size-5 text-secondary" />
              توزيع الطلبات
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {pieData.length === 0 ? (
              <div className="h-56 md:h-64 grid place-items-center text-sm text-muted-foreground">
                لا توجد طلبات بعد
              </div>
            ) : (
              <div dir="rtl" className="h-56 md:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        direction: "rtl",
                        fontFamily: "inherit",
                        fontSize: 12,
                        borderRadius: 12,
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                      }}
                      formatter={(v: number) => [formatNumber(v), "عدد الطلبات"]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={28}
                      wrapperStyle={{
                        fontFamily: "inherit",
                        fontSize: 10,
                        paddingTop: 4,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
