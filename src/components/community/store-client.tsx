"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Gift, Coins, ShoppingCart, Snowflake, Award, Sparkles, Percent,
  Monitor, Package, ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface StoreItem { id: string; name: string; description: string; icon: string; pricePoints: number; type: string; stock: number | null }

const TYPE_LABELS: Record<string, string> = { FREEZE: "تجميد", BADGE: "شارة", FEATURE: "ميزة", DISCOUNT: "خصم", DIGITAL: "رقمي" };
const TYPE_COLORS: Record<string, string> = {
  FREEZE: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  BADGE: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  FEATURE: "bg-secondary/15 text-secondary",
  DISCOUNT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  DIGITAL: "bg-primary/15 text-primary",
};
// خريطة نوع العنصر إلى أيقونة Lucide (بديل الـ emoji)
const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FREEZE: Snowflake,
  BADGE: Award,
  FEATURE: Sparkles,
  DISCOUNT: Percent,
  DIGITAL: Monitor,
};

export function StoreClient({ userPoints, embedded = false }: { userPoints: number | null; embedded?: boolean }) {
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
      const r = await fetch("/api/store/items/" + item.id + "/purchase", { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "فشل الشراء");
      toast.success("تم الشراء بنجاح");
      setPoints(p => p - item.pricePoints);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الشراء");
    } finally {
      setBuying(null);
    }
  };

  const header = (
    <header className="mb-6 flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Gift className="size-6 text-primary" />
          <span>المنتجات</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">اختر ما يناسبك واستبدل نقاطك</p>
      </div>
      {userPoints !== null && (
        <Card className="bg-primary/5 border-primary/30">
          <CardContent className="p-3 flex items-center gap-3">
            <Coins className="size-6 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">رصيدك</p>
              <p className="font-heading text-xl font-bold tabular-nums">{points} نقطة</p>
            </div>
          </CardContent>
        </Card>
      )}
    </header>
  );

  const container = embedded
    ? "w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
    : "container mx-auto px-4 py-8 max-w-6xl";

  return (
    <div className={container}>
      {!embedded && (
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="size-4" /><span>العودة للرئيسية</span>
        </Link>
      )}
      {header}

      {items === null ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Gift className="size-8 mx-auto mb-2 opacity-50" />
            <p>لا توجد منتجات بعد</p>
          </CardContent>
        </Card>
      ) : (
        // Bento: أول 3 منتجات مميّزة (col-span-2) + الباقي صغير
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[200px]">
          {items.map((item, idx) => {
            const affordable = points >= item.pricePoints;
            const isFeatured = idx < 3;
            const Icon = TYPE_ICONS[item.type] ?? Package;
            return (
              <Card
                key={item.id}
                className={`lift-on-hover relative overflow-hidden ${!affordable ? "opacity-75" : ""} ${isFeatured ? "md:col-span-2 row-span-1" : ""}`}
              >
                {/* خلفية متدرّجة بديل الـ emoji */}
                <div className={`absolute inset-0 bg-gradient-to-br ${isFeatured ? "from-primary/10 via-accent/5 to-transparent" : "from-muted/40 to-transparent"}`} aria-hidden />
                <CardContent className={`relative p-4 flex flex-col h-full ${isFeatured ? "sm:flex-row sm:items-center gap-4" : ""}`}>
                  <div className={`flex items-center justify-between ${isFeatured ? "shrink-0" : "mb-3"}`}>
                    <span className={`grid place-items-center rounded-xl bg-primary/10 text-primary ${isFeatured ? "size-14" : "size-10"}`}>
                      <Icon className={isFeatured ? "size-7" : "size-5"} />
                    </span>
                    <Badge className={`${TYPE_COLORS[item.type] ?? "bg-muted"} text-[10px]`}>{TYPE_LABELS[item.type] ?? item.type}</Badge>
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-heading font-bold ${isFeatured ? "text-lg md:text-xl" : "text-sm"}`}>{item.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t mt-2">
                    <span className="flex items-center gap-1 text-sm font-bold text-amber-600">
                      <Coins className="size-4" />{item.pricePoints}
                    </span>
                    <Button onClick={() => buy(item)} disabled={!affordable || buying === item.id} size="sm" className="h-9">
                      {buying === item.id ? "..." : <><ShoppingCart className="size-4" />شراء</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
