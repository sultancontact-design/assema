"use client";

// ===================================================================
//  LossAversionWidget — منع الفقدان (Prospect Theory)
//  - ⚠️ سلسلتك (12 يوم) ستنكسر بعد X ساعات
//  - 💰 X نقطة معلّقة — سجّل دخولك لتحصل عليها
//  - 🏅 شارة 'نشط' على وشك الانتهاء
//  - 📉 رصيدك انخفض X% هذا الشهر
// ===================================================================

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Coins, Award, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LossAversionData {
  streakAtRisk: boolean;
  streakHoursUntilBreak: number;
  streakCurrent: number;
  pendingPoints: number;
  recentBadges: Array<{
    id: string;
    name: string;
    icon: string;
    rarity: string;
    earnedAt: string;
  }>;
  balanceTrendPct: number;
  thisMonthActivities: number;
}

interface LossAversionWidgetProps {
  initial: LossAversionData;
}

export function LossAversionWidget({ initial }: LossAversionWidgetProps) {
  const [data, setData] = React.useState<LossAversionData>(initial);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/community/loss-aversion", {
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) setData(json.data);
        }
      } catch {
        // تجاهل
      }
    })();
  }, []);

  const items: LossItem[] = [];

  // 1) تحذير السلسلة
  if (data.streakAtRisk) {
    items.push({
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      title: "سلسلتك معرّضة للكسر",
      detail: `🔥 سلسلتك (${data.streakCurrent} يوم) ستنكسر بعد ${formatHours(data.streakHoursUntilBreak)}`,
      action: { label: "سجّل الآن", href: "/api/community/streak/check-in" },
    });
  }

  // 2) نقاط معلّقة
  if (data.pendingPoints > 0) {
    items.push({
      icon: Coins,
      color: "text-accent",
      bg: "bg-accent/10",
      title: "نقاط معلّقة",
      detail: `💰 ${data.pendingPoints} درهم معلّق — بمجرد تأكيد مساهمتك تُضاف لنقاطك`,
      action: { label: "تابع مساهماتك", href: "/community/fund" },
    });
  }

  // 3) شارة "نشط" — لو آخر شارة قديمة > 7 أيام
  if (data.recentBadges.length > 0) {
    const last = data.recentBadges[0];
    const daysSince = (Date.now() - new Date(last.earnedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (last.rarity === "common" && daysSince > 7) {
      items.push({
        icon: Award,
        color: "text-secondary",
        bg: "bg-secondary/10",
        title: "شارة على وشك الانتهاء",
        detail: `🏅 شارة "${last.name}" لم تُجدَّد منذ ${Math.floor(daysSince)} يوم`,
        action: { label: "احفظ شارتك", href: "/community/hooks" },
      });
    }
  }

  // 4) اتجاه الرصيد
  if (data.balanceTrendPct < 0) {
    items.push({
      icon: TrendingDown,
      color: "text-destructive",
      bg: "bg-destructive/10",
      title: "رصيدك انخفض",
      detail: `📉 نشاطك انخفض ${Math.abs(data.balanceTrendPct)}% هذا الشهر (${data.thisMonthActivities} نشاط)`,
      action: { label: "عوض النقص", href: "/community/fund" },
    });
  }

  // إن لم توجد أي عناصر → إظهار حالة إيجابية
  if (items.length === 0) {
    return (
      <Card className="warm-shadow bg-gradient-to-br from-secondary/5 to-accent/5">
        <CardContent className="space-y-3 p-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary/10 text-secondary text-2xl">
            ✨
          </div>
          <h3 className="font-heading text-base font-bold text-foreground">
            وضعك ممتاز!
          </h3>
          <p className="text-sm text-muted-foreground">
            سلسلتك آمنة، شاراتك مكتملة، ونشاطك منتظم. استمر!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="warm-shadow border-destructive/20">
      <CardContent className="space-y-3 p-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-destructive" />
          <h3 className="font-heading text-base font-bold text-foreground">
            تنبيهات تستحقّ انتباهك
          </h3>
        </div>

        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {items.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3"
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${item.bg} ${item.color}`}
                >
                  <item.icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-bold text-foreground">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.detail}
                  </p>
                  {item.action && (
                    <form
                      action={item.action.href}
                      method="post"
                      className="pt-1"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs"
                        type="submit"
                      >
                        {item.action.label}
                      </Button>
                    </form>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

interface LossItem {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  title: string;
  detail: string;
  action?: { label: string; href: string };
}

function formatHours(hours: number): string {
  if (hours <= 0) return "الآن";
  if (hours < 1) return `${Math.round(hours * 60)} دقيقة`;
  if (hours < 24) return `${Math.ceil(hours)} ساعة`;
  return `${Math.floor(hours / 24)} يوم`;
}
