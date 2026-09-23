"use client";

// ===================================================================
//  SocialProofWidget — الدليل الاجتماعي الحيّ
//  - 👥 X عضواً نشطاً الآن (آخر 15 دقيقة)
//  - 📊 X مساهمة هذا الأسبوع
//  - 🎉 X فعالية قادمة
//  - Feed آخر 5 أنشطة: "أحمد ساهم بـ50 درهم قبل 5 دقائق"
// ===================================================================

import * as React from "react";
import { motion } from "framer-motion";
import { Users, BarChart3, CalendarCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface UserActivity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  user: { name: string | null };
}

interface SocialProofData {
  activeNowCount: number;
  weeklyContributions: number;
  upcomingEvents: number;
  recentActivities: UserActivity[];
}

interface SocialProofWidgetProps {
  initial: SocialProofData;
}

export function SocialProofWidget({ initial }: SocialProofWidgetProps) {
  const [data, setData] = React.useState<SocialProofData>(initial);

  // تحديث العدّاد كل 60 ثانية
  React.useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          "/api/community/social-proof",
          { cache: "no-store" }
        );
        if (res.ok) {
          const json = await res.json();
          if (json.success) setData(json.data);
        }
      } catch {
        // تجاهل صامت
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="warm-shadow">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-secondary" />
          </span>
          <h3 className="font-heading text-sm font-bold text-foreground">
            حيّك الآن
          </h3>
        </div>

        {/* 3 إحصائيات */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <SocialStat
            icon={<Users className="size-4" />}
            value={data.activeNowCount}
            label="نشط الآن"
            color="text-secondary"
            bg="bg-secondary/10"
          />
          <SocialStat
            icon={<BarChart3 className="size-4" />}
            value={data.weeklyContributions}
            label="مساهمة هذا الأسبوع"
            color="text-primary"
            bg="bg-primary/10"
          />
          <SocialStat
            icon={<CalendarCheck className="size-4" />}
            value={data.upcomingEvents}
            label="فعالية قادمة"
            color="text-accent"
            bg="bg-accent/10"
          />
        </div>

        {/* Feed الأنشطة */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">آخر النشاطات</p>
          <div className="max-h-48 overflow-y-auto rounded-lg bg-muted/40 p-2">
            {data.recentActivities.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                لا يوجد نشاط حيّ بعد
              </p>
            ) : (
              data.recentActivities.map((act, i) => (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-background"
                >
                  <ActivityIcon type={act.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground line-clamp-1">
                      <span className="font-medium">
                        {act.user.name ?? "عضو"}
                      </span>{" "}
                      {act.description.replace(act.user.name ?? "", "")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {timeAgo(act.createdAt)}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SocialStat({
  icon,
  value,
  label,
  color,
  bg,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="space-y-1">
      <div
        className={`mx-auto flex size-9 items-center justify-center rounded-lg ${bg} ${color}`}
      >
        {icon}
      </div>
      <p className={`font-heading text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground leading-tight">
        {label}
      </p>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const map: Record<string, string> = {
    LOGIN: "✅",
    CONTRIBUTION: "💰",
    FUND_REQUEST: "🤝",
    EVENT_REGISTER: "📅",
    GROUP_JOIN: "👥",
    BADGE_EARNED: "🏅",
    STREAK_MILESTONE: "🔥",
  };
  return (
    <span className="mt-0.5 text-base" aria-hidden>
      {map[type] ?? "•"}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `قبل ${days} يوم`;
}
