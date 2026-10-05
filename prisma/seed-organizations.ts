// ===================================================================
//  v70.0 Section 4: Seed Organizations (Associations + Cooperatives + Wedadiat)
//  Inserts ~25 representative Moroccan organizations across 12 regions.
//  Types: ASSOCIATION (جمعية) | COOPERATIVE (تعاونية) | WEDADIA (تعاضدية)
//  Inspired by Loi 75-00 (Associations) + Loi 24-83 (Cooperatives) + Mutuelle law
// ===================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ORGANIZATIONS = [
  // ASSOCIATIONS — Tanger-Tétouan-Al Hoceïma
  {
    name: "جمعية أمل للتنمية الاجتماعية",
    nameFr: "Association Amal pour le Développement Social",
    type: "ASSOCIATION",
    slug: "amal-dev-social",
    mission: "تمكين المرأة القروية في إقليم طنجة-أصيلا",
    description: "جمعية تنموية تأسست سنة 2010، تعنى بمحو الأمية وتأطير المرأة القروية بمنطقة طنجة.",
    tags: "تنمية,مرأة,تعليم",
    regionSlug: "tanger-tetouan-al-hoceima",
    provinceSlug: "tanger-assilah",
    utilitePublique: false,
    membersCount: 145,
    balance: 28500,
    totalRaised: 145000,
    totalSpent: 116500,
    verifiedBadge: true,
  },
  // ASSOCIATION — Fès-Meknès
  {
    name: "جمعية مدينة فاس للموروث المعماري",
    nameFr: "Association de Sauvegarde du Patrimoine de Fès",
    type: "ASSOCIATION",
    slug: "fès-patrimoine",
    mission: "صون الموروث المعماري والتاريخي لمدينة فاس العتيقة",
    description: "تأسست سنة 2006، تجمع مهندسين ومؤرخين وعشاق المدينة العتيقة. تُنفّذ مشاريع ترميم وتأطير جولات.",
    tags: "تراث,ثقافة,هندسة",
    regionSlug: "fes-meknes",
    provinceSlug: "f-s",
    utilitePublique: true,
    membersCount: 87,
    balance: 64200,
    totalRaised: 320000,
    totalSpent: 255800,
    verifiedBadge: true,
  },
  // ASSOCIATION — Rabat-Salé-Kénitra
  {
    name: "جمعية أنوار للطفل والتلمذة",
    nameFr: "Association Anouar pour l'Enfance",
    type: "ASSOCIATION",
    slug: "anouar-enfance",
    mission: "الدعم المدرسي والتأطير التربوي للأطفال في الأحياء الهشة",
    description: "جمعية تطوعية تعمل في أحياء أكدال والرياض وحدرا. تؤطر 200 طفل سنوياً في دروس الدعم المجاني.",
    tags: "طفولة,تعليم,تطوع",
    regionSlug: "rabat-sale-kenitra",
    provinceSlug: "rabat",
    utilitePublique: false,
    membersCount: 53,
    balance: 12400,
    totalRaised: 78000,
    totalSpent: 65600,
    verifiedBadge: false,
  },
  // COOPERATIVE — Casablanca-Settat
  {
    name: "تعاونية الدار البيضاء للحرف النسائية",
    nameFr: "Coopérative CasArts",
    type: "COOPERATIVE",
    slug: "casarts-coop",
    mission: "تسويق المنتجات الحرفية للنساء الحرفيات بالدار البيضاء",
    description: "تعاونية نسوية مسجلة بـ ODC سنة 2014، تضم 35 حرفية في الخياطة والنسيج والرسم على الزجاج.",
    tags: "حرف,نساء,تسويق",
    regionSlug: "casablanca-settat",
    provinceSlug: "casablanca",
    utilitePublique: false,
    membersCount: 35,
    balance: 42000,
    totalRaised: 215000,
    totalSpent: 173000,
    verifiedBadge: true,
  },
  // COOPERATIVE — Marrakech-Safi (argan oil)
  {
    name: "تعاونية أرغان سوس النسائية",
    nameFr: "Coopérative Argan Souss Femmes",
    type: "COOPERATIVE",
    slug: "argan-souss-femmes",
    mission: "إنتاج وتسويق زيت الأرغان البيولوجي وفق المعايير العادلة",
    description: "تعاونية تضم 80 امرأة بأمنان، منتجة لزيت الأرغان العضوي المعتمد بـ Fair Trade. صادرات لأوروبا وكندا.",
    tags: "أرغان,نساء,تصدير",
    regionSlug: "marrakech-safi",
    provinceSlug: "essaouira",
    utilitePublique: false,
    membersCount: 80,
    balance: 96000,
    totalRaised: 580000,
    totalSpent: 484000,
    verifiedBadge: true,
  },
  // WEDADIA — Souss-Massa
  {
    name: "تعاضدية أكادير للتغطية الصحية التضامنية",
    nameFr: "Mutuelle Agadir Santé Solidaire",
    type: "WEDADIA",
    slug: "agadir-sante-solidaire",
    mission: "تغطية صحية تضامنية لأكثر من 1200 منخرط بإقليم أكادير",
    description: "تعاضدية مسجلة بالفدرالية الوطنية للتعاضديات، توفر تسديد مصاريف العلاج والدواء بنسبة 60%.",
    tags: "صحة,تأمين,تضامن",
    regionSlug: "souss-massa",
    provinceSlug: "agadir-ida-ou-tanane",
    utilitePublique: false,
    membersCount: 1240,
    balance: 480000,
    totalRaised: 2400000,
    totalSpent: 1920000,
    verifiedBadge: true,
  },
  // ASSOCIATION — Béni Mellal-Khénifra
  {
    name: "جمعية تنمية الأطلس المتوسط",
    nameFr: "Association Atlas Moyen Développement",
    type: "ASSOCIATION",
    slug: "atlas-moyen-dev",
    mission: "تنمية اقتصادية واجتماعية لمناطق الأطلس المتوسط",
    description: "ترعى مشاريع السياحة الجبلية والطاقات المتجددة. شراكة مع GIZ والوكالة الوطنية لتنمية مناطق الواحات.",
    tags: "تنمية,جبال,سياحة",
    regionSlug: "beni-mellal-khenifra",
    provinceSlug: "b-ni-mellal",
    utilitePublique: true,
    membersCount: 64,
    balance: 185000,
    totalRaised: 920000,
    totalSpent: 735000,
    verifiedBadge: true,
  },
  // COOPERATIVE — Drâa-Tafilalet (dates)
  {
    name: "تعاونية تمور الأدرار",
    nameFr: "Coopérative Tafilalet Dates",
    type: "COOPERATIVE",
    slug: "tafilalet-dates",
    mission: "تثمين وتسويق تمور المجهول بأقليم الرشيدية",
    description: "تعاونية 45 فلاحاً متخصصين في إنتاج وتعبئة تمور المجهول العضوية. شهادة GlobalGAP منذ 2021.",
    tags: "تمور,فلاحة,تصدير",
    regionSlug: "draa-tafilalet",
    provinceSlug: "errachidia",
    utilitePublique: false,
    membersCount: 45,
    balance: 78000,
    totalRaised: 410000,
    totalSpent: 332000,
    verifiedBadge: true,
  },
  // WEDADIA — Oriental
  {
    name: "تعاضدية الشرق للنقل المدرسي",
    nameFr: "Mutuelle Orientale Transport Scolaire",
    type: "WEDADIA",
    slug: "oriental-transport-scolaire",
    mission: "نقل مدرسي تضامني لأبناء المعلمين بإقليم وجدة-أنجاد",
    description: "تعاضدية تنقل 4500 تلميذ يومياً عبر 60 حافلة. تساهم الولاية بـ 30% من الدعم.",
    tags: "نقل,تعليم,أطفال",
    regionSlug: "oriental",
    provinceSlug: "oujda-angad",
    utilitePublique: false,
    membersCount: 320,
    balance: 156000,
    totalRaised: 880000,
    totalSpent: 724000,
    verifiedBadge: false,
  },
  // ASSOCIATION — Guelmim-Oued Noun
  {
    name: "جمعية الصحراء الخضراء للتنمية المستدامة",
    nameFr: "Association Sahara Vert",
    type: "ASSOCIATION",
    slug: "sahara-vert",
    mission: "مكافحة التصحر وزراعة النخيل بالمناطق الصحراوية",
    description: "تأسست سنة 2015، أغلبت 120 هكتاراً من النخيل في واحات كلميم. شراكة مع الوكالة الوطنية لتنمية الواحات.",
    tags: "بيئة,نخيل,تصحر",
    regionSlug: "guelmim-oued-noun",
    provinceSlug: "guelmim",
    utilitePublique: true,
    membersCount: 28,
    balance: 92000,
    totalRaised: 510000,
    totalSpent: 418000,
    verifiedBadge: true,
  },
  // COOPERATIVE — Laâyoune-Sakia El Hamra
  {
    name: "تعاونية الصحراء للحرف الصحراوية",
    nameFr: "Coopérante Sahara Arts",
    type: "COOPERATIVE",
    slug: "sahara-arts",
    mission: "إبراز وتسويق الحرف الصحراوية التقليدية",
    description: "تعاونية 40 حرفياً في صناعة الجلود والمشغولات الصحراوية. معرض دائم بالعيون.",
    tags: "حرف,صحراء,جلود",
    regionSlug: "laayoune-sakia-el-hamra",
    provinceSlug: "la-youne",
    utilitePublique: false,
    membersCount: 40,
    balance: 34000,
    totalRaised: 175000,
    totalSpent: 141000,
    verifiedBadge: false,
  },
  // ASSOCIATION — Dakhla-Oued Ed-Dahab
  {
    name: "جمعية ثقافة الصيد البحري",
    nameFr: "Association Culture Pêche Maritime",
    type: "ASSOCIATION",
    slug: "dakhla-peche",
    mission: "تأطير الصيادين التقليديين وحماية الثروة السمكية بداخلة",
    description: "جمعية مهنية تضم 180 صياداً، تدافع عن حقوقهم وتنظم دورات في الصيد المستدام.",
    tags: "صيد,بحر,بيئة",
    regionSlug: "dakhla-oued-eddahab",
    provinceSlug: "dakhla",
    utilitePublique: false,
    membersCount: 180,
    balance: 67500,
    totalRaised: 312000,
    totalSpent: 244500,
    verifiedBadge: true,
  },
  // ASSOCIATION — Casablanca-Settat (urban)
  {
    name: "جمعية حقوق الإسكان بأحياء الدار البيضاء",
    nameFr: "Association Droit au Logement Casablanca",
    type: "ASSOCIATION",
    slug: "casa-logement",
    mission: "الدفاع عن ساكنة الأحياء العشوائية بحق الإسكان اللائق",
    description: "تنطق باسم ساكنة 14 حياً عشوائياً بالدار البيضاء. مساعدة قانونية مجانية ووساطة مع الجماعة.",
    tags: "إسكان,حقوق,وساطة",
    regionSlug: "casablanca-settat",
    provinceSlug: "casablanca",
    utilitePublique: false,
    membersCount: 410,
    balance: 42000,
    totalRaised: 245000,
    totalSpent: 203000,
    verifiedBadge: false,
  },
  // WEDADIA — Fès-Meknès
  {
    name: "تعاضدية فاس للتغطية الجنائزية",
    nameFr: "Mutuelle Fès Obsèques",
    type: "WEDADIA",
    slug: "fès-obsèques",
    mission: "تغطية مصاريف الجنائز والعزاء لمنخرطيها الـ 800",
    description: "تعاضدية تضامنية تؤمن تكاليف الدفن والعزاء. مساهمة شهرية 30 درهماً للأسرة.",
    tags: "جنائز,تضامن,أسرة",
    regionSlug: "fes-meknes",
    provinceSlug: "f-s",
    utilitePublique: false,
    membersCount: 800,
    balance: 240000,
    totalRaised: 1100000,
    totalSpent: 860000,
    verifiedBadge: false,
  },
  // COOPERATIVE — Tanger-Tétouan (cannabis transition)
  {
    name: "تعاونية كتامة للعسل الجبلي",
    nameFr: "Coopérante Ketama Miel",
    type: "COOPERATIVE",
    slug: "ketama-miel",
    mission: "بديل اقتصادي مستدام لزراعة القنب الهندي بكتامة",
    description: "تعاونية 22 نحالاً، أنتجت 1.2 طن من العسل الجبلي سنة 2024. شراكة مع وكالة تنمية الشمال.",
    tags: "عسل,تنمية,بديل",
    regionSlug: "tanger-tetouan-al-hoceima",
    provinceSlug: "al-hoceima",
    utilitePublique: false,
    membersCount: 22,
    balance: 52000,
    totalRaised: 280000,
    totalSpent: 228000,
    verifiedBadge: true,
  },
  // ASSOCIATION — Marrakech-Safi (children)
  {
    name: "جمعية مراكش لرعاية الأطفال المتخلى عنهم",
    nameFr: "Association Marrakech Enfants Abandonnés",
    type: "ASSOCIATION",
    slug: "marrakech-enfants",
    mission: "رعاية وتأطير الأطفال المتخلى عنهم بمراكش",
    description: "مؤسسة استقبال تؤوي 45 طفلاً متخلى عنهم. شراكة مع وزارة التضامن والمرأة.",
    tags: "طفولة,رعاية,تضامن",
    regionSlug: "marrakech-safi",
    provinceSlug: "marrakech",
    utilitePublique: true,
    membersCount: 28,
    balance: 145000,
    totalRaised: 720000,
    totalSpent: 575000,
    verifiedBadge: true,
  },
  // ASSOCIATION — Souss-Massa (cultural)
  {
    name: "جمعية تافراوت للثقافة الأمازيغية",
    nameFr: "Association Tafraout Culture Amazighe",
    type: "ASSOCIATION",
    slug: "tafraout-amazigh",
    mission: "إحياء وتثمين الثقافة الأمازيغية بمنطقة سوس",
    description: "تنظم مهرجان تيفاوت السنوي للثقافة الأمازيغية. مكتبة أمازيغية ودروس تيفيناغ.",
    tags: "أمازيغ,ثقافة,لغة",
    regionSlug: "souss-massa",
    provinceSlug: "tiznit",
    utilitePublique: false,
    membersCount: 95,
    balance: 28000,
    totalRaised: 156000,
    totalSpent: 128000,
    verifiedBadge: false,
  },
  // COOPERATIVE — Rabat-Salé-Kénitra (dairy)
  {
    name: "تعاونية القنيطرة للحليب البيولوجي",
    nameFr: "Coopérante Kénitra Bio Lait",
    type: "COOPERATIVE",
    slug: "kenitra-bio-lait",
    mission: "إنتاج وتسويق الحليب البيولوجي بإقليم القنيطرة",
    description: "تعاونية 60 فلاحاً، تنتج 4 أطنان من الحليب العضوي أسبوعياً. عقد مع Carrefour.",
    tags: "حليب,بيولوجي,فلاحة",
    regionSlug: "rabat-sale-kenitra",
    provinceSlug: "k-nitra",
    utilitePublique: false,
    membersCount: 60,
    balance: 88000,
    totalRaised: 470000,
    totalSpent: 382000,
    verifiedBadge: true,
  },
  // ASSOCIATION — Béni Mellal-Khénifra (water)
  {
    name: "جمعية حماية واد أم الربيع",
    nameFr: "Association Oued Oum Er-Rbia",
    type: "ASSOCIATION",
    slug: "oued-oum-rbia",
    mission: "حماية مجرى واد أم الربيع من التلوث",
    description: "ترصد نوعية المياه في الوديانية وثلاث رافدات. شراكة مع المياه الجوفية والعالي.",
    tags: "ماء,بيئة,حماية",
    regionSlug: "beni-mellal-khenifra",
    provinceSlug: "b-ni-mellal",
    utilitePublique: true,
    membersCount: 47,
    balance: 33500,
    totalRaised: 168000,
    totalSpent: 134500,
    verifiedBadge: false,
  },
  // WEDADIA — Casablanca-Settat (transport)
  {
    name: "تعاضدية الدار البيضاء لسائقي الطاكسية",
    nameFr: "Mutuelle Casa Taxis Chauffeurs",
    type: "WEDADIA",
    slug: "casa-taxis",
    mission: "تغطية صحية ومهنية لسائقي سيارات الأجرة بالدار البيضاء",
    description: "تعاضدية تضم 2400 سائق. تسدد مصاريف العلاج والصرامة المهنية بنسبة 70%.",
    tags: "نقل,تأمين,مهني",
    regionSlug: "casablanca-settat",
    provinceSlug: "casablanca",
    utilitePublique: false,
    membersCount: 2400,
    balance: 540000,
    totalRaised: 2700000,
    totalSpent: 2160000,
    verifiedBadge: true,
  },
  // ASSOCIATION — Oriental (cultural)
  {
    name: "جمعية وجدة الموسيقى",
    nameFr: "Association Oujda Musique",
    type: "ASSOCIATION",
    slug: "oujda-musique",
    mission: "تأطير الموسيقى المغاربية والغنائي",
    description: "تنظم مهرجان وجدة السنوي للموسيقى الغنائي. مدرسة مجانية لـ 80 طفلاً.",
    tags: "موسيقى,ثقافة,أطفال",
    regionSlug: "oriental",
    provinceSlug: "oujda-angad",
    utilitePublique: false,
    membersCount: 72,
    balance: 41000,
    totalRaised: 220000,
    totalSpent: 179000,
    verifiedBadge: false,
  },
  // COOPERATIVE — Marrakech-Safi (pottery)
  {
    name: "تعاونية صافي للفخار التقليدي",
    nameFr: "Coopérante Safi Poterie",
    type: "COOPERATIVE",
    slug: "safi-poterie",
    mission: "تثمين صناعة الفخار التقليدي بصافي",
    description: "تعاونية 48 فخارياً بصافي. صادرات سنوية بـ 320 ألف درهم نحو أوروبا.",
    tags: "فخار,حرف,تصدير",
    regionSlug: "marrakech-safi",
    provinceSlug: "safi",
    utilitePublique: false,
    membersCount: 48,
    balance: 62000,
    totalRaised: 320000,
    totalSpent: 258000,
    verifiedBadge: true,
  },
  // WEDADIA — Drâa-Tafilalet
  {
    name: "تعاضدية الرشيدية للطاقة الشمسية",
    nameFr: "Mutuelle Errachidia Solaire",
    type: "WEDADIA",
    slug: "errachidia-solaire",
    mission: "تمويل تركيب ألواح شمسية منزلية عبر القروض الصغيرة",
    description: "تعاضدية تمنح قروضاً بدون فوائد لتركيب الطاقة الشمسية. 320 أسرة مستفيدة.",
    tags: "طاقة,شمسية,قروض",
    regionSlug: "draa-tafilalet",
    provinceSlug: "errachidia",
    utilitePublique: false,
    membersCount: 320,
    balance: 96000,
    totalRaised: 580000,
    totalSpent: 484000,
    verifiedBadge: false,
  },
  // ASSOCIATION — Guelmim (tourism)
  {
    name: "جمعية كلميم للسياحة الصحراوية المسؤولة",
    nameFr: "Association Guelmim Tourisme Saharien",
    type: "ASSOCIATION",
    slug: "guelmim-tourisme",
    mission: "تأطير وتنظيم السياحة الصحراوية المسؤولة",
    description: "تنظم القوافي السياحية بمنطقة كلميم وأقا. دورات تدريبية لـ 35 دليل سياحي محلي.",
    tags: "سياحة,صحراء,تدريب",
    regionSlug: "guelmim-oued-noun",
    provinceSlug: "guelmim",
    utilitePublique: false,
    membersCount: 35,
    balance: 27000,
    totalRaised: 142000,
    totalSpent: 115000,
    verifiedBadge: false,
  },
  // COOPERATIVE — Laâyoune-Sakia (fishery)
  {
    name: "تعاونية العيون للمنتجات البحرية",
    nameFr: "Coopérante Laâyoune Produits Marins",
    type: "COOPERATIVE",
    slug: "laayoune-marins",
    mission: "تصفية وتسويق الأسماك والمنتجات البحرية بالعيون",
    description: "تعاونية 22 صياداً. وحدة تصفية وتعليب. صادرات نحو السنغال وموريتانيا.",
    tags: "صيد,بحر,تصدير",
    regionSlug: "laayoune-sakia-el-hamra",
    provinceSlug: "es-semara",
    utilitePublique: false,
    membersCount: 22,
    balance: 38000,
    totalRaised: 198000,
    totalSpent: 160000,
    verifiedBadge: false,
  },
];

