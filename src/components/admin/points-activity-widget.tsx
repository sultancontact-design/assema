"use client";

// ===================================================================
//  PointsActivityWidget — v61.0
//  أداة عرض آخر معاملات النقاط (compact widget for admin pages)
//  - يجلب من /api/admin/points/ledger
//  - 5 معاملات أخيرة في بطاقة مدمجة
//  - لكل معاملة: user + amount (with color) + type + reason + time
//  - يمكن تضمينه في أي صفحة أدمن
// ===================================================================

import * as React from "react";
import Link from "next/link";
import { Coins, TrendingUp, TrendingDown, ShoppingCart, RotateCcw, Sparkles, Award, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/constants";

interface LedgerEntry {
  id: string;
  userId: string;
  amount: number;
  type: string;
  reason: string;
  balanceAfter: number;
  createdAt: string;
  user?: { id: string; fullName: string; email: string } | null;
}

interface PointsActivityWidgetProps {
  /** عدد العناصر (default: 5) */
  limit?: number;
  /** عنوان البطاقة */
  title?: string;
  /** فلترة بـuserId */
  userId?: string;
  /** compact mode (no header) */
  compact?: boolean;
}

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  EARN: { icon: Sparkles, color: "text-emerald-600", label: "كسب" },
  SPEND: { icon: TrendingDown, color: "text-rose-600", label: "صرف" },
  ADMIN_ADD: { icon: TrendingUp, color: "text-emerald-700", label: "إضافة أدمن" },
  ADMIN_REMOVE: { icon: TrendingDown, color: "text-rose-700", label: "خصم أدمن" },
  PURCHASE: { icon: ShoppingCart, color: "text-violet-700", label: "شراء" },
  REFUND: { icon: RotateCcw, color: "text-amber-700", label: "استرداد" },
  ADJUST: { icon: Coins, color: "text-blue-700", label: "تعديل" },
  TRANSFER: { icon: Coins, color: "text-indigo-700", label: "تحويل" },
};

export function PointsActivityWidget({
  limit = 5,
  title = "آخر معاملات النقاط",
  userId,
  compact = false,
}: PointsActivityWidgetProps) {
  const [items, setItems] = React.useState<LedgerEntry[] | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (userId) params.set("userId", userId);
    fetch(`/api/admin/points/ledger?${params}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [limit, userId]);

  if (compact) {
    return (
      <div className="space-y-1">
        {loading ? (
          Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))
        ) : items && items.length > 0 ? (
          items.map((entry) => <CompactRow key={entry.id} entry={entry} />)
        ) : (
          <p className="text-xs text-muted-foreground text-center py-3">
            لا توجد معاملات
          </p>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Coins className="size-4 text-amber-600" />
            {title}
          </span>
          <Link
            href="/admin/economy"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            عرض الكل →
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: limit }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md" />
            ))}
          </div>
        ) : items && items.length > 0 ? (
          <ul className="space-y-1">
            {items.map((entry) => (
              <li key={entry.id}>
                <Row entry={entry} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            لا توجد معاملات بعد
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ entry }: { entry: LedgerEntry }) {
  const config = TYPE_CONFIG[entry.type] ?? TYPE_CONFIG.ADJUST;
  const Icon = config.icon;
  const isPositive = entry.amount >= 0;
  const userName = entry.user?.fullName ?? "مستخدم";
  const timeAgo = formatTimeAgo(new Date(entry.createdAt));

  return (
    <Link
      href={`/admin/users/manage?q=${encodeURIComponent(entry.user?.email || "")}`}
      className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/40 transition-colors"
    >
      <div className={`grid place-items-center size-8 shrink-0 rounded-full bg-muted/60 ${config.color}`}>
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground font-medium truncate">
          {userName}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">
          {entry.reason}
        </p>
      </div>
      <div className="text-end shrink-0">
        <p className={`font-bold text-sm tabular-nums ${isPositive ? "text-emerald-700" : "text-rose-700"}`}>
          {isPositive ? "+" : ""}{formatNumber(entry.amount)}
        </p>
        <p className="text-[10px] text-muted-foreground tabular-nums">
          = {formatNumber(entry.balanceAfter)} · {timeAgo}
        </p>
      </div>
    </Link>
  );
}

function CompactRow({ entry }: { entry: LedgerEntry }) {
  const config = TYPE_CONFIG[entry.type] ?? TYPE_CONFIG.ADJUST;
  const Icon = config.icon;
  const isPositive = entry.amount >= 0;
  const userName = entry.user?.fullName ?? "مستخدم";

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded text-xs">
      <Icon className={`size-3 shrink-0 ${config.color}`} />
      <span className="flex-1 truncate text-foreground">{userName}</span>
      <span className={`font-bold tabular-nums ${isPositive ? "text-emerald-700" : "text-rose-700"}`}>
        {isPositive ? "+" : ""}{formatNumber(entry.amount)}
      </span>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return "الآن";
  if (diff < 3600) return `قبل ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `قبل ${Math.floor(diff / 3600)} س`;
  if (diff < 604800) return `قبل ${Math.floor(diff / 86400)} ي`;
  return date.toLocaleDateString("ar-MA", { day: "numeric", month: "short" });
}

export default PointsActivityWidget;
