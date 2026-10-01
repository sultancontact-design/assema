import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { GamificationClient } from "@/components/community/gamification-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "نظام المكافآت",
  description: "مستويات، شارات، تحديات، ومكافآت يومية — كل تفاعل مع الحي يُكسبك نقاطاً.",
};

// ━━━ 7 مستويات (Levels) ━━━
export const LEVELS = [
  { level: 1, name: "مبتدئ", minPoints: 0, maxPoints: 100, color: "text-muted-foreground", bgClass: "bg-muted/20", icon: "🌱" },
  { level: 2, name: "ناشط", minPoints: 101, maxPoints: 300, color: "text-primary", bgClass: "bg-primary/15", icon: "⚡" },
  { level: 3, name: "مساهم", minPoints: 301, maxPoints: 700, color: "text-secondary", bgClass: "bg-secondary/15", icon: "🤝" },
  { level: 4, name: "داعم", minPoints: 701, maxPoints: 1500, color: "text-accent-foreground", bgClass: "bg-accent/15", icon: "💚" },
  { level: 5, name: "قائد", minPoints: 1501, maxPoints: 3000, color: "text-primary", bgClass: "bg-primary/20", icon: "🏆" },
  { level: 6, name: "سفير", minPoints: 3001, maxPoints: 6000, color: "text-secondary", bgClass: "bg-secondary/20", icon: "👑" },
  { level: 7, name: "حكيم الحي", minPoints: 6001, maxPoints: 999999, color: "text-accent-foreground", bgClass: "bg-accent/25", icon: "🌟" },
] as const;

export default async function GamificationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/community/gamification");

  // جلب كل الشارات + شارات المستخدم
  const [allBadges, userBadgeIds, challenges, topUsers, userCount] = await Promise.all([
    db.badge.findMany({ orderBy: [{ rarity: "desc" }, { name: "asc" }] }),
    db.userBadge.findMany({ where: { userId: user.id }, select: { badgeId: true } }),
    db.challenge.findMany({ where: { status: "active" }, orderBy: { endDate: "asc" }, take: 4 }),
    db.user.findMany({
      where: { deletedAt: null },
      orderBy: { points: "desc" },
      take: 10,
      select: { id: true, fullName: true, points: true, level: true, district: { select: { name: true } } },
    }),
    db.user.count({ where: { deletedAt: null } }),
  ]);

  const earnedBadgeIds = new Set(userBadgeIds.map((b) => b.badgeId));
  const userRank = topUsers.findIndex((u) => u.id === user.id) + 1;

  const serializedBadges = allBadges.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    description: b.description,
    rarity: b.rarity,
    earned: earnedBadgeIds.has(b.id),
    currentRecipients: b.currentRecipients,
  }));

  const serializedChallenges = challenges.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    type: c.type,
    pointsReward: c.pointsReward,
    requiredCount: c.requiredCount,
    endDate: c.endDate.toISOString(),
    startDate: c.startDate.toISOString(),
  }));

  const serializedTopUsers = topUsers.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    points: u.points,
    level: u.level,
    districtName: u.district?.name ?? "—",
    isCurrentUser: u.id === user.id,
  }));

  return (
    <div className="flex flex-col">
      <PageHero
        section="gamification"
        title="نظام المكافآت"
        subtitle="مستويات، شارات، تحديات، ومكافآت يومية — كل تفاعل مع الحي يُكسبك نقاطاً ويُرقّيك."
        image="https://images.unsplash.com/photo-1611162616475-46b5b6bd0a1a?auto=format&fit=crop&w=1920&q=80"
        imageAlt="نظام المكافآت — مستويات وشارات"
        badge={`${user.points} نقطة · مستوى ${user.level}`}
      />
      <GamificationClient
        userPoints={user.points}
        userLevel={user.level}
        userRank={userRank || userCount}
        totalUsers={userCount}
        levels={LEVELS}
        badges={serializedBadges}
        challenges={serializedChallenges}
        topUsers={serializedTopUsers}
      />
    </div>
  );
}
