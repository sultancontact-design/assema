"use client";

// ===================================================================
//  CollapsibleSidebar v61.0 — 3-mode sidebar (expanded/collapsed/hidden)
//  - position: sticky (in-flow, NOT fixed) — no longer covers content
//  - 3 modes saved to localStorage
//  - Mobile: Sheet (off-canvas) as before
//  - When hidden: floating reopen button (visible on desktop)
// ===================================================================

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Users,
  Heart,
  CalendarDays,
  Newspaper,
  Mail,
  MessageSquare,
  Lightbulb,
  Gift,
  MapPin,
  BookOpen,
  Compass,
  Award,
  History,
  Tag,
  Megaphone,
  ShieldCheck,
  Trophy,
  Crown,
  Video,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SidebarMode = "expanded" | "collapsed" | "hidden";

const WIDTHS: Record<SidebarMode, number> = {
  expanded: 224,
  collapsed: 64,
  hidden: 0,
};

// ===================================================================
//  عناصر القائمة
// ===================================================================
const NAV_ITEMS = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/feed", label: "الحي الآن", icon: Users },
  { href: "/discover", label: "اكتشف", icon: Compass },
  { href: "/community", label: "المجتمع", icon: Users },
  { href: "/community/profile", label: "ملفي الشخصي", icon: Home },
  { href: "/community/fund", label: "صندوق المعروف", icon: Heart },
  { href: "/community/events", label: "الفعاليات", icon: CalendarDays },
  { href: "/community/groups", label: "المجموعات", icon: Newspaper },
  { href: "/community/messages", label: "الرسائل", icon: Mail },
  { href: "/community/discussions", label: "النقاشات", icon: MessageSquare },
  { href: "/community/initiatives", label: "المبادرات", icon: Lightbulb },
  { href: "/community/store", label: "المتجر", icon: Gift },
  { href: "/community/gamification", label: "المكافآت", icon: Trophy },
  { href: "/community/leaderboard", label: "المتصدرون", icon: Crown },
  { href: "/community/following", label: "المتابعة", icon: Users },
  { href: "/community/map-3d", label: "الخريطة", icon: MapPin },
  { href: "/blog", label: "المدوّنة", icon: BookOpen },
  { href: "/videos", label: "الفيديوهات", icon: Video },
  { href: "/guide", label: "دليل الحي", icon: Compass },
  { href: "/stories", label: "قصص النجاح", icon: Award },
  { href: "/history", label: "تاريخ الحي", icon: History },
  { href: "/community/prices", label: "أسعار السوق", icon: Tag },
  { href: "/community/contributions/price-report", label: "أبلغ عن سعر", icon: Megaphone },
  { href: "/privacy-requests", label: "حماية البيانات", icon: ShieldCheck },
  { href: "/ethics", label: "الأخلاق", icon: Heart },
] as const;

// ===================================================================
//  Hook: 3-mode state (expanded/collapsed/hidden) — saved to localStorage
// ===================================================================
function useSidebarMode() {
  const [mode, setMode] = React.useState<SidebarMode>("expanded");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    try {
      const stored = window.localStorage.getItem("sidebar.mode") as SidebarMode | null;
      if (stored === "expanded" || stored === "collapsed" || stored === "hidden") {
        setMode(stored);
      }
    } catch {
      // تجاهل
    }
  }, []);

  const update = React.useCallback((next: SidebarMode) => {
    setMode(next);
    try {
      window.localStorage.setItem("sidebar.mode", next);
    } catch {
      // تجاهل
    }
  }, []);

  // Cycle: expanded → collapsed → hidden → expanded
  const cycle = React.useCallback(() => {
    setMode((prev) => {
      const next: SidebarMode =
        prev === "expanded" ? "collapsed" : prev === "collapsed" ? "hidden" : "expanded";
      try {
        window.localStorage.setItem("sidebar.mode", next);
      } catch {
        // تجاهل
      }
      return next;
    });
  }, []);

  return { mode, setMode: update, cycle, mounted };
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href);
}

// ===================================================================
//  NavItems — قائمة العناصر (collapsed=أيقونات فقط)
// ===================================================================
const NavItems = React.forwardRef<
  HTMLUListElement,
  { collapsed: boolean; onNavigate?: () => void }
