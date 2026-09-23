"use client";

// ===================================================================
//  StreakWidget — عرض حالة السلسلة (compact + large)
//  - 🔥 + currentStreak + "يوم متتالٍ"
//  - ❄️ + freezes + "freeze متبقي"
//  - ⏰ تحذير الإلحاح إن كانت السلسلة معرّضة للكسر
//  - animation: flame with framer-motion
//  - auto check-in on mount لو لم يُسجّل اليوم
// ===================================================================

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Snowflake, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StreakWidgetProps {
  variant?: "compact" | "large";
  initial?: {
    currentStreak: number;
    longestStreak: number;
    freezes: number;
    totalCheckIns: number;
    hoursUntilBreak: number;
    atRisk: boolean;
    checkedInToday: boolean;
  };
}

export function StreakWidget({
  variant = "large",
  initial,
}: StreakWidgetProps) {
  const [state, setState] = React.useState(
    initial ?? {
      currentStreak: 0,
      longestStreak: 0,
      freezes: 2,
      totalCheckIns: 0,
      hoursUntilBreak: 48,
      atRisk: false,
      checkedInToday: false,
    }
  );
  const [checking, setChecking] = React.useState(false);

  const handleCheckIn = React.useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/community/streak/check-in", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "تعذّر تسجيل الدخول");
      setState({
        currentStreak: data.currentStreak ?? state.currentStreak,
        longestStreak: data.longestStreak ?? state.longestStreak,
        freezes: data.freezes ?? state.freezes,
        totalCheckIns: data.totalCheckIns ?? state.totalCheckIns,
        hoursUntilBreak: data.hoursUntilBreak ?? state.hoursUntilBreak,
        atRisk: false,
        checkedInToday: true,
      });
      if (data.milestone) {
        toast.success(`🎉 سلسلة ${data.milestone} يوم!`, {
          description: `ربحت ${data.milestonePoints} نقطة`,
        });
      } else if (data.alreadyCheckedInToday) {
        // صامت — لا toast
      } else if (data.isNewRecord) {
        toast.success("🔥 رقم قياسي جديد!", {
          description: `سلسلتك الآن ${data.currentStreak} يوم`,
        });
      } else {
        toast.success(`🔥 سلسلتك الآن ${data.currentStreak} يوم`, {
          description: data.usedFreeze
            ? "استُخدم freeze لحماية السلسلة"
            : undefined,
        });
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "تعذّر تسجيل الدخول"
      );
    } finally {
      setChecking(false);
    }
  }, [state.currentStreak, state.longestStreak, state.freezes, state.totalCheckIns, state.hoursUntilBreak]);

  // auto check-in on mount لو لم يُسجّل اليوم
  React.useEffect(() => {
    if (initial && !initial.checkedInToday) {
      void handleCheckIn();
    }
  }, []);

  // compact: عرض صغير للهيدر/السايدبار
  if (variant === "compact") {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5"
      >
        <motion.span
          animate={{
            scale: state.atRisk ? [1, 1.2, 1] : [1, 1.05, 1],
            rotate: state.atRisk ? [0, -5, 5, 0] : 0,
          }}
          transition={{
            duration: state.atRisk ? 0.8 : 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          aria-hidden
        >
          <Flame
            className={cn(
              "size-4",
              state.atRisk ? "text-destructive" : "text-primary"
            )}
          />
        </motion.span>
        <span className="font-heading text-sm font-bold text-foreground">
          {state.currentStreak}
        </span>
        <span className="text-xs text-muted-foreground">يوم</span>
        {state.freezes > 0 && (
          <span className="flex items-center gap-0.5 text-xs text-secondary" aria-hidden>
            <Snowflake className="size-3" />
            {state.freezes}
          </span>
        )}
      </motion.div>
    );
  }

  // large: بطاقة كبيرة للمجتمع
  const progressPct = Math.min(100, (state.currentStreak / Math.max(7, state.longestStreak)) * 100);
  const urgencyLabel = formatUrgency(state.hoursUntilBreak);

  return (
    <Card className="warm-shadow overflow-hidden">
      <CardContent className="space-y-4 p-6">
        {/* الرأس */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{
                scale: state.atRisk ? [1, 1.15, 1] : [1, 1.05, 1],
                rotate: state.atRisk ? [0, -3, 3, 0] : 0,
              }}
              transition={{
                duration: state.atRisk ? 0.6 : 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={cn(
                "flex size-14 items-center justify-center rounded-full",
                state.atRisk
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
              )}
              aria-hidden
            >
              <Flame className="size-7" />
            </motion.div>
            <div>
              <p className="text-xs text-muted-foreground">سلسلتك الحالية</p>
              <p className="font-heading text-3xl font-bold text-foreground">
                {state.currentStreak}{" "}
                <span className="text-base font-medium text-muted-foreground">
                  يوم متتالٍ
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-xs text-secondary">
              <Snowflake className="size-3.5" />
              {state.freezes} freeze متبقّي
            </span>
            <span className="text-xs text-muted-foreground">
              الرقم القياسي: {state.longestStreak}
            </span>
          </div>
        </div>

        {/* شريط التقدّم */}
        <div className="space-y-1">
          <Progress value={progressPct} className="h-2" />
          <p className="text-xs text-muted-foreground">
            إجمالي تسجيلات: {state.totalCheckIns}
          </p>
        </div>

        {/* تحذير الإلحاح */}
        <AnimatePresence>
          {state.atRisk && !state.checkedInToday && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
            >
              <Clock className="size-5 text-destructive shrink-0" />
              <p className="text-sm font-medium text-destructive">
                {urgencyLabel}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* زر تسجيل الدخول اليومي */}
        <Button
          onClick={handleCheckIn}
          disabled={checking || state.checkedInToday}
          className="h-11 w-full"
          variant={state.checkedInToday ? "outline" : "default"}
        >
          <Flame className="size-4" />
          {state.checkedInToday
            ? "✓ سجّلت دخول اليوم"
            : "سجّل دخول اليوم"}
        </Button>
      </CardContent>
    </Card>
  );
}

function formatUrgency(hoursUntilBreak: number): string {
  if (hoursUntilBreak <= 0) return "سلسلتك على وشك الانكسار!";
  if (hoursUntilBreak < 1) {
    const minutes = Math.round(hoursUntilBreak * 60);
    return `⏰ سلسلتك تنتهي بعد ${minutes} دقيقة`;
  }
  if (hoursUntilBreak < 24) {
    const h = Math.ceil(hoursUntilBreak);
    return `⏰ سلسلتك تنتهي بعد ${h} ساعة`;
  }
  const days = Math.floor(hoursUntilBreak / 24);
  return `⏰ سلسلتك تنتهي بعد ${days} يوم`;
}
