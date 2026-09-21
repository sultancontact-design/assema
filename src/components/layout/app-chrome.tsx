"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { BottomNav } from "@/components/layout/bottom-nav";

/**
 * غلاف كروم التطبيق — يقرّر متى يُظهر كروم الموقع العام (ترويسة/تذييل/شريط سفلي)
 * ومتى يُخفيه (القسم الإداري له كرومه الخاص)
 *
 * يعتمد على المسار: أي مسار يبدأ بـ /admin يُخفي الكروم العام.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <main className="flex-1 flex flex-col">{children}</main>;
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex flex-col">{children}</main>
      <SiteFooter />
      <BottomNav />
    </>
  );
}
