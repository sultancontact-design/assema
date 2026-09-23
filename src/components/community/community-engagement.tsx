// ===================================================================
//  Community Engagement — مكوّن خادم متدفّق (streamed)
//  يُغلَّف بـ <Suspense> في لوحة المجتمع ليتدفّق بشكل منفصل
//  عن البيانات الأساسية (KPIs، الفعاليات، المساهمات).
// ===================================================================

import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StreakWidget } from "@/components/community/streak-widget";
import { MysteryBox } from "@/components/community/mystery-box";
import { SpinWheel } from "@/components/community/spin-wheel";
import { SocialProofWidget } from "@/components/community/social-proof-widget";
import { LossAversionWidget } from "@/components/community/loss-aversion-widget";
import { getStreakStatus } from "@/lib/streak-engine";
import {
  canOpenMysteryBox,
  canSpinWheel,
  SPIN_SEGMENTS,
} from "@/lib/rewards-engine";
import { db } from "@/lib/db";

interface CommunityEngagementProps {
  userId: string;
  districtId: string;
}

/**
 * CommunityEngagement — مكوّن خادم غير متزامن يقوم بجمع بيانات نظام الإدمان
 * (السلاسل، المكافآت، الدليل الاجتماعي، الخسارة) ويُعيد الواجهة.
 *
 * يُستدعى داخل <Suspense> في صفحة /community ليتدفّق هذا القسم بشكل منفصل،
 * فتُعرض البطاقات الأخرى (KPI، الشفافية، الفعاليات) فوراً بينما تُحمَّل
 * بيانات الإدمان في الخلفية.
 */
