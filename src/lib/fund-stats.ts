// ===================================================================
//  fund-stats.ts — مصدر موحّد لكل أرقام صندوق المعروف
//  كل صفحة تعرض أرقاماً مالية يجب أن تستخدم getFundStats()
//  يستخدم unstable_cache مع revalidate 60 ثانية + tag 'fund-stats'
// ===================================================================

import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import type { FundRequestStatus } from "@prisma/client";

export interface FundStats {
  totalContributions: number;
  totalDisbursed: number;
  balance: number;
  pendingContributions: number;
  pendingRequests: number;
  confirmedContributionsCount: number;
  disbursedRequestsCount: number;
  thisMonthContributions: number;
  thisMonthDisbursed: number;
}

async function fetchFundStats(districtId?: string): Promise<FundStats> {
  const contributionsWhere = {
    status: "CONFIRMED" as const,
    ...(districtId ? { districtId } : {}),
  };

  const totalContrib = await db.contribution.aggregate({
    where: contributionsWhere,
    _sum: { amount: true },
    _count: true,
  });

  const disbursedStatuses: FundRequestStatus[] = ["DISBURSED", "COMPLETED"];
  const disbursedWhere = {
    status: { in: disbursedStatuses },
    ...(districtId ? { districtId } : {}),
  };

  const totalDisbur = await db.fundRequest.aggregate({
    where: disbursedWhere,
    _sum: { amountDisbursed: true },
    _count: true,
  });

  const pendingContrib = await db.contribution.count({
    where: {
      status: "PENDING",
      ...(districtId ? { districtId } : {}),
    },
  });

  const pendingStatuses: FundRequestStatus[] = ["SUBMITTED", "UNDER_REVIEW", "APPROVED"];
  const pendingReqs = await db.fundRequest.count({
    where: {
      status: { in: pendingStatuses },
      ...(districtId ? { districtId } : {}),
    },
  });

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const monthContrib = await db.contribution.aggregate({
    where: {
      status: "CONFIRMED" as const,
      month: currentMonth,
      ...(districtId ? { districtId } : {}),
    },
    _sum: { amount: true },
  });

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const monthDisbur = await db.fundRequest.aggregate({
    where: {
      status: { in: disbursedStatuses },
      disbursedAt: { gte: monthStart, lte: monthEnd },
      ...(districtId ? { districtId } : {}),
    },
    _sum: { amountDisbursed: true },
  });

  const totalContributions = totalContrib._sum?.amount ?? 0;
  const totalDisbursed = totalDisbur._sum?.amountDisbursed ?? 0;
  const confirmedCount: number = (totalContrib as { _count?: number })._count ?? 0;
  const disbursedCount: number = (totalDisbur as { _count?: number })._count ?? 0;
  const monthContribAmount = monthContrib._sum?.amount ?? 0;
  const monthDisburAmount = monthDisbur._sum?.amountDisbursed ?? 0;

  return {
    totalContributions,
    totalDisbursed,
    balance: totalContributions - totalDisbursed,
    pendingContributions: pendingContrib,
    pendingRequests: pendingReqs,
    confirmedContributionsCount: confirmedCount,
    disbursedRequestsCount: disbursedCount,
    thisMonthContributions: monthContribAmount,
    thisMonthDisbursed: monthDisburAmount,
  };
}

// unstable_cache with single arg in Next.js 16 — use revalidate option
export const getFundStats = unstable_cache(
  async (districtId?: string) => fetchFundStats(districtId),
  ["fund-stats"],
  {
    revalidate: 60,
    tags: ["fund-stats"],
  }
) as (districtId?: string) => Promise<FundStats>;

export async function invalidateFundStats() {
  const { revalidateTag } = await import("next/cache");
  (revalidateTag as (t: string) => void)("fund-stats");
}

