"use client";

// ===================================================================
//  district-monitor-chart.tsx — رسم أعمدة لنقاط الانتماء لكل حي
// ===================================================================

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine, ResponsiveContainer } from "recharts";

export interface DistrictMonitorRow {
  id: string;
  name: string;
  engagement: number;
  memberCount: number;
}

const COLORS = [
  "#B8492B",
  "#2D5A3D",
  "#C8842A",
  "#8B5A2B",
  "#6B5D4E",
  "#A0522D",
];

const TOOLTIP_STYLE = {
  direction: "rtl" as const,
  fontFamily: "inherit",
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
};

export function DistrictMonitorChart({
  rows,
  avg,
}: {
  rows: DistrictMonitorRow[];
  avg: number;
}) {
  const data = rows.map((r) => ({
    name: r.name.length > 18 ? r.name.slice(0, 18) + "…" : r.name,
    fullName: r.name,
    engagement: r.engagement,
    members: r.memberCount,
  }));

  if (data.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        لا توجد بيانات لعرضها
      </div>
    );
  }

  return (
    <div className="w-full h-72" aria-label="رسم انتماء الأحياء">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="horizontal"
          margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(31, 26, 23, 0.06)"
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            angle={-15}
            textAnchor="end"
            height={60}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={40}
            unit="%"
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "rgba(31, 26, 23, 0.04)" }}
            formatter={(value: number, _name, p) => {
              const row = p?.payload as {
                fullName?: string;
                members?: number;
              };
              return [
                `${value}% (${row?.members ?? 0} عضو)`,
                "نقاط الانتماء",
              ];
            }}
            labelFormatter={(label, payload) => {
              const row = payload?.[0]?.payload as {
                fullName?: string;
              };
              return row?.fullName ?? label;
            }}
          />
          <ReferenceLine
            y={avg}
            stroke="#C8842A"
            strokeDasharray="6 4"
            label={{
              value: `المتوسط ${avg}%`,
              position: "insideTopRight",
              fill: "#C8842A",
              fontSize: 10,
            }}
          />
          <Bar
            dataKey="engagement"
            radius={[4, 4, 0, 0]}
            isAnimationActive
          >
            {data.map((_entry, idx) => (
              <Cell
                key={idx}
                fill={COLORS[idx % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
