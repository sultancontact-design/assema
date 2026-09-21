"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Heart, Users, CalendarDays, Home as HomeIcon, Newspaper } from "lucide-react";
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

const NAV_LINKS = [
  { href: "/", label: "الرئيسية", icon: HomeIcon },
  { href: "/community", label: "المجتمع", icon: Users },
  { href: "/community/fund", label: "صندوق المعروف", icon: Heart },
  { href: "/community/events", label: "الفعاليات", icon: CalendarDays },
  { href: "/community/groups", label: "المجموعات", icon: Newspaper },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  // أغلق القائمة الجانبية عند تغيّر المسار
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-4">
        {/* الشعار — جهة اليمين في RTL */}
        <SiteLogo size="md" />

        {/* قائمة سطح المكتب */}
        <nav className="hidden md:flex items-center gap-1" aria-label="القائمة الرئيسية">
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
                  "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:bg-accent/40 hover:text-accent-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* الإجراءات — جهة اليسار في RTL */}
        <div className="flex items-center gap-1.5">
          <div className="hidden sm:block">
            <Button asChild size="sm" variant="default">
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
          </div>
          <ThemeToggle />

          {/* زر القائمة على الجوال */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
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
                <Button asChild size="sm" className="w-full">
                  <Link href="/login">تسجيل الدخول</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link href="/register">حساب جديد</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
