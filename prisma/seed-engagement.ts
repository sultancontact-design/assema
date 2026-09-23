// ===================================================================
//  سيدي يوسف بن علي العاصمة — Seed: نظام الإدمان (الشارات + التحديات)
//  Run with: bun prisma/seed-engagement.ts
//  يُنشئ: 10 شارات + 4 تحديات
// ===================================================================

import { db } from "@/lib/db";

// 10 شارات
const BADGES = [
  {
    slug: "founder",
    name: "مؤسس",
    description: "من أوائل 100 مستخدم سُجّلوا في المنصة — شارة لا تُكتسب مرة أخرى.",
    icon: "🏛️",
    rarity: "legendary",
    isLimited: true,
    maxRecipients: 100,
    availableFrom: null,
    availableUntil: null,
  },
  {
    slug: "ramadan-2026",
    name: "رمضان 2026",
    description: "سلسلة نشاط كاملة خلال شهر رمضان 1447هـ — 30 يوماً متتالياً.",
    icon: "🌙",
    rarity: "rare",
    isLimited: true,
    maxRecipients: null,
    availableFrom: new Date("2026-02-18T00:00:00Z"),
    availableUntil: new Date("2026-03-19T23:59:59Z"),
  },
  {
    slug: "eid-2026",
    name: "العيد",
    description: "3 أيام فقط بعد عيد الفطر: من ساهم في كلّ يوم.",
    icon: "🕌",
    rarity: "rare",
    isLimited: true,
    maxRecipients: null,
    availableFrom: new Date("2026-03-20T00:00:00Z"),
    availableUntil: new Date("2026-03-22T23:59:59Z"),
  },
  {
    slug: "active-7",
    name: "نشط",
    description: "سجّل دخول 7 أيام متتالية — أول عادة على المنصة.",
    icon: "✨",
    rarity: "common",
    isLimited: false,
    maxRecipients: null,
    availableFrom: null,
    availableUntil: null,
  },
  {
    slug: "supporter-10",
    name: "داعم",
    description: "10 مساهمات مؤكّدة في صندوق المعروف — اليد الواحدة لا تُصفّق.",
    icon: "🤝",
    rarity: "common",
    isLimited: false,
    maxRecipients: null,
    availableFrom: null,
    availableUntil: null,
  },
  {
    slug: "pro-50",
    name: "محترف",
    description: "50 مساهمة مؤكّدة — أنت ركيزة الحي.",
    icon: "💪",
    rarity: "rare",
    isLimited: false,
    maxRecipients: null,
    availableFrom: null,
    availableUntil: null,
  },
  {
    slug: "legend-100",
    name: "أسطورة",
    description: "100 مساهمة مؤكّدة — اسمك سيُذكر في تاريخ الحي.",
    icon: "👑",
    rarity: "epic",
    isLimited: false,
    maxRecipients: null,
    availableFrom: null,
    availableUntil: null,
  },
  {
    slug: "streak-7",
    name: "سلسلة 7",
    description: "أسبوع كامل من الدخول اليومي المتواصل.",
    icon: "🔥",
    rarity: "rare",
    isLimited: false,
    maxRecipients: null,
    availableFrom: null,
    availableUntil: null,
  },
  {
    slug: "streak-30",
    name: "سلسلة 30",
    description: "شهر كامل من الدخول اليومي المتواصل — إنجاز ضخم.",
    icon: "🌟",
    rarity: "epic",
    isLimited: false,
    maxRecipients: null,
    availableFrom: null,
    availableUntil: null,
  },
  {
    slug: "streak-100",
    name: "سلسلة 100",
    description: "100 يوم متتالٍ — أنت في النخبة.",
    icon: "💎",
    rarity: "legendary",
    isLimited: false,
    maxRecipients: null,
    availableFrom: null,
    availableUntil: null,
  },
];

