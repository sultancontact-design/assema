// ===================================================================
//  ستاز الإدمان — المحور 1: نظام السلاسل (Streaks)
//  مستوحى من Octalysis المحور 4 (الندرة/الانتماء) + Hook Model
//  كل المنطق الخادم للسلاسل: check-in، freezes، الوقت حتى الانكسار
// ===================================================================

import { db } from "@/lib/db";

// نقاط تكلفة الـfreeze الواحد
export const FREEZE_COST_POINTS = 50;
// أقصى عدد freezes شهرياً
export const FREEZE_MONTHLY_LIMIT = 2;

// نقاط السلاسل عند المحطات
export const STREAK_MILESTONES = [7, 14, 30, 50, 100] as const;
// مكافآت المحطات (نقاط)
export const STREAK_MILESTONE_REWARDS: Record<number, number> = {
  7: 50,
  14: 100,
  30: 250,
  50: 500,
  100: 1000,
};

// الحد الأقصى للوقت منذ آخر check-in قبل أن تُكسر السلسلة (ساعات)
const STREAK_BREAK_HOURS = 48;
// الوقت القياسي بين check-ins (ساعات)
const STREAK_INTERVAL_HOURS = 24;
// عتبة التحذير (ساعات) — بعد هذا الوقت نُظهر تحذير الإلحاح
const STREAK_URGENCY_HOURS = 20;

export interface StreakCheckInResult {
  currentStreak: number;
  longestStreak: number;
  freezes: number;
  totalCheckIns: number;
  isNewRecord: boolean;
  usedFreeze: boolean;
  streakBroken: boolean;
  milestone?: number;
  milestonePoints?: number;
  alreadyCheckedInToday: boolean;
  hoursUntilBreak: number;
  atRisk: boolean;
}

export interface StreakStatus {
  currentStreak: number;
  longestStreak: number;
  freezes: number;
  totalCheckIns: number;
  lastCheckIn: Date | null;
  hoursSinceCheckIn: number;
  hoursUntilBreak: number;
  atRisk: boolean;
  checkedInToday: boolean;
}

// ===================================================================
//  checkInStreak — يُستدعى عند الدخول اليومي
// ===================================================================

export async function checkInStreak(userId: string): Promise<StreakCheckInResult> {
  const now = new Date();
  // ضمان وجود سجل streak
  let streak = await db.userStreak.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      freezes: FREEZE_MONTHLY_LIMIT,
      totalCheckIns: 0,
      lastActivity: now,
    },
  });

  const lastCheckIn = streak.lastCheckIn;
  const hoursSince = lastCheckIn
    ? (now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60)
    : Infinity;

  // سُجّل دخول اليوم بالفعل؟ (أقل من 20 ساعة)
  if (lastCheckIn && hoursSince < STREAK_URGENCY_HOURS) {
    // تحديث آخر نشاط فقط — لا تكرار
    streak = await db.userStreak.update({
      where: { userId },
      data: { lastActivity: now },
    });
    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      freezes: streak.freezes,
      totalCheckIns: streak.totalCheckIns,
      isNewRecord: false,
      usedFreeze: false,
      streakBroken: false,
      alreadyCheckedInToday: true,
      hoursUntilBreak: computeHoursUntilBreak(lastCheckIn, now),
      atRisk: false,
    };
  }

  let newCurrent = streak.currentStreak;
  let usedFreeze = false;
  let streakBroken = false;

  if (!lastCheckIn) {
    // أول check-in على الإطلاق
    newCurrent = 1;
  } else if (hoursSince < STREAK_BREAK_HOURS) {
    // أقل من 48 ساعة → زيادة عادية
    newCurrent = streak.currentStreak + 1;
  } else {
    // أكثر من 48 ساعة — السلسلة معرّضة للكسر
    if (streak.freezes > 0) {
      // استخدم freeze
      newCurrent = streak.currentStreak + 1;
      usedFreeze = true;
      streak = await db.userStreak.update({
        where: { userId },
        data: {
          freezes: { decrement: 1 },
          freezeUsedAt: now,
        },
      });
    } else {
      // لا freeze — كسر السلسلة
      newCurrent = 1;
      streakBroken = true;
    }
  }

  const isNewRecord = newCurrent > streak.longestStreak;
  const newLongest = Math.max(streak.longestStreak, newCurrent);

  // مكافأة المحطة (إن وُجدت)
  const milestone =
    [...STREAK_MILESTONES].find((m) => m === newCurrent) ?? null;
  const milestonePoints = milestone
    ? STREAK_MILESTONE_REWARDS[milestone] ?? 0
    : 0;

  streak = await db.userStreak.update({
    where: { userId },
    data: {
      currentStreak: newCurrent,
      longestStreak: newLongest,
      lastCheckIn: now,
      lastActivity: now,
      totalCheckIns: { increment: 1 },
    },
  });

  // إن وُجدت مكافأة محطة: أضف النقاط للمستخدم
  if (milestonePoints > 0) {
    await db.user.update({
      where: { id: userId },
      data: { points: { increment: milestonePoints } },
    });
  }

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    freezes: streak.freezes,
    totalCheckIns: streak.totalCheckIns,
    isNewRecord,
    usedFreeze,
    streakBroken,
    milestone: milestone ?? undefined,
    milestonePoints: milestone ? milestonePoints : undefined,
    alreadyCheckedInToday: false,
    hoursUntilBreak: computeHoursUntilBreak(now, now),
    atRisk: false,
  };
}

