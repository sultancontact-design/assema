// ===================================================================
//  v70.0: Seed communes (الجماعات) — المستوى الإداري الثالث (1,503 nationally)
//  Inserts ~90 representative communes covering all 12 regions:
//    - Major urban communes per region (Tanger, Casa, Rabat, Fès, ...)
//    - Prefectoral arrondissements for Casablanca (5), Rabat (4), Marrakech (5)
//    - Several rural communes per region (3-5)
//  Uses upsert (idempotent — safe to re-run).
// ===================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Slugify helper — matches the style used by seed-provinces:
// lowercase, strip accents + non-alphanumeric, collapse dashes.
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

type CommuneSeed = {
  name: string;
  nameAr: string;
  nameFr?: string;
  provinceSlug: string;
  type: "urban" | "rural" | "arrondissement";
  population?: number;
  latitude?: number;
  longitude?: number;
};

// ===================================================================
//  COMMUNES DATA — ~95 communes covering all 12 regions
// ===================================================================
const COMMUNES: CommuneSeed[] = [
  // === CASABLANCA (prefecture) — main city + 5 arrondissements ===
  { name: "Casablanca", nameAr: "الدار البيضاء", nameFr: "Casablanca", provinceSlug: "casablanca", type: "urban", population: 3344000, latitude: 33.5731, longitude: -7.5898 },
  { name: "Aïn Chock", nameAr: "عين الشق", nameFr: "Aïn Chock", provinceSlug: "casablanca", type: "arrondissement", population: 173000 },
  { name: "Aïn Sebaa", nameAr: "عين السبع", nameFr: "Aïn Sebaa", provinceSlug: "casablanca", type: "arrondissement", population: 252000 },
  { name: "Maârif", nameAr: "المعاريف", nameFr: "Maârif", provinceSlug: "casablanca", type: "arrondissement", population: 371000 },
  { name: "Sidi Bernoussi", nameAr: "سيدي البرنوصي", nameFr: "Sidi Bernoussi", provinceSlug: "casablanca", type: "arrondissement", population: 165000 },
  { name: "Sidi Othmane", nameAr: "سيدي عثمان", nameFr: "Sidi Othmane", provinceSlug: "casablanca", type: "arrondissement", population: 110000 },

  // === RABAT (prefecture) — main city + 4 arrondissements ===
  { name: "Rabat", nameAr: "الرباط", nameFr: "Rabat", provinceSlug: "rabat", type: "urban", population: 577000, latitude: 34.0209, longitude: -6.8416 },
  { name: "Hassan", nameAr: "حسن", nameFr: "Hassan", provinceSlug: "rabat", type: "arrondissement", population: 120000 },
  { name: "Agdal-Ryad", nameAr: "أكدال-الرياض", nameFr: "Agdal-Ryad", provinceSlug: "rabat", type: "arrondissement", population: 80000 },
  { name: "Yacoub El Mansour", nameAr: "يعقوب المنصور", nameFr: "Yacoub El Mansour", provinceSlug: "rabat", type: "arrondissement", population: 210000 },
  { name: "Souissi", nameAr: "السويسي", nameFr: "Souissi", provinceSlug: "rabat", type: "arrondissement", population: 80000 },

  // === MARRAKECH (prefecture) — main city + 5 arrondissements ===
  { name: "Marrakech", nameAr: "مراكش", nameFr: "Marrakech", provinceSlug: "marrakech", type: "urban", population: 928000, latitude: 31.6295, longitude: -7.9811 },
  { name: "Guéliz", nameAr: "كليز", nameFr: "Guéliz", provinceSlug: "marrakech", type: "arrondissement", population: 110000 },
  { name: "Médina", nameAr: "المدينة", nameFr: "Médina", provinceSlug: "marrakech", type: "arrondissement", population: 170000 },
  { name: "Sidi Youssef Ben Ali", nameAr: "سيدي يوسف بن علي", nameFr: "Sidi Youssef Ben Ali", provinceSlug: "marrakech", type: "arrondissement", population: 175000 },
  { name: "Ménara", nameAr: "المنارة", nameFr: "Ménara", provinceSlug: "marrakech", type: "arrondissement", population: 180000 },
  { name: "Anakhil", nameAr: "النخيل", nameFr: "Anakhil", provinceSlug: "marrakech", type: "arrondissement", population: 95000 },

  // === OTHER MAJOR URBAN COMMUNES (one per major city) ===
  { name: "Tanger", nameAr: "طنجة", nameFr: "Tanger", provinceSlug: "tanger-assilah", type: "urban", population: 947000, latitude: 35.7595, longitude: -5.8340 },
  { name: "Fès", nameAr: "فاس", nameFr: "Fès", provinceSlug: "f-s", type: "urban", population: 1117000, latitude: 34.0181, longitude: -5.0078 },
  { name: "Meknès", nameAr: "مكناس", nameFr: "Meknès", provinceSlug: "mekn-s", type: "urban", population: 632000, latitude: 33.8731, longitude: -5.5407 },
  { name: "Agadir", nameAr: "أكادير", nameFr: "Agadir", provinceSlug: "agadir-ida-ou-tanane", type: "urban", population: 421000, latitude: 30.4278, longitude: -9.5981 },
  { name: "Oujda", nameAr: "وجدة", nameFr: "Oujda", provinceSlug: "oujda-angad", type: "urban", population: 494000, latitude: 34.6814, longitude: -1.9086 },
  { name: "Kénitra", nameAr: "القنيطرة", nameFr: "Kénitra", provinceSlug: "k-nitra", type: "urban", population: 432000, latitude: 34.2610, longitude: -6.5802 },
  { name: "Tétouan", nameAr: "تطوان", nameFr: "Tétouan", provinceSlug: "tetouan", type: "urban", population: 380000, latitude: 35.5889, longitude: -5.3622 },
  { name: "Safi", nameAr: "آسفي", nameFr: "Safi", provinceSlug: "safi", type: "urban", population: 308000, latitude: 32.2926, longitude: -9.2332 },
  { name: "El Jadida", nameAr: "الجديدة", nameFr: "El Jadida", provinceSlug: "el-jadida", type: "urban", population: 171000, latitude: 33.2316, longitude: -8.5070 },
  { name: "Nador", nameAr: "الناظور", nameFr: "Nador", provinceSlug: "nador", type: "urban", population: 320000, latitude: 35.1684, longitude: -2.9330 },
  { name: "Béni Mellal", nameAr: "بني ملال", nameFr: "Béni Mellal", provinceSlug: "b-ni-mellal", type: "urban", population: 193000, latitude: 32.3373, longitude: -6.3482 },
  { name: "Ouarzazate", nameAr: "ورزازات", nameFr: "Ouarzazate", provinceSlug: "ouarzazate", type: "urban", population: 71000, latitude: 30.9189, longitude: -6.8934 },
  { name: "Errachidia", nameAr: "الرشيدية", nameFr: "Errachidia", provinceSlug: "errachidia", type: "urban", population: 97000, latitude: 31.9314, longitude: -4.4244 },
  { name: "Taza", nameAr: "تازة", nameFr: "Taza", provinceSlug: "taza", type: "urban", population: 148000, latitude: 34.2140, longitude: -4.0100 },
  { name: "Laâyoune", nameAr: "العيون", nameFr: "Laâyoune", provinceSlug: "la-youne", type: "urban", population: 217000, latitude: 27.1253, longitude: -13.1625 },
  { name: "Dakhla", nameAr: "الداخلة", nameFr: "Dakhla", provinceSlug: "dakhla", type: "urban", population: 106000, latitude: 23.6814, longitude: -15.9584 },
  { name: "Guelmim", nameAr: "كلميم", nameFr: "Guelmim", provinceSlug: "guelmim", type: "urban", population: 117000, latitude: 28.9870, longitude: -10.0574 },

  // === TANGER-TÉTOUAN-AL HOCEÏMA region (rural + secondary urban) ===
  { name: "Martil", nameAr: "مرتيل", provinceSlug: "tetouan", type: "urban", population: 70000 },
  { name: "M'Diq", nameAr: "المضيق", provinceSlug: "m-diq-fnideq", type: "urban", population: 55000 },
  { name: "Fnideq", nameAr: "الفنيدق", provinceSlug: "m-diq-fnideq", type: "urban", population: 60000 },
  { name: "Larache", nameAr: "العرائش", provinceSlug: "larache", type: "urban", population: 125000 },
  { name: "Ksar El Kebir", nameAr: "القصر الكبير", provinceSlug: "larache", type: "urban", population: 130000 },
  { name: "Chefchaouen", nameAr: "شفشاون", provinceSlug: "chefchaouen", type: "urban", population: 44000 },
  { name: "Imzouren", nameAr: "إمزورن", provinceSlug: "al-hoceima", type: "urban", population: 40000 },
  { name: "Targuist", nameAr: "تارجيست", provinceSlug: "al-hoceima", type: "rural", population: 15000 },
  { name: "Bni Boufrah", nameAr: "بني بوفراح", provinceSlug: "al-hoceima", type: "rural", population: 6000 },

  // === L'ORIENTAL region (rural + secondary urban) ===
  { name: "Saïdia", nameAr: "السعيدية", provinceSlug: "berkane", type: "urban", population: 12000 },
  { name: "Aklim", nameAr: "أكليل", provinceSlug: "berkane", type: "rural", population: 14000 },
  { name: "Zaïo", nameAr: "الزايو", provinceSlug: "nador", type: "rural", population: 18000 },
  { name: "Bni Ensar", nameAr: "بني أنصار", provinceSlug: "nador", type: "urban", population: 25000 },
  { name: "El Aïoun Sidi Mellouk", nameAr: "العيون سيدي ملوك", provinceSlug: "taourirt", type: "rural", population: 22000 },
  { name: "Driouch", nameAr: "الدريوش", provinceSlug: "driouch", type: "urban", population: 30000 },
  { name: "Guercif", nameAr: "جرسيف", provinceSlug: "guercif", type: "urban", population: 90000 },

  // === FÈS-MEKNÈS region (rural + secondary urban) ===
  { name: "Sefrou", nameAr: "صفرو", provinceSlug: "sefrou", type: "urban", population: 80000 },
  { name: "Bhalil", nameAr: "بهاليل", provinceSlug: "sefrou", type: "rural", population: 10000 },
  { name: "Moulay Idriss Zerhoun", nameAr: "مولاي إدريس زرهون", provinceSlug: "moulay-yacoub", type: "urban", population: 12000 },
  { name: "Aïn Chkef", nameAr: "عين الشكف", provinceSlug: "moulay-yacoub", type: "rural", population: 13000 },
  { name: "El Hajeb", nameAr: "الحجب", provinceSlug: "el-hajeb", type: "urban", population: 36000 },
  { name: "Agouraï", nameAr: "أكوراي", provinceSlug: "el-hajeb", type: "rural", population: 14000 },
  { name: "Ifrane", nameAr: "إفران", provinceSlug: "ifrane", type: "urban", population: 15000 },
  { name: "Azrou", nameAr: "أزرو", provinceSlug: "ifrane", type: "urban", population: 55000 },
  { name: "Outat El Haj", nameAr: "أوطاط الحاج", provinceSlug: "boulemane", type: "rural", population: 11000 },

  // === RABAT-SALÉ-KÉNITRA region (rural + secondary urban) ===
  { name: "Salé", nameAr: "سلا", provinceSlug: "sal", type: "urban", population: 890000, latitude: 34.0531, longitude: -6.7982 },
  { name: "Sidi Bouknadel", nameAr: "سيدي بوبكر", provinceSlug: "sal", type: "rural", population: 35000 },
  { name: "Témara", nameAr: "تمارة", provinceSlug: "skhirat-t-mara", type: "urban", population: 313000 },
  { name: "Harhoura", nameAr: "الهرهورة", provinceSlug: "skhirat-t-mara", type: "urban", population: 24000 },
  { name: "Skhirat", nameAr: "الصخيرات", provinceSlug: "skhirat-t-mara", type: "urban", population: 47000 },
  { name: "Sidi Kacem", nameAr: "سيدي قاسم", provinceSlug: "sidi-kacem", type: "urban", population: 75000 },
  { name: "Sidi Slimane", nameAr: "سيدي سليمان", provinceSlug: "sidi-slimane", type: "urban", population: 92000 },
  { name: "Mechraa Bel Ksiri", nameAr: "مشرع بلقصيري", provinceSlug: "sidi-kacem", type: "rural", population: 25000 },

  // === CASABLANCA-SETTAT region (rural + secondary urban) ===
  { name: "Mohammedia", nameAr: "المحمدية", provinceSlug: "mohammedia", type: "urban", population: 208000 },
  { name: "Berrechid", nameAr: "برشيد", provinceSlug: "berrechid", type: "urban", population: 65000 },
  { name: "Ouled Saleh", nameAr: "أولاد صالح", provinceSlug: "berrechid", type: "rural", population: 9000 },
  { name: "Settat", nameAr: "سطات", provinceSlug: "settat", type: "urban", population: 142000 },
  { name: "El Borouj", nameAr: "البروج", provinceSlug: "settat", type: "rural", population: 18000 },
  { name: "Azemmour", nameAr: "أزمور", provinceSlug: "el-jadida", type: "urban", population: 50000 },
  { name: "Sidi Bennour", nameAr: "سيدي بنور", provinceSlug: "sidi-bennour", type: "urban", population: 55000 },
  { name: "Ouled Frej", nameAr: "أولاد الفرج", provinceSlug: "sidi-bennour", type: "rural", population: 13000 },

  // === BÉNI MELLAL-KHÉNIFRA region (rural + secondary urban) ===
  { name: "Fquih Ben Salah", nameAr: "فقيه بن صالح", provinceSlug: "fquih-ben-salah", type: "urban", population: 102000 },
  { name: "Kasbat Tadla", nameAr: "قصبة تادلة", provinceSlug: "fquih-ben-salah", type: "urban", population: 47000 },
  { name: "Oued Tarmasht", nameAr: "وادي تارماست", provinceSlug: "fquih-ben-salah", type: "rural", population: 7000 },
  { name: "Khénifra", nameAr: "خنيفرة", provinceSlug: "kh-nifra", type: "urban", population: 117000 },
  { name: "Mrirt", nameAr: "مريرت", provinceSlug: "kh-nifra", type: "rural", population: 35000 },
  { name: "Azilal", nameAr: "أزيلال", provinceSlug: "azilal", type: "urban", population: 30000 },
  { name: "Bzou", nameAr: "بزو", provinceSlug: "azilal", type: "rural", population: 14000 },
  { name: "Aït Attab", nameAr: "آيت عتاب", provinceSlug: "azilal", type: "rural", population: 9000 },

  // === MARRAKECH-SAFI region (rural + secondary urban) ===
  { name: "Essaouira", nameAr: "الصويرة", provinceSlug: "essaouira", type: "urban", population: 78000 },
  { name: "Tamanar", nameAr: "تامانار", provinceSlug: "essaouira", type: "rural", population: 10000 },
  { name: "Chichaoua", nameAr: "شيشاوة", provinceSlug: "chichaoua", type: "urban", population: 35000 },
  { name: "Ida Ou Guail", nameAr: "إدا أو غيل", provinceSlug: "chichaoua", type: "rural", population: 9000 },
  { name: "Tahanaout", nameAr: "تحناوت", provinceSlug: "al-haouz", type: "rural", population: 20000 },
  { name: "Asni", nameAr: "أسني", provinceSlug: "al-haouz", type: "rural", population: 10000 },
  { name: "Ouirgane", nameAr: "ويرگان", provinceSlug: "al-haouz", type: "rural", population: 7000 },
  { name: "El Kelaa des Sraghna", nameAr: "قلعة السراغنة", provinceSlug: "el-kelaa-des-sraghna", type: "urban", population: 95000 },
  { name: "Sidi Rahhal", nameAr: "سيدي راحال", provinceSlug: "el-kelaa-des-sraghna", type: "rural", population: 12000 },
  { name: "Youssoufia", nameAr: "اليوسفية", provinceSlug: "youssoufia", type: "urban", population: 67000 },
  { name: "Rehamna", nameAr: "الرحامنة", provinceSlug: "rehamna", type: "rural", population: 10000 },

  // === DRÂA-TAFILALET region (rural + secondary urban) ===
  { name: "Zagora", nameAr: "زاكورة", provinceSlug: "zagora", type: "urban", population: 40000 },
  { name: "Agdz", nameAr: "أكدز", provinceSlug: "zagora", type: "rural", population: 12000 },
  { name: "M'hamid El Ghizlane", nameAr: "محاميد الغزلان", provinceSlug: "zagora", type: "rural", population: 8000 },
  { name: "Tinghir", nameAr: "تنغير", provinceSlug: "tinghir", type: "urban", population: 36000 },
  { name: "Boumalne Dades", nameAr: "بومالن دادس", provinceSlug: "tinghir", type: "urban", population: 15000 },
  { name: "Midelt", nameAr: "ميدلت", provinceSlug: "midelt", type: "urban", population: 45000 },
  { name: "Itzer", nameAr: "إيتزر", provinceSlug: "midelt", type: "rural", population: 9000 },

  // === SOUSS-MASSA region (rural + secondary urban) ===
  { name: "Inezgane", nameAr: "إنزكان", provinceSlug: "inezgane-a-t-melloul", type: "urban", population: 122000 },
  { name: "Aït Melloul", nameAr: "آيت ملول", provinceSlug: "inezgane-a-t-melloul", type: "urban", population: 75000 },
  { name: "Dcheira El Jihadia", nameAr: "الدشيرة الجهادية", provinceSlug: "inezgane-a-t-melloul", type: "urban", population: 100000 },
  { name: "Tikiine", nameAr: "تيكيين", provinceSlug: "inezgane-a-t-melloul", type: "rural", population: 8000 },
  { name: "Oulad Teima", nameAr: "أولاد تايمة", provinceSlug: "taroudant", type: "urban", population: 89000 },
  { name: "Taliouine", nameAr: "تالوين", provinceSlug: "taroudant", type: "urban", population: 26000 },
  { name: "Aït Iaaza", nameAr: "آيت يعزة", provinceSlug: "taroudant", type: "rural", population: 14000 },
  { name: "Sidi Bibi", nameAr: "سيدي بيبي", provinceSlug: "tiznit", type: "rural", population: 14000 },
  { name: "Arbaa Aït Ahmed", nameAr: "أربعة آيت أحمد", provinceSlug: "tiznit", type: "rural", population: 8000 },
  { name: "Fask", nameAr: "فاسك", provinceSlug: "tiznit", type: "rural", population: 11000 },
  { name: "Biougra", nameAr: "بيوكرى", provinceSlug: "chtouka-a-t-baha", type: "urban", population: 28000 },
  { name: "Aït Baha", nameAr: "آيت باها", provinceSlug: "chtouka-a-t-baha", type: "urban", population: 25000 },
  { name: "Tata", nameAr: "طاطا", provinceSlug: "tata", type: "urban", population: 18000 },
  { name: "Akka", nameAr: "أكا", provinceSlug: "tata", type: "rural", population: 10000 },

  // === GUELMIM-OUED NOUN region (rural + secondary urban) ===
  { name: "Taghjijt", nameAr: "تغجيجت", provinceSlug: "guelmim", type: "rural", population: 8000 },
  { name: "Asrir", nameAr: "أسرير", provinceSlug: "guelmim", type: "rural", population: 6000 },
  { name: "Sidi Ifni", nameAr: "سيدي إفني", provinceSlug: "sidi-ifni", type: "urban", population: 23000 },
  { name: "Mirleft", nameAr: "ميرلفت", provinceSlug: "sidi-ifni", type: "rural", population: 6000 },
  { name: "Tan-Tan", nameAr: "طانطان", provinceSlug: "tan-tan", type: "urban", population: 73000 },
  { name: "El Ouatia", nameAr: "الوطية", provinceSlug: "tan-tan", type: "rural", population: 10000 },
  { name: "Assa", nameAr: "آسا", provinceSlug: "assa-zag", type: "rural", population: 12000 },
  { name: "Zag", nameAr: "الزاك", provinceSlug: "assa-zag", type: "rural", population: 6000 },

  // === LAÂYOUNE-SAKIA EL HAMRA region ===
  { name: "El Marsa", nameAr: "المرسى", provinceSlug: "la-youne", type: "urban", population: 17000 },
  { name: "Boujdour", nameAr: "بوجدور", provinceSlug: "boujdour", type: "urban", population: 41000 },
  { name: "Lagouira", nameAr: "لكويرة", provinceSlug: "boujdour", type: "rural", population: 4000 },
  { name: "Tarfaya", nameAr: "طرفاية", provinceSlug: "tarfaya", type: "rural", population: 5600 },
  { name: "Es-Semara", nameAr: "السمارة", provinceSlug: "es-semara", type: "rural", population: 60000 },

  // === DAKHLA-OUED ED-DAHAB region ===
  { name: "Bir Anzarane", nameAr: "بير أنزران", provinceSlug: "dakhla", type: "rural", population: 7000 },
  { name: "Aousserd", nameAr: "أوسرد", provinceSlug: "aousserd", type: "rural", population: 12000 },
  { name: "Lmiguent", nameAr: "لمگوينت", provinceSlug: "aousserd", type: "rural", population: 5000 },
];

