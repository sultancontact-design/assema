// ===================================================================
//  /admin/rewards — إدارة المكافآت المتغيرة
//  Server Component — SUPER_ADMIN فقط
// ===================================================================

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { RewardsAdmin } from "@/components/admin/rewards/rewards-admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "إدارة المكافآت المتغيرة",
};

export default async function RewardsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/admin/rewards");
  }
  if (user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const [mystery, spin, lucky] = await Promise.all([
    db.variableReward.count({ where: { type: "MYSTERY_BOX" } }),
    db.variableReward.count({ where: { type: "SPIN_WHEEL" } }),
    db.variableReward.count({ where: { type: "LUCKY_DRAW" } }),
  ]);

  // آخر 10 فائزين بالقرعة
  const luckyWinners = await db.variableReward.findMany({
    where: { type: "LUCKY_DRAW" },
    orderBy: { drawnAt: "desc" },
    take: 10,
    include: { user: { select: { fullName: true } } },
  });

  return (
    <RewardsAdmin
      stats={{ mystery, spin, lucky }}
      luckyWinners={luckyWinners.map((w) => ({
        id: w.id,
        fullName: w.user?.fullName ?? "—",
        reward: w.reward,
        value: w.value,
        drawnAt: w.drawnAt.toISOString(),
      }))}
    />
  );
}
