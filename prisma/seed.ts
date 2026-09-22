// ===================================================================
//  سيدي يوسف بن علي العاصمة — منصة المعروف الرقمي
//  Prisma Seed — بيانات مغربية واقعية (مغرب/Marrakech)
//  Run with: bun run db:seed
// ===================================================================

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

// -------------------------------------------------------------------
//  Helpers
// -------------------------------------------------------------------
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickN = <T,>(arr: T[], n: number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
};
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) => Math.random() * (max - min) + min;
const pad = (n: number, len = 4) => String(n).padStart(len, "0");
const randomPhone = () => `06${pad(randInt(0, 99999999), 8)}`;
const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const hoursAfter = (date: Date, hours: number) => new Date(date.getTime() + hours * 60 * 60 * 1000);
const uuid = () => randomUUID();

// -------------------------------------------------------------------
//  Constants — Moroccan names, family names, professions
// -------------------------------------------------------------------
const FAMILY_NAMES = [
  "بنشقرون", "الصقلي", "الحمداوي", "بدر", "الزروالي", "بلمهدي", "الشرقاوي", "بلحاج",
  "العمراني", "بنجلون", "التازي", "الفاسي", "المراكشي", "السوسي", "الناصري",
  "الغمري", "التنملالي", "بنيس", "السطي", "الحراق", "بن عيسى", "ولد لحسن",
  "الرامي", "العلوي", "البلدي", "الزيات", "بنصالح", "الحداد", "الخياطي", "النجار",
  "الفقي", "البركة", "الصنهاجي", "المرابط", "الزهراء", "ابن سليمان", "اليوسفي",
  "الصبيحي", "بلقاس", "بنحمو", "الشيباني", "العروسي", "الوافي", "بنزكري",
  "الدكالي", "الراضي", "العمراني-الصغير", "بنعمر", "الحيمري", "الزكري",
];

const MALE_NAMES = [
  "محمد", "أحمد", "عبد الله", "يوسف", "إبراهيم", "علي", "حسن", "سعيد",
  "رضا", "خالد", "كريم", "نبيل", "هشام", "زكرياء", "أنس", "حمزة",
  "عبد الرحمان", "بلال", "ياسين", "مهدي", "عبد العزيز", "مروان", "آدم",
  "جمال", "فؤاد",
];
const FEMALE_NAMES = [
  "فاطمة", "خديجة", "عائشة", "زينب", "مريم", "سعاد", "حنان", "نادية",
  "لطيفة", "سميرة", "خالدة", "نوال", "ليلى", "هند", "صابرين", "إكرام",
  "وفاء", "نجاة", "رجاء", "الهام", "زليخة", "سلمى", "أسماء", "رشيدة",
  "الحاجة",
];

const PROFESSIONS = [
  "معلم", "طبيب", "مهندس", "نجار", "كهربائي", "خياط", "تاجر", "موظف",
  "حرفي", "حدّاد", "بستاني", "سائق", "ربة بيت", "طالبة", "طالب", "متقاعد",
];

const ECONOMIC_STATUSES = ["ضعيف", "متوسط", "جيد"];

const MONTHS = [
  { month: "2024-07", year: 2024 },
  { month: "2024-08", year: 2024 },
  { month: "2024-09", year: 2024 },
  { month: "2024-10", year: 2024 },
  { month: "2024-11", year: 2024 },
  { month: "2024-12", year: 2024 },
];

// Weighted amounts (smaller more frequent)
const CONTRIBUTION_AMOUNTS = [20, 20, 20, 50, 50, 50, 100, 100, 200];

// -------------------------------------------------------------------
// 1. CLEAR ALL DATA (in safe FK order)
// -------------------------------------------------------------------
async function clearAll() {
  // For PostgreSQL: disable triggers temporarily (equivalent to SQLite PRAGMA foreign_keys=OFF)
  try { await db.$executeRawUnsafe("SET session_replication_role = 'replica'"); } catch {}
  await db.$transaction([
    db.fundRequestApproval.deleteMany({}),
    db.fundRequest.deleteMany({}),
    db.contribution.deleteMany({}),
    db.eventRegistration.deleteMany({}),
    db.event.deleteMany({}),
    db.notification.deleteMany({}),
    db.groupMember.deleteMany({}),
    db.group.deleteMany({}),
    db.complaint.deleteMany({}),
    db.ad.deleteMany({}),
    db.auditLog.deleteMany({}),
    db.setting.deleteMany({}),
    db.user.deleteMany({}),
    db.family.deleteMany({}),
    db.district.deleteMany({}),
  ]);
  // Implicit m-n join table for GroupLeader relation (PostgreSQL needs double-quoted table name)
  try { await db.$executeRawUnsafe('DELETE FROM "_GroupLeader"'); } catch {}
  try { await db.$executeRawUnsafe("SET session_replication_role = 'origin'"); } catch {}
  console.log("✓ تم مسح كل البيانات السابقة");
}

// -------------------------------------------------------------------
// 2. CREATE DISTRICT
// -------------------------------------------------------------------
async function createDistrict() {
  const district = await db.district.create({
    data: {
      name: "سيدي يوسف بن علي",
      slug: "sidi-youssef-ben-ali",
      city: "مراكش",
      region: "مراكش آسفي",
      description:
        "حي سيدي يوسف بن علي الصنهاجي بمراكش، حي عريق يحتضن أسراً مغربية أصيلة تجمعها رابطة المعروف.",
      isDefault: true,
      isActive: true,
      boundarySvg:
        "M 10 10 L 90 10 L 110 50 L 100 90 L 60 110 L 20 95 L 0 50 Z",
    },
  });
  console.log("✓ تم إنشاء الحي: سيدي يوسف بن علي");
  return district;
}

// -------------------------------------------------------------------
// 3. CREATE FAMILIES
// -------------------------------------------------------------------
async function createFamilies(districtId: string) {
  const families = [];
  for (const name of FAMILY_NAMES) {
    const fam = await db.family.create({
      data: {
        familyName: name,
        districtId,
        economicStatus: pick(ECONOMIC_STATUSES),
        memberCount: 0,
        isActive: true,
        address: `زنقة ${name}، حي سيدي يوسف بن علي، مراكش`,
      },
    });
    families.push(fam);
  }
  console.log(`✓ تم إنشاء ${families.length} أسرة`);
  return families;
}