// 4 تحديات
const CHALLENGES = [
  {
    slug: "challenge-ramadan-30",
    title: "تحدي رمضان: 30 يوم streak",
    description:
      "سجّل دخولك يومياً طوال شهر رمضان 1447هـ. كل يوم يُحتسب، وأيّ يوم فائت يُكسر السلسلة. من يكمل 30 يوماً يربح الشارة الموسمية 'رمضان 2026'.",
    type: "SEASONAL",
    status: "active",
    pointsReward: 500,
    requiredCount: 30,
    startDate: new Date("2026-02-18T00:00:00Z"),
    endDate: new Date("2026-03-19T23:59:59Z"),
  },
  {
    slug: "challenge-eid-3",
    title: "تحدي العيد: 3 مساهمات",
    description:
      "في 3 أيام العيد (20-22 مارس 2026)، قدّم 3 مساهمات (واحدة كل يوم) لأسر المحتاجة في الحي. الهدف: تكريس فرحة العيد للجميع.",
    type: "LIMITED",
    status: "active",
    pointsReward: 200,
    requiredCount: 3,
    startDate: new Date("2026-03-20T00:00:00Z"),
    endDate: new Date("2026-03-22T23:59:59Z"),
  },
  {
    slug: "challenge-summer-5",
    title: "تحدي الصيف: 5 فعاليات",
    description:
      "احضر 5 فعاليات حيّ خلال الصيف (يونيو-أغسطس 2026). الهدف: كسر العزلة وتنشيط الحياة الجماعية في الحي.",
    type: "SEASONAL",
    status: "active",
    pointsReward: 300,
    requiredCount: 5,
    startDate: new Date("2026-06-01T00:00:00Z"),
    endDate: new Date("2026-08-31T23:59:59Z"),
  },
  {
    slug: "challenge-founder-100",
    title: "تحدي المؤسس: أول 100 مسجّل",
    description:
      "كن من أول 100 مستخدم يسجّلون في المنصة. هؤلاء فقط يحملون شارة 'مؤسس' — لا يمكن اكتسابها لاحقاً مهما طال الزمن.",
    type: "LIMITED",
    status: "active",
    pointsReward: 1000,
    requiredCount: 1,
    startDate: new Date("2025-01-01T00:00:00Z"),
    endDate: new Date("2027-01-01T00:00:00Z"),
  },
];

async function main() {
  console.log("🌱 بدء seed نظام الإدمان...");

  // ─── الشارات ───
  for (const badge of BADGES) {
    await db.badge.upsert({
      where: { slug: badge.slug },
      update: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        rarity: badge.rarity,
        isLimited: badge.isLimited,
        maxRecipients: badge.maxRecipients,
        availableFrom: badge.availableFrom,
        availableUntil: badge.availableUntil,
      },
      create: {
        slug: badge.slug,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        rarity: badge.rarity,
        isLimited: badge.isLimited,
        maxRecipients: badge.maxRecipients,
        availableFrom: badge.availableFrom,
        availableUntil: badge.availableUntil,
      },
    });
    console.log(`  ✓ شارة: ${badge.name} (${badge.rarity})`);
  }

  // ─── التحديات ───
  for (const challenge of CHALLENGES) {
    // تحدٍّ مرتبط بشارة إن وُجدت
    let badgeId: string | null = null;
    const badgeSlugMap: Record<string, string> = {
      "challenge-ramadan-30": "ramadan-2026",
      "challenge-eid-3": "eid-2026",
      "challenge-founder-100": "founder",
    };
    const slugMatch = badgeSlugMap[challenge.slug];
    if (slugMatch) {
      const badge = await db.badge.findUnique({ where: { slug: slugMatch } });
      if (badge) badgeId = badge.id;
    }

    await db.challenge.upsert({
      where: { id: challenge.slug },
      update: {
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        status: challenge.status,
        pointsReward: challenge.pointsReward,
        requiredCount: challenge.requiredCount,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        badgeId,
      },
      create: {
        id: challenge.slug,
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        status: challenge.status,
        pointsReward: challenge.pointsReward,
        requiredCount: challenge.requiredCount,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        badgeId,
      },
    });
    console.log(`  ✓ تحدٍّ: ${challenge.title} (+${challenge.pointsReward} نقطة)`);
  }

  console.log(`\n✅ تمّ بنجاح: ${BADGES.length} شارة + ${CHALLENGES.length} تحدٍّ.`);
}

main()
  .catch((e) => {
    console.error("❌ فشل seed الإدمان:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
