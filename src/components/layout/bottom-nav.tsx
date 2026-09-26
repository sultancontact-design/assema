"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, CalendarDays, Gift, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * شريط التنقل السفلي — خاص بالجوال فقط
 * v21.0: 4 primary + 1 'المزيد' (Sheet بكل الأقسام)
 */
const PRIMARY_NAV = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/community/fund", label: "المعروف", icon: Heart },
  { href: "/community/events", label: "الفعاليات", icon: CalendarDays },
  { href: "/community/store", label: "المتجر", icon: Gift },
];

const MORE_NAV = [
  { href: "/community", label: "المجتمع" },
  { href: "/community/groups", label: "المجموعات" },
  { href: "/community/messages", label: "الرسائل" },
  { href: "/community/discussions", label: "النقاشات" },
  { href: "/community/initiatives", label: "المبادرات" },
  { href: "/blog", label: "المدوّنة" },
  { href: "/community/prices", label: "الأسعار" },
  { href: "/guide", label: "دليل الحي" },
  { href: "/privacy-requests", label: "حماية البيانات" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      aria-label="شريط التنقل السفلي"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="grid grid-cols-5 gap-1 px-1 py-1">
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 rounded-md py-2 px-1 text-[10px] font-medium transition-colors min-h-[44px]",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-5" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <details className="relative">
            <summary className="list-none flex flex-col items-center justify-center gap-0.5 rounded-md py-2 px-1 text-[10px] font-medium transition-colors min-h-[44px] cursor-pointer text-muted-foreground hover:text-foreground">
              <Menu className="size-5" />
              <span className="truncate">المزيد</span>
            </summary>
            <div className="absolute bottom-full end-0 mb-2 w-56 rounded-lg border border-border bg-background shadow-lg overflow-hidden">
              {MORE_NAV.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block px-4 py-2.5 text-sm transition-colors",
                      active ? "bg-primary/5 text-primary font-medium" : "text-foreground hover:bg-muted"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </details>
        </li>
      </ul>
    </nav>
  );
}
