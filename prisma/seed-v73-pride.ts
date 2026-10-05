// v73.0: Seed Neighborhood Pride + Challenges + Stories + Badges
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mock district IDs for demo purposes
const DISTRICTS = [
  { id: "d1", name: "سيدي يوسف بن علي", city: "مراكش", region: "مراكش-آسفي" },
  { id: "d2", name: "حي النخيل", city: "مراكش", region: "مراكش-آسفي" },
  { id: "d3", name: "المدينة القديمة", city: "فاس", region: "فاس-مكناس" },
  { id: "d4", name: "حي الرياض", city: "الرباط", region: "الرباط-سلا-القنيطرة" },
  { id: "d5", name: "حي المعاريف", city: "الدار البيضاء", region: "الدار البيضاء-سطات" },
  { id: "d6", name: "حي أكدال", city: "الرباط", region: "الرباط-سلا-القنيطرة" },
  { id: "d7", name: "حي باب الأحمر", city: "فاس", region: "فاس-مكناس" },
  { id: "d8", name: "حي آنفا", city: "الدار البيضاء", region: "الدار البيضاء-سطات" },
  { id: "d9", name: "حي القشلة", city: "طنجة", region: "طنجة-تطوان-الحسيمة" },
  { id: "d10", name: "حي العنق", city: "أكادير", region: "سوس-ماسة" },
  { id: "d11", name: "حي الخميس", city: "وجدة", region: "الشرق" },
  { id: "d12", name: "حي مولاي الحسن", city: "مكناس", region: "فاس-مكناس" },
];

const FAMILIES = [
  { id: "f1", name: "بنشقرون", districtId: "d1", districtName: "سيدي يوسف بن علي", city: "مراكش" },
  { id: "f2", name: "العلوي", districtId: "d3", districtName: "المدينة القديمة", city: "فاس" },
  { id: "f3", name: "بلحسن", districtId: "d5", districtName: "حي المعاريف", city: "الدار البيضاء" },
  { id: "f4", name: "المنصوري", districtId: "d9", districtName: "حي القشلة", city: "طنجة" },
  { id: "f5", name: "وزان", districtId: "d2", districtName: "حي النخيل", city: "مراكش" },
  { id: "f6", name: "السرغيني", districtId: "d7", districtName: "حي باب الأحمر", city: "فاس" },
];

const STORIES = [
  { districtId: "d1", districtName: "سيدي يوسف بن علي", familyName: "بنشقرون", title: "كيف جمعنا 50 ألف درهم لمريض في حينا", content: "قصة حقيقية عن تضامن حي سيدي يوسف بن علي مع جارهم المريض. 7 عائلات اجتمعت، نظّمنا جمعيات صغيرة، وفي 3 أسابيع جمعنا المبلغ الكامل. هذا هو فخر الأحياء.", category: "solidarity", prideBoost: 30, regionName: "مراكش-آسفي" },
  { districtId: "d3", districtName: "المدينة القديمة", familyName: "العلوي", title: "مدرسة قرآنية عمرها 300 سنة — كيف صُنت", content: "في قلب فاس القديمة، مدرسة قرآنية توارثتها عائلات الحي منذ 3 قرون. اليوم، نستقبل 120 طفلاً مجاناً. هذا موروثنا.", category: "cultural", prideBoost: 25, regionName: "فاس-مكناس" },
  { districtId: "d5", districtName: "حي المعاريف", familyName: "بلحسن", title: "أبطال كرة القدم — حي المعاريف بطل الدار البيضاء", content: "فريق الأطفال في حي المعاريف فاز ببطولة الدار البيضاء للأحياء. 11 طفل تدربوا 6 أشهر، والآن يحملون كأس البطولة. فخر ما بعده فخر!", category: "sports", prideBoost: 20, regionName: "الدار البيضاء-سطات" },
  { districtId: "d9", districtName: "حي القشلة", familyName: "المنصوري", title: "تعاونيات نسائية بطنجة — 40 امرأة يعشن من حرفهن", content: "في حي القشلة بطنجة، أسسنا 3 تعاونيات نسائية. 40 امرأة الآن ينتجن ويبيعن المنتجاتهن online. اكتفاء ذاتي وفخر عائلي.", category: "success", prideBoost: 28, regionName: "طنجة-تطوان-الحسيمة" },
  { districtId: "d2", districtName: "حي النخيل", familyName: "وزان", title: "ألف وجبة إفطار جماعي في رمضان", content: "في رمضان الماضي، نظّم حي النخيل 30 موائد إفطار جماعي. 1000 وجبة وزّعناها على الفقراء والمسافرين. الحي الذي لا ينسى رمضان.", category: "ramadan", prideBoost: 35, regionName: "مراكش-آسفي" },
];

