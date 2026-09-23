"use client";

// ===================================================================
//  EngagementCharts — مخطّطات لوحة الإدمان (recharts)
//  - DAU/MAU over 7 days
//  - Retention curve
//  - Top activities (pie)
//  - Notification performance
// ===================================================================

import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DayMetric {
  day: string;
  dau: number;
  mau: number;
  mysteryBoxes: number;
  spinWheels: number;
  notifications: number;
  retentionD1: number;
  retentionD7: number;
  retentionD30: number;
}

const COLORS = ["#B8492B", "#2D5A3D", "#C8842A", "#1F1A17", "#D4623E"];

const ACTIVITY_LABELS: Record<string, string> = {
  LOGIN: "تسجيل دخول",
  CONTRIBUTION: "مساهمة",
  FUND_REQUEST: "طلب معروف",
  EVENT_REGISTER: "تسجيل فعالية",
  GROUP_JOIN: "انضمام لمجموعة",
  BADGE_EARNED: "كسب شارة",
  STREAK_MILESTONE: "محطة سلسلة",
};

export function EngagementCharts({
  last7Days,
  topActivities,
}: {
  last7Days: DayMetric[];
  topActivities: Array<{ type: string; count: number }>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* DAU/MAU */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">المستخدمون النشطون — آخر 7 أيام</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={last7Days}>
              <defs>
                <linearGradient id="dauGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B8492B" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#B8492B" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="mauGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2D5A3D" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#2D5A3D" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="mau"
                name="شهري (MAU)"
                stroke="#2D5A3D"
                strokeWidth={2}
                fill="url(#mauGradient)"
              />
              <Area
                type="monotone"
                dataKey="dau"
                name="يومي (DAU)"
                stroke="#B8492B"
                strokeWidth={2}
                fill="url(#dauGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Retention */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">منحنّى الاحتفاظ (Retention)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="retentionD1"
                name="D1"
                stroke="#B8492B"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="retentionD7"
                name="D7"
                stroke="#2D5A3D"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="retentionD30"
                name="D30"
                stroke="#C8842A"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* توزيع الأنشطة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">توزيع الأنشطة (آخر 7 أيام)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={topActivities.map((a) => ({
                  name: ACTIVITY_LABELS[a.type] ?? a.type,
                  value: a.count,
                }))}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label={(entry) =>
                  `${entry.name}: ${entry.value}`
                }
                labelLine={false}
              >
                {topActivities.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* أداء الإشعارات */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">إرسال الإشعارات — آخر 7 أيام</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="notifications"
                name="إشعارات مُرسلة"
                fill="#C8842A"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="mysteryBoxes"
                name="صناديق مفتوحة"
                fill="#B8492B"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="spinWheels"
                name="عجلات مُدارة"
                fill="#2D5A3D"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
