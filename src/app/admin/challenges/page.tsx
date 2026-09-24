// ===================================================================
//  /admin/challenges — إدارة التحديات
//  Server Component — SUPER_ADMIN فقط
// ===================================================================

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChallengesAdmin } from "@/components/admin/challenges/challenges-admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "إدارة التحديات",
};

export interface ChallengeRow {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  pointsReward: number;
  requiredCount: number;
  startDate: string;
  endDate: string;
  participants: number;
  completed: number;
}

export default async function ChallengesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/admin/challenges");
  }
  if (user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const challenges = await db.challenge.findMany({
    orderBy: { endDate: "desc" },
    take: 200,
    include: {
      _count: {
        select: {
          participants: true,
        },
      },
    },
  });

  // احسب المكتمل لكل تحدٍّ
  const completionCounts = await db.userChallenge.groupBy({
    by: ["challengeId"],
    where: { completed: true },
    _count: { _all: true },
  });

  const rows: ChallengeRow[] = challenges.map((c) => {
    const completed = completionCounts.find((cc) => cc.challengeId === c.id)?._count._all ?? 0;
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      type: c.type,
      status: c.status,
      pointsReward: c.pointsReward,
      requiredCount: c.requiredCount,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate.toISOString(),
      participants: c._count?.participants ?? 0,
      completed,
    };
  });

  return <ChallengesAdmin rows={rows} />;
}
