// ===================================================================
//  صفحة المجتمع — لوحة معلومات المستخدم بعد الدخول
//  /community
//  Server Component (no 'use client') — كل البيانات من Prisma مباشرة
// ===================================================================

import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Home as HomeIcon,
  Wallet,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Heart,
  ArrowLeft,
  Sparkles,
  HandHeart,
  Group as GroupIcon,
  Clock,
  MapPin,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  formatMAD,
  formatNumber,
  formatDateArabic,
  FUND_REQUEST_STATUS_LABELS,
  FUND_REQUEST_TYPE_LABELS,
  CONTRIBUTION_METHOD_LABELS,
  CONTRIBUTION_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  HOME_DISTRICT,
} from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { DashboardMotion } from "@/components/community/dashboard-motion";
import { StreakWidget } from "@/components/community/streak-widget";
import { MysteryBox } from "@/components/community/mystery-box";
import { SpinWheel } from "@/components/community/spin-wheel";
import { SocialProofWidget } from "@/components/community/social-proof-widget";
import { LossAversionWidget } from "@/components/community/loss-aversion-widget";
import { getStreakStatus } from "@/lib/streak-engine";
import { canOpenMysteryBox, canSpinWheel, SPIN_SEGMENTS } from "@/lib/rewards-engine";
import type {
  ContributionStatus,
  FundRequestStatus,
  FundRequestType,
  ContributionMethod,
} from "@prisma/client";

// ===================================================================
//  بيانات التحقّق
// ===================================================================

export const dynamic = "force-dynamic";

