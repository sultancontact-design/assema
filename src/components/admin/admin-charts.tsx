"use client";

import * as React from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";

// ===================================================================
//  AdminCharts v35.1 — 4 رسوم بيانية (Recharts)
//  - Line: منحنى الاحتفاظ (30 يوم)
//  - Bar: التفاعل الشهري (12 شهر)
//  - Pie: توزيع استخدام الميزات
//  - Area: إرسال/فتح الإشعارات
//  - gradients + tooltips بالعربية + RTL
// ===================================================================

const CHART_COLORS = ["#E85A3D", "#299B6D", "#F5B220", "#0EA5E9", "#A855F7"];

//tooltip مخصّص بالعربية + RTL
function ArabicTooltip({ active, payload, label, unit }: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string }>;
  label?: string;
  unit?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div dir="rtl" className="rounded-lg border border-border bg-background/95 backdrop-blur-md px-3 py-2 shadow-xl text-xs">
      <p className="font-bold mb-1 text-foreground">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span>{p.name}:</span>
          <span className="font-bold text-foreground tabular-nums">
            {typeof p.value === "number" ? new Intl.NumberFormat("ar-MA").format(p.value) : p.value}
          </span>
          {unit && <span className="text-muted-foreground/70">{unit}</span>}
        </p>
      ))}
    </div>
  );
}

// ━━━ Line Chart: منحنى الاحتفاظ 30 يوم (D1/D7/D30) ━━━
export function RetentionLineChart({ data }: { data: Array<{ day: string; D1: number; D7: number; D30: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
        <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} width={32} />
        <Tooltip content={<ArabicTooltip unit="%" />} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" />
        <Line type="monotone" dataKey="D1" name="احتفاظ يوم 1" stroke={CHART_COLORS[0]} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="D7" name="احتفاظ يوم 7" stroke={CHART_COLORS[1]} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="D30" name="احتفاظ يوم 30" stroke={CHART_COLORS[2]} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ━━━ Bar Chart: التفاعل الشهري (12 شهر) ━━━
export function EngagementBarChart({ data }: { data: Array<{ month: string; activities: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E85A3D" stopOpacity={1} />
            <stop offset="100%" stopColor="#E85A3D" stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
        <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} width={32} />
        <Tooltip content={<ArabicTooltip />} cursor={{ fill: "rgba(232,90,61,0.06)" }} />
        <Bar dataKey="activities" name="الأنشطة" fill="url(#barGrad)" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ━━━ Pie Chart: توزيع استخدام الميزات ━━━
export function FeatureUsagePieChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={85}
          paddingAngle={2}
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ArabicTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ━━━ Area Chart: إرسال/فتح الإشعارات ━━━
export function NotificationsAreaChart({ data }: { data: Array<{ type: string; sent: number; opened: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#299B6D" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#299B6D" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="openedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5B220" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#F5B220" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="type" tick={{ fontSize: 9, fill: "#6b7280" }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
        <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} width={32} />
        <Tooltip content={<ArabicTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" />
        <Area type="monotone" dataKey="sent" name="مُرسَلة" stroke="#299B6D" strokeWidth={2} fill="url(#sentGrad)" />
        <Area type="monotone" dataKey="opened" name="مفتوحة" stroke="#F5B220" strokeWidth={2} fill="url(#openedGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
