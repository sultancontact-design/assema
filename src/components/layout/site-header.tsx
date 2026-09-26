"use client";

// ===================================================================
//  SiteHeader — ترويسة الموقع
//  - Sticky top, RTL nav, sheet للجوال
//  - 5 روابط + login (للزوّار) / streak + notifications + avatar (للأعضاء)
// ===================================================================

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, X, Heart, Users, CalendarDays, Home as HomeIcon, Newspaper, Mail, MessageSquare, Lightbulb, Gift, BookOpen, Tag, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SiteLogo } from "@/components/shared/site-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { StreakWidget } from "@/components/community/streak-widget";
import { SmartNotificationCenter } from "@/components/community/smart-notification-center";
import { AdPlacement } from "@/components/ads/ad-placement";

const NAV_LINKS = [
  { href: "/", label: "الرئيسية", icon: HomeIcon },
  { href: "/community", label: "المجتمع", icon: Users },
  { href: "/community/fund", label: "صندوق المعروف", icon: Heart },
  { href: "/community/events", label: "الفعاليات", icon: CalendarDays },
  { href: "/community/groups", label: "المجموعات", icon: Newspaper },
  { href: "/community/messages", label: "الرسائل", icon: Mail },
  { href: "/community/discussions", label: "النقاشات", icon: MessageSquare },
  { href: "/community/initiatives", label: "المبادرات", icon: Lightbulb },
  { href: "/community/store", label: "المتجر", icon: Gift },
  { href: "/blog", label: "المدوّنة", icon: BookOpen },
  { href: "/community/prices", label: "الأسعار", icon: Tag },
  { href: "/guide", label: "دليل الحي", icon: Compass },
];

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = React.useState(false);
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const [streakData, setStreakData] = React.useState<{
    currentStreak: number;
    freezes: number;
    atRisk: boolean;
    checkedInToday: boolean;
    longestStreak: number;
    totalCheckIns: number;
    hoursUntilBreak: number;
  } | null>(null);
  const [notifInitial, setNotifInitial] = React.useState<
    Array<{
      id: string;
      type: string;
      title: string;
      body: string;
      actionUrl: string | null;
      icon: string | null;
      sentAt: string;
      openedAt: string | null;
    }>
  >([]);
  const [notifUnread, setNotifUnread] = React.useState(0);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // جلب حالة السلسلة + الإشعارات للمستخدم الحالي
  React.useEffect(() => {
    if (!isAuthenticated) return;
    void (async () => {
      try {
        const [streakRes, notifRes] = await Promise.all([
          fetch("/api/community/streak/check-in", { cache: "no-store" }),
          fetch("/api/community/notifications", { cache: "no-store" }),
        ]);
        if (streakRes.ok) {
          const sd = await streakRes.json();
          setStreakData({
            currentStreak: sd.currentStreak ?? 0,
            longestStreak: sd.longestStreak ?? 0,
            freezes: sd.freezes ?? 0,
            atRisk: sd.atRisk ?? false,
            checkedInToday: sd.checkedInToday ?? false,
            totalCheckIns: sd.totalCheckIns ?? 0,
            hoursUntilBreak: sd.hoursUntilBreak ?? 48,
          });
        }
        if (notifRes.ok) {
          const nd = await notifRes.json();
          setNotifInitial(nd.notifications ?? []);
          setNotifUnread(nd.unreadCount ?? 0);
        }
      } catch {
        // تجاهل
      }
    })();
  }, [isAuthenticated]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-4">
          {/* الشعار — جهة اليمين في RTL */}
          <SiteLogo size="md" />

          {/* قائمة سطح المكتب */}
          <nav className="hidden lg:flex items-center gap-0.5" aria-label="القائمة الرئيسية">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const active =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:bg-accent/40 hover:text-accent-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="whitespace-nowrap">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* الإجراءات — جهة اليسار في RTL */}
          <div className="flex items-center gap-1.5">
            {isAuthenticated && streakData && (
              <div className="hidden sm:block">
                <StreakWidget variant="compact" initial={streakData} />
              </div>
            )}

            {isAuthenticated && (
              <SmartNotificationCenter
                initialNotifications={notifInitial}
                initialUnreadCount={notifUnread}
              />
            )}

            <ThemeToggle />

            {!isAuthenticated && (
              <div className="hidden sm:block">
                <Button asChild size="sm" variant="default">
                  <Link href="/login">تسجيل الدخول</Link>
                </Button>
              </div>
            )}

            {isAuthenticated && (
              <div className="hidden sm:block">
                <Button asChild size="sm" variant="outline">
                  <Link href="/community">لوحتي</Link>
                </Button>
              </div>
            )}

            {/* زر القائمة على الجوال */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="فتح القائمة"
                >
                  {open ? <X className="size-5" /> : <Menu className="size-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="text-start">القائمة</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-2 mt-4">
                  {NAV_LINKS.map((link) => {
                    const Icon = link.icon;
                    const active =
                      pathname === link.href ||
                      (link.href !== "/" && pathname.startsWith(link.href));
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-foreground/70 hover:bg-accent/40"
                        )}
                      >
                        <Icon className="size-4" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                  <div className="my-2 h-px bg-border" />
                  {isAuthenticated ? (
                    <>
                      <Button asChild size="sm" className="w-full">
                        <Link href="/community">لوحتي</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="w-full">
                        <Link href="/ethics">تصميمنا الأخلاقي</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild size="sm" className="w-full">
                        <Link href="/login">تسجيل الدخول</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="w-full">
                        <Link href="/register">حساب جديد</Link>
                      </Button>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* بانر إعلاني علوي — header-leaderboard، تحت الترويسة مباشرة */}
      <div className="border-b border-border bg-muted/20">
        <div className="container mx-auto px-4 py-2">
          <AdPlacement
            placement="header-leaderboard"
            className="mx-auto w-full max-w-[728px]"
          />
        </div>
      </div>
    </>
  );
}
