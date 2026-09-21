"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, CalendarDays, Users, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * شريط التنقل السفلي — خاص بالجوال فقط
 * يظهر تحت md breakpoint لضمان سهولة الوصول للأقسام الأساسية
 */
const NAV_ITEMS = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/community/fund", label: "المعروف", icon: Heart },
  { href: "/community/events", label: "الفعاليات", icon: CalendarDays },
  { href: "/community", label: "المجتمع", icon: Users },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      aria-label="شريط التنقل السفلي"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="grid grid-cols-4 gap-1 px-1 py-1">
        {NAV_ITEMS.map((item) => {
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
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
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
          <Link
            href="/community/groups"
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 rounded-md py-2 px-1 text-[10px] font-medium transition-colors min-h-[44px]",
              pathname.startsWith("/community/groups")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Menu className="size-5" />
            <span className="truncate">المزيد</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
