"use client";

// ===================================================================
//  SmartNotificationCenter — جرس الإشعارات الذكية في الهيدر
//  - أيقونة Bell + عدّاد غير المقروء
//  - لوحة منسدلة بآخر 10 إشعارات
//  - Mark as read عند النقر
// ===================================================================

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SmartNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  actionUrl: string | null;
  icon: string | null;
  sentAt: string;
  openedAt: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  STREAK: "🔥 السلسلة",
  MYSTERY_BOX: "🎁 الصندوق الغامض",
  SOCIAL: "👥 اجتماعي",
  URGENCY: "⏰ إلحاح",
  REWARD: "✨ مكافأة",
  CHALLENGE: "🏆 تحدٍّ",
  LOSS: "💔 فقدان",
  ACHIEVEMENT: "🏅 إنجاز",
  RECOMMENDATION: "💡 توصية",
  WELCOME_BACK: "👋 أهلاً بعودتك",
};

export function SmartNotificationCenter({
  initialNotifications = [],
  initialUnreadCount = 0,
}: {
  initialNotifications?: SmartNotification[];
  initialUnreadCount?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<SmartNotification[]>(
    initialNotifications
  );
  const [unreadCount, setUnreadCount] = React.useState(initialUnreadCount);
  const [loading, setLoading] = React.useState(false);

  // تحميل عند الفتح
  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/community/notifications", {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(json.notifications);
        setUnreadCount(json.unreadCount);
      }
    } catch {
      // تجاهل
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      void refresh();
    }
  }, [open, refresh]);

  const handleClick = async (notif: SmartNotification) => {
    if (!notif.openedAt) {
      try {
        await fetch("/api/community/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "markAsRead",
            notificationId: notif.id,
          }),
        });
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notif.id ? { ...n, openedAt: new Date().toISOString() } : n
          )
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // تجاهل
      }
    }
  };

  const handleMarkAll = async () => {
    try {
      await fetch("/api/community/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, openedAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success("تمّ تعليم الكل كمقروء");
    } catch {
      toast.error("تعذّر التحديث");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-10"
          aria-label="الإشعارات"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -end-0.5 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-[360px] max-w-[calc(100vw-1rem)] p-0"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border p-3">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            <h3 className="font-heading text-sm font-bold text-foreground">
              الإشعارات
            </h3>
            {unreadCount > 0 && (
              <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                {unreadCount} جديد
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={handleMarkAll}
              disabled={loading}
            >
              تعليم الكل كمقروء
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-96">
          <div className="divide-y divide-border">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                جارٍ التحميل...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-6 text-center">
                <span className="text-3xl">🎉</span>
                <p className="text-sm text-muted-foreground">
                  لا إشعارات جديدة. كلّ شيء على ما يرام!
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const unread = !notif.openedAt;
                return (
                  <Link
                    key={notif.id}
                    href={notif.actionUrl ?? "#"}
                    onClick={() => void handleClick(notif)}
                    className={cn(
                      "flex items-start gap-2 p-3 transition-colors hover:bg-muted/50",
                      unread && "bg-primary/5"
                    )}
                  >
                    <span className="mt-0.5 text-lg" aria-hidden>
                      {notif.icon ?? TYPE_LABELS[notif.type]?.split(" ")[0] ?? "•"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm text-foreground",
                          unread && "font-bold"
                        )}
                      >
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notif.body}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {timeAgo(notif.sentAt)}
                      </p>
                    </div>
                    {unread && (
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-border p-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-9 w-full text-xs"
          >
            <Link href="/community/notifications/settings">
              ⚙️ إعدادات الإشعارات
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
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
