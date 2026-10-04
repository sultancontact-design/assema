// v71.0 Section E: Seed Time Bank data
// Inserts sample offers + requests across Morocco to demonstrate the system

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USERS = [
  { id: "demo-user-1", name: "fatima" },
  { id: "demo-user-2", name: "youssef" },
  { id: "demo-user-3", name: "khadija" },
  { id: "demo-user-4", name: "mehdi" },
  { id: "demo-user-5", name: "salma" },
  { id: "demo-user-6", name: "amine" },
];

const OFFERS = [
  { userId: "demo-user-1", title: "أعطي دروس في اللغة الإنجليزية", category: "education", hoursOffered: 2.0, regionName: "طنجة-تطوان-الحسيمة", provinceName: "طنجة-أصيلا", description: "أستاذة لغة إنجليزية معتمدة، أعرض دروساً فردية أو ثنائية لكل المستويات." },
  { userId: "demo-user-2", title: "أساعد في ملأ التصريح الضريبي", category: "other", hoursOffered: 1.0, regionName: "الدار البيضاء-سطات", provinceName: "الدار البيضاء", description: "محاسب بخبرة 8 سنوات، أساعد المغاربة في ملأ التصريح السنوي بالضريبة." },
  { userId: "demo-user-3", title: "أعلّم الخياطة المغربية التقليدية", category: "craft", hoursOffered: 3.0, regionName: "فاس-مكناس", provinceName: "فاس", description: "حرفية في القنادر والجلابة. أعرض دروساً تطبيقية في الورشة." },
  { userId: "demo-user-4", title: "أساعد في الإصلاحات الكهربائية", category: "other", hoursOffered: 1.5, regionName: "سوس-ماسة", provinceName: "أكادير-إدا وتنان", description: "كهربائي معتمد، أساعد في إصلاح الأعطال المنزلية البسيطة." },
  { userId: "demo-user-5", title: "أرافق المسنّين للعيادة", category: "health", hoursOffered: 2.0, regionName: "مراكش-آسفي", provinceName: "مراكش", description: "متطوعة، أرافق كبار السن لمواعيد الطبيب والصيدلية." },
  { userId: "demo-user-6", title: "أعلّم البرمجة بـ JavaScript", category: "tech", hoursOffered: 2.0, regionName: "الرباط-سلا-القنيطرة", provinceName: "الرباط", description: "مهندس برمجيات، أعرض دروساً في React وNext.js للمبتدئين." },
  { userId: "demo-user-1", title: "أساعد في تسويق المنتجات الحرفية", category: "other", hoursOffered: 1.5, regionName: "طنجة-تطوان-الحسيمة", provinceName: "تطوان", description: "خبيرة في التسويق الرقمي، أساعد التعاونيات النسائية في بيع منتجاتها online." },
  { userId: "demo-user-3", title: "أعلّم العزف على العود", category: "craft", hoursOffered: 1.5, regionName: "فاس-مكناس", provinceName: "مكناس", description: "عازف بتجربة 15 سنة، أعرض دروساً للمبتدئين والمتقدمين." },
];