export async function CommunityEngagement({
  userId,
  districtId,
}: CommunityEngagementProps) {
  const nowEng = new Date();
  const fifteenMinAgo = new Date(nowEng.getTime() - 15 * 60 * 1000);
  const weekAgoEng = new Date(nowEng.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStartEng = new Date(nowEng.getFullYear(), nowEng.getMonth(), 1);
  const lastMonthStartEng = new Date(nowEng.getFullYear(), nowEng.getMonth() - 1, 1);

  const [streakStatus, mysteryEligibility, spinEligibility, socialProofData, lossAversionDataRaw] =
    await Promise.all([
      getStreakStatus(userId),
      canOpenMysteryBox(userId),
      canSpinWheel(userId),
      Promise.all([
        db.user.count({
          where: {
            districtId,
            lastLoginAt: { gte: fifteenMinAgo },
            status: "ACTIVE",
            deletedAt: null,
          },
        }),
        db.contribution.count({
          where: {
            districtId,
            createdAt: { gte: weekAgoEng },
            status: "CONFIRMED",
          },
        }),
        db.event.count({
          where: {
            districtId,
            startDate: { gt: nowEng },
            status: { in: ["PUBLISHED", "ONGOING"] },
            deletedAt: null,
          },
        }),
        db.userActivity.findMany({
          where: {
            isPublic: true,
            user: { districtId, deletedAt: null },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            type: true,
            description: true,
            createdAt: true,
            user: { select: { fullName: true } },
          },
        }),
      ]).then(
        ([
          activeNowCount,
          weeklyContributions,
          upcomingEvents,
          recentActivitiesRaw,
        ]) => ({
          activeNowCount,
          weeklyContributions,
          upcomingEvents,
          recentActivities: recentActivitiesRaw.map((a) => ({
            id: a.id,
            type: a.type,
            description: a.description,
            createdAt: a.createdAt.toISOString(),
            user: { name: a.user.fullName },
          })),
        }),
      ),
      Promise.all([
        db.contribution.aggregate({
          where: { userId, status: "PENDING" },
          _sum: { amount: true },
        }),
        db.userBadge.findMany({
          where: { userId },
          orderBy: { earnedAt: "desc" },
          take: 5,
          include: { badge: true },
        }),
        db.userActivity.count({
          where: { userId, createdAt: { gte: monthStartEng } },
        }),
        db.userActivity.count({
          where: {
            userId,
            createdAt: { gte: lastMonthStartEng, lt: monthStartEng },
          },
        }),
      ]).then(
        ([
          pendingAgg,
          recentBadgesRaw,
          thisMonthActivities,
          lastMonthActivities,
        ]) => {
          let balanceTrendPct = 0;
          if (lastMonthActivities > 0) {
            balanceTrendPct =
              ((thisMonthActivities - lastMonthActivities) /
                lastMonthActivities) *
              100;
          } else if (thisMonthActivities > 0) {
            balanceTrendPct = 100;
          }
          return {
            pendingPoints: pendingAgg._sum.amount ?? 0,
            recentBadges: recentBadgesRaw.map((ub) => ({
              id: ub.badge.id,
              name: ub.badge.name,
              icon: ub.badge.icon,
              rarity: ub.badge.rarity,
              earnedAt: ub.earnedAt.toISOString(),
            })),
            balanceTrendPct: Math.round(balanceTrendPct * 10) / 10,
            thisMonthActivities,
          };
        },
      ),
    ]);

  const lossAversionData = {
    streakAtRisk: streakStatus.atRisk,
    streakHoursUntilBreak: streakStatus.hoursUntilBreak,
    streakCurrent: streakStatus.currentStreak,
    pendingPoints: lossAversionDataRaw.pendingPoints,
    recentBadges: lossAversionDataRaw.recentBadges,
    balanceTrendPct: lossAversionDataRaw.balanceTrendPct,
    thisMonthActivities: lossAversionDataRaw.thisMonthActivities,
  };

  return (
    <section aria-labelledby="engagement-section" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2
          id="engagement-section"
          className="font-heading text-xl font-bold text-foreground"
        >
          نظام التفاعل اليومي
        </h2>
        <Button asChild variant="ghost" size="sm" className="h-11">
          <Link href="/community/hooks">
            حلقة الإدمان
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StreakWidget
            variant="large"
            initial={{
              currentStreak: streakStatus.currentStreak,
              longestStreak: streakStatus.longestStreak,
              freezes: streakStatus.freezes,
              totalCheckIns: streakStatus.totalCheckIns,
              hoursUntilBreak: streakStatus.hoursUntilBreak,
              atRisk: streakStatus.atRisk,
              checkedInToday: streakStatus.checkedInToday,
            }}
          />
          <SocialProofWidget initial={socialProofData} />
        </div>
        <div className="space-y-4">
          <LossAversionWidget initial={lossAversionData} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MysteryBox
          eligible={mysteryEligibility.eligible}
          reason={mysteryEligibility.reason}
          contributionsSince={mysteryEligibility.contributionsSince}
          required={mysteryEligibility.required}
        />
        <SpinWheel
          segments={SPIN_SEGMENTS}
          eligible={spinEligibility.eligible}
          reason={spinEligibility.reason}
        />
      </div>
    </section>
  );
}

/**
 * EngagementSkeleton — الهيكل العظمي الذي يُعرض بينما تُحمَّل بيانات الإدمان
 */
export function EngagementSkeleton() {
  return (
    <section aria-labelledby="engagement-section-skel" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-11 w-28 rounded-md" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="warm-shadow">
            <CardContent className="space-y-3 p-6">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-16 w-full rounded-md" />
            </CardContent>
          </Card>
          <Card className="warm-shadow">
            <CardContent className="space-y-3 p-6">
              <Skeleton className="h-4 w-1/3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="warm-shadow">
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full rounded-md" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="warm-shadow">
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full rounded-md" />
          </CardContent>
        </Card>
        <Card className="warm-shadow">
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

/**
 * EngagementSection — يجمع الـ Suspense + المكوّن + الـ Skeleton
 * لتسهيل الاستعمال في صفحة /community
 */
export function EngagementSection(props: CommunityEngagementProps) {
  return (
    <Suspense fallback={<EngagementSkeleton />}>
      <CommunityEngagement {...props} />
    </Suspense>
  );
}
