// ===================================================================
//  /admin/streaks — إدارة السلاسل
//  Server Component — SUPER_ADMIN فقط
// ===================================================================

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { StreaksAdmin } from "@/components/admin/streaks/streaks-admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "إدارة السلاسل",
};

export interface StreakRow {
  id: string;
  userId: string;
  fullName: string;
  role: string;
  currentStreak: number;
  longestStreak: number;
  freezes: number;
  lastCheckIn: string | null;
  totalCheckIns: number;
}

export default async function StreaksPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/admin/streaks");
  }
  if (user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const [raw, avgAgg, longestAgg, distribution] = await Promise.all([
    db.userStreak.findMany({
      orderBy: { currentStreak: "desc" },
      take: 200,
      include: {
        user: {
          select: { id: true, fullName: true, role: true },
        },
      },
    }),
    db.userStreak.aggregate({ _avg: { currentStreak: true } }),
    db.userStreak.aggregate({ _max: { longestStreak: true } }),
    db.userStreak.groupBy({
      by: ["currentStreak"],
      _count: { currentStreak: true },
    }),
  ]);

  // توزيع السلاسل حسب الفئات
  const buckets = [
    { range: "0", count: 0 },
    { range: "1-3", count: 0 },
    { range: "4-7", count: 0 },
    { range: "8-14", count: 0 },
    { range: "15-30", count: 0 },
    { range: "31+", count: 0 },
  ];
  for (const row of distribution) {
    const v = row.currentStreak;
    const c = row._count.currentStreak;
    if (v === 0) buckets[0].count += c;
    else if (v <= 3) buckets[1].count += c;
    else if (v <= 7) buckets[2].count += c;
    else if (v <= 14) buckets[3].count += c;
    else if (v <= 30) buckets[4].count += c;
    else buckets[5].count += c;
  }

  const rows: StreakRow[] = raw.map((s) => ({
    id: s.id,
    userId: s.userId,
    fullName: s.user.fullName,
    role: s.user.role,
    currentStreak: s.currentStreak,
    longestStreak: s.longestStreak,
    freezes: s.freezes,
    lastCheckIn: s.lastCheckIn ? s.lastCheckIn.toISOString() : null,
    totalCheckIns: s.totalCheckIns,
  }));

  return (
    <StreaksAdmin
      rows={rows}
      avgStreak={Math.round((avgAgg._avg.currentStreak ?? 0) * 10) / 10}
      longestStreak={longestAgg._max.longestStreak ?? 0}
      buckets={buckets}
    />
  );
}