// -------------------------------------------------------------------
// 4. CREATE USERS (200 total, distributed across families)
// -------------------------------------------------------------------
async function createUsers(
  districtId: string,
  families: { id: string; familyName: string }[]
) {
  // Precompute one bcrypt hash for "Demo@1234" — salts are embedded
  // in the hash so it works correctly for bcrypt.compare on all users.
  const passwordHash = await bcrypt.hash("Demo@1234", 10);

  const users: any[] = [];
  let userCounter = 0;

  // Distribute exactly 200 users across 50 families — 3 to 7 per family, avg 4.
  // Start everyone at 3 (=150 total), then add 1 by 1 to random families up to 7
  // until we reach 200 (need to distribute 50 more additions).
  const targets: number[] = new Array(families.length).fill(3);
  let toDistribute = 200 - families.length * 3; // = 50
  let safety = 0;
  while (toDistribute > 0 && safety < 10000) {
    const idx = randInt(0, families.length - 1);
    if (targets[idx] < 7) {
      targets[idx]++;
      toDistribute--;
    }
    safety++;
  }

  // Now create users per family
  for (let fi = 0; fi < families.length; fi++) {
    const fam = families[fi];
    const count = targets[fi];
    // First user is family head (male by convention)
    for (let u = 0; u < count; u++) {
      userCounter++;
      const isHead = u === 0;
      const isMale = isHead ? true : Math.random() > 0.5;
      const firstName = isMale ? pick(MALE_NAMES) : pick(FEMALE_NAMES);
      const email =
        userCounter === 1
          ? "admin@syba-community.ma"
          : `user${userCounter}@syba-community.ma`;
      const phone = randomPhone();
      const fullName = `${firstName} ${fam.familyName}`;
      const profession = pick(PROFESSIONS);

      // Role assignment (handled below for special users)
      let role: any = "MEMBER";
      let status: any = "ACTIVE";
      let emailVerified: Date | null = new Date();
      let points = randInt(0, 200);
      let level = 1 + Math.floor(points / 50);

      // A few pending users (demo of new registrations)
      if (!isHead && u > 1 && Math.random() < 0.05) {
        status = "PENDING";
        emailVerified = null;
        points = 0;
        level = 1;
      }

      users.push({
        data: {
          firstName,
          lastName: fam.familyName,
          fullName,
          email,
          phone,
          passwordHash,
          districtId,
          familyId: fam.id,
          isFamilyHead: isHead,
          role,
          status,
          emailVerified,
          profession,
          gender: isMale ? "ذكر" : "أنثى",
          points,
          level,
          skills: profession,
          interests: pick(["تعليم", "صحة", "تراث", "رياضة", "زراعة", "حرف"]),
          birthDate: daysFromNow(-randInt(20 * 365, 70 * 365)),
        },
        _familyId: fam.id,
        _isHead: isHead,
        _index: userCounter,
      });
    }
  }

  // Now persist users, capture IDs
  const persistedUsers: any[] = [];
  for (const u of users) {
    const created = await db.user.create({ data: u.data });
    persistedUsers.push({ ...created, _familyId: u._familyId, _isHead: u._isHead });
  }

  // Assign family heads (update Family.headOfFamilyId)
  for (const fam of families) {
    const head = persistedUsers.find((u) => u._familyId === fam.id && u._isHead);
    if (head) {
      await db.family.update({
        where: { id: fam.id },
        data: { headOfFamilyId: head.id, memberCount: targets[families.indexOf(fam)] },
      });
    }
  }

  // Assign special roles
  // 1 SUPER_ADMIN — first user (already created)
  const admin = persistedUsers[0];
  await db.user.update({
    where: { id: admin.id },
    data: {
      firstName: "السوبر",
      lastName: "المراكشي",
      fullName: "السوبر المراكشي",
      email: "admin@syba-community.ma",
      role: "SUPER_ADMIN",
      profession: "مدير المنصة",
    },
  });
  admin.firstName = "السوبر";
  admin.lastName = "المراكشي";
  admin.fullName = "السوبر المراكشي";
  admin.email = "admin@syba-community.ma";
  admin.role = "SUPER_ADMIN";

  // 1 TREASURER (2nd user)
  const treasurer = persistedUsers[1];
  await db.user.update({
    where: { id: treasurer.id },
    data: { role: "TREASURER", profession: "محاسب", points: 150, level: 4 },
  });
  treasurer.role = "TREASURER";

  // 1 ADS_MANAGER (3rd user)
  const adsManager = persistedUsers[2];
  await db.user.update({
    where: { id: adsManager.id },
    data: { role: "ADS_MANAGER", profession: "تسويق" },
  });
  adsManager.role = "ADS_MANAGER";

  // 1 DISTRICT_MOD (4th user)
  const districtMod = persistedUsers[3];
  await db.user.update({
    where: { id: districtMod.id },
    data: { role: "DISTRICT_MOD", profession: "مشرف" },
  });
  districtMod.role = "DISTRICT_MOD";

  // 5 ETHICS_COMMITTEE (users 5-9)
  const ethicsMembers: any[] = [];
  for (let i = 4; i < 9; i++) {
    const u = persistedUsers[i];
    await db.user.update({
      where: { id: u.id },
      data: { role: "ETHICS_COMMITTEE", profession: pick(["قاضي متقاعد", "إمام", "معلم متقاعد", "أستاذ", "موظف"]) },
    });
    ethicsMembers.push(u);
    u.role = "ETHICS_COMMITTEE";
  }

  // 3 GROUP_LEADER (users 10-12) — one per non-child group (mothers, fathers, youth)
  const groupLeaders: any[] = [];
  for (let i = 9; i < 12; i++) {
    const u = persistedUsers[i];
    await db.user.update({
      where: { id: u.id },
      data: { role: "GROUP_LEADER" },
    });
    groupLeaders.push(u);
    u.role = "GROUP_LEADER";
  }

  console.log(
    `✓ تم إنشاء ${persistedUsers.length} مستخدم (1 سوبر أدمن، 1 أمين صندوق، 5 لجنة نزاهة، 1 مشرف حي، 3 رؤساء مجموعات، 1 مسؤول إعلانات)`
  );

  return { users: persistedUsers, ethicsMembers, treasurer, groupLeaders, adsManager, districtMod, admin };
}

// -------------------------------------------------------------------
// 5. CREATE GROUPS (5 default groups)
// -------------------------------------------------------------------
async function createGroups(districtId: string) {
  const groupsData = [
    { name: "مجموعة الأمهات", slug: "mothers", category: "عائلي", description: "فضاء للأمهات لتنظيم مبادراتهن وتعاضدهن." },
    { name: "مجموعة الآباء", slug: "fathers", category: "عائلي", description: "ملتقى الآباء لتبادل الخبرات وحل مشاكل الحي." },
    { name: "مجموعة الشباب", slug: "youth", category: "تنمية", description: "شباب الحي الطامح للمساهمة في التنمية المجتمعية." },
    { name: "مجموعة الأطفال", slug: "children", category: "تعليم", description: "أنشطة تربوية وتعليمية لأطفال الحي." },
    { name: "مجموعة كبار السن", slug: "elders", category: "تراث", description: "حفظ ذاكرة الحي ونقل التراث للأجيال." },
  ];
  const groups: any[] = [];
  for (const g of groupsData) {
    const grp = await db.group.create({
      data: {
        name: g.name,
        slug: g.slug,
        description: g.description,
        districtId,
        category: g.category,
        isDefault: true,
        isActive: true,
      },
    });
    groups.push(grp);
  }
  console.log(`✓ تم إنشاء ${groups.length} مجموعة افتراضية`);
  return groups;
}

