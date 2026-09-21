// ===================================================================
//  reports-utils — أنواع وأدوات مساعدة لتقارير الأدمن
// ===================================================================

import type { EventType } from "@prisma/client";
import { EVENT_TYPE_LABELS } from "@/lib/constants";

// ─────────── الأنواع المشتركة بين العميل والخادم ───────────

export interface FinancialRow {
  period: string;
  contributions: number;
  disbursed: number;
  balance: number;
  operations: number;
}

export interface FinancialMonthlyPoint {
  month: string;
  contributions: number;
  disbursed: number;
}

export interface ActivityRow {
  week: string;
  newMembers: number;
  newContributions: number;
  newRequests: number;
  events: number;
}

export interface ActivityWeeklyPoint {
  week: string;
  newMembers: number;
  newContributions: number;
  newRequests: number;
  events: number;
}

export interface GrowthStat {
  growthThisMonth: number;
  avgMonthlyGrowth: number;
  totalMembers: number;
  totalFamilies: number;
}

export interface GrowthMonthlyPoint {
  month: string;
  members: number;
  families: number;
}

export interface EventsRow {
  id: string;
  title: string;
  type: EventType;
  registrations: number;
  attended: number;
  absent: number;
  attendanceRate: number;
  cost: number;
}

export interface EventsDistribution {
  type: EventType;
  label: string;
  value: number;
}

export interface ReportsData {
  financial: {
    summary: {
      totalContributions: number;
      totalDisbursed: number;
      balance: number;
      operationsCount: number;
    };
    rows: FinancialRow[];
    monthlySeries: FinancialMonthlyPoint[];
  };
  activity: {
    summary: {
      newMembers: number;
      newContributions: number;
      newRequests: number;
      eventsCount: number;
    };
    rows: ActivityRow[];
    weeklySeries: ActivityWeeklyPoint[];
  };
  growth: {
    summary: GrowthStat;
    memberSeries: GrowthMonthlyPoint[];
  };
  events: {
    summary: {
      totalEvents: number;
      totalRegistrations: number;
      totalAttended: number;
      attendanceRate: number;
    };
    rows: EventsRow[];
    distribution: EventsDistribution[];
  };
}

// ─────────── أدوات بناء السلاسل الزمنية ───────────

const AR_MONTH_FMT = new Intl.DateTimeFormat("ar-MA", { month: "short" });

/** يولّد مفاتيح آخر N أشهر قبل تاريخ معيّن (YYYY-MM) */
export function lastNMonthKeys(n: number, end: Date): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

/** يحوّل مفتاح YYYY-MM إلى تسمية شهر قصيرة بالعربية */
export function monthKeyToLabel(key: string): string {
  const [y, m] = key.split("-").map((s) => parseInt(s, 10));
  if (!y || !m) return key;
  const d = new Date(y, m - 1, 1);
  return AR_MONTH_FMT.format(d);
}

/** يولّد آخر N أسابيع قبل تاريخ معيّن (يبدأ من الإثنين) */
export function lastNWeekLabels(n: number, end: Date): { key: string; label: string }[] {
  const labels: { key: string; label: string }[] = [];
  const ref = new Date(end);
  // تأمين أن نبدأ من نهاية الأسبوع (الأحد)
  ref.setHours(23, 59, 59, 999);
  for (let i = 0; i < n; i++) {
    const endOfWeek = new Date(ref);
    endOfWeek.setDate(ref.getDate() - i * 7);
    const startOfWeek = new Date(endOfWeek);
    startOfWeek.setDate(endOfWeek.getDate() - 6);
    const key = `${startOfWeek.toISOString().slice(0, 10)}_${endOfWeek.toISOString().slice(0, 10)}`;
    const fmt = new Intl.DateTimeFormat("ar-MA", { day: "numeric", month: "short" });
    labels.unshift({
      key,
      label: `${fmt.format(startOfWeek)} — ${fmt.format(endOfWeek)}`,
    });
  }
  return labels;
}

/** تسمية نوع الفعالية بالعربية */
export function eventTypeLabel(type: EventType): string {
  return EVENT_TYPE_LABELS[type]?.label ?? type;
}

/** اختصار شكل ISO للتاريخ إلى YYYY-MM-DD */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
