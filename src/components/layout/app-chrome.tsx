"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CollapsibleSidebar } from "@/components/layout/collapsible-sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PwaInstallPrompt } from "@/components/community/pwa-install-prompt";
import { CookieConsent } from "@/components/layout/cookie-consent";
import { OnboardingFlow } from "@/components/community/onboarding-flow";

/**
 * غلاف كروم التطبيق — يقرّر متى يُظهر كروم الموقع العام (ترويسة/تذييل/شريط سفلي)
 * ومتى يُخفيه (القسم الإداري له كرومه الخاص)
 *
 * v17.0: يُضيف CollapsibleSidebar على كل الصفحات العامة (غير الإدارية)
 * v21.0: يُضيف القائمة الجانبية بشكل دائم للزوار
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const isAdmin = pathname.startsWith("/admin");
  const isCommunity = pathname.startsWith("/community");

  if (isAdmin) {
    return <main className="flex-1 flex flex-col">{children}</main>;
  }

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 min-h-0">
        {/* v21.0: Sidebar for visitors — قائمة شاملة بكل الأقسام */}
        <CollapsibleSidebar />
        <main className="flex-1 flex flex-col min-w-0">{children}</main>
      </div>
      <SiteFooter />
      <BottomNav />
      <PwaInstallPrompt />
      <CookieConsent />
      {isCommunity && <OnboardingFlow />}
    </>
  );
}
