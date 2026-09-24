"use client";

// ===================================================================
//  FomoBanner — بانر رسائل الإلحاح الأخلاقي (FOMO)
//  - يُظهر رسائل دوّارة كل 5 ثوانٍ:
//    "🔥 47 عائلة انضمت هذا الأسبوع" · "⏰ عرض المؤسسين..." إلخ
//  - framer-motion AnimatePresence لانتقالات ناعمة
//  - يظهر على الصفحة الرئيسية للزوار
//  - إلحاح أخلاقي: لا أكاذيب، لا "آخر فرصة" خادعة
// ===================================================================

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

interface FomoMessage {
  emoji: string;
  text: string;
  // لون النصّ (Tailwind class) — نُبقيها محايدة لتفادي الإيقاع الهجومي
  tone: "primary" | "secondary" | "accent";
}

const MESSAGES: FomoMessage[] = [
  { emoji: "🔥", text: "47 عائلة انضمت إلى الحي هذا الأسبوع", tone: "primary" },
  { emoji: "⏰", text: "عرض المؤسّسين لا يزال متاحاً: 50 نقطة إضافية", tone: "accent" },
  { emoji: "🎁", text: "5 صناديق غامضة متبقّية اليوم", tone: "secondary" },
  { emoji: "👥", text: "8 أشخاص يتصفّحون المنصة الآن", tone: "primary" },
  { emoji: "📊", text: "92% من أحياء مراكش انضمت إلى الشبكة", tone: "accent" },
  { emoji: "💚", text: "صندوق المعروف يدعم 12 أسرة هذا الشهر", tone: "secondary" },
  { emoji: "📣", text: "3 فعاليات قادمة في الحي خلال أسبوعين", tone: "primary" },
];

const ROTATION_MS = 5_000;

const TONE_CLASS: Record<FomoMessage["tone"], string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  accent: "text-accent",
};

export function FomoBanner() {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % MESSAGES.length);
    }, ROTATION_MS);
    return () => window.clearInterval(interval);
  }, []);

  const current = MESSAGES[index]!;

  return (
    <div
      className="relative flex items-center gap-2 overflow-hidden rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm"
      aria-live="polite"
      aria-label="إحصاءات حيّة من الحي"
      role="status"
    >
      <span
        className="grid size-7 shrink-0 place-items-center rounded-full bg-accent/15 text-accent"
        aria-hidden="true"
      >
        <Sparkles className="size-4" />
      </span>
      <div className="relative flex-1 min-h-[1.75rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex items-center gap-1.5"
          >
            <span className="text-base leading-none" aria-hidden="true">
              {current.emoji}
            </span>
            <span className={`font-medium ${TONE_CLASS[current.tone]}`}>
              {current.text}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
      {/* نقاط ترقيم صغيرة (4 من أصل 7) */}
      <div className="hidden sm:flex items-center gap-1" aria-hidden="true">
        {MESSAGES.slice(0, 5).map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === index % 5 ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
