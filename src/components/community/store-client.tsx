"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Coins, ShoppingCart, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface StoreItem { id: string; name: string; description: string; icon: string; pricePoints: number; type: string; stock: number | null }

// Real photographs for each product type (Unsplash)
const STORE_IMAGES: Record<string, string> = {
  // BADGE type — premium badge/trophy photos
  'founder': 'https://images.unsplash.com/photo-1551843073-4a9a5b6fcd5f?w=600&q=85',
  'supporter': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=85',
  'ramadan': 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=600&q=85',
  'professional': 'https://images.unsplash.com/photo-1543165360-b3f23c34ac70?w=600&q=85',
  // FEATURE type
  'lightning': 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=85',
  'diamond': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=85',
  // DISCOUNT type
  'gift': 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=85',
  // DIGITAL type
  'wallpaper': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=85',
  'pdf': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=85',
  // FREEZE type
  'freeze': 'https://images.unsplash.com/photo-1478265409131-1f65c88f965c?w=600&q=85',
};

// Map store item name → image key
function getImageUrl(item: StoreItem): string {
  const name = item.name.toLowerCase();
  if (name.includes('مؤسس') || name.includes('founder')) return STORE_IMAGES.founder;
  if (name.includes('داعم') || name.includes('supporter')) return STORE_IMAGES.supporter;
  if (name.includes('رمضان') || name.includes('ramadan')) return STORE_IMAGES.ramadan;
  if (name.includes('محترف') || name.includes('professional') || name.includes('⭐')) return STORE_IMAGES.professional;
  if (name.includes('أولوية') || name.includes('lightning') || name.includes('⚡')) return STORE_IMAGES.lightning;
  if (name.includes('مضاعف') || name.includes('diamond') || name.includes('💎')) return STORE_IMAGES.diamond;
  if (name.includes('خصم') || name.includes('discount') || name.includes('🎁')) return STORE_IMAGES.gift;
  if (name.includes('خلفية') || name.includes('wallpaper') || name.includes('🖼️')) return STORE_IMAGES.wallpaper;
  if (name.includes('دليل') || name.includes('pdf') || name.includes('📚')) return STORE_IMAGES.pdf;
  if (name.includes('تجميد') || name.includes('freeze') || name.includes('🧊')) return STORE_IMAGES.freeze;
  // Fallback — a warm Moroccan-themed photo
  return 'https://images.unsplash.com/photo-1539020140153-e479b8c5e640?w=600&q=85';
}

const TYPE_LABELS: Record<string, string> = { FREEZE: "تجميد", BADGE: "شارة", FEATURE: "ميزة", DISCOUNT: "خصم", DIGITAL: "رقمي" };
const TYPE_GRADIENTS: Record<string, string> = {
  FREEZE: "from-blue-500 to-cyan-600",
  BADGE: "from-amber-500 to-orange-600",
  FEATURE: "from-violet-500 to-purple-600",
  DISCOUNT: "from-emerald-500 to-teal-600",
  DIGITAL: "from-cyan-500 to-blue-600",
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
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="premium-card p-12 text-center text-muted-foreground">
          <p>لا توجد منتجات بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item, idx) => {
            const affordable = points >= item.pricePoints;
            const gradient = TYPE_GRADIENTS[item.type] ?? "from-primary to-orange-600";
            const imgUrl = getImageUrl(item);
            return (
              <div key={item.id} className="premium-card overflow-hidden flex flex-col h-full fade-stagger" style={{ animationDelay: `${idx * 0.05}s` }}>
                {/* Real photograph */}
                <div className="img-overlay-card relative aspect-[4/3] overflow-hidden">
                  <img
                    src={imgUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="overlay">
                    <Badge className={`bg-gradient-to-r ${gradient} border-0 text-[10px] mb-2`}>
                      {TYPE_LABELS[item.type] ?? item.type}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-heading font-bold text-base">{item.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex-1">{item.description}</p>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
