"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, RefreshCw, Search, Database, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface PriceItem {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  unit: string;
  icon: string | null;
  latestPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  source: string | null;
  sourceUrl?: string | null;
  verified?: boolean;
  recordedAt: string | null;
}

interface LogItem {
  source: string;
  status: string;
  productsCount: number;
  errorMessage: string | null;
  fetchedAt: string;
}

const SOURCE_LABELS: Record<string, string> = {
  // مصادر حقيقية فقط — لا مكان للـMOCK/SEASONAL_FALLBACK هنا
  PRIXAGRICULTURE: "prixagriculture.org (متوقّف)",
  FAOSTAT: "FAOSTAT (وطني)",
  DATA_GOV: "data.gov.ma",
  HCP: "HCP",
  USER_REPORTS: "مساهمة موثّقة",
  USER: "مساهمة مستخدم",
  ALL_FAILED: "كل المصادر فشلت",
};

function describeSource(source: string | null): string {
  if (!source) return "لا مصدر";
  return SOURCE_LABELS[source] ?? source;
}

export function MarketPricesBoard({
  prices,
  categories,
  logs,
}: {
  prices: PriceItem[];
  categories: { value: string; label: string }[];
  logs: LogItem[];
}) {
  const [search, setSearch] = React.useState("");
  const [activeCat, setActiveCat] = React.useState("ALL");
  const [refreshing, setRefreshing] = React.useState(false);

  const filtered = prices.filter((p) => {
    const matchCat = activeCat === "ALL" || p.category === activeCat;
    const matchSearch =
      !search ||
      p.nameAr.includes(search) ||
      p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // إحصاء البيانات الحقيقية المتوفرة
  const pricesWithData = filtered.filter((p) => p.latestPrice !== null && p.latestPrice !== undefined);
  const hasAnyRealData = pricesWithData.length > 0;
  const allSourcesFailed = logs.some((l) => l.source === "ALL_FAILED" && l.status === "FAILED");

  const avgByCategory = (cat: string) => {
    const items = prices.filter((p) => p.category === cat && p.latestPrice);
    if (items.length === 0) return null;
    return items.reduce((s, p) => s + (p.latestPrice ?? 0), 0) / items.length;
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/community/market-prices");
      if (res.ok) {
        toast.success("تم تحديث قائمة الأسعار");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error("فشل التحديث");
      }
    } catch {
      toast.error("فشل الاتصال");
    }
    setRefreshing(false);
  };

  const formatUnit = (unit: string) => {
    const map: Record<string, string> = {
      KG: "كغ",
      LITER: "لتر",
      PIECE: "حبة",
      DOZEN: "درز",
      BUNCH: "ربطة",
    };
    return map[unit] ?? unit;
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "لا يوجد";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "لا يوجد";
    const min = Math.floor((Date.now() - d.getTime()) / 60000);
    if (min < 1) return "الآن";
    if (min < 60) return `قبل ${min} دقيقة`;
    if (min < 1440) return `قبل ${Math.floor(min / 60)} ساعة`;
    const days = Math.floor(min / 1440);
    if (days < 30) return `قبل ${days} يوم`;
    return `في ${d.toLocaleDateString("ar-MA", { year: "numeric", month: "long", day: "numeric" })}`;
  };

  // لو كل المصادر فشلت وأي بيانات حقيقية لا توجد: اعرض رسالة صريحة
  const showEmptyState = !hasAnyRealData && allSourcesFailed;
  // لو لم توجد بيانات إطلاقاً (حتى لا محاولة جلب): رسالة مختلفة
  const showNoDataState = !hasAnyRealData && logs.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن منتج..."
            className="ps-9 h-11"
          />
        </div>
        <Button onClick={refresh} disabled={refreshing} variant="outline" className="h-11">
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          <span>تحديث</span>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCat("ALL")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeCat === "ALL" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
          }`}
        >
          الكل
        </button>
        {categories.map((c) => (
          <button
            key={c.value}
            onClick={() => setActiveCat(c.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeCat === c.value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Stats per category — فقط للفئات التي لها بيانات حقيقية */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {categories.map((c) => {
          const avg = avgByCategory(c.value);
          return (
            <Card key={c.value}>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="font-heading text-lg font-bold text-primary">
                  {avg !== null ? avg.toFixed(1) : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">د.م/كغ</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty state — لا توجد بيانات حقيقية */}
      {(showEmptyState || showNoDataState) && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/10">
          <CardContent className="p-6 text-center space-y-2">
            <AlertCircle className="size-10 mx-auto text-amber-600 dark:text-amber-400" />
            <h3 className="font-heading font-bold text-amber-900 dark:text-amber-200">
              {showNoDataState ? "لا توجد بيانات بعد" : "تعذّر جلب الأسعار من المصادر الرسمية"}
            </h3>
            <p className="text-sm text-amber-800/80 dark:text-amber-300/80 max-w-md mx-auto">
              {showNoDataState
                ? "لم تُجلب أي بيانات أسعار حقيقية بعد. يمكنك المساهمة بإبلاغ سعر شاهدته في السوق (يتم التحقق منه من طرف مشرف)."
                : "فشلت كل المصادر الرسمية الآن (FAOSTAT + data.gov.ma + المساهمات الموثّقة). لا نُولّد أي رقم مُصنّع — سنحاول تلقائياً لاحقاً."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => (window.location.href = "/community/prices/report")}
            >
              أبلغ عن سعر شاهدته
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Price cards — فقط المنتجات التي لها أسعار حقيقية */}
      {hasAnyRealData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((p) => (
            <Card
              key={p.id}
              className={`lift-on-hover ${p.latestPrice === null ? "opacity-50" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{p.icon}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {describeSource(p.source)}
                  </Badge>
                </div>
                <h3 className="font-heading font-bold text-foreground">{p.nameAr}</h3>
                <div className="mt-2">
                  {p.latestPrice !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="font-heading text-xl font-extrabold text-primary">
                        {p.latestPrice.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        د.م/{formatUnit(p.unit)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      لا توجد بيانات — جاري الجلب
                    </span>
                  )}
                  {p.minPrice && p.maxPrice && p.minPrice !== p.maxPrice && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {p.minPrice.toFixed(2)} - {p.maxPrice.toFixed(2)} د.م
                    </p>
                  )}
                </div>
                {p.latestPrice !== null && p.recordedAt && (
                  <p className="text-[10px] text-muted-foreground/70 mt-2 flex items-center gap-1">
                    <Clock className="size-3" />
                    آخر تحديث: {formatTime(p.recordedAt)}
                    {p.verified && <span className="text-emerald-600">· موثّق</span>}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Fetch logs — تسجيل شفّاف للجلب */}
      {logs.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
              <Database className="size-4" /> سجل جلب الأسعار (آخر 5 محاولات)
            </h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {logs.map((l, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs text-muted-foreground gap-2"
                >
                  <span className="font-medium">{describeSource(l.source)}</span>
                  <Badge
                    variant={
                      l.status === "SUCCESS"
                        ? "default"
                        : l.status === "PARTIAL"
                        ? "secondary"
                        : "destructive"
                    }
                    className="text-[10px]"
                  >
                    {l.status === "SUCCESS"
                      ? "نجح"
                      : l.status === "PARTIAL"
                      ? "جزئي"
                      : l.status === "FALLBACK"
                      ? "احتياطي (ممنوع)"
                      : "فشل"}
                  </Badge>
                  <span>{l.productsCount} منتج</span>
                  <span>{formatTime(l.fetchedAt)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
