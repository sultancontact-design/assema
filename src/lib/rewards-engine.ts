// ===================================================================
//  محرك الانتماء — المحور 2: المكافآت المتغيرة (Variable Rewards)
//  مستوحى من Hook Model + Octalysis المحور 5 (التطوّر/الإنجاز)
//  منطق: Mystery Box, Spin Wheel, Lucky Draw
// ===================================================================

import { db } from "@/lib/db";
import type { VariableReward } from "@prisma/client";

// ─────────── Mystery Box ───────────

// يُحتاج 5+ مساهمات/مساعدات منذ آخر صندوق مفتوح
export const MYSTERY_BOX_REQUIRED_CONTRIBUTIONS = 5;

export interface MysteryBoxEligibility {
  eligible: boolean;
  contributionsSince: number;
  required: number;
  reason?: string;
}

export async function canOpenMysteryBox(
  userId: string
): Promise<MysteryBoxEligibility> {
  // آخر مرة فُتح فيها صندوق
  const lastBox = await db.variableReward.findFirst({
    where: { userId, type: "MYSTERY_BOX" },
    orderBy: { drawnAt: "desc" },
  });

  // المساهمات المؤكّدة + تسجيلات الفعاليات + الانضمام للمجموعات منذ ذلك التاريخ
  const since = lastBox?.drawnAt ?? new Date(0);
  const [contribs, eventRegs, groupJoins] = await Promise.all([
    db.contribution.count({
      where: { userId, createdAt: { gt: since } },
    }),
    db.eventRegistration.count({
      where: { userId, createdAt: { gt: since } },
    }),
    db.groupMember.count({
      where: { userId, createdAt: { gt: since } },
    }),
  ]);

  const total = contribs + eventRegs + groupJoins;
  const eligible = total >= MYSTERY_BOX_REQUIRED_CONTRIBUTIONS;

  return {
    eligible,
    contributionsSince: total,
    required: MYSTERY_BOX_REQUIRED_CONTRIBUTIONS,
    reason: !eligible
      ? `تحتاج ${MYSTERY_BOX_REQUIRED_CONTRIBUTIONS - total} مساهمة إضافية`
      : undefined,
  };
}

export interface MysteryBoxReward {
  type: "POINTS" | "FREEZE" | "BADGE";
  value: number;
  badgeId?: string;
  badgeName?: string;
  badgeIcon?: string;
  emoji: string;
  label: string;
  rarity?: string;
}

// توزيع الاحتمالات:
// - 50% → 10-50 نقطة (عشوائي)
// - 30% → 100 نقطة
// - 15% → freeze
// - 5%  → شارة نادرة
export async function openMysteryBox(userId: string): Promise<MysteryBoxReward> {
  const roll = Math.random() * 100;

  if (roll < 5) {
    // شارة نادرة (لو متاحة)
    // نُحضِر كل الشارات النادرة ثم نُصفّي يدوياً (maxRecipients قد تكون null)
    const candidates = await db.badge.findMany({
      where: { rarity: { in: ["rare", "epic"] } },
      orderBy: { currentRecipients: "asc" },
    });
    const badge = candidates.find(
      (b) => b.maxRecipients == null || b.currentRecipients < b.maxRecipients
    );

    // لو ما في شارة متاحة → نُرجع 100 نقطة كبديل
    if (!badge) {
      return awardPointsMysteryBox(userId, 100);
    }

    // محاولة منح الشارة — قد تفشل لو المستخدم يملكها أصلاً (unique constraint)
    try {
      await db.userBadge.create({
        data: { userId, badgeId: badge.id },
      });
      await db.badge.update({
        where: { id: badge.id },
        data: { currentRecipients: { increment: 1 } },
      });
    } catch {
      // الشارة موجودة عند المستخدم — نكمل ونمنحه 50 نقطة
    }

    await db.user.update({
      where: { id: userId },
      data: { points: { increment: 50 } },
    });
    await db.variableReward.create({
      data: {
        userId,
        type: "MYSTERY_BOX",
        reward: "BADGE",
        value: 50,
        badgeId: badge.id,
      },
    });

    return {
      type: "BADGE",
      value: 50,
      badgeId: badge.id,
      badgeName: badge.name,
      badgeIcon: badge.icon,
      emoji: "🏅",
      label: `حصلت على شارة نادرة: ${badge.name}`,
      rarity: badge.rarity,
    };
  }

  if (roll < 20) {
    // 15% → freeze
    await db.$transaction([
      db.userStreak.upsert({
        where: { userId },
        update: { freezes: { increment: 1 } },
        create: { userId, freezes: 3 },
      }),
      db.variableReward.create({
        data: {
          userId,
          type: "MYSTERY_BOX",
          reward: "FREEZE",
          value: 1,
        },
      }),
    ]);

    return {
      type: "FREEZE",
      value: 1,
      emoji: "❄️",
      label: "حصلت على freeze مجاني يحمي سلسلتك يوماً!",
    };
  }

  if (roll < 50) {
    // 30% → 100 نقطة
    return awardPointsMysteryBox(userId, 100);
  }

  // 50% → 10-50 نقطة عشوائية
  const points = Math.floor(Math.random() * 41) + 10;
  return awardPointsMysteryBox(userId, points);
}

async function awardPointsMysteryBox(
  userId: string,
  points: number
): Promise<MysteryBoxReward> {
  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { points: { increment: points } },
    }),
    db.variableReward.create({
      data: {
        userId,
        type: "MYSTERY_BOX",
        reward: "POINTS",
        value: points,
      },
    }),
  ]);

  return {
    type: "POINTS",
    value: points,
    emoji: "✨",
    label: `حصلت على ${points} نقطة!`,
  };
}