>(({ collapsed, onNavigate }, ref) => {
  const pathname = usePathname() ?? "/";
  return (
    <TooltipProvider delayDuration={200}>
      <ul ref={ref} className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          const linkContent = (
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md transition-all min-h-11",
                collapsed
                  ? "justify-center px-0 size-11"
                  : "px-3 py-2.5",
                active
                  ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary/20"
                  : "text-foreground/70 hover:bg-accent/30 hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && (
                <span className="text-sm whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );

          if (collapsed) {
            return (
              <li key={item.href}>
                <Tooltip>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="left" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              </li>
            );
          }
          return <li key={item.href}>{linkContent}</li>;
        })}
      </ul>
    </TooltipProvider>
  );
});
NavItems.displayName = "NavItems";

// ===================================================================
//  CollapsibleSidebar — الشريط الجانبي الرئيسي (3-mode, no-overlay)
// ===================================================================
export function CollapsibleSidebar() {
  const { mode, setMode, cycle, mounted } = useSidebarMode();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // عرض SSR ثابت لتفادي hydration mismatch
  const currentMode = mounted ? mode : "expanded";
  const width = WIDTHS[currentMode];
  const collapsed = currentMode === "collapsed";
  const hidden = currentMode === "hidden";

  return (
    <>
      {/* زرّ هامبرغر على الجوال */}
      <div className="lg:hidden fixed top-20 end-2 z-30">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="فتح القائمة الجانبية"
              className="size-11 rounded-full shadow-md bg-background/95"
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
            <nav className="px-2 py-3 overflow-y-auto custom-scrollbar">
              <NavItems collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* زرّ عائم لفتح الشريط بعد الإخفاء (desktop only) */}
      <AnimatePresence>
        {hidden && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="hidden lg:block fixed top-20 end-3 z-30"
          >
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMode("expanded")}
              aria-label="فتح القائمة الجانبية"
              className="size-11 rounded-full shadow-md bg-background/95"
            >
              <Menu className="size-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* شريط جانبي على سطح المكتب — position: sticky (no overlay) */}
      <motion.aside
        initial={false}
        animate={{ width }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className={cn(
          "hidden lg:flex flex-col sticky top-16 self-start h-[calc(100vh-4rem)]",
          "bg-background border-s border-border",
          "ps-1 pe-1.5 py-3 shrink-0",
          hidden && "overflow-hidden pointer-events-none opacity-0"
        )}
        aria-label="القائمة الجانبية"
        aria-hidden={hidden}
      >
        {/* رأس الشريط: زرّ الطيّ */}
        <div
          className={cn(
            "flex items-center justify-between gap-2 mb-2 px-1.5",
            collapsed && "justify-center"
          )}
        >
          {!collapsed && !hidden && (
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              أقسام
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={cycle}
            className="size-9 text-muted-foreground hover:text-foreground"
            aria-label={collapsed ? "توسعة القائمة" : "طيّ القائمة"}
            title={`الوضع الحالي: ${currentMode} (اضغط للتغيير)`}
          >
            {collapsed ? (
              <ChevronLeft className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </Button>
        </div>

        {/* عناصر التنقّل */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-1">
          <NavItems collapsed={collapsed} />
        </nav>

        {/* تذييل: أزرار 3-mode */}
        <div className="border-t border-border pt-2 mt-2 px-1 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode("expanded")}
            className={cn(
              "h-8 w-full text-xs gap-1.5 justify-center",
              currentMode === "expanded" ? "bg-accent/40 text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="وضع موسّع"
            title="وضع موسّع"
          >
            <PanelLeftOpen className="size-3.5" />
            {!collapsed && <span>موسّع</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode("collapsed")}
            className={cn(
              "h-8 w-full text-xs gap-1.5 justify-center",
              currentMode === "collapsed" ? "bg-accent/40 text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="وضع أيقونات"
            title="وضع أيقونات"
          >
            <PanelLeftClose className="size-3.5" />
            {!collapsed && <span>أيقونات</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode("hidden")}
            className={cn(
              "h-8 w-full text-xs gap-1.5 justify-center",
              currentMode === "hidden" ? "bg-accent/40 text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="إخفاء"
            title="إخفاء القائمة"
          >
            <X className="size-3.5" />
            {!collapsed && <span>إخفاء</span>}
          </Button>
        </div>
      </motion.aside>
    </>
  );
}

export default CollapsibleSidebar;