// -------------------------------------------------------------------
// 6. CREATE GROUP MEMBERS
// -------------------------------------------------------------------
async function createGroupMembers(groups: any[], users: any[], groupLeaders: any[]) {
  let total = 0;
  // Map groupLeaders to groups: index 0 -> mothers, 1 -> fathers, 2 -> youth
  const leaderGroupMap: Record<number, string> = { 0: "mothers", 1: "fathers", 2: "youth" };

  for (let gi = 0; gi < groups.length; gi++) {
    const grp = groups[gi];
    const targetCount = randInt(10, 30);

    // Pick the leader for this group
    let leaderUser: any = null;
    if (gi < 3) {
      // Match groupLeader by slug
      const slug = leaderGroupMap[gi];
      leaderUser = groupLeaders[gi];
    } else {
      // Elders and children groups: pick a random older MEMBER
      leaderUser = users[randInt(20, users.length - 1)];
    }

    // Add leader first
    await db.groupMember.create({
      data: {
        groupId: grp.id,
        userId: leaderUser.id,
        role: "leader",
        isApproved: true,
        joinedAt: daysFromNow(-randInt(30, 180)),
      },
    });
    total++;

    // Add regular members
    const candidates = users.filter((u) => u.id !== leaderUser.id);
    const selected = pickN(candidates, targetCount - 1);
    for (const m of selected) {
      try {
        await db.groupMember.create({
          data: {
            groupId: grp.id,
            userId: m.id,
            role: "member",
            isApproved: Math.random() > 0.05,
            joinedAt: daysFromNow(-randInt(7, 200)),
          },
        });
        total++;
      } catch (e) {
        // Skip duplicates (shouldn't happen since pickN is unique within a group)
      }
    }
  }
  console.log(`✓ تم إنشاء ${total} عضو في المجموعات`);
}

// -------------------------------------------------------------------
// 7. CREATE CONTRIBUTIONS (300 across 6 months)
// -------------------------------------------------------------------
async function createContributions(users: any[], families: any[]) {
  // Only users with familyId (all users in our seed have one)
  const candidates = users.filter((u) => u.familyId);
  let receiptCounter = 1;
  let total = 0;

  for (const m of MONTHS) {
    // 50 contributions per month × 6 months = 300
    for (let i = 0; i < 50; i++) {
      const user = pick(candidates);
      const amount = pick(CONTRIBUTION_AMOUNTS);
      const method =
        Math.random() < 0.7 ? "BANK_TRANSFER" : Math.random() < 0.7 ? "CASH" : "CMI";
      const statusRoll = Math.random();
      const status =
        statusRoll < 0.75 ? "CONFIRMED" : statusRoll < 0.9 ? "PENDING" : "REJECTED";

      const createdAt = new Date(
        Date.parse(`${m.month}-15T10:00:00`) + randInt(-10, 10) * 24 * 60 * 60 * 1000
      );
      const confirmedAt =
        status === "CONFIRMED" ? hoursAfter(createdAt, randInt(1, 12)) : null;

      await db.contribution.create({
        data: {
          userId: user.id,
          familyId: user.familyId,
          districtId: user.districtId,
          amount,
          month: m.month,
          year: m.year,
          method: method as any,
          status: status as any,
          receiptNumber: `RC-${m.year}-${pad(receiptCounter++)}`,
          digitalReceipt: uuid(),
          confirmedAt,
          note: status === "REJECTED" ? "إيصال غير واضح، يرجى إعادة الرفع." : null,
          createdAt,
          updatedAt: confirmedAt ?? createdAt,
        },
      });
      total++;
    }
  }
  console.log(`✓ تم إنشاء ${total} مساهمة مالية عبر 6 أشهر`);
}

