import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { LeaderboardAdminClient } from "@/components/admin/leaderboard/leaderboard-admin-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "إدارة المتصدرين" };

export default async function LeaderboardAdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login?callbackUrl=/admin/leaderboard");

  const [configs, bans, topUsers] = await Promise.all([
    db.leaderboardConfig.findMany({ orderBy: { period: "asc" } }),
    db.leaderboardBan.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { fullName: true } } },
    }),
    db.user.findMany({
      where: { deletedAt: null },
      orderBy: { points: "desc" },
      take: 50,
      select: {
        id: true, fullName: true, points: true, level: true,
        district: { select: { name: true } },
      },
    }),
  ]);

  const serializedConfigs = configs.map(c => ({
    ...c,
    customMessage: c.customMessage ?? null,
  }));
  const serializedBans = bans.map(b => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
    expiresAt: b.expiresAt?.toISOString() ?? null,
    user: { fullName: b.user.fullName },
  }));
  const serializedTopUsers = topUsers.map(u => ({
    ...u,
    districtName: u.district?.name ?? null,
  }));

  return (
    <div className="flex flex-col">
      <PageHero
        title="إدارة المتصدرين"
        subtitle="تحكّم كامل في لوحات المتصدرين — فترات، مكافآت، ظهور، وحظر المستخدمين."
        image="https://images.unsplash.com/photo-1551269901-5c5e14c25b58?auto=format&fit=crop&w=1920&q=80"
        imageAlt="إدارة المتصدرين"
        badge={`${configs.length} فترات`}
      />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LeaderboardAdminClient
          initialConfigs={serializedConfigs}
          initialBans={serializedBans}
          initialTopUsers={serializedTopUsers}
        />
      </div>
    </div>
  );
}