const BADGES = [
  { slug: "solidarity-100", name: "متضامن", nameAr: "متضامن", description: "أكثر من 100 مساهمة في صندوق المعروف", icon: "🤝", color: "teal", category: "solidarity", requirements: "contributions >= 100", rarity: "rare", pointsAwarded: 50 },
  { slug: "host-master", name: "منظّم", nameAr: "منظّم", description: "نظّم 10 فعاليات ناجحة في الحي", icon: "📅", color: "amber", category: "activity", requirements: "events_organized >= 10", rarity: "epic", pointsAwarded: 100 },
  { slug: "family-tribe", name: "عائلة كبيرة", nameAr: "عائلة كبيرة", description: "5 أجيال من نفس العائلة في الحي", icon: "🌳", color: "emerald", category: "family", requirements: "generations >= 5", rarity: "legendary", pointsAwarded: 200 },
  { slug: "ramadan-hero", name: "بطل رمضان", nameAr: "بطل رمضان", description: "نظّم موائد إفطار جماعي", icon: "🌙", color: "purple", category: "seasonal", requirements: "iftar_tables >= 30", rarity: "rare", pointsAwarded: 80 },
  { slug: "youth-champion", name: "أبطال الشباب", nameAr: "أبطال الشباب", description: "فريق الأطفال فاز ببطولة محلية", icon: "🏆", color: "amber", category: "sports", requirements: "youth_tournaments_won >= 1", rarity: "epic", pointsAwarded: 120 },
  { slug: "story-keeper", name: "حافظ القصص", nameAr: "حافظ القصص", description: "نشر 5 قصص نجاح من الحي", icon: "📚", color: "rose", category: "milestone", requirements: "stories_published >= 5", rarity: "common", pointsAwarded: 30 },
];

const CHALLENGES = [
  { title: "تحدّي رمضان — أكثر موائد إفطار", description: "أي حي سيُنظّم أكبر عدد من موائد الإفطار الجماعي في رمضان؟", type: "ramadan", challengerId: "d1", challengerName: "سيدي يوسف بن علي", goalDescription: "نظّم 30 موائد إفطار جماعي", metric: "iftar_tables", targetValue: 30, challengerProgress: 18, endsAt: new Date(Date.now() + 21 * 24 * 3600 * 1000), participants: JSON.stringify(["d1","d2","d5","d9"]) },
  { title: "تحدّي الصندوق — أكبر مساهمات هذا الشهر", description: "أي حي سيجمع أكبر مبلغ لصندوق المعروف هذا الشهر؟", type: "solidarity", challengerId: "d5", challengerName: "حي المعاريف", challengedId: "d3", challengedName: "المدينة القديمة", goalDescription: "اجمع 5000 درهم", metric: "contributions_mad", targetValue: 5000, challengerProgress: 3200, challengedProgress: 2800, endsAt: new Date(Date.now() + 12 * 24 * 3600 * 1000), rewardPoints: 200 },
  { title: "تحدّي الفعاليات — أكثر نشاط شبابي", description: "أي حي سيُنظّم أكثر فعاليات للأطفال والشباب؟", type: "activity", challengerId: "d9", challengerName: "حي القشلة", goalDescription: "10 فعاليات شبابية هذا الشهر", metric: "events", targetValue: 10, challengerProgress: 6, endsAt: new Date(Date.now() + 18 * 24 * 3600 * 1000), participants: JSON.stringify(["d9","d10","d11"]) },
  { title: "تحدّي القصص — حكايا الأحياء", description: "أي حي سيُنشر أكبر عدد من قصص النجاح؟", type: "cultural", challengerId: "d3", challengerName: "المدينة القديمة", goalDescription: "نشر 10 قصص نجاح", metric: "stories", targetValue: 10, challengerProgress: 5, endsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000), rewardPoints: 100 },
];