// -------------------------------------------------------------------
// 8. CREATE FUND REQUESTS (40)
// -------------------------------------------------------------------
const FUND_TEMPLATES: {
  type: string;
  title: string;
  description: string;
  amountMin: number;
  amountMax: number;
}[] = [
  // MEDICAL (12)
  { type: "MEDICAL", title: "عملية جراحية لطفل", description: "يحتاج طفلنا البالغ 6 سنوات عملية جراحية عاجلة في العمود الفقري، والأسرة لا تستطيع تكاليف المستشفى الخاص.", amountMin: 800, amountMax: 5000 },
  { type: "MEDICAL", title: "علاج السرطان للأم", description: "تخضع الأم لعلاجات كيماوية في المستشفى الجامعي، ونحتاج مساعدة لتكاليف الأدوية المكملة.", amountMin: 800, amountMax: 5000 },
  { type: "MEDICAL", title: "أدوية الضغط للأب المسن", description: "الأب يعاني من ضغط الدم المرتفع ويحتاج أدوية شهرية لا يقدر على شرائها.", amountMin: 800, amountMax: 5000 },
  { type: "MEDICAL", title: "عملية قلب لرب الأسرة", description: "رب الأسرة يحتاج عملية قسطرة قلبية عاجلة بعد وعكة صحية مفاجئة.", amountMin: 800, amountMax: 5000 },
  { type: "MEDICAL", title: "علاج كسر الساق", description: "ابننا تعرض لحادث سير وعانى من كسر مضاعف في الساق يحتاج عملية عاجلة.", amountMin: 800, amountMax: 5000 },
  { type: "MEDICAL", title: "أشعة للكشف عن مرض", description: "نحتاج تصوير بالرنين المغناطيسي للتشخيص الدقيق لحالة صحية مزمنة.", amountMin: 800, amountMax: 5000 },
  { type: "MEDICAL", title: "تجهيزات طبية لكبير السن", description: "كبير السن في الأسرة يحتاج سرير طبي ومستلزمات للعناية المنزلية.", amountMin: 800, amountMax: 5000 },
  { type: "MEDICAL", title: "نقل مريض للمستشفى", description: "نحتاج نقل مريض من مراكش إلى الدار البيضاء لإجراء فحوصات متخصصة.", amountMin: 800, amountMax: 5000 },
  { type: "MEDICAL", title: "علاج أسنان للطفل", description: "طفل الأسرة يحتاج علاج أسنان معقد يتجاوز قدراتنا المالية.", amountMin: 800, amountMax: 5000 },
  { type: "MEDICAL", title: "تحاليل طبية عاجلة", description: "نحتاج تحاليل دم مخبرية متعددة لمتابعة حالة صحية مستعصية.", amountMin: 800, amountMax: 5000 },
  { type: "MEDICAL", title: "كرسي متحرك لمعاق", description: "ابننا المعاق يحتاج كرسي متحرك مناسب لحالته ليساعده على التنقل.", amountMin: 800, amountMax: 5000 },
  { type: "MEDICAL", title: "أدوية مزمنة للأم", description: "الأم تعاني من السكري والربو وتحتاج أدوية مستمرة لا نقدر على ثمنها.", amountMin: 800, amountMax: 5000 },
  // DEATH (6)
  { type: "DEATH", title: "جنازة الوالد", description: "انتقل إلى رحمة الله تعالى الوالد بعد مرض قصير، ونحتاج مساعدة لتكاليف الجنازة.", amountMin: 1500, amountMax: 3000 },
  { type: "DEATH", title: "تكاليف دفن الأم", description: "توفيت الأم فجأة ونحتاج المساعدة في تكاليف الكفن والدفن.", amountMin: 1500, amountMax: 3000 },
  { type: "DEATH", title: "كفن وأكفان لفقيد", description: "نحتاج مساعدة لشراء الكفن وأكفان لفقيد الأسرة.", amountMin: 1500, amountMax: 3000 },
  { type: "DEATH", title: "نقل جثمان من الخارج", description: "توفي ابننا غريباً ونحتاج نقل جثمانه من الخارج إلى مراكش لدفنه.", amountMin: 1500, amountMax: 3000 },
  { type: "DEATH", title: "مأتم العائلة", description: "نحتاج مساعدة لتنظيم مأتم العائلة على روح الفقيد وفقاً للعادات المغربية.", amountMin: 1500, amountMax: 3000 },
  { type: "DEATH", title: "جنازة الجد المسن", description: "توفي الجد المسن ونحتاج مساعدة لتكاليف الجنازة العاجلة.", amountMin: 1500, amountMax: 3000 },
  // WEDDING (5)
  { type: "WEDDING", title: "مساعدة عرس أسرة معوزة", description: "ابنتنا في سن الزواج ونحتاج مساعدة لتهيئة العرس وفق العادات المغربية.", amountMin: 2000, amountMax: 4000 },
  { type: "WEDDING", title: "تجهيزات عرس ابنة يتيمة", description: "ابنة يتيمة في الحي تستعد للزواج ونريد مساعدتها ببعض التجهيزات.", amountMin: 2000, amountMax: 4000 },
  { type: "WEDDING", title: "فرش منزل للمتزوج حديثاً", description: "شاب من الحي تزوج حديثاً ويحتاج مساعدة لفرش منزله البسيط.", amountMin: 2000, amountMax: 4000 },
  { type: "WEDDING", title: "تكاليف حناء العروس", description: "نحتاج مساعدة لتغطية تكاليف حناء العروس وفق التقاليد المغربية.", amountMin: 2000, amountMax: 4000 },
  { type: "WEDDING", title: "وليمة العرس لأبن الحي", description: "ابن الحي الفقير يتزوج ونريد إعانته بوليمة بسيطة لأهله وضيوفه.", amountMin: 2000, amountMax: 4000 },
  // EDUCATION (8)
  { type: "EDUCATION", title: "رسوم دراسية للابنة", description: "ابنتنا قبلت في الجامعة ونحتاج مساعدة لرسوم التسجيل.", amountMin: 300, amountMax: 1000 },
  { type: "EDUCATION", title: "حوافظ وكتب مدرسية", description: "نحتاج مساعدة لشراء الحوافظ والكتب المدرسية لأبنائنا الثلاثة.", amountMin: 300, amountMax: 1000 },
  { type: "EDUCATION", title: "كراء السكن الجامعي", description: "ابننا يدرس في مدينة أخرى ونحتاج مساعدة لكراء غرفة جامعية بسيطة.", amountMin: 300, amountMax: 1000 },
  { type: "EDUCATION", title: "تجهيزات الدخول المدرسي", description: "نحتاج مساعدة لتجهيزات الدخول المدرسي لأبنائنا الخمسة.", amountMin: 300, amountMax: 1000 },
  { type: "EDUCATION", title: "حقيبة مدرسية لطالب متفوق", description: "ابننا المتفوق يحتاج حقيبة مدرسية ولوازم للسنة الدراسية الجديدة.", amountMin: 300, amountMax: 1000 },
  { type: "EDUCATION", title: "دروس الدعم لطالب الباكالوريا", description: "ابننا يعدّ للباكالوريا ويحتاج دروس دعم إضافية لاجتياز الامتحان.", amountMin: 300, amountMax: 1000 },
  { type: "EDUCATION", title: "مواد مدرسية للقسم النهائي", description: "نحتاج مساعدة لشراء المواد المدرسية للقسم النهائي التأهيلي.", amountMin: 300, amountMax: 1000 },
  { type: "EDUCATION", title: "كراء دار للطالب المغترب", description: "ابننا طالب مغترب في الدار البيضاء ونحتاج مساعدة لكراء مسكنه.", amountMin: 300, amountMax: 1000 },
  // EMERGENCY (7)
  { type: "EMERGENCY", title: "حريق المنزل", description: "اشتعل النار في جزء من منزلنا وأتلف أثاثنا وأصبحنا بلا مأوى.", amountMin: 500, amountMax: 3000 },
  { type: "EMERGENCY", title: "تصدع جدران المنزل", description: "تصدعت جدران منزلنا بعد أمطار غزيرة ونخشى انهيارها على أطفالنا.", amountMin: 500, amountMax: 3000 },
  { type: "EMERGENCY", title: "فيضان قنوات المياه", description: "تسببت فيضانات قنوات المياه في إتلاف أثاث المنزل واحتياجنا لإصلاح عاجل.", amountMin: 500, amountMax: 3000 },
  { type: "EMERGENCY", title: "تسرب سقف الدار", description: "سقف دارنا يتسرب منه الماء عند المطر ونحتاج ترميماً عاجلاً قبل الشتاء.", amountMin: 500, amountMax: 3000 },
  { type: "EMERGENCY", title: "انقطاع كهرباء وحاجة لمولد", description: "انقطعت الكهرباء عن منزلنا بسبب عطل ونحتاج مولداً صغيراً للطوارئ.", amountMin: 500, amountMax: 3000 },
  { type: "EMERGENCY", title: "إصلاح بئر ماء أسري", description: "بئر ماء الأسرة تعطل ونحتاج مساعدة لإصلاحه قبل نفاد المخزون.", amountMin: 500, amountMax: 3000 },
  { type: "EMERGENCY", title: "إنقاذ أسرة من تشرد", description: "أسرة من الحي على وشك التشرد بعد طردها من دار الكراء ونريد إعانتها.", amountMin: 500, amountMax: 3000 },
  // MICRO_PROJECT (2)
  { type: "MICRO_PROJECT", title: "مشروع خياطة منزلي", description: "أم الأسرة ترغب في إطلاق مشروع خياطة منزلي صغير لإعالة أسرتها، ونحتاج ماكينة خياطة ومستلزمات.", amountMin: 3000, amountMax: 8000 },
  { type: "MICRO_PROJECT", title: "مشروع تربية الدواجن", description: "نريد إطلاق مشروع تربية دواجن صغير بمنزلنا لتأمين دخل قار للأسرة.", amountMin: 3000, amountMax: 8000 },
];

