// ===================================================================
//  /admin/economy — إدارة النقاط والاقتصاد
//  Server Component — SUPER_ADMIN فقط
// ===================================================================

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEconomyStats } from "@/lib/admin-lib";
import { EconomyAdmin } from "@/components/admin/economy/economy-admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "إدارة النقاط والاقتصاد",
};

export default async function EconomyPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/admin/economy");
  }
  if (user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const [stats, users, recentLedgerRows] = await Promise.all([
    getEconomyStats(),
    db.user.findMany({
      where: { deletedAt: null },
      orderBy: { fullName: "asc" },
      take: 200,
      select: { id: true, fullName: true, email: true },
    }),
    db.pointsLedger.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
      },
    }),
  ]);

  const recentLedger = recentLedgerRows.map((r) => ({
    id: r.id,
    userId: r.userId,
    userFullName: r.user?.fullName ?? "—",
    userEmail: r.user?.email ?? "—",
    userRole: r.user?.role ?? "MEMBER",
    amount: r.amount,
    type: r.type,
    reason: r.reason,
    balanceAfter: r.balanceAfter,
    adminId: r.adminId,
    metadata: r.metadata,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <EconomyAdmin stats={stats} users={users} recentLedger={recentLedger} />
  );
}