const PRIDE_SCORES = DISTRICTS.map((d, i) => {
  // Pride scores — distributed so we have a real ranking
  const scores = [
    { p: 850, l: "بطل", s: 220, a: 180, e: 200, f: 150, g: 100, cr: 1, nr: 1, wfam: 0, fcount: 18, mc: 245, st: 30 },
    { p: 780, l: "بطل", s: 180, a: 200, e: 180, f: 160, g: 60, cr: 2, nr: 2, wfam: 0, fcount: 14, mc: 188, st: 22 },
    { p: 720, l: "متضامن", s: 200, a: 150, e: 170, f: 140, g: 60, cr: 1, nr: 3, wfam: 3, fcount: 12, mc: 165, st: 18 },
    { p: 680, l: "متضامن", s: 170, a: 160, e: 180, f: 120, g: 50, cr: 1, nr: 4, wfam: 0, fcount: 9, mc: 142, st: 14 },
    { p: 620, l: "متضامن", s: 160, a: 170, e: 150, f: 110, g: 30, cr: 1, nr: 5, wfam: 0, fcount: 11, mc: 128, st: 12 },
    { p: 560, l: "نشيط", s: 140, a: 150, e: 130, f: 100, g: 40, cr: 2, nr: 6, wfam: 0, fcount: 8, mc: 110, st: 9 },
    { p: 510, l: "نشيط", s: 130, a: 140, e: 110, f: 90, g: 40, cr: 2, nr: 7, wfam: 0, fcount: 7, mc: 92, st: 7 },
    { p: 460, l: "نشيط", s: 120, a: 130, e: 90, f: 80, g: 40, cr: 2, nr: 8, wfam: 0, fcount: 6, mc: 78, st: 5 },
    { p: 400, l: "نشيط", s: 110, a: 120, e: 80, f: 70, g: 20, cr: 3, nr: 9, wfam: 0, fcount: 5, mc: 65, st: 3 },
    { p: 350, l: "جديد", s: 90, a: 100, e: 70, f: 60, g: 30, cr: 3, nr: 10, wfam: 0, fcount: 4, mc: 52, st: 2 },
    { p: 280, l: "جديد", s: 70, a: 80, e: 60, f: 50, g: 20, cr: 3, nr: 11, wfam: 0, fcount: 3, mc: 38, st: 1 },
    { p: 220, l: "جديد", s: 50, a: 60, e: 50, f: 40, g: 20, cr: 3, nr: 12, wfam: 0, fcount: 2, mc: 28, st: 1 },
  ];
  return { id: undefined, districtId: d.id, districtName: d.name, ...scores[i] };
});