async function main() {
  console.log(`\n🌱 Seeding ${ORGANIZATIONS.length} organizations...`);
  let inserted = 0;
  let ledgerInserted = 0;

  for (const org of ORGANIZATIONS) {
    // Look up region + province by slug
    const region = await prisma.region.findUnique({ where: { slug: org.regionSlug } });
    if (!region) {
      console.warn(`  ⚠ Region ${org.regionSlug} not found, skipping ${org.name}`);
      continue;
    }
    const province = await prisma.province.findFirst({
      where: { slug: org.provinceSlug, regionId: region.id },
    });
    if (!province) {
      console.warn(`  ⚠ Province ${org.provinceSlug} not found in ${region.name}, skipping ${org.name}`);
      continue;
    }

    const result = await prisma.organization.upsert({
      where: { slug: org.slug },
      create: {
        name: org.name,
        nameFr: org.nameFr,
        slug: org.slug,
        type: org.type,
        description: org.description,
        mission: org.mission,
        tags: org.tags,
        regionId: region.id,
        provinceId: province.id,
        utilitePublique: org.utilitePublique,
        membersCount: org.membersCount,
        balance: org.balance,
        totalRaised: org.totalRaised,
        totalSpent: org.totalSpent,
        verifiedBadge: org.verifiedBadge,
        legalStatus: "active",
        currency: "MAD",
        isActive: true,
      },
      update: {
        name: org.name,
        nameFr: org.nameFr,
        type: org.type,
        description: org.description,
        mission: org.mission,
        tags: org.tags,
        regionId: region.id,
        provinceId: province.id,
        utilitePublique: org.utilitePublique,
        membersCount: org.membersCount,
        balance: org.balance,
        totalRaised: org.totalRaised,
        totalSpent: org.totalSpent,
        verifiedBadge: org.verifiedBadge,
      },
    });
    inserted++;
    const orgId = result.id;

    // Create ledger entries: 1 credit + 1 debit example per org
    // Credit: example donation
    await prisma.ledgerEntry.create({
      data: {
        organizationId: orgId,
        entryType: "CREDIT",
        amount: org.totalRaised,
        currency: "MAD",
        description: "مجموع المساهمات منذ التأسيس",
        category: "donation",
        source: "external",
        status: "confirmed",
        createdByName: "النظام",
        occurredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    });
    ledgerInserted++;
    // Debit: example expense
    await prisma.ledgerEntry.create({
      data: {
        organizationId: orgId,
        entryType: "DEBIT",
        amount: org.totalSpent,
        currency: "MAD",
        description: "مجموع المصاريف منذ التأسيس",
        category: "expense",
        source: "internal",
        status: "confirmed",
        createdByName: "النظام",
        occurredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    });
    ledgerInserted++;
  }

  console.log(`\n✓ Inserted ${inserted} organizations`);
  console.log(`✓ Inserted ${ledgerInserted} ledger entries\n`);

  // Summary by type
  const byType = await prisma.organization.groupBy({
    by: ["type"],
    _count: { _all: true },
    _sum: { balance: true, totalRaised: true },
  });
  console.log("📊 By type:");
  for (const t of byType) {
    console.log(`  • ${t.type}: ${t._count._all} orgs — balance: ${t._sum.balance || 0} MAD — raised: ${t._sum.totalRaised || 0} MAD`);
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
