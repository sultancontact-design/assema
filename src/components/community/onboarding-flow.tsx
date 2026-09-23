"use client";

// ===================================================================
//  OnboardingFlow — ترحيب تفاعلي بـ8 خطوات (framer-motion)
//  - يظهر مرة واحدة فقط (localStorage "onboarding_completed")
//  - شاشة كاملة على الجوال، مودال على سطح المكتب
//  - شريط تقدّم علوي + زر تخطّي على كل خطوة
//  - الخطوة 8 → CTA لـ /community
// ===================================================================

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  MapPin,
  Heart,
  Users,
  Wallet,
  Gift,
  Flame,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { cn } from "@/lib/utils";

// ─────────── 5 أحياء مراكش ───────────
const DISTRICTS = [
  { value: "sidi-youssef-ben-ali", label: "سيدي يوسف بن علي" },
  { value: "medina", label: "المدينة" },
  { value: "guelize", label: "جليز" },
  { value: "menara", label: "المنارة" },
  { value: "annakhil", label: "النخيل" },
] as const;

// ─────────── اهتمامات ───────────
const INTERESTS = [
  "عائلي",
  "تضامني",
  "ثقافي",
  "رياضي",
  "تعليمي",
  "اجتماعي",
] as const;

// ─────────── المجموعات الافتراضية ───────────
const GROUPS = [
  { name: "مجموعة الأمهات", icon: "👩", color: "bg-primary/10 text-primary" },
  { name: "مجموعة الآباء", icon: "👨", color: "bg-secondary/10 text-secondary" },
  { name: "مجموعة الشباب", icon: "🧑", color: "bg-accent/10 text-accent" },
  { name: "مجموعة الأطفال", icon: "🧒", color: "bg-primary/10 text-primary" },
  { name: "مجموعة كبار السن", icon: "👵", color: "bg-secondary/10 text-secondary" },
] as const;

interface OnboardingStep {
  id: number;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}

const STEPS: OnboardingStep[] = [
  { id: 1, icon: Sparkles, title: "مرحباً بك في العاصمة" },
  { id: 2, icon: MapPin, title: "اختر مقاطعتك" },
  { id: 3, icon: Heart, title: "اختر اهتماماتك" },
  { id: 4, icon: Users, title: "انضم لمجموعة" },
  { id: 5, icon: Wallet, title: "اكتشف صندوق المعروف" },
  { id: 6, icon: Gift, title: "جرّب المكافآت" },
  { id: 7, icon: Flame, title: "ابدأ سلسلتك" },
  { id: 8, icon: Rocket, title: "ابدأ رحلتك" },
];

const STORAGE_KEY = "onboarding_completed";
const DISMISS_KEY = "onboarding_dismissed";