export default async function CommunityDashboardPage() {
  // 1) التحقّق من المصادقة
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/community");
  }

  // 2) استرجاع بيانات الحي
  const district = await db.district.findUnique({
    where: { id: user.districtId },
    select: {
      id: true,
      name: true,
      city: true,
      region: true,
      description: true,
    },
  });

  // 3) استرجاع العدّادات
  const [membersCount, familiesCount, upcomingEvents] = await Promise.all([
    db.user.count({
      where: {
        districtId: user.districtId,
        status: "ACTIVE",
        deletedAt: null,
      },
    }),
    db.family.count({
      where: {
        districtId: user.districtId,
        isActive: true,
        deletedAt: null,
      },
    }),
    db.event.findMany({
      where: {
        districtId: user.districtId,
        startDate: { gt: new Date() },
        status: { in: ["PUBLISHED", "ONGOING"] },
        deletedAt: null,
      },
      orderBy: { startDate: "asc" },
      take: 3,
    }),
  ]);

  // 4) حساب الرصيد الحالي للصندوق
  const confirmedContribs = await db.contribution.aggregate({
    where: { status: "CONFIRMED", districtId: user.districtId },
    _sum: { amount: true },
  });
  const disbursedAmounts = await db.fundRequest.aggregate({
    where: {
      status: { in: ["DISBURSED", "COMPLETED"] },
      districtId: user.districtId,
    },
    _sum: { amountDisbursed: true },
  });
  const fundBalance =
    (confirmedContribs._sum.amount ?? 0) -
    (disbursedAmounts._sum.amountDisbursed ?? 0);

  // 5) لوحة الشفافية المصغّرة — الشهر الحالي
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentYear = now.getFullYear();
  const monthContribs = await db.contribution.aggregate({
    where: {
      status: "CONFIRMED",
      districtId: user.districtId,
      month: currentMonth,
      year: currentYear,
    },
    _sum: { amount: true },
  });
  const monthDisbursed = await db.fundRequest.aggregate({
    where: {
      status: { in: ["DISBURSED", "COMPLETED"] },
      districtId: user.districtId,
      disbursedAt: {
        gte: new Date(now.getFullYear(), now.getMonth(), 1),
        lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      },
    },
    _sum: { amountDisbursed: true },
  });
  const monthContribTotal = monthContribs._sum.amount ?? 0;
  const monthDisbursedTotal = monthDisbursed._sum.amountDisbursed ?? 0;
  const monthBalance = monthContribTotal - monthDisbursedTotal;

  // 6) مساهماتي الأخيرة (آخر 3)
  const myContributions = user.familyId
    ? await db.contribution.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 3,
      })
    : [];

  // 7) طلباتي الأخيرة (آخر 3)
  const myRequests = await db.fundRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { _count: { select: { approvals: true } } },
  });

  // 8) روابط سريعة
  const quickLinks = [
    {
      href: "/community/fund",
      label: "صندوق المعروف",
      description: "ساهم أو اطلب",
      icon: Heart,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      href: "/community/groups",
      label: "المجموعات",
      description: "مجتمعات الحي",
      icon: GroupIcon,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      href: "/community/events",
      label: "الفعاليات",
      description: "ما هو قادم",
      icon: CalendarDays,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      href: "/community/profile",
      label: "ملفّي",
      description: "بياناتي وإعداداتي",
      icon: Users,
      color: "text-foreground",
      bg: "bg-muted",
    },
  ];

  // 9) بيانات نظام الإدمان
  const nowEng = new Date();
  const fifteenMinAgo = new Date(nowEng.getTime() - 15 * 60 * 1000);
  const weekAgoEng = new Date(nowEng.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStartEng = new Date(nowEng.getFullYear(), nowEng.getMonth(), 1);
  const lastMonthStartEng = new Date(nowEng.getFullYear(), nowEng.getMonth() - 1, 1);

  const [
    streakStatus,
    mysteryEligibility,
    spinEligibility,
    socialProofData,
    lossAversionDataRaw,
  ] = await Promise.all([
    getStreakStatus(user.id),
    canOpenMysteryBox(user.id),
    canSpinWheel(user.id),
    // social proof
    Promise.all([
      db.user.count({
        where: {
          districtId: user.districtId,
          lastLoginAt: { gte: fifteenMinAgo },
          status: "ACTIVE",
          deletedAt: null,
        },
      }),
      db.contribution.count({
        where: {
          districtId: user.districtId,
          createdAt: { gte: weekAgoEng },
          status: "CONFIRMED",
        },
      }),
      db.event.count({
        where: {
          districtId: user.districtId,
          startDate: { gt: nowEng },
          status: { in: ["PUBLISHED", "ONGOING"] },
          deletedAt: null,
        },
      }),
      db.userActivity.findMany({
        where: {
          isPublic: true,
          user: { districtId: user.districtId, deletedAt: null },
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
    ]).then(([activeNowCount, weeklyContributions, upcomingEvents, recentActivitiesRaw]) => ({
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
    })),
    // loss aversion raw
    Promise.all([
      db.contribution.aggregate({
        where: { userId: user.id, status: "PENDING" },
        _sum: { amount: true },
      }),
      db.userBadge.findMany({
        where: { userId: user.id },
        orderBy: { earnedAt: "desc" },
        take: 5,
        include: { badge: true },
      }),
      db.userActivity.count({
        where: { userId: user.id, createdAt: { gte: monthStartEng } },
      }),
      db.userActivity.count({
        where: {
          userId: user.id,
          createdAt: { gte: lastMonthStartEng, lt: monthStartEng },
        },
      }),
    ]).then(([pendingAgg, recentBadgesRaw, thisMonthActivities, lastMonthActivities]) => {
      let balanceTrendPct = 0;
      if (lastMonthActivities > 0) {
        balanceTrendPct = ((thisMonthActivities - lastMonthActivities) / lastMonthActivities) * 100;
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
    }),
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
    <DashboardMotion>
      <div className="container mx-auto max-w-6xl px-4 py-8 space-y-10">
        {/* ترحيب */}
        <section className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                أهلاً،
              </p>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                {user.name ?? "أبناء الحي"}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 text-primary" />
                <span>
                  {district?.name ?? HOME_DISTRICT.name} —{" "}
                  {district?.city ?? HOME_DISTRICT.city}
                </span>
              </p>
            </div>
            <Badge
              variant="outline"
              className="bg-secondary/5 text-secondary border-secondary/30 self-start"
            >
              <Sparkles className="size-3.5" />
              عضو في صندوق المعروف
            </Badge>
          </div>
        </section>

        <ZelligeDivider variant="diamond" />

        {/* نظام الإدمان — السلاسل + المكافآت + الدليل الاجتماعي + الفقدان */}
        <section aria-labelledby="engagement-section" className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 id="engagement-section" className="font-heading text-xl font-bold text-foreground">
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

        <ZelligeDivider variant="minimal" />

        {/* 4 بطاقات KPI */}
        <section
          aria-labelledby="kpi-section"
          className="space-y-4"
        >
          <h2 id="kpi-section" className="font-heading text-xl font-bold text-foreground">
            مؤشّرات الحي
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="أعضاء الحي"
              value={formatNumber(membersCount)}
              icon={<Users className="size-5" />}
              accent="text-secondary"
              bg="bg-secondary/10"
              hint="أعضاء نشطون مسجّلون"
            />
            <KpiCard
              label="أسر مسجّلة"
              value={formatNumber(familiesCount)}
              icon={<HomeIcon className="size-5" />}
              accent="text-accent"
              bg="bg-accent/10"
              hint="أسرة في حيّك"
            />
            <KpiCard
              label="صندوق المعروف"
              value={formatMAD(fundBalance)}
              icon={<Wallet className="size-5" />}
              accent="text-primary"
              bg="bg-primary/10"
              hint="الرصيد الجاهز للصرف"
            />
            <KpiCard
              label="فعاليات قادمة"
              value={formatNumber(upcomingEvents.length)}
              icon={<CalendarDays className="size-5" />}
              accent="text-secondary"
              bg="bg-secondary/10"
              hint="فعالية في الطريق"
            />
          </div>
        </section>

        {/* لوحة الشفافية المصغّرة */}
        <section aria-labelledby="mini-transparency" className="space-y-4">
          <h2
            id="mini-transparency"
            className="font-heading text-xl font-bold text-foreground"
          >
            لوحة الشفافية — هذا الشهر
          </h2>
          <Card className="warm-shadow bg-card">
            <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
              <MiniStat
                label="مساهمات هذا الشهر"
                value={formatMAD(monthContribTotal)}
                icon={<TrendingUp className="size-5 text-secondary" />}
                tone="positive"
              />
              <MiniStat
                label="صرف هذا الشهر"
                value={formatMAD(monthDisbursedTotal)}
                icon={<TrendingDown className="size-5 text-accent" />}
                tone="negative"
              />
              <MiniStat
                label="رصيد الشهر"
                value={formatMAD(monthBalance)}
                icon={<Wallet className="size-5 text-primary" />}
                tone="balance"
              />
            </CardContent>
          </Card>
        </section>

        {/* آخر الفعاليات */}
        {upcomingEvents.length > 0 && (
          <section aria-labelledby="upcoming-events" className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2
                id="upcoming-events"
                className="font-heading text-xl font-bold text-foreground"
              >
                فعاليات قادمة
              </h2>
              <Button asChild variant="ghost" size="sm" className="h-11">
                <Link href="/community/events">
                  عرض الكل
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((ev) => {
                const typeMeta = EVENT_TYPE_LABELS[ev.type];
                return (
                  <Card key={ev.id} className="warm-shadow overflow-hidden">
                    <div
                      className="h-24 bg-gradient-to-br from-primary/30 via-accent/30 to-secondary/30"
                      aria-hidden
                    />
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl" aria-hidden>
                          {typeMeta.emoji}
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-muted text-muted-foreground"
                        >
                          {typeMeta.label}
                        </Badge>
                      </div>
                      <h3 className="font-heading text-base font-bold text-foreground line-clamp-1">
                        {ev.title}
                      </h3>
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {formatDateArabic(ev.startDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3.5" />
                          {ev.location}
                        </span>
                      </div>
                      {ev.isRegistrationOpen && (
                        <Button
                          asChild
                          size="sm"
                          variant="default"
                          className="h-11 w-full"
                        >
                          <Link href={`/community/events`}>
                            سجّل الآن
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* مساهماتي وطلباتي */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* مساهماتي الأخيرة */}
          <section aria-labelledby="my-contribs" className="space-y-3">
            <h2
              id="my-contribs"
              className="font-heading text-lg font-bold text-foreground"
            >
              مساهماتي الأخيرة
            </h2>
            {myContributions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <Heart className="size-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    لا توجد مساهمات بعد. ابدأ مساهمتك الأولى!
                  </p>
                  <Button asChild size="sm" className="h-11">
                    <Link href="/community/fund">
                      <Heart className="size-4" />
                      ساهم الآن
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="warm-shadow">
                <CardContent className="divide-y divide-border p-0">
                  {myContributions.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 p-4"
                    >
                      <div className="space-y-0.5">
                        <p className="font-mono text-xs text-primary">
                          {c.receiptNumber ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {CONTRIBUTION_METHOD_LABELS[
                            c.method as ContributionMethod
                          ]}{" "}
                          · {formatDateArabic(c.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-heading font-bold text-foreground">
                          {formatMAD(c.amount)}
                        </span>
                        <ContributionStatusBadge
                          status={c.status as ContributionStatus}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </section>

          {/* طلباتي الأخيرة */}
          <section aria-labelledby="my-reqs" className="space-y-3">
            <h2
              id="my-reqs"
              className="font-heading text-lg font-bold text-foreground"
            >
              طلباتي الأخيرة
            </h2>
            {myRequests.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <HandHeart className="size-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    لا توجد طلبات بعد. اطلب مساعدة إن لزم الأمر.
                  </p>
                  <Button asChild size="sm" variant="outline" className="h-11">
                    <Link href="/community/fund">
                      <HandHeart className="size-4" />
                      قدّم طلباً
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="warm-shadow">
                <CardContent className="divide-y divide-border p-0">
                  {myRequests.map((r) => {
                    const statusMeta =
                      FUND_REQUEST_STATUS_LABELS[
                        r.status as FundRequestStatus
                      ];
                    const typeMeta =
                      FUND_REQUEST_TYPE_LABELS[r.type as FundRequestType];
                    return (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-3 p-4"
                      >
                        <div className="space-y-0.5">
                          <p className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-primary">
                              {r.anonymousCode ?? "SY-???"}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              <span aria-hidden>{typeMeta.emoji}</span>
                              <span>{typeMeta.label}</span>
                            </Badge>
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {r.title} · {formatDateArabic(r.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-heading font-bold text-foreground">
                            {formatMAD(r.amountRequested)}
                          </span>
                          <StatusBadge color={statusMeta.color}>
                            {statusMeta.label}
                          </StatusBadge>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </section>
        </div>

        <ZelligeDivider variant="wave" />

        {/* روابط سريعة */}
        <section aria-labelledby="quick-links" className="space-y-4">
          <h2
            id="quick-links"
            className="font-heading text-xl font-bold text-foreground"
          >
            روابط سريعة
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickLinks.map((q) => {
              const Icon = q.icon;
              return (
                <Link
                  key={q.href}
                  href={q.href}
                  className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 warm-shadow transition-all hover:border-primary/40 hover:bg-muted/40"
                >
                  <div
                    className={`flex size-10 items-center justify-center rounded-lg ${q.bg} ${q.color}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{q.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </DashboardMotion>
  );
}

// ===================================================================
//  بطاقة KPI كبيرة
// ===================================================================

function KpiCard({
  label,
  value,
  icon,
  accent,
  bg,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  bg: string;
  hint: string;
}) {
  return (
    <Card className="warm-shadow">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          <div
            className={`flex size-9 items-center justify-center rounded-lg ${bg} ${accent}`}
          >
            {icon}
          </div>
        </div>
        <p className="font-heading text-2xl font-bold text-foreground">
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

// ===================================================================
//  إحصائية شفافية مصغّرة
// ===================================================================

function MiniStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "positive" | "negative" | "balance";
}) {
  const toneColor =
    tone === "positive"
      ? "text-secondary"
      : tone === "negative"
        ? "text-accent"
        : "text-primary";
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-muted/60 p-2">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`font-heading text-xl font-bold ${toneColor}`}>{value}</p>
      </div>
    </div>
  );
}

// ===================================================================
//  شارات حالة (محلية)
// ===================================================================

function ContributionStatusBadge({
  status,
}: {
  status: ContributionStatus;
}) {
  const map: Record<ContributionStatus, string> = {
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
    REFUNDED: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <Badge variant="outline" className={map[status]}>
      {CONTRIBUTION_STATUS_LABELS[status]}
    </Badge>
  );
}

function StatusBadge({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  const map: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rose: "bg-rose-100 text-rose-700 border-rose-200",
    secondary: "bg-secondary/10 text-secondary border-secondary/20",
  };
  return (
    <Badge variant="outline" className={map[color] ?? map.slate}>
      {children}
    </Badge>
  );
}
