import { db } from "../src/lib/db";

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)] as T;
const randomDate = (days: number) => { const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random() * days)); d.setHours(Math.floor(Math.random()*24), Math.floor(Math.random()*60)); return d; };

async function main() {
  console.log("🚀 Seed Missing Data — مبادرات + رسائل + نشاطات\n");
  const users = await db.user.findMany({ select: { id: true, fullName: true, districtId: true }, take: 200 });
  const district = await db.district.findFirst({ where: { isDefault: true } });
  if (!district) { console.log("❌ لا حي"); return; }

  // ─── 50 مبادرة ───
  console.log("━━━ 50 مبادرة ━━━");
  const initTitles = ["تنظيف ساحة الحي","حملة تبرع بالدم","ورشة محو الأمية","مكتبة في الدار","تشجير الشوارع","دعم الطلاب المتعثرين","ورشة خياطة","تعاونية طرز","توعية صحية","يوم مفتوح","مجموعة رياضية","تصليح أجهزة","مكافحة تدخين","حضانة مجتمعية","طبخ للأمهات","دعم مواد غذائية","ملعب أطفال","موسيقى وترفيه","نظافة المساجد","مسابقة قرآنية","حرف يدوية","صندوق قرض حسن","توعية مرورية","نسخ على القماش","زيارات للمرضى","مشي جماعي","بستنة","تبرع كتب","مجموعة نسائية","إلكترونيات أطفال","توعية مخدرات","دار قوارير","دهان","دعم أرامل","فريق كرة قدم","نجارة","فحوصات طبية","مخيم صيفي","تلوين","دعم احتياجات خاصة","مجموعة تصوير","طباعة 3D","توعية تغذية","ناد قراءة","برمجة أطفال","زيارات مسنين","فرقة موسيقية","صابون طبيعي","نظافة مقابر","استشارات أسرية"];
  for (let i = 0; i < 50; i++) {
    const u = pick(users);
    const init = await db.initiative.create({ data: { title: initTitles[i] || `مبادرة ${i+1}`, description: `${initTitles[i] || `مبادرة ${i+1}`} — مبادرة مجتمعية تضامنية لخدمة حي سيدي يوسف بن علي.`, category: pick(["EDUCATION","HEALTH","ENVIRONMENT","CULTURE","SOCIAL","INFRASTRUCTURE"]), status: pick(["proposed","under_review","approved","in_progress"]), proposerId: u.id, districtId: district.id, votes: Math.floor(Math.random()*50), createdAt: randomDate(60) } });
    for (let j = 0; j < 2; j++) { try { await db.initiativeVote.create({ data: { initiativeId: init.id, userId: pick(users).id } }); } catch {} }
  }
  console.log("✓ 50 مبادرة + 100 تصويت");

  // ─── 500 رسالة ───
  console.log("\n━━━ 500 رسالة ━━━");
  const messages = ["السلام عليكم، كيف حالك؟","شكراً على مساهمتك!","متى الاجتماع؟","هل تحضر الفعالية؟","بارك الله فيك.","أحتاج مساعدتك.","هل انضممت للمجموعة؟","اقتراح رائع!","نلتقي غداً في الدار.","ساهم اليوم لا تؤجل."];
  for (let i = 0; i < 500; i++) {
    let s = pick(users), r = pick(users); while (r.id === s.id) r = pick(users);
    await db.directMessage.create({ data: { senderId: s.id, receiverId: r.id, content: pick(messages), readAt: Math.random()>0.5 ? randomDate(14) : null, createdAt: randomDate(30) } });
  }
  console.log("✓ 500 رسالة");

  // ─── 30 نشاط Live Feed ───
  console.log("\n━━━ 30 نشاط ━━━");
  const acts = ["LOGIN","CONTRIBUTION","FUND_REQUEST","EVENT_REGISTER","GROUP_JOIN","BADGE_EARNED","STREAK_MILESTONE"];
  const descs = ["ساهم بـ50 درهم","انضم لمجموعة","سجّل في فعالية","حصل على شارة","أكمل 7 أيام متتالية","سجّل الدخول","قدّم طلب معروف","انضم للحي"];
  for (let i = 0; i < 30; i++) {
    const u = pick(users);
    await db.userActivity.create({ data: { userId: u.id, type: pick(acts), description: `${u.fullName} — ${pick(descs)}`, isPublic: true, createdAt: randomDate(1) } });
  }
  console.log("✓ 30 نشاط");

  // ─── النتيجة ───
  console.log("\n━━━ النتيجة النهائية ━━━");
  console.log("Initiatives:", await db.initiative.count());
  console.log("InitiativeVotes:", await db.initiativeVote.count());
  console.log("DirectMessages:", await db.directMessage.count());
  console.log("UserActivities:", await db.userActivity.count());
  await db.$disconnect();
}
main().catch(console.error);
