import type { MetadataRoute } from "next";

/**
 * Manifest — سيدي يوسف بن علي العاصمة
 * منصة المعروف الرقمي لحي سيدي يوسف بن علي بمراكش
 *
 * - dir="rtl" lang="ar" لدعم العربية RTL
 * - theme_color: ترابي زليج #B8492B
 * - background_color: كريم #FBF6EE
 * - display: standalone — تجربة شبيهة بالتطبيق الأصلي
 * - orientation: portrait — الجوال أولاً
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "سيدي يوسف بن علي العاصمة — منصة المعروف الرقمي",
    short_name: "العاصمة",
    description: "منصة المعروف الرقمي لحي سيدي يوسف بن علي بمراكش",
    start_url: "/",
    display: "standalone",
    theme_color: "#B8492B",
    background_color: "#FBF6EE",
    dir: "rtl",
    lang: "ar",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
      {
        src: "/icon-512-maskable.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    categories: ["social", "community", "lifestyle"],
    shortcuts: [
      {
        name: "صندوق المعروف",
        short_name: "الصندوق",
        description: "ساهم أو اطلب من صندوق المعروف",
        url: "/community/fund",
      },
      {
        name: "الفعاليات",
        short_name: "فعاليات",
        description: "الفعاليات القادمة في الحي",
        url: "/community/events",
      },
      {
        name: "المجموعات",
        short_name: "مجموعات",
        description: "مجتمعات الحي النشطة",
        url: "/community/groups",
      },
    ],
  };
}
