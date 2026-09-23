"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  LogIn,
  LayoutDashboard,
  HeartHandshake,
  CalendarDays,
  Users,
  UserCircle,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  PlayCircle,
  Info,
  Compass,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { SiteLogo } from "@/components/shared/site-logo";
import { cn } from "@/lib/utils";

// ===================================================================
//  Interactive Tour — جولة تفاعلية في 10 خطوات
//  - تخطيط بشريط جانبي (يمين) + محتوى الخطوة الحالية (يسار)
//  - framer-motion لانتقالات بين الخطوات
//  - زر "ابدأ الجولة" يبدأ من الخطوة 1
//  - شريط تقدّم علوي + شارات الترقيم
//  - "جرّب الآن" → رابط + "التالي" + "السابق"
//  - بعد الخطوة 10: "اكتملت الجولة!" + "سجّل حساباً" CTA
// ===================================================================

interface TourStep {
  id: number;
  title: string;
  route: string;
  description: string;
  highlights: string[];
  icon: LucideIcon;
  adminOnly?: boolean;
}

const STEPS: TourStep[] = [
  {
    id: 1,
    title: "الصفحة الرئيسية",
    route: "/",
    icon: Home,
    description:
      "نقطة الدخول للمنصة. تعرض Hero (عنوان المنصة ودعوة الانضمام)، إحصاءات حية من قاعدة البيانات (عدد الأسر، إجمالي المساهمات، رصيد الصندوق)، مبادئنا الخمسة (الكرامة، الشفافية، الاستدامة، التوسّع، المعروف المغربي)، وباقات الإعلانات للراعين.",
    highlights: [
      "إحصاءات حية من قاعدة البيانات (تحديث فوري)",
      "مبادئ خمسة لا تتنازل عنها المنصة",
      "باقات إعلانات (برونزية → بلاتينية)",
      "دعوة للانضمام بحساب مجاني",
    ],
  },
  {
    id: 2,
    title: "تسجيل الدخول",
    route: "/login",
    icon: LogIn,
    description:
      "صفحة الدخول للمنصة. تقبل البريد الإلكتروني وكلمة المرور، تدعم تذكّرني لمدة 30 يوماً، وتُعيد توجيهك لصفحة المصادقة الثنائية إن كان حسابك مُفعّلاً عليه 2FA. لديها أيضاً وضع عرض توضيحي بحسابات جاهزة.",
    highlights: [
      "حقول بريد + كلمة مرور مع إظهار/إخفاء",
      "وضع العرض التوضيحي بحسابات جاهزة",
      "تكامل كامل مع 2FA (TOTP + رموز نسخ)",
      "تذكّرني لمدة 30 يوماً",
    ],
  },
  {
    id: 3,
    title: "لوحة المجتمع",
    route: "/community",
    icon: LayoutDashboard,
    description:
      "لوحة التحكّم الرئيسية للعضو المسجّل. تعرض ملخّص نشاطك (نقاطك، مستواك، آخر مساهماتك)، إحصاءات الصندوق العامة، الفعاليات القادمة، آخر إشعاراتك، والمجموعات التي تنتمي إليها.",
    highlights: [
      "ملخّص النشاط الشخصي (نقاط + مستوى)",
      "إحصاءات الصندوق الكاملة",
      "الفعاليات القادمة في الحي",
      "آخر الإشعارات + المجموعات",
    ],
  },
  {
    id: 4,
    title: "صندوق المعروف",
    route: "/community/fund",
    icon: HeartHandshake,
    description:
      "قلب المنصة. ثلاثة تبويبات: (1) المساهمة — ساهم بمبلغ شهري ثابت (10، 20، 50، 100، 200 درهم) عبر تحويل بنكي أو نقداً أو بطاقة CMI. (2) طلباتي — قدّم طلب معروف (مرض، وفاة، عرس، تعليم، طوارئ، مشروع صغير). (3) الشفافية — لوحة عمومية تُظهر المساهمات والصرف والرصيد بدون أسماء.",
    highlights: [
      "3 تبويبات: المساهمة، طلباتي، الشفافية",
      "5 قفف مساهمة شهرية ثابتة",
      "6 أنواع طلبات معروف مع أيقونات",
      "لوحة شفافية عمومية بدون أسماء",
    ],
  },
  {
    id: 5,
    title: "الفعاليات",
    route: "/community/events",
    icon: CalendarDays,
    description:
      "تقويم فعاليات الحي. فعاليات شهرية (جلسات تفطير، لقاءات دورية)، موسمية (رمضان، عيد الأضحى)، تضامنية (تأبين جنازة، دعم أسرة)، ثقافية (محاضرات، أمسيات شعرية). سجّل حضورك واحصل على تذكرة برمز QR.",
    highlights: [
      "5 أنواع فعاليات (شهري/موسمي/خاص/تضامني/ثقافي)",
      "تسجيل حضور مع تذكرة QR via البريد",
      "تقييم الفعالية بعد انتهائها",
      "مسح رمز QR عند الدخول (للمشرف)",
    ],
  },
  {
    id: 6,
    title: "المجموعات",
    route: "/community/groups",
    icon: Users,
    description:
      "مجموعات اهتمام داخل الحي. 5 مجموعات افتراضية: مجموعة الأمهات، مجموعة الآباء، مجموعة الشباب، مجموعة الأطفال، مجموعة كبار السن. انضم إلى مجموعة، تابع آخر منشوراتها، وتواصل مع رئيسها مباشرة.",
    highlights: [
      "5 مجموعات افتراضية حسب الفئة",
      "رئيس مجموعة لكل واحد (GROUP_LEADER)",
      "انضمام/مغادرة بضغطة واحدة",
      "فئات: عائلي، تنمية، تعليم، تراث",
    ],
  },
  {
    id: 7,
    title: "الملف الشخصي",
    route: "/community/profile",
    icon: UserCircle,
    description:
      "صفحتك الشخصية. عرّف بنفسك، عدّل صورتك، تابع آخر مساهماتك وطلباتك، احصل على إيصالات PDF لكل مساهمة، تابع نقاطك ومستواك، وتحقّق من حالة حسابك.",
    highlights: [
      "تحديث الصورة + المعلومات",
      "تتبّع المساهمات والطلبات",
      "تنزيل إيصالات PDF",
      "نظام نقاط ومستويات",
    ],
  },
  {
    id: 8,
    title: "لوحة الإدارة",
    route: "/admin",
    icon: ShieldCheck,
    description:
      "لوحة الإدارة الكاملة — للمشرف العام (SUPER_ADMIN) فقط. 13 قسم: الرئيسية، المستخدمون، العائلات، الصندوق، الفعاليات، الشكاوى، الإعلانات، التقارير، الإشعارات، الأحياء، سجل النشاط، النسخ الاحتياطي، الإعدادات. كل قسم له صفحاته الفرعية الخاصة.",
    highlights: [
      "13 قسم كامل (من المستخدمين إلى الإعدادات)",
      "تقييد صارم: SUPER_ADMIN فقط",
      "مصادقة ثنائية إلزامية (TOTP + رموز نسخ)",
      "قائمة IP المسموحة + سجل نشاط كامل",
    ],
    adminOnly: true,
  },
  {
    id: 9,
    title: "دليل الحي",
    route: "/guide",
    icon: Compass,
    description:
      "دليل شامل لأماكن الحي المفيدة: مقاهي، مطاعم، محلات، مدارس، مراكز صحية، مساجد، خدمات، وجمعيات. ابحث بالاسم، صفّ حسب الفئة، وأضف أماكن تعرفها ليستفيد منها كل أهل الحي. كل عنصر يحتوي اسمه، فئته، عنوانه، هاتفه، وتقييمه.",
    highlights: [
      "8 فئات: مقاهي، مطاعم، محلات، مدارس، مراكز صحية، مساجد، خدمات، جمعيات",
      "بحث بالاسم والوصف والعنوان",
      "بطاقات سريعة لفلترة الفئة بنقرة",
      "زر «أضف مكاناً» — مساهمتك تثري الدليل",
    ],
  },
  {
    id: 10,
    title: "قصص نجاح",
    route: "/stories",
    icon: BookOpen,
    description:
      "حكايات حقيقية لأهل الحي: نجاحات مهنية، تجاوز أزمات، تضامن جماعي، ومسارات تعليمية ملهمة. 10 قصص مرتّبة زمنياً، قابلة للفلترة حسب الفئة. كل قصة فجر جديد لمن يحتاجها — شارك قصتك لتلهم غيرك.",
    highlights: [
      "10 قصص نجاح ملهمة من الحي",
      "4 فئات: نجاح مهني، تجاوز أزمة، تضامن، تعليم",
      "كل قصة: عنوان، مقتطف، كاتب، تاريخ",
      "زر «شارك قصتك» — قصتك تستحق أن تُروى",
    ],
  },
];

