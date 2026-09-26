"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Gift, Coins, ShoppingCart, ArrowLeft, Snowflake, Crown,
  Heart, Moon, Star, Diamond, Zap, Tag, BookOpen, Image, Lock,
} from "lucide-react";
import Link from "next/link";

interface StoreItem { id: string; name: string; description: string; icon: string; pricePoints: number; type: string; stock: number | null }

// Map emoji/old icons → Lucide icon component
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "🧊": Snowflake, "❄️": Snowflake,
  "👑": Crown,
  "💝": Heart,
  "🌙": Moon,
  "⭐": Star,
  "💎": Diamond,
  "⚡": Zap,
  "🎁": Gift,
  "📚": BookOpen,
  "🖼️": Image,
};

const TYPE_LABELS: Record<string, string> = { FREEZE: "تجميد", BADGE: "شارة", FEATURE: "ميزة", DISCOUNT: "خصم", DIGITAL: "رقمي" };
const TYPE_GRADIENTS: Record<string, string> = {
  FREEZE: "from-blue-500 to-cyan-600",
  BADGE: "from-amber-500 to-orange-600",
  FEATURE: "from-violet-500 to-purple-600",
  DISCOUNT: "from-emerald-500 to-teal-600",
  DIGITAL: "from-cyan-500 to-blue-600",
};

function ItemIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name] ?? Gift;
  return <Icon className="size-6 text-white" />;
}

export function StoreClient({ userPoints }: { userPoints: number | null }) {
  const [items, setItems] = React.useState<StoreItem[] | null>(null);
  const [points, setPoints] = React.useState(userPoints ?? 0);
  const [buying, setBuying] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/store/items").then(r => r.json()).then(d => setItems(d.items ?? [])).catch(() => setItems([]));
  }, []);

  const buy = async (item: StoreItem) => {
    if (points < item.pricePoints) { toast.error("رصيد غير كافٍ"); return; }
    if (!confirm(`شراء "${item.name}" مقابل ${item.pricePoints} نقطة؟`)) return;
    setBuying(item.id);
    try {
      const res = await fetch(`/api/store/items/${item.id}/purchase`, { method: "POST" });
      if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error ?? "فشل"); setBuying(null); return; }
      const d = await res.json();
      setPoints(d.remainingPoints);
      toast.success(`تمّ شراء ${item.name}`);
    } catch { toast.error("فشل الاتصال"); }
    setBuying(null);
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /><span>العودة للرئيسية</span>
      </Link>
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">
            <span className="shimmer-text">متجر النقاط</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">استبدل نقاط المعروف بمنتجات وميزات حصرية</p>
        </div>
        {userPoints !== null && (
          <div className="premium-card px-4 py-3 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Coins className="size-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">رصيدك</p>
              <p className="font-heading text-xl font-bold">{points} نقطة</p>
            </div>
          </div>
        )}
      </header>

      {items === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="premium-card p-12 text-center text-muted-foreground">
          <Gift className="size-8 mx-auto mb-2 opacity-50" />
          <p>لا توجد منتجات بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item, idx) => {
            const affordable = points >= item.pricePoints;
            const gradient = TYPE_GRADIENTS[item.type] ?? "from-primary to-orange-600";
            return (
              <div key={item.id} className={`premium-card p-5 flex flex-col h-full fade-stagger`} style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`size-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                    <ItemIcon name={item.icon} />
                  </div>
                  <Badge className="bg-muted/50 text-muted-foreground text-[10px]">{TYPE_LABELS[item.type] ?? item.type}</Badge>
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-base">{item.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{item.description}</p>
                </div>
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/40">
                  <span className="flex items-center gap-1 text-sm font-bold text-amber-600">
                    <Coins className="size-4" />{item.pricePoints}
                  </span>
                  {item.stock !== null && (
                    <span className="text-xs text-muted-foreground">{item.stock} متبقٍّ</span>
                  )}
                </div>
                <Button
                  onClick={() => buy(item)}
                  disabled={!affordable || buying === item.id}
                  className={`btn-premium w-full mt-3 ${affordable ? `bg-gradient-to-r ${gradient} border-0` : ""}`}
                  size="sm"
                >
                  {buying === item.id ? "..." : <><ShoppingCart className="size-4" />شراء</>}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
