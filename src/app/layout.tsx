import type { Metadata, Viewport } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
            <AppChrome>{children}</AppChrome>
            <Toaster />
            <SonnerToaster position="top-center" />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