export default function TourPage() {
  const [started, setStarted] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const isFirst = currentStep === 0;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  function handleStart() {
    setStarted(true);
    setCurrentStep(0);
  }

  function handleNext() {
    if (!isLast) {
      setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  }

  function handlePrev() {
    if (!isFirst) {
      setCurrentStep((s) => Math.max(s - 1, 0));
    }
  }

  function handleJumpTo(idx: number) {
    setCurrentStep(idx);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/40">
      {/* ─────────── الترويسة ─────────── */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <SiteLogo size="sm" />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="h-11">
              <Link href="/">
                <ArrowRight className="size-4" />
                <span className="hidden sm:inline">الرئيسية</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-11">
              <Link href="/demo-access">
                <Sparkles className="size-4" />
                <span className="hidden sm:inline">حسابات العرض</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {!started ? (
          // ─────────── شاشة البداية ───────────
          <section className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Badge
                  variant="secondary"
                  className="mb-5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                >
                  <PlayCircle className="size-3 ms-1.5" />
                  <span>جولة تفاعلية</span>
                </Badge>

                <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-foreground leading-tight mb-4">
                  جولة في 10 خطوات
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed">
                  تعرّف على أهم أقسام منصة «سيدي يوسف بن علي العاصمة» قبل
                  تسجيل الدخول. كل خطوة لها شرح، أبرز المزايا، وزرّ لتجربة
                  القسم مباشرة.
                </p>

                <ZelligeDivider variant="diamond" className="opacity-70" />

                <div className="mt-8">
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base"
                    onClick={handleStart}
                  >
                    <PlayCircle className="size-5" />
                    <span>ابدأ الجولة</span>
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mt-4">
                  أو تصفّح الخطوات مباشرة من القائمة الجانبية
                </p>
              </motion.div>
            </div>

            {/* شبكة مصغّرة لكل الخطوات */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-12 max-w-5xl mx-auto">
              {STEPS.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setStarted(true);
                      handleJumpTo(idx);
                    }}
                    className="text-start group"
                  >
                    <Card className="warm-shadow border-border/60 h-full transition-all hover:border-primary/30 hover:-translate-y-0.5">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="grid place-items-center size-8 rounded-md bg-primary/10 text-primary text-xs font-bold shrink-0">
                            {s.id}
                          </span>
                          <Icon className="size-4 text-muted-foreground shrink-0" />
                        </div>
                        <p className="font-medium text-sm text-foreground">
                          {s.title}
                        </p>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          // ─────────── الجولة ───────────
          <section className="container mx-auto px-4 py-6 md:py-8">
            {/* شريط التقدّم */}
            <div className="mb-6">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-medium text-muted-foreground">
                  الخطوة {currentStep + 1} من {STEPS.length}
                </p>
                <div className="flex items-center gap-1.5">
                  {STEPS.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleJumpTo(idx)}
                      aria-label={`انتقل للخطوة ${idx + 1}: ${s.title}`}
                      className={cn(
                        "size-2 rounded-full transition-all",
                        idx === currentStep
                          ? "bg-primary w-6"
                          : idx < currentStep
                            ? "bg-primary/40"
                            : "bg-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
                <Badge variant="outline" className="text-[11px]">
                  {Math.round(progress)}%
                </Badge>
              </div>
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
              {/* القائمة الجانبية — قائمة الخطوات */}
              <aside className="lg:sticky lg:top-20 lg:self-start">
                <Card className="warm-shadow border-border/60">
                  <CardContent className="p-3">
                    <nav aria-label="خطوات الجولة">
                      <ol className="flex flex-col gap-1">
                        {STEPS.map((s, idx) => {
                          const Icon = s.icon;
                          const active = idx === currentStep;
                          const done = idx < currentStep;
                          return (
                            <li key={s.id}>
                              <button
                                type="button"
                                onClick={() => handleJumpTo(idx)}
                                aria-current={active ? "step" : undefined}
                                className={cn(
                                  "flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-start transition-colors min-h-11",
                                  active
                                    ? "bg-primary/10 text-primary"
                                    : done
                                      ? "text-foreground hover:bg-muted/60"
                                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                )}
                              >
                                <span
                                  className={cn(
                                    "grid place-items-center size-6 rounded-full text-[11px] font-bold shrink-0",
                                    active
                                      ? "bg-primary text-primary-foreground"
                                      : done
                                        ? "bg-secondary text-secondary-foreground"
                                        : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  {done ? (
                                    <Check className="size-3" />
                                  ) : (
                                    s.id
                                  )}
                                </span>
                                <Icon className="size-4 shrink-0" />
                                <span className="text-sm font-medium flex-1 truncate">
                                  {s.title}
                                </span>
                                {active && (
                                  <span
                                    className="size-1.5 rounded-full bg-primary shrink-0"
                                    aria-hidden="true"
                                  />
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ol>
                    </nav>
                  </CardContent>
                </Card>
              </aside>

              {/* المحتوى — الخطوة الحالية */}
              <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  {!isLast ? (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <StepCard step={step} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="complete"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <CompletionCard />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* أزرار التنقّل */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-between">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-11"
                    onClick={handlePrev}
                    disabled={isFirst}
                  >
                    <ArrowLeft className="size-4" />
                    <span>السابق</span>
                  </Button>

                  <Button
                    asChild
                    variant="secondary"
                    size="lg"
                    className="h-11"
                  >
                    <Link href={step.route}>
                      <span>جرّب الآن</span>
                      <ArrowLeft className="size-4" />
                    </Link>
                  </Button>

                  {!isLast ? (
                    <Button size="lg" className="h-11" onClick={handleNext}>
                      <span>التالي</span>
                      <ArrowRight className="size-4" />
                    </Button>
                  ) : (
                    <Button asChild size="lg" className="h-11">
                      <Link href="/register">
                        <span>سجّل حساباً</span>
                        <ArrowLeft className="size-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// ===================================================================
//  بطاقة خطوة واحدة
// ===================================================================

function StepCard({ step }: { step: TourStep }) {
  const Icon = step.icon;
  return (
    <Card className="warm-shadow border-border/60 overflow-hidden">
      <CardHeader className="p-6 border-b border-border/60 bg-muted/30">
        <div className="flex items-start gap-4">
          <span className="grid place-items-center size-14 rounded-xl bg-primary/10 text-primary shrink-0">
            <Icon className="size-7" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20"
              >
                الخطوة {step.id} من {STEPS.length}
              </Badge>
              {step.adminOnly && (
                <Badge
                  variant="outline"
                  className="border-destructive/30 bg-destructive/5 text-destructive"
                >
                  <ShieldCheck className="size-3 ms-1" />
                  مشرف عام فقط
                </Badge>
              )}
            </div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mt-2">
              {step.title}
            </h2>
            <code
              dir="ltr"
              className="block mt-2 font-mono text-xs text-muted-foreground bg-muted/60 rounded px-2 py-1 inline-block"
            >
              {step.route}
            </code>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        <p className="text-base text-foreground leading-relaxed">
          {step.description}
        </p>

        {step.adminOnly && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2.5">
            <Info className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive leading-relaxed">
              هذا القسم مُقيَّد للمشرف العام فقط. للوصول إليه، سجّل الدخول
              بحساب{" "}
              <code dir="ltr" className="font-mono">
                admin@syba-community.ma
              </code>{" "}
              (كلمة المرور{" "}
              <code dir="ltr" className="font-mono">
                Demo@1234
              </code>
              ) من{" "}
              <Link
                href="/demo-access"
                className="font-medium underline underline-offset-2"
              >
                صفحة العرض التوضيحي
              </Link>
              .
            </p>
          </div>
        )}

        <div>
          <h3 className="font-heading text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Sparkles className="size-4 text-accent" />
            أبرز المزايا
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {step.highlights.map((h, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 rounded-md bg-muted/30 p-2.5"
              >
                <span className="grid place-items-center size-5 rounded-full bg-secondary/20 text-secondary text-[11px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-sm text-foreground leading-relaxed">
                  {h}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// ===================================================================
//  بطاقة الإكمال — بعد الخطوة 10
// ===================================================================

function CompletionCard() {
  return (
    <Card className="warm-shadow border-accent/30 bg-accent/5 overflow-hidden">
      <CardHeader className="p-6 border-b border-accent/20 bg-accent/10">
        <div className="flex items-center gap-4">
          <span className="grid place-items-center size-14 rounded-xl bg-accent/15 text-accent shrink-0">
            <Check className="size-7" />
          </span>
          <div>
            <Badge variant="secondary" className="bg-accent/15 text-accent border-accent/20">
              اكتمال
            </Badge>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mt-1">
              اكتملت الجولة!
            </h2>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        <p className="text-base text-foreground leading-relaxed">
          أحسنت! لقد أكملت جولة في 10 خطوات على منصة «سيدي يوسف بن علي
          العاصمة». الآن أنت تعرف أهم الأقسام والوظائف، من الصفحة
          الرئيسية إلى لوحة الإدارة، ومن دليل الحي إلى قصص النجاح. الخطوة
          التالية الطبيعية هي:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-5 space-y-3">
              <span className="grid place-items-center size-10 rounded-lg bg-primary/15 text-primary">
                <Sparkles className="size-5" />
              </span>
              <h3 className="font-heading font-bold text-foreground">
                جرّب بحساب جاهز
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                انتقل لصفحة وصول العرض، اختر دوراً، وجرّب المنصة بحساب
                مشرف/أمين صندوق/عضو...
              </p>
              <Button asChild className="w-full h-11">
                <Link href="/demo-access">
                  <span>صفحة العرض</span>
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-secondary/30 bg-secondary/5">
            <CardContent className="p-5 space-y-3">
              <span className="grid place-items-center size-10 rounded-lg bg-secondary/15 text-secondary">
                <UserCircle className="size-5" />
              </span>
              <h3 className="font-heading font-bold text-foreground">
                سجّل حسابك الخاص
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                إن كنتَ تسكن في حي سيدي يوسف بن علي بمراكش، سجّل حسابك
                المجاني وانضم لمجتمعك الرقمي.
              </p>
              <Button asChild variant="secondary" className="w-full h-11">
                <Link href="/register">
                  <span>سجّل حساباً</span>
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-start gap-3">
          <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            تذكير: منصة المعروف الرقمي مجانية 100% لكل سكان الحي. نبدأ
            بسيدي يوسف بن علي، ثم نتوسّع لأحياء مراكش الأخرى، ثم لمدن المغرب.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