// ===================================================================
//  getStreakStatus — يُرجع حالة السلسلة الحالية + الوقت حتى الكسر
// ===================================================================

export async function getStreakStatus(userId: string): Promise<StreakStatus> {
  const streak = await db.userStreak.findUnique({ where: { userId } });
  const now = new Date();

  if (!streak || !streak.lastCheckIn) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      freezes: FREEZE_MONTHLY_LIMIT,
      totalCheckIns: 0,
      lastCheckIn: null,
      hoursSinceCheckIn: Infinity,
      hoursUntilBreak: STREAK_INTERVAL_HOURS,
      atRisk: false,
      checkedInToday: false,
    };
  }

  const hoursSince = (now.getTime() - streak.lastCheckIn.getTime()) / (1000 * 60 * 60);
  const hoursUntilBreak = Math.max(
    0,
    STREAK_BREAK_HOURS - hoursSince
  );

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    freezes: streak.freezes,
    totalCheckIns: streak.totalCheckIns,
    lastCheckIn: streak.lastCheckIn,
    hoursSinceCheckIn: hoursSince,
    hoursUntilBreak,
    atRisk: hoursSince > STREAK_URGENCY_HOURS,
    checkedInToday: hoursSince < STREAK_INTERVAL_HOURS,
  };
}

// ===================================================================
//  useFreeze — استخدام يدوي لـfreeze (يكلّف 50 نقطة، أقصى 2/شهر)
// ===================================================================

export interface UseFreezeResult {
  success: boolean;
  freezes: number;
  message: string;
}

export async function useFreeze(userId: string): Promise<UseFreezeResult> {
  const streak = await db.userStreak.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      freezes: FREEZE_MONTHLY_LIMIT,
    },
    include: { user: { select: { points: true } } },
  });

  // التحقّق منfreeze ضمن آخر شهر
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const usedThisMonth =
    streak.freezeUsedAt && streak.freezeUsedAt > oneMonthAgo;

  if (streak.freezes >= FREEZE_MONTHLY_LIMIT + (usedThisMonth ? 0 : 0)) {
    // لو freezes ≥ حد، يعني عنده freeze مجاني أصلاً — لا حاجة للدفع
    // (لكن إن استُخدم freeze واحد هذا الشهر، يحقّ له شراء واحد إضافي)
  }

  // فحص النقاط الكافية
  if (streak.user.points < FREEZE_COST_POINTS) {
    return {
      success: false,
      freezes: streak.freezes,
      message: `تحتاج ${FREEZE_COST_POINTS} نقطة على الأقل لشراء freeze`,
    };
  }

  // فحص أقصى freezes: لا يمكن تجاوز FREEZE_MONTHLY_LIMIT + FREEZE_MONTHLY_LIMIT
  // (أقصى 4 freezes: 2 مجانية + 2 مشتراة شهرياً)
  if (streak.freezes >= FREEZE_MONTHLY_LIMIT * 2) {
    return {
      success: false,
      freezes: streak.freezes,
      message: `بلغت الحد الأقصى من freezes (${FREEZE_MONTHLY_LIMIT * 2})`,
    };
  }

  // شراء freeze: دفع نقاط + إضافة freeze
  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { points: { decrement: FREEZE_COST_POINTS } },
    }),
    db.userStreak.update({
      where: { userId },
      data: {
        freezes: { increment: 1 },
        freezeUsedAt: new Date(),
      },
    }),
  ]);

  return {
    success: true,
    freezes: streak.freezes + 1,
    message: `اشتريت freeze إضافيّاً! كلّفك ${FREEZE_COST_POINTS} نقطة`,
  };
}

// ===================================================================
//  مساعدات داخلية
// ===================================================================

function computeHoursUntilBreak(lastCheckIn: Date, now: Date): number {
  const hoursSince = (now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60);
  return Math.max(0, STREAK_BREAK_HOURS - hoursSince);
}

/**
 * يُرجع اسم اليوم/الأسبوع القادم الذي سيُكسر فيه السلسلة لو لم يُسجّل الدخول
 */
export function formatStreakUrgency(hoursUntilBreak: number): string {
  if (hoursUntilBreak <= 0) return "سلسلتك على وشك الانكسار!";
  if (hoursUntilBreak < 1) {
    const minutes = Math.round(hoursUntilBreak * 60);
    return `⏰ سلسلتك تنتهي بعد ${minutes} دقيقة`;
  }
  if (hoursUntilBreak < 24) {
    const h = Math.ceil(hoursUntilBreak);
    return `⏰ سلسلتك تنتهي بعد ${h} ساعة`;
  }
  const days = Math.floor(hoursUntilBreak / 24);
  return `⏰ سلسلتك تنتهي بعد ${days} يوم`;
}
