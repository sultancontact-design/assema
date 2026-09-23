// ===================================================================
//  سيدي يوسف بن علي العاصمة — Seed: أحياء مراكش الخمسة
//  Run with: bun prisma/seed-districts.ts
//
//  يحدّث الحي الموجود (سيدي يوسف بن علي) باسمين عربي/فرنسي وسكان.
//  ينشئ 4 أحياء إضافية (المدينة، جليز، المنارة، النخيل).
//  يُعادل members/familiesCount/contributions من جداول المنصة الفعلية.
// ===================================================================

import { db } from "@/lib/db";

interface DistrictSeed {
  name: string;
  slug: string;
  nameAr: string;
  nameFr: string;
  population: number;
  description: string;
  boundarySvg: string;
  isDefault?: boolean;
}

const DISTRICTS: DistrictSeed[] = [
  {
    name: "سيدي يوسف بن علي",
    slug: "sidi-youssef-ben-ali",
    nameAr: "سيدي يوسف بن علي",
    nameFr: "Sidi Youssef Ben Ali",
    population: 116532,
    description:
      "حي سيدي يوسف بن علي الصنهاجي بمراكش، حي عريق يحتضن أسراً مغربية أصيلة تجمعها رابطة المعروف.",
    // جنوب شرق المدينة
    boundarySvg: "M 200 290 L 290 260 L 370 300 L 340 380 L 220 375 L 180 330 Z",
    isDefault: true,
  },
  {
    name: "المدينة",
    slug: "medina",
    nameAr: "المدينة",
    nameFr: "Médina",
    population: 192745,
    description:
      "المدينة العتيقة بمراكش، قلب المدينة التاريخي الذي يحتضن الجامع الكاتبية والأسواق التقليدية والأسوار المرابطية.",
    // وسط الخريطة
    boundarySvg: "M 160 130 L 270 130 L 290 200 L 250 250 L 170 250 L 140 200 Z",
  },
  {
    name: "جليز",
    slug: "guelize",
    nameAr: "جليز",
    nameFr: "Guéliz",
    population: 148196,
    description:
      "حي جليز، الحي التجاري الحديث شمال غرب المدينة العتيقة، يحتضن شارع محمد الخامس والحدائق والمقاهي الراقية.",
    // شمال غرب
    boundarySvg: "M 30 30 L 170 40 L 180 160 L 90 170 L 30 110 Z",
  },
  {
    name: "المنارة",
    slug: "menara",
    nameAr: "المنارة",
    nameFr: "Ménara",
    population: 148137,
    description:
      "حي المنارة جنوب غرب المدينة، يحتضن حديقة المنارة الشهيرة وبحيرتها وقصر المنارة التاريخي.",
    // جنوب غرب
    boundarySvg: "M 30 210 L 150 200 L 200 290 L 180 360 L 60 350 L 30 280 Z",
  },
  {
    name: "النخيل",
    slug: "annakhil",
    nameAr: "النخيل",
    nameFr: "Annakhil",
    population: 120000,
    description:
      "حي النخيل شرق المدينة، حي سكني حديث يمتد نحو الواحات والمناطق الخضراء.",
    // شرق
    boundarySvg: "M 290 90 L 380 100 L 390 240 L 300 250 L 280 170 Z",
  },
];

async function computeLiveStats(districtId: string) {
  const [members, familiesCount, contribAgg] = await Promise.all([
    db.user.count({
      where: { districtId, deletedAt: null, status: "ACTIVE" },
    }),
    db.family.count({
      where: { districtId, deletedAt: null, isActive: true },
    }),
    db.contribution.aggregate({
      where: { districtId, status: "CONFIRMED" },
      _sum: { amount: true },
    }),
  ]);
  return {
    members,
    familiesCount,
    contributions: Math.round(contribAgg._sum?.amount ?? 0),
  };
}

async function main() {
  console.log("→ تهيئة 5 أحياء بمراكش...\n");

  for (const seed of DISTRICTS) {
    const existing = await db.district.findUnique({
      where: { slug: seed.slug },
      select: { id: true, name: true },
    });

    if (existing) {
      // تحديث الحي الموجود (سيدي يوسف بن علي)
      const stats = await computeLiveStats(existing.id);
      await db.district.update({
        where: { id: existing.id },
        data: {
          nameAr: seed.nameAr,
          nameFr: seed.nameFr,
          population: seed.population,
          description: seed.description,
          boundarySvg: seed.boundarySvg,
          isDefault: seed.isDefault ?? false,
          members: stats.members,
          familiesCount: stats.familiesCount,
          contributions: stats.contributions,
          isActive: true,
        },
      });
      console.log(
        `✓ تم تحديث: ${seed.nameAr} (${seed.nameFr}) — العدد: ${stats.members} عضو، ${stats.familiesCount} أسرة، ${stats.contributions} د.م مساهمات`
      );
    } else {
      // إنشاء حي جديد (الأحياء الجديدة ليس لها مستخدمين بعد — 0)
      const created = await db.district.create({
        data: {
          name: seed.name,
          slug: seed.slug,
          nameAr: seed.nameAr,
          nameFr: seed.nameFr,
          population: seed.population,
          description: seed.description,
          boundarySvg: seed.boundarySvg,
          isDefault: seed.isDefault ?? false,
          isActive: true,
          members: 0,
          familiesCount: 0,
          contributions: 0,
        },
      });
      console.log(
        `✓ تم إنشاء: ${seed.nameAr} (${seed.nameFr}) — السكان: ${seed.population} (لا أعضاء بعد)`
      );
      void created;
    }
  }

  console.log("\n✅ اكتمل البذر: 5 أحياء بمراكش في قاعدة البيانات.");
}

main()
  .catch((err) => {
    console.error("✗ خطأ أثناء البذر:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
