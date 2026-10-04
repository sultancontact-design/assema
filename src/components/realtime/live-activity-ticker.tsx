"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity, UserPlus, Coins, Building2, Heart, MessageSquare,
  ArrowBigUp, FileText, Megaphone, Wifi, WifiOff,
} from "lucide-react";

interface ActivityEvent {
  id: string;
  type: "contribution" | "member_join" | "new_org" | "follow" | "comment" | "vote" | "ledger" | "announcement";
  title: string;
  subtitle?: string;
  userName?: string;
  regionName?: string;
  amount?: number;
  ts: number;
}

const TYPE_META: Record<string, { icon: any; color: string }> = {
  contribution: { icon: Coins, color: "text-emerald-600" },
  member_join: { icon: UserPlus, color: "text-teal-700 dark:text-teal-300" },
  new_org: { icon: Building2, color: "text-amber-600" },
  follow: { icon: Heart, color: "text-rose-600" },
  comment: { icon: MessageSquare, color: "text-blue-600" },
  vote: { icon: ArrowBigUp, color: "text-orange-600" },
  ledger: { icon: FileText, color: "text-indigo-600" },
  announcement: { icon: Megaphone, color: "text-purple-600" },
};

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "الآن";
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + " د";
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + " س";
  return Math.floor(diff / 86_400_000) + " ي";
}

export function LiveActivityTicker() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // IMPORTANT: per gateway rule, use relative path + XTransformPort
    const socket = io("/?XTransformPort=3003", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("recent", (recent: ActivityEvent[]) => {
      setEvents(recent.slice(0, 15));
    });

    socket.on("activity", (event: ActivityEvent) => {
      setEvents((prev) => [event, ...prev].slice(0, 15));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Card className="border-teal-300/40 bg-gradient-to-br from-background to-teal-50/30 dark:to-teal-950/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-teal-700 dark:text-teal-300" />
            <h3 className="font-semibold text-sm">نشاط وَصَل الحيّ</h3>
            {connected ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                <Wifi className="h-3 w-3" /> مباشر
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <WifiOff className="h-3 w-3" /> غير متصل
              </span>
            )}
          </div>
          <Badge variant="outline" className="text-[10px]">RT</Badge>
        </div>

        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">في انتظار أحداث...</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {events.map((e) => {
              const meta = TYPE_META[e.type] ?? TYPE_META.announcement;
              const Icon = meta.icon;
              return (
                <li key={e.id} className="flex items-start gap-2 text-xs animate-in fade-in slide-in-from-top-1 duration-300">
                  <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${meta.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium leading-tight">{e.title}</p>
                    {e.subtitle && (
                      <p className="text-muted-foreground leading-tight">{e.subtitle}</p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      {e.regionName && <span>{e.regionName}</span>}
                      <span>· {formatRelative(e.ts)}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