const REQUEST_STATUSES = [
  // 10 SUBMITTED, 6 UNDER_REVIEW, 10 APPROVED, 5 REJECTED, 6 DISBURSED, 3 COMPLETED
  ...Array(10).fill("SUBMITTED"),
  ...Array(6).fill("UNDER_REVIEW"),
  ...Array(10).fill("APPROVED"),
  ...Array(5).fill("REJECTED"),
  ...Array(6).fill("DISBURSED"),
  ...Array(3).fill("COMPLETED"),
];

async function createFundRequests(
  users: any[],
  treasurer: any,
  ethicsMembers: any[]
) {
  const candidates = users.filter((u) => u.familyId);
  let totalRequests = 0;
  let totalApprovals = 0;

  for (let i = 0; i < 40; i++) {
    const template = FUND_TEMPLATES[i];
    const user = pick(candidates);
    const amount = randFloat(template.amountMin, template.amountMax);
    const status = REQUEST_STATUSES[i];
    const requiresEthics = amount > 1000;
    const createdAt = daysFromNow(-randInt(1, 120));

    // Reviewed/approved/disbursed data
    let amountApproved: number | null = null;
    let reviewedById: string | null = null;
    let reviewedAt: Date | null = null;
    let disbursedAt: Date | null = null;
    let disbursedById: string | null = null;
    let amountDisbursed: number | null = null;
    let disbursementMethod: string | null = null;
    let completedAt: Date | null = null;
    let reviewedNote: string | null = null;

    if (["UNDER_REVIEW", "APPROVED", "REJECTED", "DISBURSED", "COMPLETED"].includes(status)) {
      reviewedAt = hoursAfter(createdAt, randInt(2, 72));
      reviewedById = treasurer.id;
      reviewedNote =
        status === "REJECTED"
          ? "الطلب غير مكتمل، يرجى إرفاق الوثائق الطبية اللازمة."
          : "تمت المراجعة الأولية، الطلب مؤهل للمتابعة.";
    }
    if (["APPROVED", "DISBURSED", "COMPLETED"].includes(status)) {
      amountApproved = Math.round(amount * 0.9 * 100) / 100;
    }
    if (["DISBURSED", "COMPLETED"].includes(status)) {
      disbursedAt = hoursAfter(reviewedAt!, randInt(24, 72));
      disbursedById = treasurer.id;
      amountDisbursed = amountApproved;
      disbursementMethod = Math.random() < 0.6 ? "BANK_TRANSFER" : "CASH";
    }
    if (status === "COMPLETED") {
      completedAt = hoursAfter(disbursedAt!, randInt(24 * 7, 24 * 30));
    }

    const fundRequest = await db.fundRequest.create({
      data: {
        userId: user.id,
        familyId: user.familyId,
        districtId: user.districtId,
        type: template.type as any,
        amountRequested: Math.round(amount * 100) / 100,
        amountApproved,
        amountDisbursed,
        title: template.title,
        description: template.description,
        attachments: null,
        location:
          template.type === "MEDICAL"
            ? "مستشفى ابن طفيل بمراكش"
            : template.type === "EDUCATION"
            ? "ثانوية سيدي يوسف بن علي"
            : null,
        status: status as any,
        requiresEthics,
        reviewedById,
        reviewedAt,
        reviewedNote,
        disbursedAt,
        disbursedById,
        disbursementMethod,
        finalReceipt:
          status === "DISBURSED" || status === "COMPLETED" ? uuid() : null,
        completedAt,
        anonymousCode: `SY-${pad(i + 1, 3)}`,
        createdAt,
        updatedAt: completedAt ?? disbursedAt ?? reviewedAt ?? createdAt,
      },
    });
    totalRequests++;

    // Create ethics approvals for requests > 1000 (any status)
    if (requiresEthics) {
      const numApprovals = randInt(3, 5);
      const approvers = pickN(ethicsMembers, Math.min(numApprovals, ethicsMembers.length));
      for (const approver of approvers) {
        // Decision mix: majority APPROVE, some REJECT
        const decisionRoll = Math.random();
        const decision =
          decisionRoll < 0.7 ? "APPROVE" : decisionRoll < 0.9 ? "REJECT" : "ABSTAIN";
        try {
          await db.fundRequestApproval.create({
            data: {
              requestId: fundRequest.id,
              approverId: approver.id,
              decision: decision as any,
              note:
                decision === "APPROVE"
                  ? "الطلب مستوفي الشروط ويستحق المساندة."
                  : decision === "REJECT"
                  ? "الوثائق غير كاملة أو المبلغ يفوق قدرات الصندوق الحالية."
                  : "أمتنع عن التصويت لعدم توفر معلومات كافية.",
              decidedAt: hoursAfter(createdAt, randInt(3, 48)),
            },
          });
          totalApprovals++;
        } catch (e) {
          // Skip duplicates
        }
      }
    }
  }
  console.log(
    `✓ تم إنشاء ${totalRequests} طلب مساعدة و${totalApprovals} موافقة لجنة نزاهة`
  );
}

