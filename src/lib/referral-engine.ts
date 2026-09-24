// ===================================================================
//  referral-engine.ts — نظام الإحالة (Referral System) v7.0
//  - generateReferralCode(userId): يولّد رمزاً فريداً 8 حروف/أرقام
//  - getReferralStats(userId): يُرجع إحصاءات (الإجمالي/النشط/المعلّق/النقاط)
//  - processReferral(code, newUserId): يُعلّم الإحالة SIGNED_UP،
//    يمنح 50 نقطة للمُحيل، ينشئ PointsLedger
// ===================================================================

import { db } from "@/lib/db";

// ─────────── أحرف مرجعية للرمز (بدون 0/O/1/I/L لتفادي الالتباس) ───────────
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

/**
 * يولّد رمز إحالة عشوائي 8 حروف/أرقام (قابل للنطق بسهولة)
 */
function makeCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

/**
 * يُولّد رمز إحالة فريد للمستخدم ويُنشئ سجل Referral (status=PENDING).
 * لو لديه رمز سابق، يُرجعه.
 * @param userId معرّف المستخدم المُحيل
 * @returns الرمز النصّي 8 حروف
 */
export async function generateReferralCode(userId: string): Promise<string> {
  // 1) هل لدى المستخدم رمز سابق؟
  const existing = await db.referral.findFirst({
    where: { referrerId: userId },
    select: { code: true },
  });
  if (existing) {
    return existing.code;
  }

  // 2) توليد رمز فريد (إعادة المحاولة عند التكرار النادر)
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode();
    const clash = await db.referral.findUnique({
      where: { code },
      select: { id: true },
    });
    if (clash) continue;

    await db.referral.create({
      data: {
        referrerId: userId,
        code,
        status: "PENDING",
      },
      select: { id: true },
    });
    return code;
  }

  // احتياط: نمط fallback مع timestamp-based suffix
  const fallback = "SY" + Date.now().toString(36).toUpperCase().slice(-6);
  await db.referral.create({
    data: {
      referrerId: userId,
      code: fallback,
      status: "PENDING",
    },
    select: { id: true },
  });
  return fallback;
}

/**
 * إحصاءات إحالة المستخدم
 * - totalReferrals: كل الإحالات التي بدأها (PENDING + SIGNED_UP + ACTIVE)
 * - activeReferrals: الحالات SIGNED_UP و ACTIVE
 * - pendingReferrals: الحالات PENDING (لم يُكمل التسجيل بعد)
 * - pointsEarned: مجموع النقاط المكتسبة (كل إحالة نشطة = 50 نقطة)
 */
export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  pointsEarned: number;
  code: string | null;
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const referrals = await db.referral.findMany({
    where: { referrerId: userId },
    select: { status: true, code: true },
  });

  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter(
    (r) => r.status === "SIGNED_UP" || r.status === "ACTIVE"
  ).length;
  const pendingReferrals = referrals.filter(
    (r) => r.status === "PENDING"
  ).length;
  const pointsEarned = activeReferrals * 50; // كل إحالة مكتملة = 50 نقطة
  const code = referrals[0]?.code ?? null;

  return {
    totalReferrals,
    activeReferrals,
    pendingReferrals,
    pointsEarned,
    code,
  };
}

/**
 * مُعلّمة الإحالة كمكتملة (SIGNED_UP) ومنح النقاط للمُحيل.
 * - يتحقّق أن الرمز موجود وحالته PENDING
 * - يربط refereeId بالمستخدم الجديد
 * - يحدّث الحالة لـ SIGNED_UP + completedAt
 * - يمنح 50 نقطة للمُحيل + سجلّ PointsLedger
 * @param code رمز الإحالة
 * @param newUserId معرّف المستخدم الجديد (referee)
 * @returns نتيجة العملية
 */
