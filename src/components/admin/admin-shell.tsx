"use client";

// ===================================================================
//  AdminShell — كروم لوحة الإدارة (Sidebar + Topbar + Main content)
//  - لوحة جانبية على اليمين (RTL)
//  - شريط علوي ثابت: breadcrumb + theme toggle + bell + user dropdown
//  - محتوى قابل للتمرير
//  - على الجوال تنطوي اللوحة الجانبية في Sheet (يمين)
//  النمط: MINIMAL REFINED — حدود رفيعة، فراغ كبير، لون ذهبي واحد
// ===================================================================

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users as UsersIcon,
  Users2,
  HeartHandshake,
  CalendarDays,
  MessageSquareWarning,
  Megaphone,
  BarChart3,
  History,
  Settings as SettingsIcon,
  Menu,
  Bell,
  LogOut,
  Shield,
  ChevronDown,
  MapPin,
  DatabaseBackup,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { toast } from "sonner";

// ===================================================================
//  الأنواع
// ===================================================================

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  avatar: string | null;
  districtId: string;
}

// ===================================================================
//  روابط القسم الإداري (10 عناصر) — مرتّبة على اليمين في RTL
// ===================================================================

interface NavSubLink {
  href: string;
  label: string;
  match: string;
}

interface NavLinkItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  /** الجزء الأخير من الـURL لأغراض الـactive state */
  match: string;
  /** روابط فرعية تُعرض داخل قائمة قابلة للطيّ */
  children?: NavSubLink[];
}

const ADS_SUB_LINKS: NavSubLink[] = [
  { href: "/admin/ads", label: "نظرة عامة", match: "" },
  { href: "/admin/ads/campaigns", label: "الحملات", match: "campaigns" },
  { href: "/admin/ads/advertisers", label: "المعلنون", match: "advertisers" },
  { href: "/admin/ads/placements", label: "الأماكن", match: "placements" },
  { href: "/admin/ads/packages", label: "الباقات", match: "packages" },
  { href: "/admin/ads/adsense", label: "Google AdSense", match: "adsense" },
  { href: "/admin/ads/invoices", label: "الفواتير", match: "invoices" },
  { href: "/admin/ads/reports", label: "التقارير", match: "reports" },
];

const NAV_LINKS: NavLinkItem[] = [
  { href: "/admin", label: "الرئيسية", icon: LayoutDashboard, match: "" },
  { href: "/admin/users", label: "المستخدمون", icon: UsersIcon, match: "users" },
  { href: "/admin/families", label: "العائلات", icon: Users2, match: "families" },
  { href: "/admin/fund", label: "الصندوق", icon: HeartHandshake, match: "fund" },
  { href: "/admin/events", label: "الفعاليات", icon: CalendarDays, match: "events" },
  { href: "/admin/complaints", label: "الشكاوى", icon: MessageSquareWarning, match: "complaints" },
  { href: "/admin/ads", label: "الإعلانات", icon: Megaphone, match: "ads", children: ADS_SUB_LINKS },
  { href: "/admin/reports", label: "التقارير", icon: BarChart3, match: "reports" },
  { href: "/admin/notifications", label: "الإشعارات", icon: Bell, match: "notifications" },
  { href: "/admin/districts", label: "الأحياء", icon: MapPin, match: "districts" },
  { href: "/admin/audit", label: "سجل النشاط", icon: History, match: "audit" },
  { href: "/admin/backup", label: "النسخ الاحتياطي", icon: DatabaseBackup, match: "backup" },
  { href: "/admin/settings", label: "الإعدادات", icon: SettingsIcon, match: "settings" },
];

// ===================================================================
//  خريطة أسماء الأقسام من المسار
// ===================================================================

const SECTION_TITLES: Record<string, string> = {
  "": "الرئيسية",
  users: "المستخدمون",
  families: "العائلات",
  fund: "الصندوق",
  events: "الفعاليات",
  complaints: "الشكاوى",
  ads: "الإعلانات",
  reports: "التقارير",
  notifications: "الإشعارات",
  districts: "الأحياء",
  audit: "سجل النشاط",
  backup: "النسخ الاحتياطي",
  settings: "الإعدادات",
};

