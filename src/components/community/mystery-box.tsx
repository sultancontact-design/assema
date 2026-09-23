"use client";

// ===================================================================
//  MysteryBox — صندوق غامض تفاعلي
//  - يهتزّ قبل الفتح
//  - confetti بعد الفتح
//  - يعرض المكافأة بإيموجي مناسب
// ===================================================================

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Gift, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MysteryBoxProps {
  eligible: boolean;
  reason?: string;
  contributionsSince?: number;
  required?: number;
}

interface MysteryReward {
  type: "POINTS" | "FREEZE" | "BADGE";
  value: number;
  emoji: string;
  label: string;
  badgeName?: string;
}

export function MysteryBox({
  eligible,
  reason,
  contributionsSince = 0,
  required = 5,
}: MysteryBoxProps) {
  const [opening, setOpening] = React.useState(false);
  const [reward, setReward] = React.useState<MysteryReward | null>(null);
  const [showConfetti, setShowConfetti] = React.useState(false);

  const handleOpen = async () => {
    setOpening(true);
    setReward(null);
    try {
      const res = await fetch("/api/community/rewards/mystery-box", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "تعذّر فتح الصندوق");
      setReward(data.reward);
      // confetti لمدة ثانيتين
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2200);
      toast.success("🎁 فتحت الصندوق الغامض!", {
        description: data.reward.label,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ غير متوقّع");
    } finally {
      setOpening(false);
    }
  };

  const progress = Math.min(100, (contributionsSince / required) * 100);

  return (
    <Card className="warm-shadow overflow-hidden">
      <CardContent className="space-y-4 p-6 text-center">
        <div>
          <h3 className="font-heading text-lg font-bold text-foreground">
            الصندوق الغامض
          </h3>
          <p className="text-xs text-muted-foreground">
            مكافأة عشوائية بعد كل {required} مساهمات
          </p>
        </div>

        {/* الصندوق */}
        <div className="relative flex h-32 items-center justify-center">
          <AnimatePresence mode="wait">
            {reward ? (
              <motion.div
                key="reward"
                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-5xl" aria-hidden>
                  {reward.emoji}
                </span>
                <p className="font-heading text-sm font-bold text-foreground">
                  {reward.label}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="box"
                animate={
                  opening
                    ? {
                        rotate: [0, -8, 8, -8, 8, 0],
                        scale: [1, 1.05, 1, 1.05, 1],
                      }
                    : eligible
                      ? { y: [0, -4, 0], rotate: [0, -2, 2, 0] }
                      : {}
                }
                transition={
                  opening
                    ? { duration: 0.6, repeat: Infinity }
                    : eligible
                      ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      : {}
                }
                className="flex size-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20"
                aria-hidden
              >
                <Gift className="size-12 text-primary" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confetti */}
          {showConfetti && <ConfettiBurst />}
        </div>

        {/* المؤشّر التقدّم */}
        {!reward && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              المساهمات منذ آخر صندوق:{" "}
              <span className="font-bold text-foreground">
                {contributionsSince}/{required}
              </span>
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6 }}
                className="h-full bg-gradient-to-r from-primary to-accent"
              />
            </div>
          </div>
        )}

        <Button
          onClick={handleOpen}
          disabled={opening || !eligible || !!reward}
          className="h-11 w-full"
        >
          {reward ? (
            "✓ أُفتح الصندوق"
          ) : opening ? (
            <Spinner label="جارٍ الفتح..." />
          ) : eligible ? (
            <>
              <Sparkles className="size-4" />
              افتح الصندوق الغامض
            </>
          ) : (
            reason ?? "غير مؤهّل بعد"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─────────── Confetti بسيط ───────────

function ConfettiBurst() {
  const colors = ["#B8492B", "#2D5A3D", "#C8842A", "#FBF6EE", "#D4623E"];
  const pieces = Array.from({ length: 24 });
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {pieces.map((_, i) => {
        const angle = (i / pieces.length) * Math.PI * 2;
        const distance = 60 + Math.random() * 30;
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              opacity: 0,
              scale: 0.5,
              rotate: Math.random() * 360,
            }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className={cn("absolute left-1/2 top-1/2 size-2 rounded-full")}
            style={{ backgroundColor: colors[i % colors.length] }}
          />
        );
      })}
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2">
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        className="size-4 rounded-full border-2 border-current border-t-transparent"
      />
      {label}
    </span>
  );
}
