"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Gift, Coins, ShoppingCart, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface StoreItem { id: string; name: string; description: string; icon: string; pricePoints: number; type: string; stock: number | null }

const TYPE_LABELS: Record<string, string> = { FREEZE: "تجميد", BADGE: "شارة", FEATURE: "ميزة", DISCOUNT: "خصم", DIGITAL: "رقمي" };
const TYPE_COLORS: Record<string, string> = {
  FREEZE: "bg-blue-100 text-blue-800", BADGE: "bg-amber-100 text-amber-800",
  FEATURE: "bg-purple-100 text-purple-800", DISCOUNT: "bg-emerald-100 text-emerald-800", DIGITAL: "bg-cyan-100 text-cyan-800",
};

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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /><span>العودة للرئيسية</span>
      </Link>
      <header className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><Gift className="size-7 text-primary" /><span>متجر النقاط</span></h1>
          <p className="text-sm text-muted-foreground">استبدل نقاطك بمنتجات وميزات حصرية</p>
        </div>
        {userPoints !== null && (
          <Card className="bg-primary/5 border-primary/30">
            <CardContent className="p-3 flex items-center gap-3">
              <Coins className="size-6 text-amber-500" />
              <div><p className="text-xs text-muted-foreground">رصيدك</p><p className="font-heading text-xl font-bold">{points} نقطة</p></div>
            </CardContent>
          </Card>
        )}
      </header>
      {items === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      ) : items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground"><Gift className="size-8 mx-auto mb-2 opacity-50" /><p>لا توجد منتجات بعد</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {items.map((item) => {
            const affordable = points >= item.pricePoints;
            return (
              <Card key={item.id} className={`lift-on-hover ${!affordable ? "opacity-75" : ""}`}>
                <CardContent className="p-4 space-y-3 flex flex-col h-full">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl">{item.icon}</span>
                    <Badge className={`${TYPE_COLORS[item.type] ?? "bg-muted"} text-[10px]`}>{TYPE_LABELS[item.type] ?? item.type}</Badge>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="flex items-center gap-1 text-sm font-bold text-amber-600"><Coins className="size-4" />{item.pricePoints}</span>
                  </div>
                  <Button onClick={() => buy(item)} disabled={!affordable || buying === item.id} className="w-full" size="sm">
                    {buying === item.id ? "..." : <><ShoppingCart className="size-4" />شراء</>}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
