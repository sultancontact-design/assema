"use client";

// ===================================================================
//  SiteHeader v63.0 — Simplified, clean, social-network style
//  - Sticky top, RTL, minimal: Logo + Search + Notifications + User
//  - All nav links moved to CollapsibleSidebar (v61.0)
//  - No clutter, no overlapping buttons
//  - Mobile: hamburger opens sidebar Sheet
// ===================================================================

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, Bell, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SiteLogo } from "@/components/shared/site-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SmartNotificationCenter } from "@/components/community/smart-notification-center";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const [notifInitial, setNotifInitial] = React.useState<
    Array<{
      id: string;
      title: string;
      body?: string;
      type: string;
      isRead: boolean;
      createdAt: string;
    }>
  >([]);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const userInitial = session?.user?.name?.slice(0, 1) ?? "أ";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-fluid flex h-16 items-center justify-between gap-4">
        {/* 1. Mobile menu + Logo */}
        <div className="flex items-center gap-2">
          {/* Mobile hamburger — opens Sheet with nav links */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="فتح القائمة"
              >
                {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetHeader className="p-4 border-b border-border">
                <SheetTitle className="text-start">
                  <SiteLogo size="sm" />
                </SheetTitle>
              </SheetHeader>
              <nav className="px-2 py-3 overflow-y-auto">
                <MobileNavLinks onNavigate={() => setMobileOpen(false)} />
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo — always visible */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <SiteLogo size="sm" />
          </Link>
        </div>

        {/* 2. Search (desktop only, center) */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="ابحث في المنصة..."
              className="ps-9 h-10 rounded-full bg-muted/50 border-transparent focus-visible:border-border"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const q = (e.target as HTMLInputElement).value.trim();
                  if (q) window.location.href = `/feed?q=${encodeURIComponent(q)}`;
                }
              }}
            />
          </div>
        </div>

        {/* 3. Actions: Notifications + Theme + User/Login */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Notifications (authenticated only) */}
          {isAuthenticated && <SmartNotificationCenter initialNotifications={notifInitial} />}

          {/* User menu or login */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full p-0.5 hover:bg-muted/60 transition-colors" aria-label="قائمة المستخدم">
                  <Avatar className="size-9 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold text-sm">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/community/profile" className="cursor-pointer">الملف الشخصي</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/wallet" className="cursor-pointer">المحفظة</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/community/gamification" className="cursor-pointer">النقاط والشارات</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {session?.user?.role === "SUPER_ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard" className="cursor-pointer font-semibold text-primary">لوحة الإدارة</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/api/auth/signout?callbackUrl=/" className="cursor-pointer text-red-600">تسجيل الخروج</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="rounded-full h-9 px-4">
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

// ===================================================================
//  MobileNavLinks — روابط القائمة للجوال (same as sidebar)
// ===================================================================

const MOBILE_NAV = [
  { section: "الشبكة", links: [
    { href: "/", label: "الرئيسية" },
    { href: "/feed", label: "المنشورات" },
    { href: "/discover", label: "اكتشف" },
    { href: "/community/members", label: "الأعضاء" },
    { href: "/community/messages", label: "الرسائل" },
    { href: "/community/profile", label: "ملفي الشخصي" },
  ]},
  { section: "المجتمع", links: [
    { href: "/community", label: "المجتمع" },
    { href: "/community/fund", label: "صندوق المعروف" },
    { href: "/community/events", label: "الفعاليات" },
    { href: "/community/groups", label: "المجموعات" },
    { href: "/community/discussions", label: "النقاشات" },
    { href: "/community/initiatives", label: "المبادرات" },
  ]},
  { section: "المعرفة", links: [
    { href: "/blog", label: "المدوّنة" },
    { href: "/videos", label: "الفيديوهات" },
    { href: "/community/services", label: "الخدمات" },
    { href: "/community/prices", label: "أسعار السوق" },
    { href: "/guide", label: "دليل الحي" },
  ]},
  { section: "الانتماء", links: [
    { href: "/community/store", label: "المتجر" },
    { href: "/community/gamification", label: "النقاط والشارات" },
    { href: "/community/leaderboard", label: "المتصدرون" },
    { href: "/community/map-3d", label: "الخريطة" },
    { href: "/wallet", label: "المحفظة" },
  ]},
];

function MobileNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "/";
  return (
    <div className="space-y-4">
      {MOBILE_NAV.map((section) => (
        <div key={section.section}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mb-2">
            {section.section}
          </p>
          <ul className="space-y-0.5">
            {section.links.map((link) => {
              const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onNavigate}
                    className={cn(
                      "block px-3 py-2.5 rounded-md text-sm transition-colors min-h-11",
                      active
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground/70 hover:bg-accent/30 hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
