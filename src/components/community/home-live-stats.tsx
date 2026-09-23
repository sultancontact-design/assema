"use client";

// ===================================================================
//  HomeLiveStats — البطاقات الأربع للإحصاءات الحيّة
//  - يستقبل props أولية من server (SSR)
//  - يعرض AnimatedCounter لكل قيمة
//  - كل بطاقة بلون زليج مميّز
// ===================================================================

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, HandCoins, Scale, CalendarDays } from "lucide-react";
import { AnimatedCounter } from "@/components/community/animated-counter";

interface HomeLiveStatsProps {
  families: number;
  contributions: number;
  contributionsTotal: number;
  events: number;
}

const arabicNumber = new Intl.NumberFormat("ar-MA");

export function HomeLiveStats({
  families,
  contributions,
  contributionsTotal,
  events,
}: HomeLiveStatsProps) {
  const stats = [
    {
      label: "أسرة مسجّلة",
      value: families,
      icon: Users,
      color: "text-secondary",
      bg: "bg-secondary/10",
      formatFn: (n: number) => arabicNumber.format(Math.round(n)),
    },
    {
      label: "مساهمة مؤكّدة",
      value: contributions,
      icon: HandCoins,
      color: "text-primary",
      bg: "bg-primary/10",
      formatFn: (n: number) => arabicNumber.format(Math.round(n)),
    },
    {
      label: "رصيد الصندوق (د.م)",
      value: contributionsTotal,
      icon: Scale,
      color: "text-accent",
      bg: "bg-accent/15",
      formatFn: (n: number) => arabicNumber.format(Math.round(n)),
    },
    {
      label: "فعالية قادمة",
      value: events,
      icon: CalendarDays,
      color: "text-secondary",
      bg: "bg-secondary/10",
      formatFn: (n: number) => arabicNumber.format(Math.round(n)),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
          >
            <Card className="text-center warm-shadow card-glow border-border overflow-hidden">
              <CardContent className="pt-5 pb-5">
                <span
                  className={`mx-auto mb-2 grid size-9 place-items-center rounded-full ${stat.bg} ${stat.color}`}
                  aria-hidden="true"
                >
                  <Icon className="size-4.5" />
                </span>
                <div
                  className={`font-heading text-3xl sm:text-4xl font-extrabold ${stat.color}`}
                >
                  <AnimatedCounter
                    value={stat.value}
                    duration={2200}
                    delay={idx * 150}
                    formatFn={stat.formatFn}
                  />
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

export function HomeLiveStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} className="text-center warm-shadow border-border">
          <CardContent className="pt-5 pb-5">
            <Skeleton className="size-9 mx-auto mb-2 rounded-full" />
            <Skeleton className="h-9 w-2/3 mx-auto mb-2" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
