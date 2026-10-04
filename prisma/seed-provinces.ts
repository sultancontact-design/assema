// v70.0: Seed 12 regions with province data for Morocco
// Based on HCP official administrative division

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 12 Regions with their main provinces
const REGIONS_DATA = [
  { slug: "tanger-tetouan-al-hoceima", name: "Tanger-Tétouan-Al Hoceïma", nameAr: "طنجة-تطوان-الحسيمة", nameFr: "Tanger-Tétouan-Al Hoceïma", provinces: [
    { name: "Tanger-Assilah", nameAr: "طنجة-أصيلا" },
    { name: "Tetouan", nameAr: "تطوان" },
    { name: "Al Hoceima", nameAr: "الحسيمة" },
    { name: "Larache", nameAr: "العرائش" },
    { name: "Chefchaouen", nameAr: "شفشاون" },
    { name: "Fahs-Anjra", nameAr: "الفحص-أنجرة" },
    { name: "M'Diq-Fnideq", nameAr: "المضيق-الفنيدق" },
  ]},
  { slug: "oriental", name: "L'Oriental", nameAr: "الشرق", nameFr: "L'Oriental", provinces: [
    { name: "Oujda-Angad", nameAr: "وجدة-أنجاد" },
    { name: "Nador", nameAr: "الناظور" },
    { name: "Berkane", nameAr: "بركان" },
    { name: "Taourirt", nameAr: "تاوريرت" },
    { name: "Jerada", nameAr: "جرسيف" },
    { name: "Figuig", nameAr: "فكيك" },
    { name: "Driouch", nameAr: "الدريوش" },
    { name: "Guercif", nameAr: "جرسيف" },
  ]},
  { slug: "fes-meknes", name: "Fès-Meknès", nameAr: "فاس-مكناس", nameFr: "Fès-Meknès", provinces: [
    { name: "Fès", nameAr: "فاس" },
    { name: "Meknès", nameAr: "مكناس" },
    { name: "El Hajeb", nameAr: "الحجب" },
    { name: "Ifrane", nameAr: "إفران" },
    { name: "Boulemane", nameAr: "بولمان" },
    { name: "Taza", nameAr: "تازة" },
    { name: "Moulay Yacoub", nameAr: "مولاي يعقوب" },
    { name: "Sefrou", nameAr: "صفرو" },
  ]},
  { slug: "rabat-sale-kenitra", name: "Rabat-Salé-Kénitra", nameAr: "الرباط-سلا-القنيطرة", nameFr: "Rabat-Salé-Kénitra", provinces: [
    { name: "Rabat", nameAr: "الرباط" },
    { name: "Salé", nameAr: "سلا" },
    { name: "Skhirat-Témara", nameAr: "الصخيرات-تمارة" },
    { name: "Kénitra", nameAr: "القنيطرة" },
    { name: "Sidi Kacem", nameAr: "سيدي قاسم" },
    { name: "Sidi Slimane", nameAr: "سيدي سليمان" },
  ]},
  { slug: "casablanca-settat", name: "Casablanca-Settat", nameAr: "الدار البيضاء-سطات", nameFr: "Casablanca-Settat", provinces: [
    { name: "Casablanca", nameAr: "الدار البيضاء" },
    { name: "Mohammedia", nameAr: "المحمدية" },
    { name: "Settat", nameAr: "سطات" },
    { name: "Berrechid", nameAr: "برشيد" },
    { name: "Sidi Bennour", nameAr: "سيدي بنور" },
    { name: "El Jadida", nameAr: "الجديدة" },
  ]},
  { slug: "beni-mellal-khenifra", name: "Béni Mellal-Khénifra", nameAr: "بني ملال-خنيفرة", nameFr: "Béni Mellal-Khénifra", provinces: [
    { name: "Béni Mellal", nameAr: "بني ملال" },
    { name: "Khénifra", nameAr: "خنيفرة" },
    { name: "Fquih Ben Salah", nameAr: "فقيه بن صالح" },
    { name: "Azilal", nameAr: "أزيلال" },
  ]},
  { slug: "marrakech-safi", name: "Marrakech-Safi", nameAr: "مراكش-آسفي", nameFr: "Marrakech-Safi", provinces: [
    { name: "Marrakech", nameAr: "مراكش" },
    { name: "Safi", nameAr: "آسفي" },
    { name: "Al Haouz", nameAr: "الحوز" },
    { name: "Chichaoua", nameAr: "شيشاوة" },
    { name: "El Kelaa des Sraghna", nameAr: "قلعة السراغنة" },
    { name: "Essaouira", nameAr: "الصويرة" },
    { name: "Rehamna", nameAr: "الرحامنة" },
    { name: "Youssoufia", nameAr: "اليوسفية" },
  ]},
  { slug: "draa-tafilalet", name: "Drâa-Tafilalet", nameAr: "درعة-تافيلالت", nameFr: "Drâa-Tafilalet", provinces: [
    { name: "Errachidia", nameAr: "الرشيدية" },
    { name: "Ouarzazate", nameAr: "ورزازات" },
    { name: "Tinghir", nameAr: "تنغير" },
    { name: "Zagora", nameAr: "زاكورة" },
    { name: "Midelt", nameAr: "ميدلت" },
  ]},
  { slug: "souss-massa", name: "Souss-Massa", nameAr: "سوس-ماسة", nameFr: "Souss-Massa", provinces: [
    { name: "Agadir-Ida Ou Tanane", nameAr: "أكادير-إدا وتنان" },
    { name: "Inezgane-Aït Melloul", nameAr: "إنزكان-آيت ملول" },
    { name: "Taroudant", nameAr: "تارودانت" },
    { name: "Tiznit", nameAr: "تيزنيت" },
    { name: "Chtouka-Aït Baha", nameAr: "شتوكة-آيت باها" },
    { name: "Tata", nameAr: "طاطا" },
  ]},
  { slug: "guelmim-oued-noun", name: "Guelmim-Oued Noun", nameAr: "كلميم-واد نون", nameFr: "Guelmim-Oued Noun", provinces: [
    { name: "Guelmim", nameAr: "كلميم" },
    { name: "Tan-Tan", nameAr: "طانطان" },
    { name: "Assa-Zag", nameAr: "آسا-الزاك" },
    { name: "Sidi Ifni", nameAr: "سيدي إفني" },
  ]},
  { slug: "laayoune-sakia-el-hamra", name: "Laâyoune-Sakia El Hamra", nameAr: "العيون-الساقية الحمراء", nameFr: "Laâyoune-Sakia El Hamra", provinces: [
    { name: "Laâyoune", nameAr: "العيون" },
    { name: "Boujdour", nameAr: "بوجدور" },
    { name: "Tarfaya", nameAr: "طرفاية" },
    { name: "Es-Semara", nameAr: "السمارة" },
  ]},
  { slug: "dakhla-oued-eddahab", name: "Dakhla-Oued Ed-Dahab", nameAr: "الداخلة-وادي الذهب", nameFr: "Dakhla-Oued Ed-Dahab", provinces: [
    { name: "Dakhla", nameAr: "الداخلة" },
    { name: "Aousserd", nameAr: "أوسرد" },
  ]},
];

