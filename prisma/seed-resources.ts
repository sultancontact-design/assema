// v70.0 Section 6: Seed Resources (GitHub + Product Hunt + HN style)
// Inserts ~20 curated resources for Moroccan devs + entrepreneurs + associations

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RESOURCES = [
  // GitHub repos (Morocco-relevant)
  {
    title: "awesome-morocco — Best of Moroccan open-source",
    url: "https://github.com/OSSMorocco/awesome-morocco",
    description: "قائمة رائعة لأفضل المشاريع مفتوحة المصدر المغربية. تشمل Next.js, React, MongoDB, Arabic tools.",
    category: "github",
    tags: "morocco,open-source,awesome,list",
    sourcePlatform: "GitHub",
    submittedBy: "النظام",
    upvotes: 142,
    pinned: true,
    pinnedOrder: 1,
  },
  {
    title: "Morocco-Cities-Database (HCP 2024)",
    url: "https://github.com/atskaout/morocco-cities-db",
    description: "قاعدة بيانات شاملة لـ 1,503 جماعة مغربية بـ JSON/SQL/CSV. تشمل الإحداثيات الجغرافية والسكان.",
    category: "github",
    tags: "morocco,gis,data,hcp,cities",
    sourcePlatform: "GitHub",
    submittedBy: "النظام",
    upvotes: 87,
    pinned: true,
    pinnedOrder: 2,
  },
  {
    title: "nextjs-arabic-tutorial (وَصَل)",
    url: "https://github.com/sultancontact-design/assema",
    description: "كود مصدري منصة وَصَل (هذا المشروع) — مرجع كامل لـ Next.js 16 + Prisma + Arabic RTL.",
    category: "github",
    tags: "nextjs,typescript,prisma,arabic,rtl",
    sourcePlatform: "GitHub",
    submittedBy: "النظام",
    upvotes: 64,
    pinned: true,
    pinnedOrder: 3,
  },
  {
    title: "Tailwind-RTL-Plugin-Arabic",
    url: "https://github.com/RTL-Cool/tailwind-rtl",
    description: "إضافة Tailwind لـ RTL كامل + خطوط عربية. تستخدمها وَصَل لإنتاج RTL صحيح.",
    category: "github",
    tags: "tailwind,rtl,arabic,plugin",
    sourcePlatform: "GitHub",
    submittedBy: "النظام",
    upvotes: 41,
  },
  // Product Hunt-style tools
  {
    title: "Maroc Tech Job Board — لوحة وظائف التقنية",
    url: "https://example.com/maroc-tech-jobs",
    description: "لوحة وظائف للتقنيين المغاربة: Dev, Designer, PM. تجد آخر 150 شغلة مطبّقة.",
    category: "producthunt",
    tags: "jobs,tech,morocco,developer",
    sourcePlatform: "Product Hunt",
    submittedBy: "النظام",
    upvotes: 28,
  },
  {
    title: "Notion Morocco Founders Hub",
    url: "https://example.com/notion-founders-ma",
    description: "قالب Notion مجاني لرواد الأعمال المغاربة: خطة عمل + Pivot Canvas + Customer Development.",
    category: "producthunt",
    tags: "founders,notion,template,startup",
    sourcePlatform: "Product Hunt",
    submittedBy: "النظام",
    upvotes: 19,
  },
  // Show HN-style discussions
  {
    title: "Show HN: AI Chatbot بالدارجة المغربية",
    url: "https://example.com/show-hn-darija-bot",
    description: "بنينا chatbot AI يتحدث بالدارجة. Fine-tuned على 50K جملة. نقبل التجريب والاقتراحات.",
    category: "hackernews",
    tags: "ai,darija,chatbot,nlp",
    sourcePlatform: "Hacker News",
    submittedBy: "النظام",
    upvotes: 53,
  },
  {
    title: "Show HN: خريطة الأسعار — Markets MAD",
    url: "https://example.com/show-hn-mad-prices",
    description: "تطبيق يرسم أسعار الخضر والفواكه بالأسواق المغربية. API مجاني + خريطة حرارية.",
    category: "hackernews",
    tags: "markets,prices,mad,api,map",
    sourcePlatform: "Hacker News",
    submittedBy: "النظام",
    upvotes: 38,
  },
  // Articles
  {
    title: "كيف نبني منصة مغربية بـ Next.js 16 + Prisma (دليل كامل)",
    url: "https://example.com/nextjs16-morocco",
    description: "مقال تعليمي يشرح بناء وَصَل من الصفر: المصادقة + قاعدة البيانات + اللغة العربية + النشر على Vercel.",
    category: "article",
    tags: "nextjs,tutorial,morocco,prisma",
    sourcePlatform: "Manual",
    submittedBy: "النظام",
    upvotes: 76,
  },
  {
    title: "دليل جمعية مغربية — كيف تنشئها وكيف تنميها",
    url: "https://example.com/morocco-association-guide",
    description: "دليل شامل لتأسيس جمعية وفقاً لقانون 75-00. الخطوات + النماذج + النصائح العملية.",
    category: "article",
    tags: "association,loi-75-00,guide,morocco",
    sourcePlatform: "Manual",
    submittedBy: "النظام",
    upvotes: 33,
  },
  {
    title: "تعاونية مغربية — من الفكرة للتصدير (دليل ODC)",
    url: "https://example.com/morocco-cooperative-guide",
    description: "دليل تأسيس التعاونية عبر مكتب تنمية التعاونية ODC. تشمل الأمثلة والأخطاء الشائعة.",
    category: "article",
    tags: "cooperative,odc,guide,morocco,export",
    sourcePlatform: "Manual",
    submittedBy: "النظام",
    upvotes: 27,
  },
  // Tools
  {
    title: "MarocDev CLI — نشر Next.js على Vercel",
    url: "https://example.com/marocdev-cli",
    description: "CLI يسهّل نشر مشاريع Next.js المغربية على Vercel + إعداد RTL + خطوط Tajawal تلقائياً.",
    category: "tool",
    tags: "cli,vercel,nextjs,rtl",
    sourcePlatform: "Manual",
    submittedBy: "النظام",
    upvotes: 22,
  },
  {
    title: "Hijri Date Helper — التاريخ الهجري المغربي",
    url: "https://example.com/hijri-date-ma",
    description: "مكتبة JS تحوّل Gregorian إلى Hijri مع إضافة الأعياد الدينية المغربية الرسمية.",
    category: "tool",
    tags: "hijri,date,js,library,morocco",
    sourcePlatform: "Manual",
    submittedBy: "النظام",
    upvotes: 15,
  },
  // Courses
  {
    title: "دورة Next.js 16 بالعربية (مجانية)",
    url: "https://example.com/nextjs-course-ar",
    description: "12 ساعة تعليمية تغطي Next.js 16 + App Router + Turbopack + Prisma. مستوى مبتدئ-متوسط.",
    category: "course",
    tags: "nextjs,course,arabic,free",
    sourcePlatform: "Manual",
    submittedBy: "النظام",
    upvotes: 48,
  },
  {
    title: "Prisma + PostgreSQL for Arabic apps",
    url: "https://example.com/prisma-arabic",
    description: "دورة قصيرة (3 ساعات) لكيفية بناء schema يدعم العربية والـ RTL مع Prisma + Supabase.",
    category: "course",
    tags: "prisma,postgres,arabic,supabase",
    sourcePlatform: "Manual",
    submittedBy: "النظام",
    upvotes: 31,
  },
  // Morocco-specific
  {
    title: "بوابة ODC — تسجيل التعاونيات",
    url: "https://www.odc.gov.ma",
    description: "الموقع الرسمي لمكتب تنمية التعاونية. نماذج التسجيل + قائمة التعاونيات الناشطة + الإحصاءات.",
    category: "morocco",
    tags: "official,cooperative,odc,gov",
    sourcePlatform: "Manual",
    submittedBy: "النظام",
    upvotes: 58,
    regionName: "All",
  },
  {
    title: "HCP المغرب — إحصاءات رسمية",
    url: "https://www.hcp.ma",
    description: "المندوبية السامية للتخطيط. بيانات رسمية عن السكان + الجماعات + الجهات.",
    category: "morocco",
    tags: "official,hcp,gov,statistics",
    sourcePlatform: "Manual",
    submittedBy: "النظام",
    upvotes: 71,
    regionName: "All",
  },
  {
    title: "Maroc PME — دعم المؤسسات الصغرى",
    url: "https://www.marocpme.ma",
    description: "بوابة حكومية لدعم المؤسسات الصغرى والمتوسطة. برامج + قروض + تأطير.",
    category: "morocco",
    tags: "official,pme,gov,support",
    sourcePlatform: "Manual",
    submittedBy: "النظام",
    upvotes: 35,
    regionName: "All",
  },
  {
    title: "ANPME — الوكالة الوطنية لتنمية المقاولات",
    url: "https://example.com/anpme",
    description: "برامج ANPME لتطوير رواد الأعمال: Moukawalati + Intelaka + Forsa.",
    category: "morocco",
    tags: "official,entrepreneur,programs",
    sourcePlatform: "Manual",
    submittedBy: "النظام",
    upvotes: 28,
    regionName: "All",
  },
  {
    title: "Maroc Digital — استراتيجية المغرب الرقمي 2027",
    url: "https://example.com/maroc-digital-strategy",
    description: "وثيقة رسمية لاستراتيجية المغرب الرقمي. أهداف Sectorielles + خارطة طريق + مؤشرات.",
    category: "morocco",
    tags: "digital,strategy,gov,2027",
    sourcePlatform: "Manual",
    submittedBy: "النظام",
    upvotes: 42,
    regionName: "All",
  },
  {
    title: "Tamwilt — منصة تمويل جماعي مغربية",
    url: "https://example.com/tamwilt",
    description: "منصة Crowdfunding مغربية معتمدة من الـ AMMC. للتعاونيات والجمعيات.",
    category: "morocco",
    tags: "crowdfunding,tamwilt,ammc,finance",
    sourcePlatform: "Manual",
    submittedBy: "النظام",
    upvotes: 23,
  },
];

