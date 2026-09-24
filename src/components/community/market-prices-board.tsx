"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, RefreshCw, Search, Database } from "lucide-react";
import { toast } from "sonner";

interface PriceItem {
  id: string; name: string; nameAr: string; category: string;
  unit: string; icon: string | null; latestPrice: number | null;
  minPrice: number | null; maxPrice: number | null;
  source: string | null; recordedAt: string | null;
}

interface LogItem {
  source: string; status: string; productsCount: number;
  errorMessage: string | null; fetchedAt: string;
}

const SOURCE_LABELS: Record<string, string> = {
  SEASONAL_FALLBACK: "موسمي (تلقائي)",
  PRIXAGRICULTURE: "prixagriculture.org",
  DATA_GOV: "data.gov.ma",
  HCP: "HCP",
  FAOSTAT: "FAOSTAT",
  USER: "مستخدم",
};

export function MarketPricesBoard({ prices, categories, logs }: { prices: PriceItem[]; categories: { value: string; label: string }[]; logs: LogItem[] }) {
  const [search, setSearch] = React.useState("");
  const [activeCat, setActiveCat] = React.useState("ALL");
  const [refreshing, setRefreshing] = React.useState(false);

  const filtered = prices.filter(p => {
    const matchCat = activeCat === "ALL" || p.category === activeCat;
    const matchSearch = !search || p.nameAr.includes(search) || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const avgByCategory = (cat: string) => {
    const items = prices.filter(p => p.category === cat && p.latestPrice);
    if (items.length === 0) return 0;
    return items.reduce((s, p) => s + (p.latestPrice ?? 0), 0) / items.length;
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/community/market-prices");
      if (res.ok) { toast.success("تم تحديث الأسعار"); setTimeout(() => window.location.reload(), 1000); }
    } catch { toast.error("فشل التحديث"); }
    setRefreshing(false);
  };

  const formatUnit = (unit: string) => {
    const map: Record<string, string> = { KG: "كغ", LITER: "لتر", PIECE: "حبة", DOZEN: "درز", BUNCH: "ربطة" };
    return map[unit] ?? unit;
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const min = Math.floor((Date.now() - d.getTime()) / 60000);
    if (min < 60) return `قبل ${min} دقيقة`;
    if (min < 1440) return `قبل ${Math.floor(min / 60)} ساعة`;
    return `قبل ${Math.floor(min / 1440)} يوم`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن منتج..." className="ps-9 h-11" />
        </div>
        <Button onClick={refresh} disabled={refreshing} variant="outline" className="h-11">
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          <span>تحديث</span>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveCat("ALL")} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeCat === "ALL" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>الكل</button>
        {categories.map(c => (
          <button key={c.value} onClick={() => setActiveCat(c.value)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeCat === c.value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Stats per category */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {categories.map(c => {
          const avg = avgByCategory(c.value);
          return (
            <Card key={c.value}><CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="font-heading text-lg font-bold text-primary">{avg > 0 ? avg.toFixed(1) : "—"}</p>
              <p className="text-[10px] text-muted-foreground">د.م/كغ</p>
            </CardContent></Card>
          );
        })}
      </div>

      {/* Price cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Database className="size-8 mx-auto mb-2" />
          <p>لا توجد أسعار متاحة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(p => (
            <Card key={p.id} className="lift-on-hover">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{p.icon}</span>
                  <Badge variant="outline" className="text-[10px]">{SOURCE_LABELS[p.source ?? ""] ?? p.source}</Badge>
                </div>
                <h3 className="font-heading font-bold text-foreground">{p.nameAr}</h3>
                <div className="mt-2">
                  {p.latestPrice ? (
                    <div className="flex items-baseline gap-1">
                      <span className="font-heading text-xl font-extrabold text-primary">{p.latestPrice.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">د.م/{formatUnit(p.unit)}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">غير متوفر</span>
                  )}
                  {p.minPrice && p.maxPrice && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {p.minPrice.toFixed(2)} - {p.maxPrice.toFixed(2)} د.م
                    </p>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground/70 mt-2">{formatTime(p.recordedAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Fetch logs */}
      {logs.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
              <Database className="size-4" /> سجل جلب الأسعار
            </h3>
            <div className="space-y-1">
              {logs.map((l, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{SOURCE_LABELS[l.source] ?? l.source}</span>
                  <Badge variant={l.status === "SUCCESS" ? "default" : l.status === "FALLBACK" ? "secondary" : "destructive"} className="text-[10px]">
                    {l.status === "SUCCESS" ? "نجح" : l.status === "FALLBACK" ? "احتياطي" : "فشل"}
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
