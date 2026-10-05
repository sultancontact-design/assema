// v72.0: Seed Polls + LostFound + Carpool
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const POLLS = [
  {
    userId: "demo-user-1",
    title: "ما الميزة التي تهمّك أكثر في وَصَل؟",
    description: "استطلاع لتوجيه التطوير القادم",
    category: "community",
    options: JSON.stringify([
      { id: "a", text: "مساعد ذكي بالدارجة", votes: 28 },
      { id: "b", text: "بنك الوقت", votes: 22 },
      { id: "c", text: "خريطة المنظمات", votes: 18 },
      { id: "d", text: "البث المباشر", votes: 14 },
    ]),
    totalVotes: 82,
    regionName: "كل المدن",
  },
  {
    userId: "demo-user-2",
    title: "متى تفضّل الفعاليات المجتمعية؟",
    category: "community",
    options: JSON.stringify([
      { id: "a", text: "أيام الأسبوع بعد العمل", votes: 35 },
      { id: "b", text: "نهاية الأسبوع صباحاً", votes: 42 },
      { id: "c", text: "نهاية الأسبوع مساءً", votes: 58 },
    ]),
    totalVotes: 135,
  },
  {
    userId: "demo-user-3",
    title: "ما الموضوع الذي تتمنى تغطيته المدوّنة أكثر؟",
    category: "culture",
    options: JSON.stringify([
      { id: "a", text: "قصص نجاح الجمعيات", votes: 24 },
      { id: "b", text: "دروس تقنية", votes: 31 },
      { id: "c", text: "أخبار المنظمات", votes: 12 },
      { id: "d", text: "ثقافة وفنون مغربية", votes: 38 },
    ]),
    totalVotes: 105,
  },
  {
    userId: "demo-user-4",
    title: "هل أنت مع/ضد إلزامية التأمين الصحي؟",
    category: "politics",
    options: JSON.stringify([
      { id: "a", text: "مع بقوة", votes: 78 },
      { id: "b", text: "مع", votes: 45 },
      { id: "c", text: "ضد", votes: 22 },
      { id: "d", text: "لا أهتم", votes: 8 },
    ]),
    totalVotes: 153,
  },
  {
    userId: "demo-user-5",
    title: "ما الدورة التدريبية الأكثر طلباً؟",
    category: "tech",
    options: JSON.stringify([
      { id: "a", text: "Next.js بالدارجة", votes: 64 },
      { id: "b", text: "Prisma + Supabase", votes: 38 },
      { id: "c", text: "Tailwind RTL", votes: 28 },
      { id: "d", text: "AI للمطورين", votes: 51 },
    ]),
    totalVotes: 181,
  },
];

const LOST_FOUND = [
  { userId: "demo-user-1", type: "lost", title: "ضاعت قطة رمادية بحي النخيل", category: "pets", location: "حي النخيل، مراكش", regionName: "مراكش-آسفي", description: "قطة رمادية صغيرة، عُمرها سنتين، اسمها ميمي. عندها طوق أحمر. ضاعت من أمس.", reward: 200, contactInfo: "06XXXXXXXX" },
  { userId: "demo-user-2", type: "found", title: "وجدت محفظة بنكية قرب المسجد", category: "documents", location: "شارع محمد الخامس، الدار البيضاء", regionName: "الدار البيضاء-سطات", description: "محفظة جلدية بنية تحتوي على بطاقة بنكية ووثائق. صاحبها يصفها.", contactInfo: "06XXXXXXXX" },
  { userId: "demo-user-3", type: "lost", title: "ضاع هاتف Samsung A52", category: "electronics", location: "محطة القطار، فاس", regionName: "فاس-مكناس", description: "هاتف أسود مع جراب أزرق. صورة الشاشة لقطتي.", reward: 300, contactInfo: "06XXXXXXXX" },
  { userId: "demo-user-4", type: "found", title: "وجدت مفاتيح سيارة في الحافلة", category: "keys", location: "الحافلة 19، طنجة", regionName: "طنجة-تطوان-الحسيمة", description: "مفتاحان لسيارة رينو. صاحبها يصف السيارة.", contactInfo: "06XXXXXXXX" },
  { userId: "demo-user-5", type: "lost", title: "ضاع طفل قط 3 سنوات (موجودة)", category: "pets", location: "حي السلام، أكادير", regionName: "سوس-ماسة", description: "كلب بُلدُوغ فرنسي، لون رمادي فاتح، اسمه ريكس. طوق أخضر.", reward: 500, contactInfo: "06XXXXXXXX" },
  { userId: "demo-user-6", type: "found", title: "حقيبة مدرسية مع كتب", category: "other", location: "مقربة من الثانوية، مكناس", regionName: "فاس-مكناس", description: "حقيبة زرقاء مع كتب ثالثة إعدادي. الطفل حزين جداً.", contactInfo: "06XXXXXXXX" },
];

