"use client";

// ===================================================================
//  ActivityTicker — شريط النشاطات الحيّة
//  - يجلب من /api/public/activity-feed (بدون مصادقة)
//  - شريط أفقي متحرّك (RTL: يتحرّك من اليمين إلى اليسار)
//  - يُظهر 5-8 نشاطات حديثة كبصيلات: "🔥 أحمد ساهم بـ50 د.م"
//  - framer-motion للحركة الناعمة
//  - استطلاع كل 30 ثانية لجلب النشاطات الجديدة
//  - skeleton أثناء التحميل
// ===================================================================

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Users, Sparkles, HandCoins, CalendarPlus, Award, Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface ActivityItem {
  type: string;
  description: string;
  timeAgo: string;
}

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CONTRIBUTION: HandCoins,
  LOGIN: Users,
  EVENT_REGISTER: CalendarPlus,
  GROUP_JOIN: Users,
  BADGE_EARNED: Award,
  STREAK_MILESTONE: Flame,
  FUND_REQUEST: Heart,
  default: Sparkles,
};

const ACTIVITY_EMOJI: Record<string, string> = {
  CONTRIBUTION: "🤲",
  LOGIN: "👋",
  EVENT_REGISTER: "📅",
  GROUP_JOIN: "👥",
  BADGE_EARNED: "🏆",
  STREAK_MILESTONE: "🔥",
  FUND_REQUEST: "💝",
  default: "✨",
};

function ActivityPill({ item }: { item: ActivityItem }) {
  const Icon = ACTIVITY_ICONS[item.type] ?? ACTIVITY_ICONS.default;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card/90 ps-3 pe-4 py-1.5 text-sm shadow-sm backdrop-blur">
      <span
        className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary shrink-0"
        aria-hidden="true"
      >
        <Icon className="size-3.5" />
      </span>
      <span className="text-foreground font-medium">{item.description}</span>
      <span className="text-muted-foreground text-xs">· {item.timeAgo}</span>
    </span>
  );
}

function TickerSkeleton() {
  return (
    <div className="flex items-center gap-2 overflow-hidden" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-48 rounded-full shrink-0" />
      ))}
    </div>
  );
}

function EmptyTicker() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
      <Sparkles className="size-4 text-accent" aria-hidden="true" />
      <span>المنصة تستيقظ الآن... كن أوّل المساهمين اليوم!</span>
    </div>
  );
}

export function ActivityTicker() {
  const [items, setItems] = React.useState<ActivityItem[] | null>(null);
  const [error, setError] = React.useState(false);

  const fetchFeed = React.useCallback(async () => {
    try {
      const res = await fetch("/api/public/activity-feed", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("fetch failed");
      const data = (await res.json()) as ActivityItem[];
      setItems(data);
      setError(false);
    } catch {
      // لا نُخفي القائمة القديمة لو فشل التحديث الجديد
      if (items === null) {
        setError(true);
        setItems([]);
      }
    }
  }, [items]);

  React.useEffect(() => {
    fetchFeed();
    const interval = window.setInterval(fetchFeed, 30_000);
    return () => window.clearInterval(interval);
  }, [fetchFeed]);

  // محتوى التحميل
  if (items === null) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-border bg-muted/30 px-3 py-2">
        <TickerSkeleton />
      </div>
    );
  }

  // لا توجد بيانات حقيقية ولا احتياطية
  if (items.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-border bg-muted/30 px-4 py-3">
        <EmptyTicker />
      </div>
    );
  }

  // نُكرّر البصيلات مرّتين لتفادي الفراغ أثناء التحرّك المستمر
  const loop = [...items, ...items];

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-border bg-muted/30 px-1 py-2"
      role="marquee"
      aria-label="آخر نشاطات الحي"
      aria-live="polite"
    >
      {/* تدرّج للإخفاء عند الحافّتين */}
      <div
        className="pointer-events-none absolute inset-y-0 start-0 z-10 w-12 bg-gradient-to-r from-muted/60 to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 end-0 z-10 w-12 bg-gradient-to-l from-muted/60 to-transparent"
        aria-hidden="true"
      />
      <motion.div
        className="flex w-max items-center gap-2 px-2"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: Math.max(20, items.length * 4),
          ease: "linear",
          repeat: Infinity,
          repeatType: "loop",
        }}
      >
        {loop.map((item, idx) => (
          <ActivityPill key={`${idx}-${item.description}`} item={item} />
        ))}
      </motion.div>

      {error && (
        <AnimatePresence>
          <span className="sr-only">تعذّر تحديث الشريط، نُعيد المحاولة</span>
        </AnimatePresence>
      )}
    </div>
  );
}

// نصدّر الثوابت الثانوية لإعادة الاستعمال (اختياري)
export { ACTIVITY_EMOJI };