async function main() {
  console.log("🌱 Seeding regions + provinces...");

  for (const regionData of REGIONS_DATA) {
    // Check if region exists
    let region = await prisma.region.findUnique({
      where: { slug: regionData.slug },
    });

    if (!region) {
      // Create region
      region = await prisma.region.create({
        data: {
          name: regionData.name,
          nameAr: regionData.nameAr,
          nameFr: regionData.nameFr || regionData.name,
          slug: regionData.slug,
        },
      });
      console.log(`  ✅ Created region: ${regionData.nameAr} (${regionData.slug})`);
    } else {
      // Update region with new fields
      region = await prisma.region.update({
        where: { id: region.id },
        data: {
          nameFr: regionData.nameFr || regionData.name,
        },
      });
      console.log(`  ♻️ Updated region: ${regionData.nameAr}`);
    }

    // Create provinces for this region
    for (const provData of regionData.provinces) {
      const provSlug = provData.name.toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const existingProv = await prisma.province.findUnique({
        where: { slug: provSlug },
      });

      if (!existingProv) {
        await prisma.province.create({
          data: {
            name: provData.name,
            nameAr: provData.nameAr,
            slug: provSlug,
            regionId: region.id,
          },
        });
      }
    }
    console.log(`    → ${regionData.provinces.length} provinces seeded`);
  }

  // Link existing cities to provinces (by name match)
  const cities = await prisma.city.findMany({ select: { id: true, name: true, nameAr: true, regionId: true } });
  const provinces = await prisma.province.findMany({ select: { id: true, name: true, nameAr: true, slug: true } });

  let linked = 0;
  for (const city of cities) {
    // Try to match city to a province by name
    const match = provinces.find(p =>
      p.nameAr === city.nameAr ||
      p.name === city.name ||
      city.nameAr?.includes(p.nameAr) ||
      city.name?.includes(p.name)
    );
    if (match && !city.regionId) {
      // Skip if already has regionId - we don't want to break existing links
    }
    if (match) {
      await prisma.city.update({
        where: { id: city.id },
        data: { provinceId: match.id },
      }).catch(() => {});
      linked++;
    }
  }
  console.log(`\n🔗 Linked ${linked} cities to provinces`);

  const finalCount = {
    regions: await prisma.region.count(),
    provinces: await prisma.province.count(),
    cities: await prisma.city.count(),
    districts: await prisma.district.count(),
  };
  console.log("\n📊 Final counts:", JSON.stringify(finalCount, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
