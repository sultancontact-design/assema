"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Heart, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * BottomNav v66.0 — 5 items, Teal active state, mobile only
 * - Home, Community, Fund, Notifications, Account
 * - Sticky bottom, no jump on scroll
 * - RTL aware
 */
const NAV_ITEMS = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/community", label: "المجتمع", icon: Users },
  { href: "/community/fund", label: "المعروف", icon: Heart },
  { href: "/community/messages", label: "الإشعارات", icon: Bell },
  { href: "/community/profile", label: "حسابي", icon: User },
];

export function BottomNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      data-bottom-nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="التنقل السفلي"
    >
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 min-h-11 relative"
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <span
                  className="absolute top-0 h-1 w-8 rounded-full"
                  style={{ backgroundColor: "var(--primary)" }}
                  aria-hidden
                />
              )}
              <Icon
                className={cn(
                  "size-5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
                style={active ? { color: "var(--primary)" } : undefined}
              />
              <span
                className={cn(
                  "text-[10px] transition-colors",
                  active
                    ? "font-bold text-primary"
                    : "text-muted-foreground"
                )}
                style={active ? { color: "var(--primary)" } : undefined}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