// ─────────── Spin Wheel ───────────

export interface SpinSegment {
  label: string;
  reward: "POINTS" | "BADGE";
  value: number;
  weight: number;
  color: string;
  emoji: string;
}

export const SPIN_SEGMENTS: SpinSegment[] = [
  { label: "5 نقاط", reward: "POINTS", value: 5, weight: 20, color: "#2D5A3D", emoji: "5" },
  { label: "10 نقاط", reward: "POINTS", value: 10, weight: 15, color: "#B8492B", emoji: "10" },
  { label: "25 نقطة", reward: "POINTS", value: 25, weight: 10, color: "#C8842A", emoji: "25" },
  { label: "5 نقاط", reward: "POINTS", value: 5, weight: 20, color: "#2D5A3D", emoji: "5" },
  { label: "10 نقاط", reward: "POINTS", value: 10, weight: 15, color: "#B8492B", emoji: "10" },
  { label: "50 نقطة", reward: "POINTS", value: 50, weight: 5, color: "#C8842A", emoji: "50" },
  { label: "100 نقطة", reward: "POINTS", value: 100, weight: 2, color: "#1F1A17", emoji: "100" },
  { label: "شارة", reward: "BADGE", value: 0, weight: 1, color: "#D4623E", emoji: "🏅" },
];

export interface SpinWheelEligibility {
  eligible: boolean;
  nextAvailableInHours?: number;
  reason?: string;
}

export async function canSpinWheel(userId: string): Promise<SpinWheelEligibility> {
  // التحقّق: لم يُدر مدولاً اليوم (آخر 24 ساعة)
  const lastSpin = await db.variableReward.findFirst({
    where: { userId, type: "SPIN_WHEEL" },
    orderBy: { drawnAt: "desc" },
  });

  if (lastSpin) {
    const hoursSince =
      (Date.now() - lastSpin.drawnAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) {
      return {
        eligible: false,
        nextAvailableInHours: Math.ceil(24 - hoursSince),
        reason: `يمكنك الدوران بعد ${Math.ceil(24 - hoursSince)} ساعة`,
      };
    }
  }

  return { eligible: true };
}

export interface SpinWheelResult {
  segmentIndex: number;
  segment: SpinSegment;
  badge?: { id: string; name: string; icon: string };
}

export async function spinWheel(userId: string): Promise<SpinWheelResult> {
  const eligibility = await canSpinWheel(userId);
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason ?? "لا يمكن الدوران الآن");
  }

  // اختيار المقطع بالوزن
  const totalWeight = SPIN_SEGMENTS.reduce((s, seg) => s + seg.weight, 0);
  let roll = Math.random() * totalWeight;
  let segmentIndex = 0;
  for (let i = 0; i < SPIN_SEGMENTS.length; i++) {
    if (roll < SPIN_SEGMENTS[i].weight) {
      segmentIndex = i;
      break;
    }
    roll -= SPIN_SEGMENTS[i].weight;
  }

  const segment = SPIN_SEGMENTS[segmentIndex];

  if (segment.reward === "POINTS") {
    await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: { points: { increment: segment.value } },
      }),
      db.variableReward.create({
        data: {
          userId,
          type: "SPIN_WHEEL",
          reward: "POINTS",
          value: segment.value,
        },
      }),
    ]);
    return { segmentIndex, segment };
  }

  // مكافأة BADGE
  const badge = await db.badge.findFirst({
    where: { rarity: "common" },
    orderBy: { currentRecipients: "asc" },
  });

  if (badge) {
    try {
      await db.userBadge.create({ data: { userId, badgeId: badge.id } });
      await db.badge.update({
        where: { id: badge.id },
        data: { currentRecipients: { increment: 1 } },
      });
    } catch {
      // المستخدم يملك الشارة أصلاً
    }
    await db.variableReward.create({
      data: {
        userId,
        type: "SPIN_WHEEL",
        reward: "BADGE",
        value: 0,
        badgeId: badge.id,
      },
    });
    return {
      segmentIndex,
      segment,
      badge: { id: badge.id, name: badge.name, icon: badge.icon },
    };
  }

  // لا توجد شارة متاحة → نُعطي 50 نقطة كبديل
  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { points: { increment: 50 } },
    }),
    db.variableReward.create({
      data: {
        userId,
        type: "SPIN_WHEEL",
        reward: "POINTS",
        value: 50,
      },
    }),
  ]);
  return { segmentIndex, segment };
}

// ─────────── Lucky Draw ───────────

export interface LuckyDrawEntries {
  entries: number;
  reason: string;
}

/**
 * يُرجع عدد المُدخلات في السحب: 1 مُدخل لكل مساهمة > 100 درهم
 */
export async function getLuckyDrawEntries(
  userId: string
): Promise<LuckyDrawEntries> {
  const count = await db.contribution.count({
    where: {
      userId,
      amount: { gte: 100 },
      status: "CONFIRMED",
    },
  });

  return {
    entries: count,
    reason: "كل مساهمة ≥ 100 درهم تمنحك مُدخلاً في السحب الشهري",
  };
}

// ─────────── سجلّ المكافآت ───────────

export async function getRewardHistory(
  userId: string,
  limit = 20
): Promise<VariableReward[]> {
  return db.variableReward.findMany({
    where: { userId },
    orderBy: { drawnAt: "desc" },
    take: limit,
    include: { badge: { select: { name: true, icon: true, rarity: true } } },
  }) as Promise<VariableReward[]>;
}
