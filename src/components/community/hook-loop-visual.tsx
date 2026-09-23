"use client";

// ===================================================================
//  HookLoopVisual — تمثيل دائري متحرّك لحلقة الإدمان
//  4 مراحل متّصلة عبر أسهم، مع نبض نشط
// ===================================================================

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HookPhaseVisual {
  title: string;
  emoji: string;
  color: string;
}

export function HookLoopVisual({ phases }: { phases: HookPhaseVisual[] }) {
  return (
    <div className="relative rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {phases.map((phase, i) => (
          <div key={phase.title} className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
              className="flex-1"
            >
              <div
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-2xl border-2 bg-card p-3 text-center",
                  "border-current"
                )}
              >
                <motion.span
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.4,
                  }}
                  className="text-3xl"
                  aria-hidden
                >
                  {phase.emoji}
                </motion.span>
                <p className={cn("mt-2 text-xs font-bold", phase.color)}>
                  {phase.title}
                </p>
              </div>
            </motion.div>

            {/* السهم بعد كل عنصر عدا الأخير */}
            {i < phases.length - 1 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 + 0.2 }}
                className="hidden sm:block"
                aria-hidden
              >
                {/* RTL: السهم يشير ليسار (إلى الأمام في العربية) */}
                <ArrowLeft className={cn("size-6", phase.color)} />
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* حلقة أسفل: ربط آخر → أول (Investment → Trigger) */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>يكتمل الدور: استثماراتك تخلق مُحفّزات جديدة</span>
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          aria-hidden
        >
          <ArrowRight className="size-3" />
        </motion.span>
      </div>
    </div>
  );
}
