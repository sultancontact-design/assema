// Seed CMS content + images
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const CONTENT = [
  // HOME
  { key: "home.hero.badge", value: "حي سيدي يوسف بن علي · مراكش", section: "HOME", labelAr: "شارة Hero" },
  { key: "home.hero.title.line1", value: "من حي", section: "HOME", labelAr: "عنوان Hero — سطر 1" },
  { key: "home.hero.title.line2", value: "إلى عاصمة", section: "HOME", labelAr: "عنوان Hero — سطر 2" },
  { key: "home.hero.description", value: "منصة اجتماعية تضامنية تُحوّل المعروف المغربي إلى واقع رقمي", section: "HOME", labelAr: "وصف Hero" },
  { key: "home.hero.cta1.text", value: "انضمّ إلى الحيّ", section: "HOME", labelAr: "زر Hero 1" },
  { key: "home.hero.cta1.link", value: "/community", section: "HOME", labelAr: "رابط Hero 1" },
  { key: "home.hero.cta2.text", value: "تعرّف على الصندوق", section: "HOME", labelAr: "زر Hero 2" },
  { key: "home.hero.cta2.link", value: "/community/fund", section: "HOME", labelAr: "رابط Hero 2" },
  { key: "home.stats.title", value: "إحصاءات حيّة", section: "HOME", labelAr: "عنوان الإحصاءات" },
  { key: "home.stats.families.label", value: "أسرة مسجّلة", section: "HOME", labelAr: "إحصائية 1 — تسمية" },
  { key: "home.stats.contributions.label", value: "مساهمة مؤكّدة", section: "HOME", labelAr: "إحصائية 2 — تسمية" },
  { key: "home.stats.balance.label", value: "رصيد الصندوق", section: "HOME", labelAr: "إحصائية 3 — تسمية" },
  { key: "home.stats.events.label", value: "فعالية قادمة", section: "HOME", labelAr: "إحصائية 4 — تسمية" },
  // GROUPS
  { key: "groups.page.title", value: "مجموعات الحي", section: "GROUPS", labelAr: "عنوان الصفحة" },
  { key: "groups.page.subtitle", value: "انضم لمجموعة تناسب اهتماماتك", section: "GROUPS", labelAr: "وصف الصفحة" },
  { key: "groups.mothers.name", value: "مجموعة الأمهات", section: "GROUPS", labelAr: "اسم مجموعة الأمهات" },
  { key: "groups.mothers.description", value: "فضاء للأمهات لتنظيم مبادراتهن", section: "GROUPS", labelAr: "وصف مجموعة الأمهات" },
  { key: "groups.children.name", value: "مجموعة الأطفال", section: "GROUPS", labelAr: "اسم مجموعة الأطفال" },
  { key: "groups.children.description", value: "أنشطة تربوية وتعليمية لأطفال الحي", section: "GROUPS", labelAr: "وصف مجموعة الأطفال" },
  { key: "groups.elders.name", value: "مجموعة كبار السن", section: "GROUPS", labelAr: "اسم مجموعة كبار السن" },
  { key: "groups.elders.description", value: "حفظ ذاكرة الحي ونقل التراث للأجيال", section: "GROUPS", labelAr: "وصف مجموعة كبار السن" },
  { key: "groups.youth.name", value: "مجموعة الشباب", section: "GROUPS", labelAr: "اسم مجموعة الشباب" },
  { key: "groups.youth.description", value: "شباب الحي الطامح للمساهمة في التنمية المجتمعية", section: "GROUPS", labelAr: "وصف مجموعة الشباب" },
  { key: "groups.fathers.name", value: "مجموعة الآباء", section: "GROUPS", labelAr: "اسم مجموعة الآباء" },
  { key: "groups.fathers.description", value: "ملتقى الآباء لتبادل الخبرات وحل مشاكل الحي", section: "GROUPS", labelAr: "وصف مجموعة الآباء" },
  // FUND
  { key: "fund.page.title", value: "صندوق المعروف", section: "FUND", labelAr: "عنوان الصفحة" },
  { key: "fund.page.subtitle", value: "التضامن هو روح الحي", section: "FUND", labelAr: "وصف الصفحة" },
  // EVENTS
  { key: "events.page.title", value: "فعاليات الحي", section: "EVENTS", labelAr: "عنوان الصفحة" },
  { key: "events.page.subtitle", value: "قوافل طبية، أمسيات ثقافية، ورشات، وأنشطة", section: "EVENTS", labelAr: "وصف الصفحة" },
  // STORE
  { key: "store.page.title", value: "متجر النقاط", section: "STORE", labelAr: "عنوان الصفحة" },
  { key: "store.page.subtitle", value: "استبدل نقاطك بمكافآت حصرية", section: "STORE", labelAr: "وصف الصفحة" },
  // ETHICS
  { key: "ethics.page.title", value: "تصميمنا الأخلاقي", section: "ETHICS", labelAr: "عنوان الصفحة" },
  { key: "ethics.page.subtitle", value: "نُصمّم المنصة بآليات تحفيز قوية لكنّنا نعرف أنّ هذه الآليات سلاح ذو حدّين", section: "ETHICS", labelAr: "وصف الصفحة" },
  { key: "ethics.value1.title", value: "الشفافية", section: "ETHICS", labelAr: "قيمة 1 — عنوان" },
  { key: "ethics.value1.description", value: "نشرح لك كيف ولماذا نُحفّزك. لا أسرار، لا خداع.", section: "ETHICS", labelAr: "قيمة 1 — وصف" },
  { key: "ethics.value2.title", value: "التحكّم", section: "ETHICS", labelAr: "قيمة 2 — عنوان" },
  { key: "ethics.value2.description", value: "لك أن توقف أيّ آلية، تحدّ ساعات الهدوء، تأخذ استراحة.", section: "ETHICS", labelAr: "قيمة 2 — وصف" },
  { key: "ethics.value3.title", value: "الصحة", section: "ETHICS", labelAr: "قيمة 3 — عنوان" },
  { key: "ethics.value3.description", value: "نُصمّم لعادات إيجابية لا لاستغلال.", section: "ETHICS", labelAr: "قيمة 3 — وصف" },
  { key: "ethics.value4.title", value: "الفائدة", section: "ETHICS", labelAr: "قيمة 4 — عنوان" },
  { key: "ethics.value4.description", value: "كل آلية محفّزاتها تخدم الهدف الأساسي: مساعدة الأسر.", section: "ETHICS", labelAr: "قيمة 4 — وصف" },
  // FOOTER
  { key: "footer.tagline", value: "منصة اجتماعية تضامنية لرقمنة المعروف المغربي", section: "FOOTER", labelAr: "الشعار" },
  { key: "footer.copyright", value: "© 2026 سيدي يوسف بن علي العاصمة", section: "FOOTER", labelAr: "حقوق النشر" },
];