const FAMILY_PRIDE_SCORES = FAMILIES.map((f, i) => {
  const scores = [
    { p: 780, l: "أسطورة", s: 220, a: 180, ach: 200, gen: 180, dr: 1, cr: 1, nr: 1, mc: 18, wfam: 3, st: 30 },
    { p: 690, l: "بطل", s: 180, a: 200, ach: 160, gen: 150, dr: 2, cr: 1, nr: 2, mc: 14, wfam: 0, st: 22 },
    { p: 580, l: "بطل", s: 200, a: 150, ach: 140, gen: 90, dr: 1, cr: 1, nr: 3, mc: 12, wfam: 0, st: 18 },
    { p: 470, l: "متضامن", s: 160, a: 170, ach: 110, gen: 30, dr: 1, cr: 2, nr: 4, mc: 9, wfam: 0, st: 14 },
    { p: 380, l: "متضامن", s: 140, a: 150, ach: 80, gen: 10, dr: 2, cr: 3, nr: 5, mc: 7, wfam: 0, st: 9 },
    { p: 290, l: "نشيط", s: 110, a: 120, ach: 50, gen: 10, dr: 2, cr: 3, nr: 6, mc: 5, wfam: 0, st: 5 },
  ];
  return { districtId: f.districtId, districtName: f.districtName, city: f.city, familyId: f.id, familyName: f.name, ...scores[i] };
});

async function main() {
  console.log(`\n🌱 Seeding v73 Pride data...`);

  // District Pride scores
  let dpCount = 0;
  for (const p of PRIDE_SCORES as any) {
    await prisma.districtPride.upsert({
      where: { districtId: p.districtId },
      create: {
        districtId: p.districtId,
        districtName: p.districtName,
        prideScore: p.p,
        prideLevel: p.l,
        solidarityScore: p.s,
        activityScore: p.a,
        engagementScore: p.e,
        familyPrideScore: p.f,
        growthScore: p.g,
        cityRank: p.cr,
        nationalRank: p.nr,
        weeksAsLeader: p.wfam,
        totalFamilies: p.fcount,
        totalMembers: p.mc,
        streak: p.st,
        achievements: JSON.stringify([
          ...(p.s > 200 ? ["solidarity-100"] : []),
          ...(p.a > 200 ? ["host-master"] : []),
          ...(p.wfam >= 3 ? ["family-tribe"] : []),
        ]),
        lastActivityAt: new Date(),
      },
      update: {},
    });
    dpCount++;
  }

  // Family Pride scores
  let fpCount = 0;
  for (const p of FAMILY_PRIDE_SCORES as any) {
    await prisma.familyPride.upsert({
      where: { familyId: p.familyId },
      create: {
        familyId: p.familyId,
        familyName: p.familyName,
        districtId: p.districtId,
        districtName: p.districtName,
        city: p.city,
        prideScore: p.p,
        prideLevel: p.l,
        solidarityScore: p.s,
        activityScore: p.a,
        achievementsScore: p.ach,
        generationsScore: p.gen,
        districtRank: p.dr,
        cityRank: p.cr,
        nationalRank: p.nr,
        totalMembers: p.mc,
        weeksAsLeader: p.wfam,
        streak: p.st,
        achievements: JSON.stringify([
          ...(p.gen >= 100 ? ["family-tribe"] : []),
          ...(p.ach >= 150 ? ["story-keeper"] : []),
        ]),
        lastActivityAt: new Date(),
      },
      update: {},
    });
    fpCount++;
  }

  // Badges
  let bCount = 0;
  for (const b of BADGES) {
    await prisma.achievementBadge.upsert({
      where: { slug: b.slug },
      create: b,
      update: b,
    });
    bCount++;
  }

  // Challenges
  let cCount = 0;
  for (const c of CHALLENGES) {
    try {
      await prisma.districtChallenge.create({ data: c });
      cCount++;
    } catch (e) { /* ignore dups */ }
  }

  // Stories
  let sCount = 0;
  for (const s of STORIES) {
    try {
      await prisma.neighborhoodStory.create({ data: { ...s, isApproved: true, status: "approved" } as any });
      sCount++;
    } catch (e) { /* ignore */ }
  }

  console.log(`✓ Inserted ${dpCount} district prides + ${fpCount} family prides + ${bCount} badges + ${cCount} challenges + ${sCount} stories`);
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