// -------------------------------------------------------------------
// 9. CREATE EVENTS (8)
// -------------------------------------------------------------------
const EVENTS_DATA = [
  { title: "ملتقى الحي الشهري", type: "MONTHLY", status: "PUBLISHED", daysOffset: 14, location: "دار الحي", maxAttendees: 80, desc: "ملتقى شهري لمناقشة شؤون الحي وتبادل الأخبار بين الأسر." },
  { title: "ملتقى الحي الشهري - نسخة الشتاء", type: "MONTHLY", status: "PUBLISHED", daysOffset: 45, location: "دار الحي", maxAttendees: 80, desc: "ملتقى الحي الشهري لفصل الشتاء لتنظيم مبادرات الدعم الموسمية." },
  { title: "إفطار رمضاني جماعي", type: "SEASONAL", status: "PUBLISHED", daysOffset: 30, location: "مسجد سيدي يوسف", maxAttendees: 200, desc: "إفطار جماعي في رمضان يجمع أسر الحي على مائدة الرحمة." },
  { title: "عرس جماعي لـ 3 أسر", type: "SPECIAL", status: "ONGOING", daysOffset: 0, location: "ساحة الحي", maxAttendees: 150, desc: "عرس جماعي لثلاث أسر من الحي بمساعدة من صندوق المعروف." },
  { title: "قافلة طبية مجانية", type: "SOLIDARITY", status: "COMPLETED", daysOffset: -30, location: "المركز الثقافي", maxAttendees: 100, desc: "قافلة طبية تضامنية لفائدة ساكنة الحي بشراكة مع أطباء متطوعين." },
  { title: "حملة التبرع بالدم", type: "SOLIDARITY", status: "COMPLETED", daysOffset: -60, location: "مستشفى ابن طفيل", maxAttendees: 60, desc: "حملة للتبرع بالدم بالشراكة مع المركز الجهوي لتحاقن الدم." },
  { title: "أمسية شعرية في ذاكرة الحي", type: "CULTURAL", status: "COMPLETED", daysOffset: -45, location: "دار الحي", maxAttendees: 50, desc: "أمسية شعرية ملحونية تستحضر ذاكرة الحي وتراثه العريق." },
  { title: "معرض حرف الزليج", type: "CULTURAL", status: "CANCELLED", daysOffset: 20, location: "ساحة الحي", maxAttendees: 120, desc: "معرض لعرض حرف الزليج التقليدي المغربي بأيدي أبناء الحي." },
];

async function createEvents(districtId: string, groups: any[], users: any[]) {
  let totalEvents = 0;
  let totalRegs = 0;
  let regCounter = 1;

  for (let i = 0; i < EVENTS_DATA.length; i++) {
    const e = EVENTS_DATA[i];
    const startDate = daysFromNow(e.daysOffset);
    const slug = `event-${i + 1}-${e.type.toLowerCase()}`;
    const isPastOrOngoing = ["COMPLETED", "ONGOING"].includes(e.status);

    const event = await db.event.create({
      data: {
        title: e.title,
        slug,
        description: e.desc,
        districtId,
        type: e.type as any,
        status: e.status as any,
        startDate,
        endDate: hoursAfter(startDate, 3),
        location: e.location,
        maxAttendees: e.maxAttendees,
        isRegistrationOpen: e.status === "PUBLISHED",
        requiresApproval: false,
        groupId: i < 3 ? groups[i % groups.length].id : null,
        organizerId: users[i % users.length].id,
        coverImage: null,
        galleryImages: null,
        locationMapSvg: null,
        createdAt: daysFromNow(e.daysOffset - 30),
        updatedAt: new Date(),
      },
    });
    totalEvents++;

    // Registrations for PUBLISHED/COMPLETED/ONGOING events
    if (["PUBLISHED", "COMPLETED", "ONGOING"].includes(e.status)) {
      const numRegs = randInt(5, Math.min(30, e.maxAttendees));
      const registrants = pickN(users, numRegs);
      for (const r of registrants) {
        const regStatus =
          isPastOrOngoing && Math.random() < 0.8
            ? "ATTENDED"
            : Math.random() < 0.9
            ? "REGISTERED"
            : "CANCELLED";
        try {
          await db.eventRegistration.create({
            data: {
              eventId: event.id,
              userId: r.id,
              qrCode: uuid(),
              ticketCode: `EV-2024-${pad(regCounter++, 3)}`,
              status: regStatus as any,
              registeredAt: daysFromNow(e.daysOffset - 20),
              attendedAt:
                regStatus === "ATTENDED"
                  ? hoursAfter(startDate, randInt(0, 2))
                  : null,
              notes: null,
            },
          });
          totalRegs++;
        } catch (e) {
          // Skip duplicates
        }
      }
    }
  }
  console.log(`✓ تم إنشاء ${totalEvents} فعالية و${totalRegs} تسجيل حضور`);
}

// -------------------------------------------------------------------
// 10. CREATE ADS (7)
// -------------------------------------------------------------------
const ADS_DATA = [
  { title: "وجبات مغربية أصيلة", advertiser: "مطعم الدار", package: "BRONZE", placement: "sidebar", status: "ACTIVE", amount: 300, daysStart: -10, daysEnd: 20 },
  { title: "أدويتك بثقة وأمان", advertiser: "صيدلية السلام", package: "SILVER", placement: "in-feed", status: "ACTIVE", amount: 600, daysStart: -15, daysEnd: 25 },
  { title: "كتب مدرسية بكل اللغات", advertiser: "مكتبة الأطلس", package: "GOLD", placement: "sidebar", status: "ACTIVE", amount: 1200, daysStart: -5, daysEnd: 35 },
  { title: "زليج مراكشي الأصيل", advertiser: "متجر الزليج", package: "GOLD", placement: "header", status: "ACTIVE", amount: 1200, daysStart: -7, daysEnd: 28 },
  { title: "نجارة حديثة وأنيقة", advertiser: "ورشة النجارة الحديثة", package: "PLATINUM", placement: "in-feed", status: "PENDING", amount: 3000, daysStart: -2, daysEnd: 60 },
  { title: "قهوة مغربية محمية", advertiser: "مقهى مراكش", package: "SPONSOR", placement: "header", status: "ACTIVE", amount: 10000, daysStart: -20, daysEnd: 40 },
  { title: "أقمشة مغربية تقليدية", advertiser: "محل الأقمشة المغربية", package: "GOLD", placement: "footer", status: "EXPIRED", amount: 1200, daysStart: -50, daysEnd: -5 },
];

async function createAds(districtId: string, adsManager: any) {
  let total = 0;
  for (const a of ADS_DATA) {
    await db.ad.create({
      data: {
        title: a.title,
        advertiserName: a.advertiser,
        advertiserEmail: `contact@${a.advertiser.replace(/\s/g, "").toLowerCase()}.ma`,
        advertiserPhone: randomPhone(),
        districtId,
        package: a.package as any,
        imageUrl: null,
        targetUrl: `https://${a.advertiser.replace(/\s/g, "").toLowerCase()}.ma`,
        placement: a.placement,
        startDate: daysFromNow(a.daysStart),
        endDate: daysFromNow(a.daysEnd),
        status: a.status as any,
        views: a.status === "ACTIVE" ? randInt(50, 500) : randInt(0, 30),
        clicks: a.status === "ACTIVE" ? randInt(5, 50) : randInt(0, 5),
        amountPaid: a.amount,
        managerId: adsManager.id,
      },
    });
    total++;
  }
  console.log(`✓ تم إنشاء ${total} إعلان ورعاية`);
}