// ===================================================================
//  Main
// ===================================================================
async function main() {
  console.log("🌱 Seeding communes (الجماعات)...");

  // Build provinceSlug → {id, regionId} lookup
  const provinces = await prisma.province.findMany({
    select: { id: true, slug: true, name: true, nameAr: true, regionId: true },
  });
  const provinceBySlug = new Map(provinces.map((p) => [p.slug, p]));
  console.log(`  → Found ${provinces.length} provinces in DB`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const provincesTouched = new Set<string>();

  for (const c of COMMUNES) {
    const province = provinceBySlug.get(c.provinceSlug);
    if (!province) {
      console.warn(`  ⚠ Province not found for slug "${c.provinceSlug}" — commune "${c.name}" skipped`);
      skipped++;
      continue;
    }

    const slug = slugify(c.name);
    if (!slug) {
      console.warn(`  ⚠ Could not generate slug for commune "${c.name}" — skipped`);
      skipped++;
      continue;
    }

    const result = await prisma.commune.upsert({
      where: { slug },
      update: {
        name: c.name,
        nameAr: c.nameAr,
        nameFr: c.nameFr ?? null,
        type: c.type,
        provinceId: province.id,
        regionId: province.regionId ?? null,
        ...(c.population !== undefined ? { population: c.population } : {}),
        ...(c.latitude !== undefined ? { latitude: c.latitude } : {}),
        ...(c.longitude !== undefined ? { longitude: c.longitude } : {}),
        isActive: true,
      },
      create: {
        name: c.name,
        nameAr: c.nameAr,
        nameFr: c.nameFr ?? null,
        slug,
        type: c.type,
        provinceId: province.id,
        regionId: province.regionId ?? null,
        ...(c.population !== undefined ? { population: c.population } : {}),
        ...(c.latitude !== undefined ? { latitude: c.latitude } : {}),
        ...(c.longitude !== undefined ? { longitude: c.longitude } : {}),
      },
    });

    // Differentiate inserts from updates by checking createdAt timestamp distance (rough)
    // — we can't get back an "isInsert" flag from upsert, so we use the simple "touched" approach.
    provincesTouched.add(province.id);
    void result; // silence unused
    inserted++;
  }

  // Summary
  const counts = await prisma.commune.groupBy({
    by: ["type"],
    _count: true,
  });

  const total = await prisma.commune.count();
  const totalProvinces = await prisma.province.count();
  const totalRegions = await prisma.region.count();
  const totalCities = await prisma.city.count();

  console.log("");
  console.log(`✓ Inserted/updated ${inserted + updated} communes across ${provincesTouched.size} provinces`);
  console.log(`  (skipped: ${skipped})`);
  console.log("");
  console.log("📊 Communes by type:");
  for (const row of counts) {
    console.log(`  • ${row.type}: ${row._count}`);
  }
  console.log("");
  console.log("📊 Final DB counts:");
  console.log(`  Regions:   ${totalRegions}`);
  console.log(`  Provinces: ${totalProvinces}`);
  console.log(`  Cities:    ${totalCities}`);
  console.log(`  Communes:  ${total}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("❌ seed-communes failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