async function main() {
  console.log(`\n🌱 Seeding ${RESOURCES.length} resources...`);
  let inserted = 0;

  for (const r of RESOURCES) {
    await prisma.resourceLink.upsert({
      where: { url: r.url },
      create: {
        title: r.title,
        url: r.url,
        description: r.description,
        category: r.category,
        tags: r.tags,
        sourcePlatform: r.sourcePlatform,
        submittedBy: r.submittedBy,
        upvotes: r.upvotes,
        pinned: r.pinned ?? false,
        pinnedOrder: r.pinnedOrder,
        regionName: r.regionName,
        isVerified: r.category === "morocco",
        isActive: true,
      },
      update: {
        title: r.title,
        description: r.description,
        category: r.category,
        tags: r.tags,
        sourcePlatform: r.sourcePlatform,
        upvotes: r.upvotes,
        pinned: r.pinned ?? false,
        pinnedOrder: r.pinnedOrder,
        regionName: r.regionName,
        isVerified: r.category === "morocco",
      },
    });
    inserted++;
  }

  console.log(`✓ Inserted ${inserted} resources`);

  const byCategory = await prisma.resourceLink.groupBy({
    by: ["category"],
    _count: { _all: true },
    _sum: { upvotes: true },
  });
  console.log("\n📊 By category:");
  for (const c of byCategory) {
    console.log(`  • ${c.category}: ${c._count._all} resources, ${c._sum.upvotes || 0} upvotes`);
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