const REQUESTS = [
  { userId: "demo-user-2", title: "أحتاج مساعدة في كتابة السيرة الذاتية", category: "other", hoursNeeded: 1.0, urgency: "high", regionName: "الدار البيضاء-سطات", provinceName: "الدار البيضاء", description: "أبحث عن عمل وأحتاج لمن يساعدني في تنظيم السيرة الذاتية بالفرنسية." },
  { userId: "demo-user-4", title: "أحتاج دروساً في الفرنسية", category: "education", hoursNeeded: 2.0, urgency: "normal", regionName: "سوس-ماسة", provinceName: "أكادير-إدا وتنان", description: "أبحث عن عمل في الفندقة وأحتاج تحسين لغتي الفرنسية." },
  { userId: "demo-user-5", title: "أحتاج مساعدة في نقل أثاث المنزل", category: "transport", hoursNeeded: 3.0, urgency: "urgent", regionName: "مراكش-آسفي", provinceName: "مراكش", description: "سأنتقل لمنزل جديد خلال أسبوع وأحتاج يد مساعدة في النقل." },
  { userId: "demo-user-6", title: "أبحث عن دورة في تصميم الواجهات (UI/UX)", category: "tech", hoursNeeded: 2.0, urgency: "normal", regionName: "الرباط-سلا-القنيطرة", provinceName: "الرباط", description: "مطور خلفية، أريد تعلّم أساسيات الـ UI/UX لتحسين مهاراتي." },
  { userId: "demo-user-1", title: "أحتاج من يرافق والدتي للعيادة", category: "health", hoursNeeded: 2.0, urgency: "high", regionName: "طنجة-تطوان-الحسيمة", provinceName: "طنجة-أصيلا", description: "والدتي كبيرة في السن وتحتاج للذهاب للطبيب 3 مرات في الشهر." },
  { userId: "demo-user-3", title: "أحتاج مساعدة في التسويق لورشتي", category: "other", hoursNeeded: 1.5, urgency: "normal", regionName: "فاس-مكناس", provinceName: "فاس", description: "أملك ورشة خياطة وأحتاج مساعدة في إنشاء صفحة إنستغرام احترافية." },
  { userId: "demo-user-2", title: "أبحث عن مربية أطفال مسائية", category: "other", hoursNeeded: 4.0, urgency: "normal", regionName: "الدار البيضاء-سطات", provinceName: "المحمدية", description: "أعمل في الميترو وأحتاج مربية لأطفالي من 17:00-21:00." },
  { userId: "demo-user-4", title: "أريد تعلّم الخياطة التقليدية", category: "craft", hoursNeeded: 3.0, urgency: "low", regionName: "سوس-ماسة", provinceName: "تيزنيت", description: "أرغب في افتتاح ورشة صغيرة وأحتاج تعلّم الأساسيات." },
];

async function main() {
  console.log(`\n🌱 Seeding Time Bank data...`);

  // First, ensure ledger exists for demo users
  for (const u of USERS) {
    await prisma.timeLedger.upsert({
      where: { userId: u.id },
      create: { userId: u.id, creditHours: 0, debitHours: 0, balance: 0, transactionCount: 0 },
      update: {},
    });
  }
  console.log(`✓ Ensured ${USERS.length} user ledgers exist`);

  // Seed offers
  let offersInserted = 0;
  for (const o of OFFERS) {
    // Use create + catch for duplicates
    try {
      await prisma.timeOffer.create({
        data: {
          ...o,
          status: "open",
        },
      });
      offersInserted++;
    } catch (e: any) {
      // ignore unique constraint errors (if re-run)
      if (!e.message.includes("unique")) console.warn(`  ⚠ offer skip: ${e.message.slice(0, 80)}`);
    }
  }

  let requestsInserted = 0;
  for (const r of REQUESTS) {
    try {
      await prisma.timeRequest.create({
        data: {
          ...r,
          status: "open",
        },
      });
      requestsInserted++;
    } catch (e: any) {
      if (!e.message.includes("unique")) console.warn(`  ⚠ request skip: ${e.message.slice(0, 80)}`);
    }
  }

  console.log(`✓ Inserted ${offersInserted} offers + ${requestsInserted} requests\n`);

  // Stats
  const offers = await prisma.timeOffer.count();
  const requests = await prisma.timeRequest.count();
  const ledgers = await prisma.timeLedger.count();
  console.log(`📊 Final counts: offers=${offers}, requests=${requests}, ledgers=${ledgers}`);

  // By category
  const byCategory = await prisma.timeOffer.groupBy({
    by: ["category"],
    _count: { _all: true },
  });
  console.log("\n📊 Offers by category:");
  for (const c of byCategory) {
    console.log(`  • ${c.category}: ${c._count._all}`);
  }
}

main()
  .catch((err) => {
    console.error("❌ Seed error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