const CARPOOLS = [
  { driverId: "demo-user-1", originCity: "طنجة", destinationCity: "الرباط", departureTime: new Date(Date.now() + 12 * 3600 * 1000), seatsTotal: 4, seatsTaken: 2, pricePerSeat: 80, vehicleInfo: "سيارة بيضاء - رينو سيمبول", contactInfo: "06XXXXXXXX", regionName: "طنجة-تطوان-الحسيمة" },
  { driverId: "demo-user-2", originCity: "الدار البيضاء", destinationCity: "مراكش", departureTime: new Date(Date.now() + 6 * 3600 * 1000), seatsTotal: 3, seatsTaken: 1, pricePerSeat: 60, vehicleInfo: "داشيا ساندرو - رمادي", contactInfo: "06XXXXXXXX", regionName: "الدار البيضاء-سطات" },
  { driverId: "demo-user-3", originCity: "فاس", destinationCity: "وجدة", departureTime: new Date(Date.now() + 24 * 3600 * 1000), seatsTotal: 4, seatsTaken: 0, pricePerSeat: 100, vehicleInfo: "بيجو 208 - أحمر", contactInfo: "06XXXXXXXX", regionName: "فاس-مكناس" },
  { driverId: "demo-user-4", originCity: "أكادير", destinationCity: "الصويرة", departureTime: new Date(Date.now() + 18 * 3600 * 1000), seatsTotal: 2, seatsTaken: 1, pricePerSeat: 70, vehicleInfo: "سيات ibiza - أزرق", contactInfo: "06XXXXXXXX", regionName: "سوس-ماسة" },
  { driverId: "demo-user-5", originCity: "الرباط", destinationCity: "مكناس", departureTime: new Date(Date.now() + 30 * 3600 * 1000), seatsTotal: 4, seatsTaken: 3, pricePerSeat: 40, vehicleInfo: "هيونداي i10 - أبيض", contactInfo: "06XXXXXXXX", regionName: "الرباط-سلا-القنيطرة" },
  { driverId: "demo-user-6", originCity: "مراكش", destinationCity: "ورزازات", departureTime: new Date(Date.now() + 48 * 3600 * 1000), seatsTotal: 6, seatsTaken: 2, pricePerSeat: 90, vehicleInfo: "كليو 4 - رمادي", contactInfo: "06XXXXXXXX", regionName: "مراكش-آسفي" },
];

async function main() {
  console.log(`\n🌱 Seeding v72.0 data...`);

  let pollsInserted = 0;
  for (const p of POLLS) {
    try {
      await prisma.communityPoll.create({
        data: { ...p, status: "active", isAnonymous: false },
      });
      pollsInserted++;
    } catch (e) { console.warn(`  ⚠ poll skip: ${e.message.slice(0, 60)}`); }
  }

  let lfInserted = 0;
  for (const l of LOST_FOUND) {
    try {
      await prisma.lostFound.create({
        data: { ...l, status: "open" },
      });
      lfInserted++;
    } catch (e) { console.warn(`  ⚠ lf skip: ${e.message.slice(0, 60)}`); }
  }

  let cpInserted = 0;
  for (const c of CARPOOLS) {
    try {
      await prisma.carpool.create({
        data: { ...c, status: "active" },
      });
      cpInserted++;
    } catch (e) { console.warn(`  ⚠ cp skip: ${e.message.slice(0, 60)}`); }
  }

  // Seed reputation scores for demo users
  const repScores = [
    { userId: "demo-user-1", score: 580, level: "trusted", endorsementsReceived: 12, transactionsCompleted: 8, ledgerEntriesCount: 5, pollsCreated: 1, lostFoundResolved: 1, carpoolsCompleted: 5, blogsPublished: 3, daysActive: 145 },
    { userId: "demo-user-2", score: 720, level: "expert", endorsementsReceived: 24, transactionsCompleted: 15, ledgerEntriesCount: 10, pollsCreated: 1, lostFoundResolved: 2, carpoolsCompleted: 8, blogsPublished: 6, daysActive: 230 },
    { userId: "demo-user-3", score: 340, level: "contributor", endorsementsReceived: 6, transactionsCompleted: 3, ledgerEntriesCount: 2, pollsCreated: 1, lostFoundResolved: 0, carpoolsCompleted: 2, blogsPublished: 1, daysActive: 88 },
    { userId: "demo-user-4", score: 120, level: "newcomer", endorsementsReceived: 1, transactionsCompleted: 0, ledgerEntriesCount: 0, pollsCreated: 1, lostFoundResolved: 0, carpoolsCompleted: 0, blogsPublished: 0, daysActive: 24 },
    { userId: "demo-user-5", score: 920, level: "luminary", endorsementsReceived: 38, transactionsCompleted: 22, ledgerEntriesCount: 14, pollsCreated: 1, lostFoundResolved: 4, carpoolsCompleted: 12, blogsPublished: 9, daysActive: 365 },
    { userId: "demo-user-6", score: 460, level: "trusted", endorsementsReceived: 9, transactionsCompleted: 6, ledgerEntriesCount: 3, pollsCreated: 0, lostFoundResolved: 1, carpoolsCompleted: 4, blogsPublished: 2, daysActive: 180 },
  ];
  let repInserted = 0;
  for (const r of repScores) {
    try {
      await prisma.reputationScore.upsert({
        where: { userId: r.userId },
        create: r,
        update: r,
      });
      repInserted++;
    } catch (e) { console.warn(`  ⚠ rep skip: ${e.message.slice(0, 60)}`); }
  }

  console.log(`✓ Inserted ${pollsInserted} polls + ${lfInserted} lost-found + ${cpInserted} carpools + ${repInserted} reputation scores`);
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
