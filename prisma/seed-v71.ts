// v71.0: Seed all 5 new sections' demo data
// Solidarity offers/needs + Civic reports + Trust events + Audio rooms + Crisis

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("\n🌱 Seeding v71.0 demo data...\n");

  // Get regions + users for foreign keys
  const regions = await prisma.region.findMany({ take: 12, select: { id: true, slug: true, nameAr: true, name: true } });
  const users = await prisma.user.findMany({ take: 20, select: { id: true, fullName: true, email: true } });

  // ─── Section 7: Solidarity Offers + Needs + SwapLedger ─────────
  const OFFERS = [
    { title: "دروس دعم في الرياضيات (مجاناً)", category: "skill", tags: "رياضيات,تعليم,ثانوي", desc: "أستاذ رياضيات متقاعد أقدم دروس دعم مجانية للتلاميذ بالباكلوريا", valueHours: 2 },
    { title: "كرسي متحرك — معار", category: "good", tags: "صحة,إعاقة,كرسي", desc: "كرسي متحرك كهربائي بحالة جيدة جداً. سلمته لمن يحتاجه بمراكش", valueHours: null },
    { title: "نقل مجاني للمرضى يوم الجمعة", category: "service", tags: "صحة,نقل,مرضى", desc: "أمتلك سيارة وأمضي يوم الجمعة لنقل المرضى للقطب الطبي بأكادير", valueHours: 4 },
    { title: "ملابس شتوية للأطفال (0-3 سنوات)", category: "good", tags: "أطفال,ملابس,شتاء", desc: "حقيبة ملابس شتوية بحالة ممتازة لأطفال بين 0-3 سنوات", valueHours: null },
    { title: "دورة في الخياطة العصرية (4 جلسات)", category: "skill", tags: "خياطة,نساء,دورة", desc: "حرفية من فاس أقدم دورة في الخياطة العصرية لـ 5 نساء", valueHours: 8 },
    { title: "إيواء مؤقت — غرفة لشخص بطنجة", category: "shelter", tags: "إيواء,طنجة,مؤقت", desc: "غرفة مفروشة مجاناً لشخص عابر السبيل أو طالب لمدة 7 أيام", valueHours: null },
    { title: "ترجمة من الفرنسية للعربية", category: "skill", tags: "ترجمة,فرنسية,عربية", desc: "مترجم محلف أقدم خدمات الترجمة للوثائق الإدارية", valueHours: 1 },
    { title: "وجبات طعام يومية لـ 3 أيام (أسرة محتاجة)", category: "service", tags: "طعام,أسرة,تضامن", desc: "أطبخ وجبات يومية لأسرة محتاجة بمنطقة الدار البيضاء", valueHours: 6 },
    { title: "صيانة واصلاح الهواتف", category: "skill", tags: "هاتف,صيانة,إصلاح", desc: "مهندس إلكترونيك يصلح الهواتف المعطلة مجاناً للعائلات الفقيرة", valueHours: 1 },
    { title: "10 ساعات وقت لمساعدة كبار السن", category: "time", tags: "وقت,كبار السن,تضامن", desc: "أمتلك 10 ساعات أسبوعياً لمساعدة كبار السن بالتسوق والإطعام", valueHours: 10 },
  ];

  const NEEDS = [
    { title: "بحث عن مدرس خصوصي للإنجليزية (إعدادي)", category: "skill", tags: "إنجليزية,إعدادي", desc: "ابني في الإعدادي ويحتاج مدرس إنجليزية بأسعار معقولة", valueHours: 2, urgent: true },
    { title: "نقالة طبية — حالة طارئة", category: "good", tags: "نقالة,طبي,طارئ", desc: "نقالة طبية لوالدتي المسنة التي لا تستطيع المشي", valueHours: null, urgent: true },
    { title: "بحث عن نقل للقطب طبي الأحد", category: "service", tags: "نقل,صحة,أحد", desc: "أحتاج نقل من بني ملال للقطب الطبي بالرباط يوم الأحد", valueHours: 4, urgent: true },
    { title: "ملابس مدرسية لطفلين بباكلوريا", category: "good", tags: "ملابس,مدرسية,أطفال", desc: "أبحث عن ملابس مدرسية لطفلين بالثانوي", valueHours: null, urgent: false },
    { title: "دورة في الطبخ المغربي", category: "skill", tags: "طبخ,مغربي,دورة", desc: "ابنتي تبحث عن دورة في الطبخ المغربي التقليدي", valueHours: 4, urgent: false },
    { title: "غرفة مستأجرة بـ 800 درهم", category: "shelter", tags: "غرفة,إيجار,800", desc: "أبحث عن غرفة مستأجرة بسيطة بـ 800 درهم شهرياً", valueHours: null, urgent: true },
    { title: "ترجمة عاجلة لوثيقة طبية من الألمانية", category: "skill", tags: "ترجمة,ألمانية,طبي", desc: "وثيقة طبية من مستشفى ألماني تحتاج ترجمة عاجلة للعربية", valueHours: 1, urgent: true },
    { title: "مساعدة في نقل عفش أسرة (طنجة)", category: "service", tags: "نقل,عفش,طنجة", desc: "أبحث عن متطوعين لمساعدتي في نقل عفش أسرة بطنجة", valueHours: 3, urgent: false },
    { title: "تطبيق ذكي لعرض المنتجات الحرفية", category: "skill", tags: "تطبيق,حرف,تسويق", desc: "تعاونية تبحث عن مطور ذكي لبناء تطبيق بسيط لعرض المنتجات الحرفية", valueHours: 5, urgent: false },
    { title: "5 وجبات يومية لكبار السن بأمنان", category: "service", tags: "وجبات,كبار السن,أمنان", desc: "أبحث عن متطوعين لتقديم 5 وجبات يومية لكبار السن المنعزلين بأمنان", valueHours: 5, urgent: true },
  ];

  let offersCreated = 0;
  let needsCreated = 0;
  for (const offer of OFFERS) {
    const region = pickRandom(regions);
    const user = pickRandom(users);
    await prisma.solidarityOffer.upsert({
      where: { id: `seed-offer-${offersCreated}` }, // deterministic id for upsert
      create: {
        id: `seed-offer-${offersCreated}`,
        userId: user.id,
        userName: user.fullName,
        title: offer.title,
        description: offer.desc,
        category: offer.category,
        tags: offer.tags,
        regionId: region.id,
        estimatedValueHours: offer.valueHours,
        isActive: true,
        isFulfilled: false,
      },
      update: {},
    });
    offersCreated++;
  }

  for (const need of NEEDS) {
    const region = pickRandom(regions);
    const user = pickRandom(users);
    await prisma.solidarityNeed.upsert({
      where: { id: `seed-need-${needsCreated}` },
      create: {
        id: `seed-need-${needsCreated}`,
        userId: user.id,
        userName: user.fullName,
        title: need.title,
        description: need.desc,
        category: need.category,
        tags: need.tags,
        regionId: region.id,
        estimatedValueHours: need.valueHours,
        isUrgent: need.urgent,
        isActive: true,
        isFulfilled: false,
      },
      update: {},
    });
    needsCreated++;
  }

  console.log(`✓ Solidarity: ${offersCreated} offers + ${needsCreated} needs`);

  // ─── Section 8: Civic Reports ──────────────────────────────
  const CIVIC_REPORTS = [
    { title: "حفرة كبيرة بطريق أكدال", cat: "pothole", pri: "high", desc: "حفرة عميقة بشمال أكدال تسبب حوادث. تجنبتها بسيارتي مرتين" },
    { title: "إنارة عمومية معطلة بحي حدرا", cat: "lighting", pri: "normal", desc: "3 أعمدة إنارة معطلة منذ أسبوع بحي حدرا بسلا" },
    { title: "نفايات متراكمة بحي السلام", cat: "waste", pri: "high", desc: "نفايات لم تُرفع منذ 5 أيام. روائح كريهة وحشرات" },
    { title: "تسرب مياه بطريق محمد الخامس", cat: "water", pri: "critical", desc: "تسرب مياه كبير منذ أمس. الطريق مغمور" },
    { title: "رصيف مكسور بطريق فاس", cat: "road", pri: "normal", desc: "رصيف مكسور يصعب مرور العربات" },
    { title: "حديقة بحالة سيئة — حي النهضة", cat: "park", pri: "low", desc: "مقاعد مكسورة وأعشاب طويلة. الأطفال لا يستطيعون اللعب" },
    { title: "إشارة مرور معطلة بتقاطع المسيرة", cat: "road", pri: "high", desc: "الإشارة الخضراء لا تعمل. حوادث عدة هذا الأسبوع" },
    { title: "صرف صحي مفتوح بحي البيدا", cat: "water", pri: "critical", desc: "غطاء بالوعة مكسور. خطر على الأطفال" },
    { title: "رسم جداري مسيء بشارع الزرقطوني", cat: "other", pri: "low", desc: "كتابات مسيئة على جدار عمارة سكنية" },
    { title: "حاوية ممتلئة بحي المسيرة 2", cat: "waste", pri: "normal", desc: "الحاوية لم تُفرغ منذ أسبوعين" },
  ];

  let civicCreated = 0;
  for (let i = 0; i < CIVIC_REPORTS.length; i++) {
    const r = CIVIC_REPORTS[i];
    const region = pickRandom(regions);
    const user = pickRandom(users);
    const reportNumber = `CR-MA-2026-${String(1000 + i).padStart(4, "0")}`;
    await prisma.civicReport.upsert({
      where: { reportNumber },
      create: {
        reportNumber,
        title: r.title,
        description: r.desc,
        category: r.cat,
        priority: r.pri,
        regionId: region.id,
        reportedById: user.id,
        reportedByName: user.fullName,
        latitude: 31 + Math.random() * 5,
        longitude: -8 + Math.random() * 4,
        status: pickRandom(["submitted", "verified", "assigned", "in_progress", "resolved"]),
        upvotes: Math.floor(Math.random() * 50),
        viewsCount: Math.floor(Math.random() * 200),
        isVerified: Math.random() > 0.6,
      },
      update: {},
    });
    civicCreated++;
  }
  console.log(`✓ Civic Reports: ${civicCreated} reports`);

  // ─── Section 9: Trust Events (initial seed) ─────────────────
  let trustEventsCreated = 0;
  for (const user of users.slice(0, 10)) {
    for (const eventType of ["karma", "verified", "endorsement", "tenure", "civic_report"]) {
      const delta = eventType === "verified" ? 20 : eventType === "karma" ? Math.floor(Math.random() * 15) + 5 : eventType === "endorsement" ? 5 : eventType === "tenure" ? 10 : 8;
      await prisma.trustEvent.create({
        data: {
          userId: user.id,
          eventType,
          delta,
          description: `Seed: ${eventType} +${delta}`,
          source: "seed",
        },
      });
      trustEventsCreated++;
    }
  }
  console.log(`✓ Trust Events: ${trustEventsCreated} events`);

  // ─── Section 10: Audio Rooms ───────────────────────────────
  const ROOMS = [
    { title: "تضامن — زلزال الحوز", topic: "تضامن", desc: "غرفة صوتية لتنسيق التضامن مع منكوبي زلزال الحوز", regionSlug: "marrakech-safi" },
    { title: "ندوة: الجمعيات والقانون 75-00", topic: "قانون", desc: "محامي يشرح قانون الجمعيات ويجيب على أسئلتكم", regionSlug: "rabat-sale-kenitra" },
    { title: "حكايات من الدار البيضاء", topic: "حكايات", desc: "غرفة لسرد الحكايات الشعبية الدار البيضاء", regionSlug: "casablanca-settat" },
    { title: "ندوة فاس التاريخية — حفظ الموروث", topic: "تراث", desc: "محاداثة عن صون المدينة العتيقة", regionSlug: "fes-meknes" },
    { title: "تعاونية نسائية نجاحات", topic: "تعاونية", desc: "نساء من تعاونيات ناجحة يحكين تجاربهن", regionSlug: "souss-massa" },
    { title: "أساتذة الرياضيات بالباك", topic: "تعليم", desc: "أساتذة متطوعون يجيبون على أسئلة التلاميذ", regionSlug: "tanger-tetouan-al-hoceima" },
  ];

  let roomsCreated = 0;
  for (let i = 0; i < ROOMS.length; i++) {
    const r = ROOMS[i];
    const region = regions.find((rg) => rg.slug === r.regionSlug) ?? pickRandom(regions);
    const user = pickRandom(users);
    const isLive = i === 0; // first one is live
    await prisma.audioRoom.upsert({
      where: { id: `seed-room-${i}` },
      create: {
        id: `seed-room-${i}`,
        title: r.title,
        description: r.desc,
        topic: r.topic,
        hostId: user.id,
        hostName: user.fullName,
        regionId: region.id,
        isLive,
        isPublic: true,
        isActive: true,
        scheduledFor: isLive ? null : new Date(Date.now() + (i * 24 * 60 * 60 * 1000)),
        startedAt: isLive ? new Date() : null,
        currentListeners: isLive ? Math.floor(Math.random() * 50) + 5 : 0,
        peakListeners: isLive ? Math.floor(Math.random() * 100) + 20 : 0,
        speakersCount: isLive ? Math.floor(Math.random() * 5) + 1 : 0,
        livekitRoomName: `wassal-room-${i}`,
      },
      update: {},
    });
    roomsCreated++;
  }
  console.log(`✓ Audio Rooms: ${roomsCreated} rooms`);

  // ─── Section 11: Crisis + ResourceNeeds + VolunteerSlots ────
  const CRISIS_LIST = [
    { title: "زلزال الحوز 2026 (محاكاة)", type: "earthquake", severity: "critical", regionSlug: "marrakech-safi", affected: 250000, casualties: 2900, desc: "زلزال بقوة 6.8 بمقياس ريختر ضرب إقليم الحوز" },
    { title: "فيضانات واد درعة", type: "flood", severity: "high", regionSlug: "draa-tafilalet", affected: 15000, casualties: 12, desc: "فيضانات نهر درعة بعد أمطار غزيرة" },
    { title: "حرش جبال الريف — حريق", type: "fire", severity: "high", regionSlug: "tanger-tetouan-al-hoceima", affected: 800, casualties: 0, desc: "حريق غابوي بإقليم الحسيمة" },
  ];

  let crisisCreated = 0;
  for (let i = 0; i < CRISIS_LIST.length; i++) {
    const c = CRISIS_LIST[i];
    const region = regions.find((rg) => rg.slug === c.regionSlug) ?? pickRandom(regions);
    const crisis = await prisma.crisis.upsert({
      where: { id: `seed-crisis-${i}` },
      create: {
        id: `seed-crisis-${i}`,
        title: c.title,
        description: c.desc,
        crisisType: c.type,
        severity: c.severity,
        status: i === 0 ? "active" : i === 1 ? "contained" : "resolved",
        regionId: region.id,
        affectedPeople: c.affected,
        casualties: c.casualties,
        isVerified: true,
        verifiedBy: "admin",
        sourceUrl: "https://example.com/official-source",
        isActive: i < 2,
      },
      update: {},
    });
    crisisCreated++;

    // Add resource needs
    const needs = [
      { category: "water", qty: 5000, unit: "liters", urgency: "critical" },
      { category: "food", qty: 2000, unit: "meals", urgency: "critical" },
      { category: "medical", qty: 50, unit: "kits", urgency: "high" },
      { category: "shelter", qty: 200, unit: "tents", urgency: "high" },
      { category: "clothing", qty: 1000, unit: "items", urgency: "medium" },
    ];
    for (const n of needs) {
      await prisma.resourceNeed.create({
        data: {
          crisisId: crisis.id,
          category: n.category,
          quantityNeeded: n.qty,
          quantityFulfilled: Math.floor(n.qty * (i > 0 ? 0.6 : 0.2)),
          unit: n.unit,
          urgency: n.urgency,
          isFulfilled: false,
        },
      });
    }

    // Add volunteer slots
    const slots = [
      { role: "medic", slots: 10 },
      { role: "driver", slots: 25 },
      { role: "translator", slots: 5 },
      { role: "coordinator", slots: 3 },
      { role: "logistics", slots: 8 },
      { role: "search_rescue", slots: 15 },
    ];
    for (const s of slots) {
      await prisma.volunteerSlot.create({
        data: {
          crisisId: crisis.id,
          role: s.role,
          slotsNeeded: s.slots,
          slotsFilled: Math.floor(s.slots * (i > 0 ? 0.7 : 0.3)),
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }
  console.log(`✓ Crisis: ${crisisCreated} crises (with resource needs + volunteer slots)`);

  // ─── SOS alerts (sample) ────────────────────────────────────
  for (let i = 0; i < 3; i++) {
    const region = pickRandom(regions);
    const user = pickRandom(users);
    await prisma.sosAlert.upsert({
      where: { alertNumber: `SOS-MA-2026-${String(2000 + i).padStart(4, "0")}` },
      create: {
        alertNumber: `SOS-MA-2026-${String(2000 + i).padStart(4, "0")}`,
        userId: user.id,
        userName: user.fullName,
        userPhone: "+212-6XX-XX-XX-XX",
        latitude: 31 + Math.random() * 5,
        longitude: -8 + Math.random() * 4,
        regionId: region.id,
        triggerType: "manual_long_press",
        status: i === 0 ? "active" : i === 1 ? "responded" : "resolved",
        isVerified: i > 0,
        respondedAt: i > 0 ? new Date(Date.now() - i * 3600000) : null,
        resolvedAt: i === 2 ? new Date() : null,
      },
      update: {},
    });
  }
  console.log(`✓ SOS Alerts: 3 sample alerts`);

  // Final summary
  const summary = {
    offers: await prisma.solidarityOffer.count(),
    needs: await prisma.solidarityNeed.count(),
    swaps: await prisma.swapLedger.count(),
    civicReports: await prisma.civicReport.count(),
    trustEvents: await prisma.trustEvent.count(),
    audioRooms: await prisma.audioRoom.count(),
    crises: await prisma.crisis.count(),
    resourceNeeds: await prisma.resourceNeed.count(),
    volunteerSlots: await prisma.volunteerSlot.count(),
    missingPersons: await prisma.missingPerson.count(),
    sosAlerts: await prisma.sosAlert.count(),
  };
  console.log("\n📊 Final v71.0 counts:");
  for (const [k, v] of Object.entries(summary)) {
    console.log(`  • ${k}: ${v}`);
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
