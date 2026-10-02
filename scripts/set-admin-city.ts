// ===================================================================
//  scripts/set-admin-city.ts — v57.0
//  يربط المستخدم الإداري بالمدينة (مراكش) ويحدّث district.cityId
//  يُشغّل ضدّ قاعدة بيانات Supabase الإنتاجية عبر DATABASE_URL
//  الاستعمال:
//    DATABASE_URL='postgresql://...' bun run scripts/set-admin-city.ts
// ===================================================================

import { PrismaClient } from "@prisma/client";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL غير مُعرَّفة في البيئة");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: ["error", "warn"],
});

const ADMIN_EMAIL = "admin@syba-community.ma";

async function main() {
  console.log("▶️  بدء ربط المستخدم الإداري بالمدينة...");

  // 1) ابحث عن مدينة مراكش
  const marrakech = await prisma.city.findUnique({
    where: { slug: "marrakech" },
    select: { id: true, name: true, nameAr: true, slug: true },
  });

  if (!marrakech) {
    console.error("❌ مدينة 'مراكش' غير موجودة. شغّل seed-moroccan-cities أولاً.");
    process.exit(1);
  }
  console.log(`✅ تم العثور على مدينة مراكش: ${marrakech.id} (${marrakech.nameAr})`);

  // 2) ابحث عن المستخدم الإداري
  const admin = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: {
      id: true,
      email: true,
      cityId: true,
      districtId: true,
    },
  });

  if (!admin) {
    console.error(`❌ المستخدم ${ADMIN_EMAIL} غير موجود.`);
    process.exit(1);
  }
  console.log(`▶️  المستخدم الإداري: id=${admin.id} cityId=${admin.cityId ?? "NULL"}`);

  // 3) حدّث cityId للمستخدم الإداري
  const updated = await prisma.user.update({
    where: { id: admin.id },
    data: { cityId: marrakech.id },
    select: { id: true, cityId: true },
  });
  console.log(`✅ تم تحديث cityId للمستخدم الإداري: ${updated.cityId}`);

  // 4) اربط الحي الافتراضي (sidi-youssef-ben-ali) بمدينة مراكش
  const district = await prisma.district.findUnique({
    where: { slug: "sidi-youssef-ben-ali" },
    select: { id: true, name: true, city: true, cityId: true },
  });

  if (district) {
    if (district.cityId !== marrakech.id) {
      const updatedDistrict = await prisma.district.update({
        where: { id: district.id },
        data: {
          cityId: marrakech.id,
          city: marrakech.name,
        },
        select: { id: true, cityId: true, city: true },
      });
      console.log(
        `✅ تم ربط الحي 'sidi-youssef-ben-ali' بمدينة مراكش: cityId=${updatedDistrict.cityId}, city=${updatedDistrict.city}`
      );
    } else {
      console.log(
        `ℹ️  الحي 'sidi-youssef-ben-ali' مربوط بالفعل بمدينة مراكش (cityId=${district.cityId})`
      );
    }
  } else {
    console.log("⚠️  الحي 'sidi-youssef-ben-ali' غير موجود — تخطّي الربط");
  }

  // 5) اربط كل الأحياء ذات city == "مراكش" بمدينة مراكش إن لم تكن مربوطة
  const orphanDistricts = await prisma.district.findMany({
    where: {
      OR: [{ cityId: null }, { city: "مراكش" }],
    },
    select: { id: true, slug: true, name: true, cityId: true, city: true },
  });

  let backfillCount = 0;
  for (const d of orphanDistricts) {
    if (d.cityId === marrakech.id) continue;
    // عيّن cityId = marrakech.id فقط للأحياء التي city == "مراكش" أو cityId == null
    if (d.city !== "مراكش" && d.cityId !== null) continue;
    await prisma.district.update({
      where: { id: d.id },
      data: { cityId: marrakech.id },
    });
    backfillCount++;
  }
  console.log(`✅ تم ربط ${backfillCount} حي إضافي بمدينة مراكش`);

  // 6) ملخص نهائي
  const stats = {
    users: await prisma.user.count({ where: { cityId: marrakech.id } }),
    districts: await prisma.district.count({ where: { cityId: marrakech.id } }),
    regions: await prisma.region.count(),
    cities: await prisma.city.count(),
    countries: await prisma.country.count(),
    diasporaCities: await prisma.diasporaCity.count(),
  };
  console.log("\n📊 الإحصاءات النهائية:");
  console.log(JSON.stringify(stats, null, 2));

  console.log("\n✅ اكتمل بنجاح");
}

main()
  .catch((e) => {
    console.error("❌ فشل:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