const IMAGES = [
  { key: "home.hero.image", url: "https://images.unsplash.com/photo-1539020140153-e479b8c5e640?w=1920&q=90", alt: "مراكش", section: "HOME", labelAr: "صورة Hero الرئيسية" },
  { key: "groups.mothers.image", url: "https://images.unsplash.com/photo-1499017404655-611a3f8abe9b?w=800&q=85", alt: "أمهات", section: "GROUPS", labelAr: "صورة مجموعة الأمهات" },
  { key: "groups.children.image", url: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=85", alt: "أطفال", section: "GROUPS", labelAr: "صورة مجموعة الأطفال" },
  { key: "groups.elders.image", url: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?w=800&q=85", alt: "كبار السن", section: "GROUPS", labelAr: "صورة مجموعة كبار السن" },
  { key: "groups.youth.image", url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=85", alt: "شباب", section: "GROUPS", labelAr: "صورة مجموعة الشباب" },
  { key: "groups.fathers.image", url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=85", alt: "آباء", section: "GROUPS", labelAr: "صورة مجموعة الآباء" },
  { key: "ethics.value1.image", url: "https://images.unsplash.com/photo-1554224155-6724dd031d9f?w=600&q=85", alt: "شفافية", section: "ETHICS", labelAr: "صورة القيمة 1" },
  { key: "ethics.value2.image", url: "https://images.unsplash.com/photo-1554415707-72e20038b528?w=600&q=85", alt: "تحكّم", section: "ETHICS", labelAr: "صورة القيمة 2" },
  { key: "ethics.value3.image", url: "https://images.unsplash.com/photo-1521791135904-15f7b4faff47?w=600&q=85", alt: "احترام", section: "ETHICS", labelAr: "صورة القيمة 3" },
  { key: "ethics.value4.image", url: "https://images.unsplash.com/photo-1563013544-824ae38b5697?w=600&q=85", alt: "حماية", section: "ETHICS", labelAr: "صورة القيمة 4" },
];

async function main() {
  console.log("📝 Seeding CMS content...");
  for (const item of CONTENT) {
    const existing = await db.siteContent.findUnique({ where: { key: item.key } });
    if (!existing) await db.siteContent.create({ data: { ...item, type: "TEXT" } });
  }
  console.log("🖼️ Seeding CMS images...");
  for (const img of IMAGES) {
    const existing = await db.imageAsset.findUnique({ where: { key: img.key } });
    if (!existing) await db.imageAsset.create({ data: img });
  }
  const cCount = await db.siteContent.count();
  const iCount = await db.imageAsset.count();
  console.log(`✅ Done: ${cCount} content items + ${iCount} images`);
}
main().finally(() => db.$disconnect());