// ===================================================================
//  مكوّن اللوحة الجانبية — قابل لإعادة الاستخدام في الـDesktop وSheet
// ===================================================================

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="قسم الإدارة" className="flex flex-col gap-1 p-3">
      {NAV_LINKS.map((link) => {
        const Icon = link.icon;
        // حالة الـactive: تطابق المسار المقطّع
        const seg = pathname.replace(/^\/admin\/?/, "").split("/")[0] ?? "";
        const active = seg === link.match;

        // روابط فرعية قابلة للطيّ (قسم الإعلانات)
        if (link.children && link.children.length > 0) {
          const isOnSection = seg === link.match;
          return (
            <Collapsible key={link.href} defaultOpen={isOnSection}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isOnSection
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-[18px] shrink-0 transition-colors",
                      isOnSection
                        ? "text-accent"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                    strokeWidth={1.5}
                  />
                  <span className="flex-1 text-start">{link.label}</span>
                  <ChevronDown
                    className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
                    strokeWidth={1.5}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="mt-1 flex flex-col gap-0.5 border-s border-border ps-2">
                  {link.children.map((child) => {
                    // حالة الـactive: تطابق المسار الفرعي
                    const subSeg = pathname
                      .replace(/^\/admin\/ads\/?/, "")
                      .split("/")[0] ?? "";
                    const childActive = subSeg === child.match;
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={onNavigate}
                          aria-current={childActive ? "page" : undefined}
                          className={cn(
                            "flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-[13px] transition-colors",
                            childActive
                              ? "bg-accent/10 text-accent"
                              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                          )}
                        >
                          <span
                            className={cn(
                              "size-1 rounded-full transition-colors",
                              childActive
                                ? "bg-accent"
                                : "bg-muted-foreground/40"
                            )}
                            aria-hidden="true"
                          />
                          <span className="flex-1 text-start">{child.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          );
        }

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "size-[18px] shrink-0 transition-colors",
                active
                  ? "text-accent"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
              strokeWidth={1.5}
            />
            <span className="flex-1 text-start">{link.label}</span>
            {active && (
              <span
                className="size-1 rounded-full bg-accent"
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// ===================================================================
//  شارة الدور — لون واحد فقط (accent) لكل الأدوار
// ===================================================================

function RoleBadge({ role }: { role: string }) {
  return (
    <Badge
      variant="outline"
      className="border-accent/30 bg-accent/10 text-accent"
    >
      {role}
    </Badge>
  );
}

// ===================================================================
//  أيقونة المستخدم
// ===================================================================

function UserAvatar({
  name,
  avatar,
  className,
}: {
  name: string;
  avatar: string | null;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((s) => s.charAt(0))
    .join("");
  return (
    <Avatar className={cn("size-9 rounded-full", className)}>
      {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
      <AvatarFallback className="bg-muted text-xs font-medium text-foreground">
        {initials || "م"}
      </AvatarFallback>
    </Avatar>
  );
}

// ===================================================================
//  القائمة المنسدلة للمستخدم
// ===================================================================

function UserMenu({ user }: { user: AdminUser }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await signOut({ redirect: false });
      toast.success("تم تسجيل الخروج بنجاح");
      router.push("/");
    } catch {
      toast.error("تعذّر تسجيل الخروج");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-11 gap-2 rounded-md px-2 hover:bg-muted"
          aria-label="قائمة المستخدم"
        >
          <UserAvatar
            name={user.name}
            avatar={user.avatar}
            className="size-8"
          />
          <span className="hidden text-start md:block">
            <span className="block text-xs font-medium text-foreground">
              {user.name}
            </span>
            <span className="block text-[10px] text-muted-foreground">
              {user.roleLabel}
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            {user.name}
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
          <div className="mt-1">
            <RoleBadge role={user.roleLabel} />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/community" className="cursor-pointer">
            <Shield className="size-4" strokeWidth={1.5} />
            <span>العودة للمجتمع</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            handleLogout();
          }}
          disabled={signingOut}
          variant="destructive"
          className="cursor-pointer"
        >
          <LogOut className="size-4" strokeWidth={1.5} />
          <span>{signingOut ? "جارٍ الخروج..." : "تسجيل الخروج"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ===================================================================
//  Breadcrumb — مولّد من المسار
// ===================================================================

function AdminBreadcrumb() {
  const pathname = usePathname() ?? "/admin";
  const segments = pathname
    .replace(/^\/admin\/?/, "")
    .split("/")
    .filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/admin" className="text-muted-foreground">
              لوحة الإدارة
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.length > 0 && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {SECTION_TITLES[segments[0] ?? ""] ?? segments[0]}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// ===================================================================
//  الترويسة العلوية
// ===================================================================

function AdminTopbar({
  user,
  onOpenSidebar,
}: {
  user: AdminUser;
  onOpenSidebar: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenSidebar}
        className="md:hidden"
        aria-label="فتح القائمة الجانبية"
      >
        <Menu className="size-5" strokeWidth={1.5} />
      </Button>

      <div className="flex-1">
        <AdminBreadcrumb />
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          aria-label="الإشعارات"
          className="relative"
          onClick={() => toast.info("لا توجد إشعارات جديدة")}
        >
          <Bell className="size-4" strokeWidth={1.5} />
          <span
            className="absolute end-2 top-2 size-1.5 rounded-full bg-accent"
            aria-hidden="true"
          />
        </Button>
        <span className="mx-1 hidden h-8 w-px bg-border md:block" />
        <UserMenu user={user} />
      </div>
    </header>
  );
}

// ===================================================================
//  الشعار المصغّر للوحة الإدارة
// ===================================================================

function AdminLogo() {
  return (
    <Link
      href="/admin"
      className="flex items-center gap-2.5 border-b border-border px-4 py-4"
    >
      <span className="grid size-9 place-items-center rounded-md bg-foreground text-background">
        <Shield className="size-5" strokeWidth={1.5} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-heading text-sm font-bold text-foreground">
          لوحة الإدارة
        </span>
        <span className="text-[11px] text-muted-foreground">
          سيدي يوسف بن علي
        </span>
      </span>
    </Link>
  );
}

// ===================================================================
//  AdminShell الرئيسي
// ===================================================================

export function AdminShell({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/admin";
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // أغلق Sheet الجوال عند تغيّر المسار
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* الشريط الجانبي — Desktop (ثابت على اليمين في RTL) */}
      <aside
        className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:border-s md:border-border md:bg-muted/30"
        aria-label="الشريط الجانبي للوحة الإدارة"
      >
        <AdminLogo />
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <SidebarNav pathname={pathname} />
        </div>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2 rounded-md p-2 text-xs text-muted-foreground">
            <span>الإصدار 1.0.0 — تجريبي</span>
          </div>
        </div>
      </aside>

      {/* منطقة المحتوى الرئيسية */}
      <div className="flex flex-1 flex-col">
        <AdminTopbar user={user} onOpenSidebar={() => setMobileOpen(true)} />

        {/* Sheet للجوال — ينزلق من اليمين */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="right" className="w-72 p-0">
            <SheetHeader className="border-b border-border">
              <SheetTitle className="text-start">قسم الإدارة</SheetTitle>
            </SheetHeader>
            <SidebarNav
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {/* المحتوى */}
        <main className="flex-1 overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