export async function processReferral(
  code: string,
  newUserId: string
): Promise<{ success: boolean; reason: string; pointsAwarded: number }> {
  // 1) البحث عن الرمز
  const referral = await db.referral.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true, referrerId: true, status: true, reward: true },
  });

  if (!referral) {
    return { success: false, reason: "INVALID_CODE", pointsAwarded: 0 };
  }

  // 2) منع إحالة الذات
  if (referral.referrerId === newUserId) {
    return { success: false, reason: "SELF_REFERRAL", pointsAwarded: 0 };
  }

  // 3) لا تُعالَج الإحالات المكتملة سابقاً
  if (referral.status === "SIGNED_UP" || referral.status === "ACTIVE") {
    return { success: false, reason: "ALREADY_PROCESSED", pointsAwarded: 0 };
  }

  // 4) معاملة ذرّية (atomic): تحديث الإحالة + منح النقاط + سجلّ ledger
  const result = await db.$transaction(async (tx) => {
    // 4.1) ربط refereeId + تحديث الحالة
    const updated = await tx.referral.update({
      where: { id: referral.id },
      data: {
        refereeId: newUserId,
        status: "SIGNED_UP",
        completedAt: new Date(),
      },
      select: { reward: true },
    });

    // 4.2) جلب رصيد المستخدم الحالي
    const referrer = await tx.user.findUnique({
      where: { id: referral.referrerId },
      select: { points: true, fullName: true },
    });

    if (!referrer) {
      throw new Error("REFERRER_NOT_FOUND");
    }

    const newBalance = referrer.points + updated.reward;

    // 4.3) تحديث نقاط المستخدم
    await tx.user.update({
      where: { id: referral.referrerId },
      data: { points: newBalance },
    });

    // 4.4) سجلّ PointsLedger
    await tx.pointsLedger.create({
      data: {
        userId: referral.referrerId,
        amount: updated.reward,
        type: "EARN",
        reason: "REFERRAL_BONUS",
        balanceAfter: newBalance,
        metadata: JSON.stringify({
          refereeId: newUserId,
          referralCode: code.toUpperCase(),
        }),
      },
    });

    // 4.5) إشعار للمُحيل
    await tx.notification.create({
      data: {
        userId: referral.referrerId,
        type: "REWARD",
        title: "إحالة ناجحة!",
        message: `أكمل أحد أصدقائك التسجيل برمزك. حصلت على ${updated.reward} نقطة.`,
        link: "/community/refer",
      },
    });

    return { pointsAwarded: updated.reward };
  });

  return {
    success: true,
    reason: "SUCCESS",
    pointsAwarded: result.pointsAwarded,
  };
}

/**
 * يبني رابط الإحالة الكامل (نسبّي ثم يُكمل في العميل عبر window.location.origin)
 * @param code رمز الإحالة
 * @param origin أصل العنوان (يُمرَّر من العميل)
 */
export function buildReferralUrl(code: string, origin: string): string {
  return `${origin}/register?ref=${code}`;
}

/**
 * لائحة أفضل 10 مُحيلين (لوحة الصدارة)
 */
export interface ReferralLeader {
  userId: string;
  fullName: string;
  avatar: string | null;
  totalReferrals: number;
  activeReferrals: number;
  pointsEarned: number;
}

export async function getReferralLeaderboard(
  limit = 10
): Promise<ReferralLeader[]> {
  const grouped = await db.referral.groupBy({
    by: ["referrerId"],
    _count: { _all: true },
    orderBy: { _count: { _all: "desc" } },
    take: limit,
  });

  if (grouped.length === 0) return [];

  const userIds = grouped.map((g) => g.referrerId);
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      fullName: true,
      avatar: true,
      points: true,
    },
  });

  // تفاصيل العدّادات لكل مستخدم
  const statses = await Promise.all(
    userIds.map((id) =>
      db.referral.findMany({
        where: { referrerId: id },
        select: { status: true },
      })
    )
  );

  return grouped.map((g, idx) => {
    const user = users.find((u) => u.id === g.referrerId);
    const stats = statses[idx];
    const active = stats.filter(
      (s) => s.status === "SIGNED_UP" || s.status === "ACTIVE"
    ).length;
    return {
      userId: g.referrerId,
      fullName: user?.fullName ?? "مستخدم",
      avatar: user?.avatar ?? null,
      totalReferrals: g._count._all,
      activeReferrals: active,
      pointsEarned: active * 50,
    };
  });
}
