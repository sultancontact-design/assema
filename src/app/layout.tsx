import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

/* استيراد الخطوط العربية محلياً (Turbopack يعالج JS imports للـCSS) */
import "@fontsource/tajawal/arabic-400.css";
import "@fontsource/tajawal/arabic-500.css";
import "@fontsource/tajawal/arabic-700.css";
import "@fontsource/tajawal/arabic-800.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-400.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-500.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-600.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { AppChrome } from "@/components/layout/app-chrome";
import { AdsProvider, type AdPlacementType } from "@/components/ads/ads-provider";
import { db } from "@/lib/db";

// ===================================================================
//  جلب إعدادات Google AdSense من جدول Setting (server-side)
//  - يُقرأ مرة واحدة عند كل طلب صفحة
//  - لو active=true و publisherId غير فارغ: يُحقن سكربت AdSense
//  - يُمرَّر القيم إلى AdsProvider (client) ليستهلكه AdPlacement
// ===================================================================

const ADSENSE_SETTING_KEYS = [
  "ads.adsense.publisherId",
  "ads.adsense.active",
  "ads.adsense.testMode",
  // slot IDs اختيارية لكل موضع
  "ads.adsense.slot.header-leaderboard",
  "ads.adsense.slot.sidebar-top",
  "ads.adsense.slot.sidebar-bottom",
  "ads.adsense.slot.in-feed",
  "ads.adsense.slot.in-article",
  "ads.adsense.slot.footer-banner",
] as const;

const SLOT_PLACEMENT_KEYS: ReadonlyArray<{
  setting: string;
  placement: AdPlacementType;
}> = [
  {
    setting: "ads.adsense.slot.header-leaderboard",
    placement: "header-leaderboard",
  },
  {
    setting: "ads.adsense.slot.sidebar-top",
    placement: "sidebar-top",
  },
  {
    setting: "ads.adsense.slot.sidebar-bottom",
    placement: "sidebar-bottom",
  },
  {
    setting: "ads.adsense.slot.in-feed",
    placement: "in-feed",
  },
  {
    setting: "ads.adsense.slot.in-article",
    placement: "in-article",
  },
  {
    setting: "ads.adsense.slot.footer-banner",
    placement: "footer-banner",
  },
];

async function getAdsenseSettings(): Promise<{
  active: boolean;
  publisherId: string;
  testMode: boolean;
  slots: Partial<Record<AdPlacementType, string>>;
}> {
  try {
    const settings = await db.setting.findMany({
      where: { key: { in: [...ADSENSE_SETTING_KEYS] } },
      select: { key: true, value: true },
    });
    const map = new Map(settings.map((s) => [s.key, s.value]));
    const publisherId = (map.get("ads.adsense.publisherId") ?? "").trim();
    const active =
      map.get("ads.adsense.active") === "true" && publisherId.length > 0;
    const testMode = map.get("ads.adsense.testMode") === "true";

    const slots: Partial<Record<AdPlacementType, string>> = {};
    for (const { setting, placement } of SLOT_PLACEMENT_KEYS) {
      const value = map.get(setting);
      if (value && value.trim()) {
        slots[placement] = value.trim();
      }
    }

    return { active, publisherId, testMode, slots };
  } catch {
    // في حال تعذّر الاتصال بقاعدة البيانات، نُظهر placeholders فقط
    return { active: false, publisherId: "", testMode: false, slots: {} };
  }
}

export const metadata: Metadata = {
  title: {
    default: "سيدي يوسف بن علي العاصمة — منصة المعروف الرقمي",
    template: "%s | سيدي يوسف بن علي العاصمة",
  },
  description:
    "منصة ويب اجتماعية تضامنية لرقمنة المعروف المغربي في حي سيدي يوسف بن علي بمراكش. من حي إلى عاصمة... المعروف الرقمي.",
  keywords: [
    "المعروف المغربي",
    "التضامن المجتمعي",
    "حي سيدي يوسف بن علي",
    "مراكش",
    "صندوق الأفراح والأتراح",
    "العمل الخيري",
    "المجتمع المدني",
  ],
  authors: [{ name: "سيدي يوسف بن علي العاصمة" }],
  applicationName: "سيدي يوسف بن علي العاصمة",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "العاصمة",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  openGraph: {
    title: "سيدي يوسف بن علي العاصمة — منصة المعروف الرقمي",
    description: "من حي إلى عاصمة... المعروف الرقمي",
    type: "website",
    locale: "ar_MA",
  },
  twitter: {
    card: "summary_large_image",
    title: "سيدي يوسف بن علي العاصمة",
    description: "من حي إلى عاصمة... المعروف الرقمي",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF6EE" },
    { media: "(prefers-color-scheme: dark)", color: "#15110D" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // جلب إعدادات AdSense من جدول Setting (server-side, ديناميكي)
  const adsense = await getAdsenseSettings();

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <AdsProvider
              active={adsense.active}
              publisherId={adsense.publisherId}
              testMode={adsense.testMode}
              slots={adsense.slots}
            >
              <AppChrome>{children}</AppChrome>
              <Toaster />
              <SonnerToaster position="top-center" />
            </AdsProvider>
          </SessionProvider>
        </ThemeProvider>

        {/* سكربت Google AdSense — يُحقن فقط عند ضبط publisherId و active=true */}
        {adsense.active && adsense.publisherId ? (
          <Script
            id="adsense-script"
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsense.publisherId}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </body>
    </html>
  );
}
