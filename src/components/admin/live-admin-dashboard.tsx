"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, CalendarDays, TrendingUp, Activity, Clock } from "lucide-react";

interface LiveStat {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  trend?: string;
}

interface FeedItem {
  id: string;
  action: string;
  user: string;
  time: string;
  severity: string;
}

export function LiveAdminDashboard() {
  const [stats, setStats] = React.useState<LiveStat[]>([
    { label: "مستخدم نشط الآن", value: 0, icon: Users, color: "text-secondary" },
    { label: "مساهمات اليوم", value: 0, icon: Heart, color: "text-primary" },
    { label: "فعاليات اليوم", value: 0, icon: CalendarDays, color: "text-accent" },
    { label: "نسبة الانتماء", value: 0, icon: TrendingUp, color: "text-secondary" },
  ]);
  const [feed, setFeed] = React.useState<FeedItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());

  const fetchStats = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/live-stats");
      if (res.ok) {
        const data = await res.json();
        setStats([
          { label: "مستخدم نشط الآن", value: data.activeUsers ?? 0, icon: Users, color: "text-secondary", trend: data.activeUsers > 5 ? "↑" : "→" },
          { label: "مساهمات اليوم", value: data.contributionsToday ?? 0, icon: Heart, color: "text-primary", trend: data.contributionsToday > 0 ? "↑" : "→" },
          { label: "فعاليات اليوم", value: data.eventsToday ?? 0, icon: CalendarDays, color: "text-accent" },
          { label: "نسبة الانتماء", value: data.engagementRate ?? 0, icon: TrendingUp, color: "text-secondary" },
        ]);
        setFeed(data.recentActivities ?? []);
        setLastUpdate(new Date());
      }
    } catch {
      // فشل صامت — نبقي البيانات السابقة
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // تحديث كل 10 ثوان
    return () => clearInterval(interval);
  }, [fetchStats]);

  return (
    <div className="space-y-4">
      {/* شريط الحالة الحي */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-secondary" />
          </span>
          <span className="text-sm font-medium text-foreground">
            {stats[0].value > 0 ? `🟢 ${stats[0].value} مستخدم نشط` : "⚪ بانتظار النشاط"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3" />
          <span>آخر تحديث: {lastUpdate.toLocaleTimeString("ar-MA")}</span>
        </div>
      </div>

      {/* 4 بطاقات KPI حية */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="border-border">
              <CardContent className="p-4 text-center">
                <Icon className={`size-5 mx-auto mb-1 ${stat.color}`} strokeWidth={1.5} />
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {stat.value}
                  {stat.label.includes("نسبة") ? "%" : ""}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {stat.label}
                  {stat.trend && (
                    <span className={`ms-1 ${stat.trend === "↑" ? "text-secondary" : "text-muted-foreground/50"}`}>
                      {stat.trend}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* آخر 20 حدث */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="size-4 text-primary" strokeWidth={1.5} />
            <h3 className="text-sm font-bold text-foreground">آخر الأنشطة</h3>
            <Badge variant="secondary" className="text-xs">Live</Badge>
          </div>
          {loading && feed.length === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 rounded animate-pulse bg-muted" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          ) : feed.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد أنشطة حديثة</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
              {feed.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={item.severity === "critical" ? "destructive" : item.severity === "warning" ? "default" : "secondary"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {item.action.split(".")[0]}
                    </Badge>
                    <span className="text-foreground truncate max-w-[200px]">{item.user}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
