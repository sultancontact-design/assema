// Seed 91 FeatureFlags across 12 categories
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

interface FlagSeed { key: string; nameAr: string; description?: string; category: string }

const FLAGS: FlagSeed[] = [
  // HOME (10)
  { key: "home.hero", nameAr: "القسم الرئيسي", description: "البانر الترحيبي", category: "HOME" },
  { key: "home.stats", nameAr: "الإحصاءات الحيّة", description: "عدّادات حيّة", category: "HOME" },
  { key: "home.activity_feed", nameAr: "آخر النشاطات", description: "شريط RTL Ticker", category: "HOME" },
  { key: "home.fomo_banner", nameAr: "بانر FOMO", category: "HOME" },
  { key: "home.stories_carousel", nameAr: "قصص النجاح", category: "HOME" },
  { key: "home.map_preview", nameAr: "معاينة الخريطة", category: "HOME" },
  { key: "home.ads", nameAr: "الإعلانات الرئيسية", category: "HOME" },
  { key: "home.upcoming_events", nameAr: "الفعاليات القادمة", category: "HOME" },
  { key: "home.top_members", nameAr: "أبرز الأعضاء", category: "HOME" },
  { key: "home.testimonials", nameAr: "شهادات", category: "HOME" },
  // FUND (8)
  { key: "fund.contribute", nameAr: "المساهمة في الصندوق", category: "FUND" },
  { key: "fund.requests.new", nameAr: "طلب جديد", category: "FUND" },
  { key: "fund.requests.list", nameAr: "قائمة الطلبات", category: "FUND" },
  { key: "fund.transparency", nameAr: "الشفافية", category: "FUND" },
  { key: "fund.reports", nameAr: "التقارير", category: "FUND" },
  { key: "fund.receipts", nameAr: "الإيصالات", category: "FUND" },
  { key: "fund.committee", nameAr: "لجنة الصندوق", category: "FUND" },
  { key: "fund.export", nameAr: "تصدير", category: "FUND" },
  // EVENTS (6)
  { key: "events.list", nameAr: "قائمة الفعاليات", category: "EVENTS" },
  { key: "events.create", nameAr: "إنشاء فعالية", category: "EVENTS" },
  { key: "events.register", nameAr: "التسجيل", category: "EVENTS" },
  { key: "events.qr_scan", nameAr: "QR Scan", category: "EVENTS" },
  { key: "events.ratings", nameAr: "التقييمات", category: "EVENTS" },
  { key: "events.gallery", nameAr: "المعرض", category: "EVENTS" },
  // SERVICES (6)
  { key: "services.professions", nameAr: "المهن", category: "SERVICES" },
  { key: "services.crafts", nameAr: "الحرف", category: "SERVICES" },
  { key: "services.advice", nameAr: "النصائح", category: "SERVICES" },
  { key: "services.reviews", nameAr: "التقييمات", category: "SERVICES" },
  { key: "services.create", nameAr: "إضافة خدمة", category: "SERVICES" },
  { key: "services.verify", nameAr: "توثيق", category: "SERVICES" },
  // PRICES (5)
  { key: "prices.view", nameAr: "عرض الأسعار", category: "PRICES" },
  { key: "prices.report", nameAr: "إبلاغ عن سعر", category: "PRICES" },
  { key: "prices.compare", nameAr: "مقارنة", category: "PRICES" },
  { key: "prices.history", nameAr: "السجلّ التاريخي", category: "PRICES" },
  { key: "prices.admin", nameAr: "إدارة الأسعار", category: "PRICES" },
  // BLOG (5)
  { key: "blog.view", nameAr: "قراءة المقالات", category: "BLOG" },
  { key: "blog.write", nameAr: "كتابة مقال", category: "BLOG" },
  { key: "blog.comments", nameAr: "التعليقات", category: "BLOG" },
  { key: "blog.likes", nameAr: "الإعجابات", category: "BLOG" },
  { key: "blog.share", nameAr: "المشاركة", category: "BLOG" },
  // COMMUNITY (8)
  { key: "community.members", nameAr: "الأعضاء", category: "COMMUNITY" },
  { key: "community.neighbors", nameAr: "الجيران", category: "COMMUNITY" },
  { key: "community.messages", nameAr: "الرسائل", category: "COMMUNITY" },
  { key: "community.discussions", nameAr: "النقاشات", category: "COMMUNITY" },
  { key: "community.initiatives", nameAr: "المبادرات", category: "COMMUNITY" },
  { key: "community.referral", nameAr: "الإحالات", category: "COMMUNITY" },
  { key: "community.badges", nameAr: "الشارات", category: "COMMUNITY" },
  { key: "community.leaderboard", nameAr: "لوحة المتصدّرين", category: "COMMUNITY" },
  // STORE (4)
  { key: "store.view", nameAr: "تصفّح المتجر", category: "STORE" },
  { key: "store.buy", nameAr: "الشراء", category: "STORE" },
  { key: "store.inventory", nameAr: "المخزون", category: "STORE" },
  { key: "store.history", nameAr: "سجلّ المشتريات", category: "STORE" },
  // MAP (3)
  { key: "map.3d", nameAr: "خريطة 3D", category: "MAP" },
  { key: "map.satellite", nameAr: "عرض القمر", category: "MAP" },
  { key: "map.geolocation", nameAr: "تحديد الموقع", category: "MAP" },
  // ADMIN (10)
  { key: "admin.users", nameAr: "إدارة المستخدمين", category: "ADMIN" },
  { key: "admin.roles", nameAr: "إدارة الأدوار", category: "ADMIN" },
  { key: "admin.economy", nameAr: "الاقتصاد", category: "ADMIN" },
  { key: "admin.analytics", nameAr: "التحليلات", category: "ADMIN" },
  { key: "admin.ads", nameAr: "الإعلانات", category: "ADMIN" },
  { key: "admin.blog", nameAr: "إدارة المدوّنة", category: "ADMIN" },
  { key: "admin.data", nameAr: "إدارة البيانات", category: "ADMIN" },
  { key: "admin.settings", nameAr: "الإعدادات", category: "ADMIN" },
  { key: "admin.live", nameAr: "النشاط الحي", category: "ADMIN" },
  { key: "admin.feature_flags", nameAr: "Feature Flags", category: "ADMIN" },
  // SECURITY (5)
  { key: "security.2fa", nameAr: "المصادقة الثنائية", category: "SECURITY" },
  { key: "security.ip_allowlist", nameAr: "قائمة IP", category: "SECURITY" },
  { key: "privacy.cookies", nameAr: "إدارة الكوكيز", category: "SECURITY" },
  { key: "privacy.requests", nameAr: "طلبات البيانات", category: "SECURITY" },
  { key: "privacy.export", nameAr: "تصدير بياناتي", category: "SECURITY" },
  // NOTIFICATIONS (3)
  { key: "notifications.email", nameAr: "إشعارات البريد", category: "NOTIFICATIONS" },
  { key: "notifications.push", nameAr: "إشعارات Push", category: "NOTIFICATIONS" },
  { key: "notifications.sms", nameAr: "إشعارات SMS", category: "NOTIFICATIONS" },
  // SECTION-LEVEL FLAGS (18 — high-level on/off for each major section)
  { key: "blog", nameAr: "المدوّنة (قسم)", category: "BLOG" },
  { key: "fund", nameAr: "صندوق المعروف (قسم)", category: "FUND" },
  { key: "events", nameAr: "الفعاليات (قسم)", category: "EVENTS" },
  { key: "groups", nameAr: "المجموعات (قسم)", category: "COMMUNITY" },
  { key: "messages", nameAr: "الرسائل (قسم)", category: "COMMUNITY" },
  { key: "discussions", nameAr: "النقاشات (قسم)", category: "COMMUNITY" },
  { key: "initiatives", nameAr: "المبادرات (قسم)", category: "COMMUNITY" },
  { key: "store", nameAr: "المتجر (قسم)", category: "STORE" },
  { key: "market_prices", nameAr: "أسعار السوق (قسم)", category: "PRICES" },
  { key: "services", nameAr: "الخدمات (قسم)", category: "SERVICES" },
  { key: "advice", nameAr: "النصائح (قسم)", category: "SERVICES" },
  { key: "guide", nameAr: "دليل الحي (قسم)", category: "COMMUNITY" },
  { key: "stories", nameAr: "قصص النجاح (قسم)", category: "COMMUNITY" },
  { key: "map", nameAr: "الخريطة (قسم)", category: "MAP" },
  { key: "referral", nameAr: "الإحالة (قسم)", category: "COMMUNITY" },
  { key: "cndp", nameAr: "حماية البيانات (قسم)", category: "SECURITY" },
  { key: "contributions", nameAr: "مساهمات المستخدمين (قسم)", category: "COMMUNITY" },
  { key: "ads", nameAr: "الإعلانات (قسم)", category: "ADMIN" },
];

async function main() {
  console.log(`🏁 Seeding ${FLAGS.length} FeatureFlags...`);
  let created = 0, updated = 0, skipped = 0;
  for (const f of FLAGS) {
    const existing = await db.featureFlag.findUnique({ where: { key: f.key } });
    if (existing) {
      const needsUpdate = existing.category !== f.category || existing.nameAr !== f.nameAr;
      if (needsUpdate) {
        await db.featureFlag.update({ where: { id: existing.id }, data: { category: f.category, nameAr: f.nameAr, description: f.description ?? existing.description } });
        updated++;
      } else { skipped++; }
    } else {
      await db.featureFlag.create({ data: { key: f.key, nameAr: f.nameAr, description: f.description ?? null, category: f.category, status: "ACTIVE" } });
      created++;
    }
  }
  const total = await db.featureFlag.count();
  console.log(`\n📊 Created: ${created}, Updated: ${updated}, Skipped: ${skipped}, Total: ${total}`);
}
main().finally(() => db.$disconnect());
