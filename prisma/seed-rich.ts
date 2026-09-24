// ===================================================================
//  prisma/seed-rich.ts — بيانات غنية تحاكي نشاط 6 أشهر
//  يُشغّل عبر: bun prisma/seed-rich.ts
// ===================================================================

import { db } from "../src/lib/db";

const FIRST_NAMES_M = ["محمد", "أحمد", "يوسف", "إبراهيم", "علي", "حسن", "سعيد", "رضا", "خالد", "كريم", "نبيل", "هشام", "زكرياء", "حمزة", "بلال"];
const FIRST_NAMES_F = ["فاطمة", "خديجة", "عائشة", "زينب", "مريم", "سعاد", "حنان", "نادية", "لطيفة", "سميرة", "نوال", "ليلى", "هند", "إكرام", "وفاء"];
const FAMILY_NAMES = ["بنشقرون", "الصقلي", "الحمداوي", "بدر", "الزروالي", "بلمهدي", "الشرقاوي", "بلحاج", "العمراني", "بنجلون", "التازي", "المراكشي", "السوسي", "الناصري"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] as T; }
function randomDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d;
}

async function main() {
  console.log("🚀 بدء Rich Seed — بيانات غنية تحاكي نشاط 6 أشهر\n");

  // جلب البيانات الموجودة
  const district = await db.district.findFirst({ where: { isDefault: true } });
  if (!district) { console.log("❌ لا يوجد حي افتراضي"); return; }
  const users = await db.user.findMany({ select: { id: true, fullName: true, familyId: true, districtId: true }, take: 200 });
  const families = await db.family.findMany({ select: { id: true, districtId: true, familyName: true }, take: 50 });
  console.log(`✓ ${users.length} مستخدم، ${families.length} عائلة موجودون`);

  // ─────────── 1. 100 مساهمة جديدة موزعة على 30 يوم ───────────
  console.log("\n━━━ 1. مساهمات (100 جديدة) ━━━");
  const amounts = [20, 50, 100, 200, 500];
  const methods = ["BANK_TRANSFER", "CASH", "CMI"];
  const statuses = ["PENDING", "CONFIRMED", "CONFIRMED", "CONFIRMED"];
  for (let i = 0; i < 100; i++) {
    const user = pick(users);
    const amount = pick(amounts);
    const method = pick(methods);
    const status = pick(statuses) as "PENDING" | "CONFIRMED";
    const monthDate = randomDate(30);
    const month = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    await db.contribution.create({
      data: {
        userId: user.id, familyId: user.familyId || pick(families).id, districtId: user.districtId || district.id,
        amount, month, year: monthDate.getFullYear(), method: method as any, status,
        receiptNumber: `RC-RICH-${String(i + 1).padStart(4, "0")}`,
        digitalReceipt: crypto.randomUUID?.() || `rich-${Date.now()}-${i}`,
        confirmedAt: status === "CONFIRMED" ? monthDate : null,
        createdAt: monthDate, updatedAt: monthDate,
      }
    });
  }
  console.log("✓ 100 مساهمة أُنشئت");

  // ─────────── 2. 30 فعالية جديدة موزعة على 6 أشهر ───────────
  console.log("\n━━━ 2. فعاليات (30 جديدة) ━━━");
  const eventTypes = ["MONTHLY", "SEASONAL", "SPECIAL", "SOLIDARITY", "CULTURAL"];
  const eventTitles = [
    "ملتقى الحي الشهري", "قافلة طبية مجانية", "إفطار رمضاني جماعي", "مهرجان الأطفال الصيفي",
    "أمسية شعرية في ذاكرة الحي", "معرض حرف الزليج", "حملة التبرع بالدم", "ورشة الطرز المغربي",
    "يوم رياضي لشباب الحي", "سوق خيري لصالح الصندوق", "حفل تكريم المتفوقين", "ندوة صحية للأمهات",
    "محاضرة تربوية", "دورة محو الأمية", "ورشة الحرف اليدوية", "حملة نظافة الحي",
    "احتفال عيد الفطر", "موسم رمضان الخيري", "دورة تكوينية للشباب", "عرض مسرحي للأطفال",
    "ندوة قانونية", "ملتقى الجمعيات", "ورشة تصوير فوتوغرافي", "يوم مفتوح للحي",
    "حملة التشجير", "ورشة الطبخ المغربي", "مسابقة قرآنية", "ندوة بيئية",
    "حفل ختام الأنشطة الصيفية", "ورشة المعلوماتية للأطفال"
  ];
  for (let i = 0; i < 30; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + i * 6);
    const slug = `event-rich-${Date.now()}-${i + 1}`;
    await db.event.create({
      data: {
        title: eventTitles[i], slug,
        description: `${eventTitles[i]} — فعالية مجتمعية تضامنية في حي سيدي يوسف بن علي بمراكش.`,
        type: pick(eventTypes) as any, status: "PUBLISHED",
        startDate, endDate: new Date(startDate.getTime() + 3 * 3600000),
        location: pick(["دار الحي", "مسجد سيدي يوسف", "ساحة الحي", "المركز الثقافي", "المدرسة القرآنية"]),
        districtId: district.id, maxAttendees: 20 + Math.floor(Math.random() * 80),
        isRegistrationOpen: true, requiresApproval: false,
      }
    });
  }
  console.log("✓ 30 فعالية أُنشئت");

  // ─────────── 3. 100 نقاش + 300 رد ───────────
  console.log("\n━━━ 3. نقاشات (100 جديدة) ───────────");
  const discussionTopics = [
    "كيف نساعد أسرة محتاجة في الحي؟", "أفضل مقهى في سيدي يوسف بن علي", "نصائح تربوية للأطفال",
    "أماكن تعليمية مجانية في مراكش", "كيف ننظّم حملة تنظيف؟", "تجربتي مع صندوق المعروف",
    "مقترحات لتحسين الحي", "كيف نحتفل بشهر رمضان؟", "نصائح للادخار العائلي",
    "قصة نجاح: مشروع صغير بدعم الصندوق", "أهمية التضامن في الإسلام", "صحة الطفل: نصائح للأمهات",
    "دور المسجد في الحياة الاجتماعية", "التعليم الإلكتروني: تجارب واقتراحات",
    "فوائد الرياضة للجماعة", "كيف نبدأ مشروعاً صغيراً؟", "التطوع: طريق إلى السعادة",
    "أجمل ذكرياتي في الحي", "كيف نتعامل مع أزمة المرض؟", "نصائح لمواجهة غلاء المعيشة",
    "كيف نُنشّط مجموعة كبار السن؟", "أفكار لفعاليات صيفية", "مقترحات لورش تكوينية",
    "كيف نشجّع الشباب على المشاركة؟", "تجربة الانتماء والعطاء", "نصائح للأمهات الجدد",
    "كيف نحافظ على نظافة الحي؟", "مقترحات لتعزيز الأمان", "كيف نستفيد من نقاط الانتماء؟",
    "أفضل الأماكن للعب الأطفال", "نصائح للتعامل مع كبار السن", "كيف نساعد الطلاب المتعثرين؟",
    "مقترحات لتحسين النقل في الحي", "تجربتي مع العجلة اليومية", "كيف نستثمر في المعروف؟",
    "نصائح لإدارة الميزانية العائلية", "كيف نتعامل مع التنمر؟", "مقترحات لأنشطة رمضانية",
    "كيف نحتفل بيوم المرأة؟", "نصائح للتعامل مع القلق", "أفضل الكتب لقراءتها",
    "كيف نُفعّل الساحة العامة؟", "مقترحات لورش الطبخ", "كيف نستفيد من الخريطة التفاعلية؟",
    "نصائح للأب الجديد", "كيف نحافظ على التراث؟", "مقترحات لليوم الرياضي",
    "كيف نُنشّط المجموعات؟", "أفكار لتعزيز روح الجماعة"
  ];
  for (let i = 0; i < 100; i++) {
    const user = pick(users);
    const disc = await db.discussion.create({
      data: {
        title: discussionTopics[i] || `نقاش رقم ${i + 1}`,
        content: `السلام عليكم، أحببت أن أفتح هذا النقاش معكم حول ${discussionTopics[i] || `موضوع ${i + 1}`}. ما رأيكم؟ كيف نتعاون؟`,
        authorId: user.id, category: pick(["general", "question", "suggestion", "announcement"]),
        views: Math.floor(Math.random() * 200), createdAt: randomDate(60), updatedAt: new Date(),
      }
    });
    // 3 ردود لكل نقاش
    for (let j = 0; j < 3; j++) {
      await db.discussionReply.create({
        data: {
          discussionId: disc.id, authorId: pick(users).id,
          content: pick(["شكراً على هذا الطرح الممتاز!", "أوافقك الرأي تماماً، فالتعاون أساس نجاحنا.", "اقتراح رائع، لنبدأ التنفيذ قريباً.", "مشاركة قيّمة، جزاك الله خيراً.", "نحتاج المزيد من التفاصيل لنبدأ.", "فكرة ممتازة، أنا معك في التنفيذ."]),
          likes: Math.floor(Math.random() * 10), createdAt: randomDate(30),
        }
      });
    }
  }
  console.log("✓ 100 نقاش + 300 رد أُنشئت");

  // ─────────── 4. 50 مبادرة + 100 تصويت ───────────
  console.log("\n━━━ 4. مبادرات (50 جديدة) ━━━");
  const initTitles = [
    "تنظيف وتجميل ساحة الحي", "حملة تبرع بالدم الشهرية", "ورشة محو الأمية للكبار",
    "إنشاء مكتبة صغيرة في الدار", "حملة تشجير شوارع الحي", "دعم الطلاب المتعثرين دراسياً",
    "ورشة تكوينية للخياطة", "إنشاء تعاونية للطرز", "حملة توعية صحية",
    "تنظيم يوم مفتوح للحي", "إنشاء مجموعة رياضية للشباب", "ورشة تصليح الأجهزة",
    "حملة مكافحة التدخين", "إنشاء حضانة مجتمعية", "ورشة طبخ للأمهات",
    "دعم الأسر المعوزة بمواد غذائية", "إنشاء ملعب صغير للأطفال", "ورشة موسيقى وترفيه",
    "حملة نظافة المساجد", "تنظيم مسابقة قرآنية", "ورشة حرف يدوية للأطفال",
    "إنشاء صندوق قرض حسن", "حملة توعية مرورية", "ورشة تصميم جرافيك للشباب",
    "دعم المرضى بزيارات منزلية", "إنشاء مجموعة للمشي الجماعي", "ورشة بستنة وتشجير",
    "حملة تبرع بالكتب", "إنشاء مجموعة نسائية للحرف", "ورشة إلكترونيات للأطفال",
    "حملة توعية عن المخدرات", "إنشاء دار للقوارير", "ورشة نسخ على القماش",
    "دعم الأرامل والمطلقات", "إنشاء فريق كرة قدم", "ورشة نجارة مبسطة",
    "حملة فحوصات طبية مجانية", "إنشاء مخيم صيفي للأطفال", "ورشة تلوين ودهان",
    "دعم ذوي الاحتياجات الخاصة", "إنشاء مجموعة للتصوير", "ورشة طباعة ثلاثية الأبعاد",
    "حملة توعية عن التغذية", "إنشاء ناد للقراءة", "ورشة برمجة للأطفال",
    "دعم المسنين بالزيارات", "إنشاء فرقة موسيقية", "ورشة صناعة الصابون الطبيعي",
    "حملة تنظيف المقابر", "إنشاء مكتب للاستشارات الأسرية"
  ];
  for (let i = 0; i < 50; i++) {
    const user = pick(users);
    const init = await db.initiative.create({
      data: {
        title: initTitles[i] || `مبادرة ${i + 1}`,
        description: `${initTitles[i] || `مبادرة ${i + 1}`} — مبادرة مجتمعية تضامنية لخدمة حي سيدي يوسف بن علي. نحتاج دعمكم ومشاركتكم.`,
        category: pick(["EDUCATION", "HEALTH", "ENVIRONMENT", "CULTURE", "SOCIAL", "INFRASTRUCTURE"]),
        status: pick(["proposed", "under_review", "approved", "in_progress"]),
        proposerId: user.id, districtId: district.id,
        votes: Math.floor(Math.random() * 50), createdAt: randomDate(60),
      }
    });
    // 2 تصويت لكل مبادرة
    for (let j = 0; j < 2; j++) {
      const voter = pick(users);
      try {
        await db.initiativeVote.create({ data: { initiativeId: init.id, userId: voter.id } });
      } catch { /* duplicate vote — skip */ }
    }
  }
  console.log("✓ 50 مبادرة + 100 تصويت أُنشئت");

  // ─────────── 5. 30 نشاط Live Feed ───────────
  console.log("\n━━━ 5. UserActivity (30 نشاط) ━━━");
  const activityTypes = ["LOGIN", "CONTRIBUTION", "FUND_REQUEST", "EVENT_REGISTER", "GROUP_JOIN", "BADGE_EARNED", "STREAK_MILESTONE"];
  for (let i = 0; i < 30; i++) {
    const user = pick(users);
    const type = pick(activityTypes);
    await db.userActivity.create({
      data: {
        userId: user.id, type, description: `${user.fullName} — ${type === "CONTRIBUTION" ? "ساهم بـ" + pick(amounts) + " درهم" : type === "EVENT_REGISTER" ? "سجّل في فعالية" : type === "LOGIN" ? "سجّل الدخول" : "أنجز نشاطاً"}`,
        isPublic: true, createdAt: randomDate(1),
      }
    });
  }
  console.log("✓ 30 نشاط أُنشئت");

  // ─────────── 6. 50 رسالة بين الأعضاء ───────────
  console.log("\n━━━ 6. رسائل (50) ━━━");
  for (let i = 0; i < 50; i++) {
    const sender = pick(users);
    let receiver = pick(users);
    while (receiver.id === sender.id) receiver = pick(users);
    await db.directMessage.create({
      data: {
        senderId: sender.id, receiverId: receiver.id,
        content: pick(["السلام عليكم، كيف حالك؟", "شكراً على مساهمتك الكريمة!", "متى الاجتماع القادم؟", "هل تحضر الفعالية غداً؟", "بارك الله فيك على هذا العمل.", "أحتاج مساعدتك في موضوع.", "هل انضممت للمجموعة الجديدة؟", "شكراً على دعوتك لي."]),
        readAt: Math.random() > 0.5 ? randomDate(7) : null, createdAt: randomDate(14),
      }
    });
  }
  console.log("✓ 50 رسالة أُنشئت");

  // ─────────── النتيجة النهائية ───────────
  console.log("\n━━━ النتيجة النهائية ━━━");
  const counts = {
    users: await db.user.count(),
    families: await db.family.count(),
    contributions: await db.contribution.count(),
    fundRequests: await db.fundRequest.count(),
    events: await db.event.count(),
    groups: await db.group.count(),
    discussions: await db.discussion.count(),
    discussionReplies: await db.discussionReply.count(),
    initiatives: await db.initiative.count(),
    initiativeVotes: await db.initiativeVote.count(),
    userActivities: await db.userActivity.count(),
    directMessages: await db.directMessage.count(),
    blogPosts: await db.blogPost.count(),
  };
  console.log(JSON.stringify(counts, null, 2));
  await db.$disconnect();
}

main().catch(console.error);
