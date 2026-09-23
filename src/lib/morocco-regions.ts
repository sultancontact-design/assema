// ===================================================================
//  morocco-regions.ts — جهات المغرب الـ12 (مُعطيات SVG مبسّطة)
//  الخريطة مبسّطة (stylized) — ليست دقيقة جغرافياً
//  تُستعمل في src/components/community/morocco-map.tsx
// ===================================================================

export interface MoroccoRegionShape {
  slug: string;
  nameAr: string;
  nameFr: string;
  /** مُقاربة موقع الجهة على شبكة 320×360 */
  boundarySvg: string;
  /** هل هي الجهة الافتراضية (مراكش-آسفي)؟ */
  isPrimary?: boolean;
}

/**
 * 12 جهة حسب التقسيم الإداري 2015 للمغرب
 * المسارات SVG مُبسّطة (polygons) لتمثيل مرئي أنيق
 */
export const MOROCCO_REGIONS: MoroccoRegionShape[] = [
  {
    slug: "tanger-tetouan-al-hoceima",
    nameAr: "طنجة-تطوان-الحسيمة",
    nameFr: "Tanger-Tétouan-Al Hoceïma",
    boundarySvg: "M 35 12 L 200 8 L 215 38 L 60 42 Z",
  },
  {
    slug: "oriental",
    nameAr: "الشرق",
    nameFr: "L'Oriental",
    boundarySvg: "M 200 8 L 308 26 L 302 108 L 210 100 L 215 38 Z",
  },
  {
    slug: "fes-meknes",
    nameAr: "فاس-مكناس",
    nameFr: "Fès-Meknès",
    boundarySvg: "M 60 42 L 215 38 L 210 100 L 130 104 L 70 82 Z",
  },
  {
    slug: "rabat-sale-kenitra",
    nameAr: "الرباط-سلا-القنيطرة",
    nameFr: "Rabat-Salé-Kénitra",
    boundarySvg: "M 35 42 L 60 42 L 70 82 L 60 132 L 25 112 L 22 60 Z",
  },
  {
    slug: "casablanca-settat",
    nameAr: "الدار البيضاء-سطات",
    nameFr: "Casablanca-Settat",
    boundarySvg: "M 22 112 L 60 132 L 88 180 L 38 178 L 12 138 Z",
  },
  {
    slug: "beni-mellal-khenifra",
    nameAr: "بني ملال-خنيفرة",
    nameFr: "Béni Mellal-Khénifra",
    boundarySvg: "M 88 130 L 210 100 L 198 162 L 105 168 L 90 132 Z",
  },
  {
    slug: "marrakech-safi",
    nameAr: "مراكش-آسفي",
    nameFr: "Marrakech-Safi",
    isPrimary: true,
    boundarySvg: "M 38 178 L 88 180 L 105 168 L 130 232 L 70 232 L 32 200 Z",
  },
  {
    slug: "draa-tafilalet",
    nameAr: "درعة-تافيلالت",
    nameFr: "Drâa-Tafilalet",
    boundarySvg: "M 198 100 L 302 108 L 290 222 L 220 232 L 130 232 L 198 162 Z",
  },
  {
    slug: "souss-massa",
    nameAr: "سوس-ماسة",
    nameFr: "Souss-Massa",
    boundarySvg: "M 32 200 L 70 232 L 130 232 L 145 272 L 88 292 L 32 252 Z",
  },
  {
    slug: "guelmim-oued-noun",
    nameAr: "كلميم-واد نون",
    nameFr: "Guelmim-Oued Noun",
    boundarySvg: "M 32 252 L 88 292 L 145 272 L 162 318 L 80 328 L 28 304 Z",
  },
  {
    slug: "laayoune-sakia-el-hamra",
    nameAr: "العيون-الساقية الحمراء",
    nameFr: "Laâyoune-Sakia El Hamra",
    boundarySvg: "M 28 304 L 80 328 L 162 318 L 170 355 L 18 355 Z",
  },
  {
    slug: "dakhla-oued-ed-dahab",
    nameAr: "الداخلة-وادي الذهب",
    nameFr: "Dakhla-Oued Ed-Dahab",
    boundarySvg: "M 18 355 L 170 355 L 165 332 L 90 332 L 25 350 Z",
  },
];

/**
 * خريطة بين slug الجهة واسمها العربي/الفرنسي القياسي
 * (مطابق لما في MOROCCO_REGIONS لكن للاستعلام المباشر)
 */
export const REGION_BY_SLUG: Record<string, MoroccoRegionShape> =
  Object.fromEntries(MOROCCO_REGIONS.map((r) => [r.slug, r]));
