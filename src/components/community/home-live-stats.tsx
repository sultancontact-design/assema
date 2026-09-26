"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, HandCoins, Scale, CalendarDays } from "lucide-react";

interface HomeLiveStatsProps {
  families: number;
  contributions: number;
  contributionsTotal: number;
  events: number;
}

const arabicNumber = new Intl.NumberFormat("ar-MA");

export function HomeLiveStats({
  families: initialFamilies,
  contributions: initialContributions,
  contributionsTotal: initialTotal,
  events: initialEvents,
}: HomeLiveStatsProps) {
  const [families, setFamilies] = React.useState(initialFamilies);
  const [contributions, setContributions] = React.useState(initialContributions);
  const [contributionsTotal, setTotal] = React.useState(initialTotal);
  const [events, setEvents] = React.useState(initialEvents);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/public/stats", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setFamilies(data.families ?? 0);
          setContributions(data.contributions ?? 0);
          setTotal(data.contributionsTotal ?? 0);
          setEvents(data.events ?? 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const stats = [
    { label: "أسرة مسجّلة", value: families, icon: Users, gradient: "from-emerald-500 to-teal-600" },
    { label: "مساهمة مؤكّدة", value: contributions, icon: HandCoins, gradient: "from-orange-500 to-red-600" },
    { label: "رصيد الصندوق", value: contributionsTotal, suffix: " د.م", icon: Scale, gradient: "from-amber-500 to-yellow-600" },
    { label: "فعالية قادمة", value: events, icon: CalendarDays, gradient: "from-violet-500 to-purple-600" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="premium-card p-5 h-full">
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`size-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                  <Icon className="size-5 text-white" />
                </div>
                <div>
                  <p className="stat-number">
                    {loaded ? arabicNumber.format(Math.round(stat.value)) : "..."}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">{stat.label}</p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function HomeLiveStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} className="text-center">
          <CardContent className="pt-5 pb-5">
            <Skeleton className="size-12 mx-auto mb-3 rounded-2xl" />
            <Skeleton className="h-10 w-2/3 mx-auto mb-2" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
