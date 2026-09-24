// ===================================================================
//  GET /api/public/stats
//  - endpoint عمومي بدون مصادقة
//  - يُرجع: { families, contributions, contributionsTotal, events, recentActivities }
//  - يستعمل getFundStats() من @/lib/fund-stats مع try/catch
//  - صمّام أمان: قيم صفرية افتراضية عند فشل DB
// ===================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getFundStats } from "@/lib/fund-stats";

export const dynamic = "force-dynamic";
export const revalidate = 60;

interface ActivityRow {
  type: string;
  description: string;
  createdAt: Date;
  user?: { firstName: string; lastName: string } | null;
}

function maskName(user?: { firstName: string; lastName: string } | null): string {
  if (!user) return "أحد الجيران";
  const first = user.firstName.trim() || "جار";
  const lastInitial = user.lastName.trim().charAt(0);
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "الآن";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `قبل ${days} يوم`;
  return `قبل ${Math.floor(days / 7)} أسبوع`;
}

export async function GET() {
  // القيم الافتراضية الآمنة
  let families = 0;
  let contributions = 0;
  let contributionsTotal = 0;
  let events = 0;
  let recentActivities: { type: string; description: string; timeAgo: string }[] = [];

  try {
    const [fundStats, familyCount, eventCount, activities] = await Promise.all([
      getFundStats(),
      db.family.count({ where: { isActive: true, deletedAt: null } }),
      db.event.count({
        where: {
          status: "PUBLISHED",
          startDate: { gte: new Date() },
          deletedAt: null,
        },
      }),
      db.userActivity.findMany({
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          type: true,
          description: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    families = familyCount;
    contributions = fundStats.confirmedContributionsCount;
    contributionsTotal = fundStats.totalContributions;
    events = eventCount;

    recentActivities = (activities as ActivityRow[]).map((row) => {
      const masked = maskName(row.user ?? null);
      const baseDescription = row.description?.trim() || "أحدث نشاطاً";
      const startsWithName = /^(أنا|إنّني|قام|ساهم|انضمّ|شارك|حصل|سجّل|أضاف|أرسل|بدأ)\b/.test(
        baseDescription
      );
      const description = startsWithName
        ? `${masked} ${baseDescription}`
        : baseDescription;
      return {
        type: row.type || "default",
        description,
        timeAgo: formatTimeAgo(new Date(row.createdAt)),
      };
    });
  } catch {
    // الواجهة ستستقبل القيم الافتراضية الصفرية
    // لكن تبقى العمومية وتعمل دون تعطّل
  }

  return NextResponse.json({
    families,
    contributions,
    contributionsTotal,
    events,
    recentActivities,
  });
}