// -------------------------------------------------------------------
// 11. CREATE COMPLAINTS (7)
// -------------------------------------------------------------------
const COMPLAINTS_DATA = [
  { type: "FINANCIAL", subject: "تأخر في تأكيد مساهمة مالية", description: "أرفعت مساهمة منذ أسبوع ولم يتم تأكيدها بعد في المنصة، أرجو التدخل لمعرفة السبب.", status: "OPEN", anonymous: false, priority: "normal" },
  { type: "BEHAVIORAL", subject: "سلوك غير لائق من عضو في المجموعة", description: "أحد أعضاء مجموعة الشباب تلفظ بكلمات غير لائقة خلال الاجتماع الأخير، نرجو تذكيره بقواعد السلوك.", status: "IN_PROGRESS", anonymous: true, priority: "high" },
  { type: "TECHNICAL", subject: "صعوبة في تحميل صورة الإيصال", description: "عند محاولة رفع صورة إيصال مساهمة، تظهر رسالة خطأ ولا تكتمل العملية. جربت على هاتفين مختلفين.", status: "RESOLVED", anonymous: false, priority: "normal", resolution: "تم إصلاح المشكلة، كانت متعلقة بحجم الصورة. يرجى ضغط الصور قبل الرفع." },
  { type: "SUGGESTION", subject: "اقتراح إضافة قسم للوظائف", description: "أقترح إضافة قسم في المنصة لتبادل عروض العمل بين أبناء الحي، يكون مفيداً للجميع.", status: "RESOLVED", anonymous: false, priority: "low", resolution: "اقتراح ممتاز، سيتم دراسته في الملتقى الشهري القادم." },
  { type: "FINANCIAL", subject: "عدم وضوح معايير الصرف", description: "لا أعرف المعايير التي تحدد صرف المساعدات، أرجو توضيح الشروط للجميع.", status: "CLOSED", anonymous: true, priority: "normal", resolution: "تم نشر معايير الصرف في صفحة 'كيف نعمل' بالمنصة." },
  { type: "TECHNICAL", subject: "بطء في تحميل الصفحة", description: "الصفحة الرئيسية بطيئة في التحميل خاصة في ساعات المساء.", status: "OPEN", anonymous: false, priority: "high" },
  { type: "BEHAVIORAL", subject: "نشر تعليقات غير مناسبة", description: "أحد المستخدمين ينشر تعليقات تحض على الكراهية في تعليقات الفعاليات.", status: "REJECTED", anonymous: true, priority: "urgent", resolution: "بعد التحقق، التعليقات كانت ضمن حرية التعبير ولا تنتهك القواعد." },
];

async function createComplaints(districtId: string, users: any[], treasurer: any, districtMod: any) {
  let total = 0;
  const handlers = [treasurer, districtMod];
  for (const c of COMPLAINTS_DATA) {
    const filer = c.anonymous ? null : pick(users);
    const createdAt = daysFromNow(-randInt(5, 90));
    const isResolved = ["RESOLVED", "CLOSED", "REJECTED"].includes(c.status);
    const handler = isResolved ? pick(handlers) : null;
    await db.complaint.create({
      data: {
        isAnonymous: c.anonymous,
        filedById: filer ? filer.id : null,
        districtId,
        type: c.type as any,
        subject: c.subject,
        description: c.description,
        attachments: null,
        status: c.status as any,
        priority: c.priority,
        handledById: handler ? handler.id : null,
        resolution: c.resolution ?? null,
        resolvedAt: isResolved ? hoursAfter(createdAt, randInt(24, 24 * 14)) : null,
        createdAt,
        updatedAt: isResolved ? hoursAfter(createdAt, randInt(24, 24 * 14)) : new Date(),
      },
    });
    total++;
  }
  console.log(`✓ تم إنشاء ${total} شكوى واقتراح`);
}

// -------------------------------------------------------------------
// 12. CREATE NOTIFICATIONS (20)
// -------------------------------------------------------------------
const NOTIF_TEMPLATES = [
  { type: "CONTRIBUTION", title: "تم تأكيد مساهمتك", message: "تم تأكيد مساهمتك المالية بقيمة 50 درهم لإيصال RC-2024-001. بارك الله فيك." },
  { type: "FUND_REQUEST", title: "تحديث حالة طلبك", message: "طلب المساعدة SY-001 انتقل إلى مرحلة 'قيد المراجعة'." },
  { type: "EVENT", title: "تم تسجيلك في الفعالية", message: "تم تسجيلك في فعالية 'ملتقى الحي الشهري'. رمز تذكرتك: EV-2024-001." },
  { type: "SYSTEM", title: "مرحباً بك في منصة المعروف", message: "أهلاً وسهلاً بك في منصة المعروف الرقمي لحي سيدي يوسف بن علي. نرجو إكمال ملفك الشخصي." },
  { type: "ANNOUNCEMENT", title: "إعلان هام من إدارة الحي", message: "نعلمكم بأن الملتقى الشهري القادم سيكون يوم السبت القادم في دار الحي بعد صلاة العصر." },
];

async function createNotifications(users: any[]) {
  const candidates = users.filter((u) => u.status === "ACTIVE");
  let total = 0;
  for (let i = 0; i < 20; i++) {
    const tmpl = NOTIF_TEMPLATES[i % NOTIF_TEMPLATES.length];
    const user = pick(candidates);
    const isRead = Math.random() < 0.5;
    const createdAt = daysFromNow(-randInt(1, 30));
    await db.notification.create({
      data: {
        userId: user.id,
        type: tmpl.type as any,
        title: tmpl.title,
        message: tmpl.message,
        link:
          tmpl.type === "CONTRIBUTION"
            ? "/community/fund/contributions"
            : tmpl.type === "FUND_REQUEST"
            ? "/community/fund/requests"
            : tmpl.type === "EVENT"
            ? "/community/events"
            : null,
        isRead,
        readAt: isRead ? hoursAfter(createdAt, randInt(1, 24)) : null,
        metadata: null,
        createdAt,
      },
    });
    total++;
  }
  console.log(`✓ تم إنشاء ${total} إشعار`);
}

// -------------------------------------------------------------------
// 13. CREATE AUDIT LOGS (10)
// -------------------------------------------------------------------
const AUDIT_DATA = [
  { action: "user.login", severity: "info", entity: "User", metadata: '{"method":"email_password"}' },
  { action: "user.registered", severity: "info", entity: "User", metadata: '{"source":"public_signup"}' },
  { action: "fund.contribution.confirmed", severity: "info", entity: "Contribution", metadata: '{"amount":50}' },
  { action: "fund.request.approved", severity: "info", entity: "FundRequest", metadata: '{"amountApproved":1500}' },
  { action: "fund.request.disbursed", severity: "info", entity: "FundRequest", metadata: '{"amountDisbursed":1500}' },
  { action: "admin.user.role_changed", severity: "warning", entity: "User", metadata: '{"oldRole":"MEMBER","newRole":"ETHICS_COMMITTEE"}' },
  { action: "auth.failed_login", severity: "warning", entity: "User", metadata: '{"attempts":3}' },
  { action: "user.suspended", severity: "warning", entity: "User", metadata: '{"reason":"spam_behavior"}' },
  { action: "system.fraud_detected", severity: "critical", entity: "Contribution", metadata: '{"pattern":"duplicate_receipt"}' },
  { action: "system.backup_completed", severity: "info", entity: "System", metadata: '{"size":"15MB"}' },
];

