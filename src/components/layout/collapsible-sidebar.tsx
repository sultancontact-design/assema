"use client";

// ===================================================================
//  CollapsibleSidebar — شريط جانبي قابل للطيّ
//  - شريط ثابت على سطح المكتب (جهة اليمين في RTL)
//  - على الجوال: زرّ هامبرغر يفتحه كـ Sheet
//  - يحتوي كل أقسام المجتمع: الرئيسية، المجتمع، صندوق المعروف،
//    الفعاليات، المجموعات، الرسائل، النقاشات، المبادرات، المتجر،
//    الخريطة، المدوّنة، دليل الحي، قصص النجاح، تاريخ الحي، الأخلاق
//  - كل عنصر: أيقونة + تسمية
//  - إبراز العنصر النشط (usePathname)
//  - زرّ طيّ/توسعة (framer-motion)
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

// ===================================================================
//  عناصر القائمة
// ===================================================================
const NAV_ITEMS = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/community", label: "المجتمع", icon: Users },
  { href: "/community/fund", label: "صندوق المعروف", icon: Heart },
  { href: "/community/events", label: "الفعاليات", icon: CalendarDays },
  { href: "/community/groups", label: "المجموعات", icon: Newspaper },
  { href: "/community/messages", label: "الرسائل", icon: Mail },
  { href: "/community/discussions", label: "النقاشات", icon: MessageSquare },
  { href: "/community/initiatives", label: "المبادرات", icon: Lightbulb },
  { href: "/community/refer", label: "المتجر", icon: Gift },
  { href: "/community/map", label: "الخريطة", icon: MapPin },
  { href: "/blog", label: "المدوّنة", icon: BookOpen },
  { href: "/guide", label: "دليل الحي", icon: Compass },
  { href: "/stories", label: "قصص النجاح", icon: Award },
  { href: "/history", label: "تاريخ الحي", icon: History },
  { href: "/community/prices", label: "أسعار السوق", icon: Tag },
  { href: "/community/contributions/price-report", label: "أبلغ عن سعر", icon: Megaphone },
  { href: "/privacy-requests", label: "حماية البيانات", icon: ShieldCheck },
  { href: "/ethics", label: "الأخلاق", icon: Heart },
] as const;

// ===================================================================
//  Hook: حالة الطيّ (مشفوعة في localStorage)
// ===================================================================
function useCollapsed() {
  const [collapsed, setCollapsed] = React.useState(false);
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem("sidebar.collapsed");
      if (stored === "true") setCollapsed(true);
    } catch {
      // تجاهل
    }
  }, []);
  const toggle = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem("sidebar.collapsed", String(next));
      } catch {
        // تجاهل
      }
      return next;
    });
  }, []);
  return { collapsed, toggle, setCollapsed };
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href);
}

// ===================================================================
//  NavItems — قائمة العناصر القابلة للطيّ
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

          // في الوضع المطويّ: نُغلّفه بـTooltip
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
//  CollapsibleSidebar — الشريط الجانبي الرئيسي
// ===================================================================
export function CollapsibleSidebar() {
  const { collapsed, toggle } = useCollapsed();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

      {/* شريط جانبي ثابت على سطح المكتب — جهة اليمين في RTL */}
      <motion.aside
        initial={false}
        animate={{
          width: collapsed ? 64 : 224,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className={cn(
          "hidden lg:flex flex-col fixed top-16 inset-y-0 end-0 z-30",
          "bg-background border-s border-border",
          "ps-1 pe-1.5 py-3"
        )}
        aria-label="القائمة الجانبية"
      >
        {/* رأس الشريط: زرّ الطيّ */}
        <div
          className={cn(
            "flex items-center justify-between gap-2 mb-2 px-1.5",
            collapsed && "justify-center"
          )}
        >
          {!collapsed && (
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              أقسام
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="size-9 text-muted-foreground hover:text-foreground"
            aria-label={collapsed ? "توسعة القائمة" : "طيّ القائمة"}
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

        {/* تذييل: زرّ توسعة/طيّ سفلي */}
        <div className="border-t border-border pt-2 mt-2 px-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            className={cn(
              "h-9 w-full text-xs gap-1.5 text-muted-foreground hover:text-foreground",
              collapsed && "px-0 justify-center"
            )}
            aria-label={collapsed ? "توسعة القائمة" : "طيّ القائمة"}
          >
            {collapsed ? (
              <>
                <PanelLeftOpen className="size-3.5" />
              </>
            ) : (
              <>
                <PanelLeftClose className="size-3.5" />
                <span>طيّ</span>
              </>
            )}
          </Button>
        </div>

        {/* مؤشّر طيّ متحرّك */}
        <AnimatePresence>
          {collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-1.5 mt-2 text-center text-[10px] text-muted-foreground"
            >
              قائمة
              <br />
              جانبية
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </>
  );
}

export default CollapsibleSidebar;