export function OnboardingFlow() {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [district, setDistrict] = React.useState<string>("");
  const [interests, setInterests] = React.useState<string[]>([]);
  const [joinedGroups, setJoinedGroups] = React.useState<string[]>([]);

  // 1) تحقّق من localStorage عند التحميل — يظهر فقط إن لم يُكمَّل
  React.useEffect(() => {
    try {
      const completed = localStorage.getItem(STORAGE_KEY);
      const dismissed = sessionStorage.getItem(DISMISS_KEY);
      if (!completed && !dismissed) {
        // تأخير بسيط لتفادي وميض
        const t = setTimeout(() => setOpen(true), 800);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage قد يكون مُعطّلاً — نتجاهل
    }
  }, []);

  function handleClose() {
    setOpen(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  }

  function handleComplete() {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // ignore
    }
    setOpen(false);
  }

  function handleNext() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  }

  function handlePrev() {
    if (step > 0) setStep((s) => s - 1);
  }

  function toggleInterest(value: string) {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function toggleGroup(name: string) {
    setJoinedGroups((prev) =>
      prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name]
    );
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;
  const CurrentIcon = current.icon;

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full h-full sm:h-auto sm:max-w-2xl sm:rounded-2xl bg-card sm:border sm:border-border sm:warm-shadow flex flex-col max-h-screen overflow-hidden"
          >
            {/* ─────────── شريط التقدّم العلوي + زر التخطّي ─────────── */}
            <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20"
                >
                  الخطوة {step + 1} من {STEPS.length}
                </Badge>
              </div>
              <div className="flex-1 mx-3">
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-muted-foreground hover:text-foreground"
                onClick={handleClose}
                aria-label="تخطّي الترحيب"
              >
                <span>تخطّي</span>
                <X className="size-4" />
              </Button>
            </header>

            {/* ─────────── المحتوى ─────────── */}
            <div className="flex-1 overflow-y-auto scrollbar-moroccan">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="p-6 sm:p-8"
                >
                  {/* أيقونة + عنوان */}
                  <div className="flex flex-col items-center text-center mb-6">
                    <span className="grid place-items-center size-20 rounded-2xl bg-primary/10 text-primary mb-4">
                      <CurrentIcon className="size-10" />
                    </span>
                    <h2
                      id="onboarding-title"
                      className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground"
                    >
                      {current.title}
                    </h2>
                    {current.subtitle && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {current.subtitle}
                      </p>
                    )}
                    <ZelligeDivider variant="minimal" className="opacity-60 mt-4" />
                  </div>

                  {/* ───── محتوى الخطوة ───── */}
                  {step === 0 && (
                    <div className="text-center space-y-4">
                      <p className="text-base text-foreground leading-relaxed">
                        أهلاً وسهلاً بك في منصة «سيدي يوسف بن علي العاصمة» —
                        منصة المعروف الرقمي التي تجمع أسر الحي على التضامن
                        والعطاء. سنأخذك في جولة سريعة من 8 خطوات لتعرف
                        المنصة وتستعدّ لبدء رحلتك.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6">
                        {[
                          { icon: Wallet, label: "صندوق المعروف" },
                          { icon: Users, label: "المجموعات" },
                          { icon: Gift, label: "المكافآت" },
                          { icon: Flame, label: "السلاسل" },
                        ].map(({ icon: I, label }) => (
                          <div
                            key={label}
                            className="rounded-lg bg-muted/40 p-3 flex flex-col items-center gap-1.5"
                          >
                            <I className="size-5 text-primary" />
                            <span className="text-xs font-medium text-foreground">
                              {label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-4">
                      <p className="text-base text-foreground leading-relaxed text-center">
                        اختر الحيّ الذي تسكن فيه بمراكش. هذا يربطك بأهله
                        ومجموعاته وفعالياته.
                      </p>
                      <Select value={district} onValueChange={setDistrict}>
                        <SelectTrigger className="h-12 text-base">
                          <MapPin className="size-4 text-muted-foreground" />
                          <SelectValue placeholder="اختر حيك..." />
                        </SelectTrigger>
                        <SelectContent>
                          {DISTRICTS.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground text-center">
                        ملاحظة: يمكنك تغيير الحي لاحقاً من ملفك الشخصي.
                      </p>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <p className="text-base text-foreground leading-relaxed text-center">
                        اختر الاهتمامات التي تهمّك. سنُرشّح لك المجموعات
                        والفعاليات والمحتوى المناسب.
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                        {INTERESTS.map((i) => {
                          const selected = interests.includes(i);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => toggleInterest(i)}
                              className={cn(
                                "h-11 px-4 rounded-full border text-sm font-medium transition-all",
                                selected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-card text-foreground border-border hover:border-primary/30"
                              )}
                              aria-pressed={selected}
                            >
                              {selected && <Check className="size-3.5 ms-1 inline" />}{" "}
                              {i}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        يمكنك اختيار أكثر من اهتمام.
                      </p>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <p className="text-base text-foreground leading-relaxed text-center">
                        انضم لإحدى المجموعات الافتراضية الخمس لتلتقي بأهل
                        اهتمامك في الحي.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {GROUPS.map((g) => {
                          const joined = joinedGroups.includes(g.name);
                          return (
                            <button
                              key={g.name}
                              type="button"
                              onClick={() => toggleGroup(g.name)}
                              className={cn(
                                "flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-start min-h-14",
                                joined
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/30"
                              )}
                              aria-pressed={joined}
                            >
                              <span
                                className={cn(
                                  "grid place-items-center size-10 rounded-full text-lg shrink-0",
                                  g.color
                                )}
                              >
                                {g.icon}
                              </span>
                              <span className="flex-1 font-medium text-sm text-foreground">
                                {g.name}
                              </span>
                              {joined && (
                                <Check className="size-5 text-primary shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-4 text-center">
                      <p className="text-base text-foreground leading-relaxed">
                        صندوق المعروف هو قلب المنصة — تجمع فيه مساهمات
                        الأسر شهرياً، وتُسلَّف لمن يحتاجها في المناسبات
                        السعيدة (عرس، تعليم) أو الأليمة (مرض، وفاة).
                      </p>
                      <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
                        {[
                          { label: "20", desc: "د.م/شهر" },
                          { label: "50", desc: "د.م/شهر" },
                          { label: "100", desc: "د.م/شهر" },
                        ].map((tier) => (
                          <div
                            key={tier.label}
                            className="rounded-lg bg-muted/40 p-3 flex flex-col items-center gap-0.5"
                          >
                            <span className="text-xl font-bold text-primary">
                              {tier.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {tier.desc}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        كل درهم تُسهم به مع إيصال رقمي قابل للتحميل.
                      </p>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="space-y-4 text-center">
                      <p className="text-base text-foreground leading-relaxed">
                        كلما زاد نشاطك (مساهمة، حضور فعالية، تسجيل دخول يومي)،
                        ربحت نقاطاً تفتح بها «صندوق الغموض» ومكافآت متغيّرة.
                      </p>
                      <div className="rounded-2xl bg-gradient-to-br from-accent/15 to-primary/10 p-6 mx-auto max-w-sm">
                        <div className="size-20 mx-auto rounded-2xl bg-card grid place-items-center shadow-lg mb-3">
                          <Gift className="size-10 text-accent" />
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-accent/15 text-accent border-accent/30 mb-2"
                        >
                          معاينة
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          كل صندوق مفاجأة — قد يكون نقاطاً، شارة، تجميد
                          سلسلة، أو ميزة حصرية...
                        </p>
                      </div>
                    </div>
                  )}

                  {step === 6 && (
                    <div className="space-y-4 text-center">
                      <p className="text-base text-foreground leading-relaxed">
                        سلسلتك اليومية تُسجّل دخولك كل يوم. كلما طالت السلسلة،
                        زادت مكافآتك وارتقى مستواك في الحي.
                      </p>
                      <div className="flex items-center justify-center gap-2 my-6">
                        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                          <div
                            key={d}
                            className="flex flex-col items-center gap-1"
                          >
                            <div
                              className={cn(
                                "grid place-items-center size-10 rounded-full",
                                d <= 5
                                  ? "bg-secondary text-secondary-foreground"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {d <= 5 ? (
                                <Check className="size-4" />
                              ) : (
                                <Flame className="size-4" />
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {["إثن", "ثلا", "أرب", "خمي", "جمع", "سبت", "أحد"][d - 1]}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        7 أيام متتالية = مكافأة خاصة وشارة «سلسلة 7».
                      </p>
                    </div>
                  )}

                  {step === 7 && (
                    <div className="space-y-4 text-center">
                      <p className="text-base text-foreground leading-relaxed">
                        كل ما تحتاجه الآن جاهز — لوحة المجتمع بانتظارك.
                        ابدأ رحلتك في صندوق المعروف، انضم لمجموعة، قدّم
                        مساهمتك الأولى، وتابع سلسلتك اليومية.
                      </p>
                      <ZelligeDivider variant="diamond" className="opacity-70" />
                      <p className="text-sm text-muted-foreground">
                        من حي إلى عاصمة... المعروف الرقمي.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ─────────── أزرار التنقّل السفلية ─────────── */}
            <footer className="px-4 sm:px-6 py-4 border-t border-border bg-background/95 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="lg"
                  className="h-11"
                  onClick={handlePrev}
                  disabled={step === 0}
                >
                  <ArrowRight className="size-4" />
                  <span>السابق</span>
                </Button>

                {isLast ? (
                  <Button asChild size="lg" className="h-11 px-6">
                    <Link href="/community" onClick={handleComplete}>
                      <span>ابدأ رحلتي</span>
                      <Rocket className="size-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" className="h-11 px-6" onClick={handleNext}>
                    <span>التالي</span>
                    <ArrowLeft className="size-4" />
                  </Button>
                )}
              </div>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