async function createAuditLogs(users: any[]) {
  let total = 0;
  for (let i = 0; i < AUDIT_DATA.length; i++) {
    const a = AUDIT_DATA[i];
    const actor = pick(users);
    await db.auditLog.create({
      data: {
        actorId: actor.id,
        action: a.action,
        entity: a.entity,
        entityId: randomUUID(),
        ipAddress: `196.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        metadata: a.metadata,
        severity: a.severity,
        createdAt: daysFromNow(-randInt(1, 30)),
      },
    });
    total++;
  }
  console.log(`✓ تم إنشاء ${total} سجل نشاط`);
}

// -------------------------------------------------------------------
// 14. CREATE SETTINGS (14 entries)
// -------------------------------------------------------------------
const SETTINGS_DATA = [
  { key: "site.name", value: "سيدي يوسف بن علي العاصمة", type: "string", category: "general", desc: "اسم المنصة" },
  { key: "site.tagline", value: "من حي إلى عاصمة... المعروف الرقمي", type: "string", category: "general", desc: "شعار المنصة" },
  { key: "site.description", value: "منصة المعروف الرقمي لحي سيدي يوسف بن علي بمراكش", type: "string", category: "general", desc: "وصف المنصة" },
  { key: "fund.threshold.ethics", value: "1000", type: "int", category: "fund", desc: "المبلغ الذي يستوجب مرور لجنة النزاهة" },
  { key: "fund.disbursement.deadline", value: "72", type: "int", category: "fund", desc: "مهرة الصرف بعد الموافقة (ساعات)" },
  { key: "community.target.families", value: "500", type: "int", category: "community", desc: "هدف المرحلة الأولى: عدد الأسر" },
  { key: "community.target.contributions", value: "100", type: "int", category: "community", desc: "هدف المساهمات الشهرية بالدرهم" },
  { key: "community.target.events", value: "10", type: "int", category: "community", desc: "عدد الفعاليات المستهدفة سنوياً" },
  { key: "ads.packages.bronze", value: "300", type: "int", category: "ads", desc: "ثمينة الباقة البرونزية" },
  { key: "ads.packages.silver", value: "600", type: "int", category: "ads", desc: "ثمينة الباقة الفضية" },
  { key: "ads.packages.gold", value: "1200", type: "int", category: "ads", desc: "ثمينة الباقة الذهبية" },
  { key: "ads.packages.platinum", value: "3000", type: "int", category: "ads", desc: "ثمينة الباقة البلاتينية" },
  { key: "ads.packages.sponsor", value: "10000", type: "int", category: "ads", desc: "ثمينة باقة الراعي الرسمي" },
  { key: "site.locale", value: "ar-MA", type: "string", category: "general", desc: "اللغة والمنطقة" },
];

async function createSettings() {
  let total = 0;
  for (const s of SETTINGS_DATA) {
    await db.setting.create({
      data: {
        key: s.key,
        value: s.value,
        type: s.type,
        category: s.category,
        isPublic: true,
        description: s.desc,
      },
    });
    total++;
  }
  console.log(`✓ تم إنشاء ${total} إعداد في قاعدة الإعدادات`);
}

// -------------------------------------------------------------------
// 15. SUMMARY
// -------------------------------------------------------------------
async function printSummary() {
  const [
    districts, families, users, groups, groupMembers, contributions,
    fundRequests, fundRequestApprovals, events, eventRegistrations,
    notifications, ads, complaints, auditLogs, settings,
  ] = await Promise.all([
    db.district.count(),
    db.family.count(),
    db.user.count(),
    db.group.count(),
    db.groupMember.count(),
    db.contribution.count(),
    db.fundRequest.count(),
    db.fundRequestApproval.count(),
    db.event.count(),
    db.eventRegistration.count(),
    db.notification.count(),
    db.ad.count(),
    db.complaint.count(),
    db.auditLog.count(),
    db.setting.count(),
  ]);

  console.log("\n" + "=".repeat(60));
  console.log("✦  ملخص البيانات المُزروعة  ✦");
  console.log("=".repeat(60));
  console.log(`  الأحياء (Districts)        : ${districts}`);
  console.log(`  الأسر (Families)            : ${families}`);
  console.log(`  المستخدمون (Users)         : ${users}`);
  console.log(`  المجموعات (Groups)          : ${groups}`);
  console.log(`  عضويات المجموعات           : ${groupMembers}`);
  console.log(`  المساهمات (Contributions)  : ${contributions}`);
  console.log(`  طلبات المساعدة            : ${fundRequests}`);
  console.log(`  موافقات لجنة النزاهة       : ${fundRequestApprovals}`);
  console.log(`  الفعاليات (Events)         : ${events}`);
  console.log(`  تسجيلات الحضور             : ${eventRegistrations}`);
  console.log(`  الإشعارات (Notifications)  : ${notifications}`);
  console.log(`  الإعلانات (Ads)             : ${ads}`);
  console.log(`  الشكاوى (Complaints)        : ${complaints}`);
  console.log(`  سجلات النشاط (AuditLogs)   : ${auditLogs}`);
  console.log(`  الإعدادات (Settings)       : ${settings}`);
  console.log("=".repeat(60));
  console.log("✓ تم إنهاء الزرع بنجاح — من حي إلى عاصمة... المعروف الرقمي");
}

// -------------------------------------------------------------------
//  MAIN
// -------------------------------------------------------------------
async function main() {
  console.log("🚀 بدء زرع بيانات منصة المعروف الرقمي — سيدي يوسف بن علي العاصمة\n");

  try {
    await clearAll();
    const district = await createDistrict();
    const families = await createFamilies(district.id);
    const { users, ethicsMembers, treasurer, groupLeaders, adsManager, districtMod } =
      await createUsers(district.id, families);
    const groups = await createGroups(district.id);
    await createGroupMembers(groups, users, groupLeaders);
    await createContributions(users, families);
    await createFundRequests(users, treasurer, ethicsMembers);
    await createEvents(district.id, groups, users);
    await createAds(district.id, adsManager);
    await createComplaints(district.id, users, treasurer, districtMod);
    await createNotifications(users);
    await createAuditLogs(users);
    await createSettings();
    await printSummary();
  } catch (err) {
    console.error("\n✗ خطأ أثناء الزرع:");
    console.error(err);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}

main();
