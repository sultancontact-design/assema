import Link from "next/link";
import { db } from "@/lib/db";
import { ROLE_LABELS, ROLE_HIERARCHY } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { SiteLogo } from "@/components/shared/site-logo";
import {
  Sparkles,
  LogIn,
  ShieldCheck,
  KeyRound,
  Info,
  ArrowLeft,
  Compass,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@prisma/client";

// ===================================================================
//  وصول العرض التوضيحي — سيدي يوسف بن علي العاصمة
//  صفحة عمومية تعرض حسابات تجريبية لكل دور من الـ8 أدوار
//  Server Component — تجلب حساباً واحداً لكل دور من قاعدة البيانات
// ===================================================================

const DEMO_PASSWORD = "Demo@1234";

// أيقونات الأدوار الـ8
const ROLE_ICONS: Record<Role, LucideIcon> = {
  SUPER_ADMIN: ShieldCheck,
  TREASURER: KeyRound,
  ETHICS_COMMITTEE: Sparkles,
  DISTRICT_MOD: ShieldCheck,
  GROUP_LEADER: Compass,
  ADS_MANAGER: Sparkles,
  MEMBER: LogIn,
  GUEST: Compass,
};

// ترتيب العرض الافتراضي للبطاقات — من الأعلى صلاحيةً إلى الأقل
const ROLE_DISPLAY_ORDER: Role[] = [
  "SUPER_ADMIN",
  "TREASURER",
  "ETHICS_COMMITTEE",
  "DISTRICT_MOD",
  "GROUP_LEADER",
  "ADS_MANAGER",
  "MEMBER",
  "GUEST",
];

interface DemoAccount {
  role: Role;
  email: string | null;
  fullName: string | null;
}

async function getDemoAccounts(): Promise<DemoAccount[]> {
  const roles: Role[] = [
    "SUPER_ADMIN",
    "TREASURER",
    "ETHICS_COMMITTEE",
    "DISTRICT_MOD",
    "GROUP_LEADER",
    "ADS_MANAGER",
    "MEMBER",
  ];

  const accounts: DemoAccount[] = [];

  for (const role of roles) {
    const user = await db.user.findFirst({
      where: { role, deletedAt: null },
      select: { email: true, fullName: true },
      orderBy: { createdAt: "asc" },
    });
    accounts.push({
      role,
      email: user?.email ?? null,
      fullName: user?.fullName ?? null,
    });
  }

  // حساب "زائر" — لا بريد له
  accounts.push({
    role: "GUEST",
    email: null,
    fullName: null,
  });

  return accounts;
}

export const metadata = {
  title: "وصول العرض التوضيحي | سيدي يوسف بن علي العاصمة",
  description:
    "صفحة عرض توضيحي بحسابات جاهزة لكل دور على المنصة. جرّب المنصة بحساب مشرف عام، أمين صندوق، لجنة نزاهة، مشرف حي، رئيس مجموعة، عضو، أو زائر.",
};

export default async function DemoAccessPage() {
  const accounts = await getDemoAccounts();

  // رتّب الحسابات حسب الترتيب الافتراضي
  const orderedAccounts = ROLE_DISPLAY_ORDER.map((role) =>
    accounts.find((a) => a.role === role)!
  ).filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/40">
      {/* ─────────── الترويسة ─────────── */}
      <header className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <SiteLogo size="md" />
          <Button asChild variant="outline" size="sm" className="h-11">
            <Link href="/">
              <ArrowLeft className="size-4" />
              <span>العودة للرئيسية</span>
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* ─────────── قسم البطل ─────────── */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="absolute inset-0 -z-10 opacity-[0.04] pointer-events-none"
            aria-hidden="true"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, #B8492B 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="max-w-3xl mx-auto text-center">
              <Badge
                variant="secondary"
                className="mb-5 bg-accent/10 text-accent border-accent/20 hover:bg-accent/15"
              >
                <Sparkles className="size-3 ms-1.5" />
                <span>وضع العرض التوضيحي</span>
              </Badge>

              <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-foreground leading-tight mb-4">
                وصول العرض التوضيحي
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed">
                جرّب المنصة بحسابات جاهزة. كل الحسابات تستخدم نفس كلمة المرور:{" "}
                <code
                  dir="ltr"
                  className="font-mono text-base bg-muted px-2 py-0.5 rounded border border-border"
                >
                  {DEMO_PASSWORD}
                </code>
              </p>

              <ZelligeDivider variant="diamond" className="opacity-70" />
            </div>

            {/* بطاقة كلمة المرور المشتركة */}
            <Card className="max-w-md mx-auto mt-8 warm-shadow border-accent/20 bg-accent/5">
              <CardContent className="p-5 flex items-center gap-4">
                <span className="grid place-items-center size-11 rounded-lg bg-accent/15 text-accent shrink-0">
                  <KeyRound className="size-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    كلمة مرور موحّدة لكل الحسابات
                  </p>
                  <code
                    dir="ltr"
                    className="block mt-1 font-mono text-lg text-accent"
                  >
                    {DEMO_PASSWORD}
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ─────────── شبكة بطاقات الأدوار ─────────── */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
              اختر الدور لتجربته
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              ثمانية أدوار مختلفة على المنصة، كل واحد بصلاحيات ومسؤوليات
              مختلفة. اضغط «دخول» ليتم توجيهك لصفحة تسجيل الدخول مع تعبئة
              البريد مسبقاً.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {orderedAccounts.map((account) => {
              const roleMeta = ROLE_LABELS[account.role];
              const Icon = ROLE_ICONS[account.role];
              const hierarchyLevel = ROLE_HIERARCHY[account.role];

              return (
                <Card
                  key={account.role}
                  className="warm-shadow border-border/60 flex flex-col h-full overflow-hidden"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="grid place-items-center size-11 rounded-lg bg-primary/10 text-primary shrink-0">
                          <Icon className="size-5" />
                        </span>
                        <div>
                          <CardTitle className="text-lg font-heading text-foreground">
                            {roleMeta.label}
                          </CardTitle>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            مستوى الصلاحية: {hierarchyLevel}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-3">
                    <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                      {roleMeta.description}
                    </CardDescription>

                    {account.email ? (
                      <div className="space-y-1.5 pt-2 border-t border-border/60">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          البريد الإلكتروني
                        </p>
                        <code
                          dir="ltr"
                          className="block font-mono text-xs text-foreground bg-muted/60 rounded px-2 py-1.5 break-all"
                        >
                          {account.email}
                        </code>
                        {account.fullName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            الاسم: {account.fullName}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-border/60">
                        <Badge
                          variant="outline"
                          className="bg-muted/40 text-muted-foreground"
                        >
                          لا حساب مطلوب
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          يمكنك تصفّح الصفحات العمومية بدون تسجيل دخول.
                        </p>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-2">
                    {account.email ? (
                      <Button
                        asChild
                        className="w-full h-11"
                      >
                        <Link
                          href={`/login?callbackUrl=/community&email=${encodeURIComponent(
                            account.email!
                          )}`}
                        >
                          <LogIn className="size-4" />
                          <span>دخول</span>
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full h-11"
                      >
                        <Link href="/">
                          <Compass className="size-4" />
                          <span>تصفّح كزائر</span>
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ─────────── قسم التنبيه + الجولة ─────────── */}
        <section className="container mx-auto px-4 pb-16 md:pb-20">
          <div className="max-w-3xl mx-auto space-y-5">
            {/* تنبيه العرض التوضيحي */}
            <div className="rounded-lg border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/40 p-4 flex items-start gap-3">
              <span className="grid place-items-center size-9 rounded-md bg-amber-200/70 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 shrink-0">
                <Info className="size-4" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  تنبيه للعرض التوضيحي
                </p>
                <p className="text-sm text-amber-800/90 dark:text-amber-300/90 mt-1 leading-relaxed">
                  هذه الصفحة مخصّصة للعرض التوضيحي فقط. في الإنتاج الحقيقي،
                  تُعطّل هذه الصفحة ويتم حذف الحسابات التجريبية واستبدالها
                  بحسابات حقيقية لكل عضو من أعضاء الحي.
                </p>
              </div>
            </div>

            {/* بطاقة الجولة التفاعلية */}
            <Card className="warm-shadow border-primary/30 bg-primary/5">
              <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <span className="grid place-items-center size-12 rounded-lg bg-primary/15 text-primary shrink-0">
                  <Compass className="size-6" />
                </span>
                <div className="flex-1">
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    أوّلاً تحبّ أن نأخذك في جولة؟
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    جولة تفاعلية من 8 خطوات تعرّفك على أهم أقسام المنصة قبل
                    تسجيل الدخول.
                  </p>
                </div>
                <Button asChild size="lg" className="h-11 shrink-0">
                  <Link href="/tour">
                    <span>ابدأ الجولة</span>
                    <ArrowLeft className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button asChild variant="ghost" className="h-11">
                <Link href="/">
                  <ArrowLeft className="size-4" />
                  <span>العودة للصفحة الرئيسية</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
