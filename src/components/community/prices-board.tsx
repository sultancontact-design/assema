"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface PriceItem {
  id: string; productName: string; productNameAr: string; category: string;
  price: number; unit: string; market?: string | null; source: string;
  reportedAt: string;
}

export function PricesBoard({ prices, categories }: { prices: PriceItem[]; categories: { value: string; label: string }[] }) {
  const [showForm, setShowForm] = React.useState(false);
  const [productName, setProductName] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [category, setCategory] = React.useState("VEGETABLE");
  const [market, setMarket] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (!productName.trim() || !price) { toast.error("المنتج والسعر مطلوبان"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/community/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, productNameAr: productName, category, price, market }),
      });
      if (res.ok) {
        toast.success("تم تسجيل السعر");
        setShowForm(false); setProductName(""); setPrice(""); setMarket("");
        setTimeout(() => window.location.reload(), 1000);
      } else { toast.error("فشل"); }
    } catch { toast.error("خطأ"); }
    setSubmitting(false);
  };

  const avgByCategory = (cat: string) => {
    const items = prices.filter(p => p.category === cat);
    if (items.length === 0) return 0;
    return items.reduce((s, p) => s + p.price, 0) / items.length;
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowForm(!showForm)} className="h-11"><Plus className="size-4" /> أبلغ عن سعر</Button>

      {showForm && (
        <Card><CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label>المنتج</Label><Input value={productName} onChange={e => setProductName(e.target.value)} className="mt-1" placeholder="مثال: طماطم" /></div>
            <div><Label>السعر (درهم/كغ)</Label><Input value={price} onChange={e => setPrice(e.target.value)} type="number" className="mt-1" placeholder="8" /></div>
            <div><Label>الفئة</Label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div><Label>السوق (اختياري)</Label><Input value={market} onChange={e => setMarket(e.target.value)} className="mt-1" placeholder="سوق سيدي يوسف" /></div>
          </div>
          <Button onClick={submit} disabled={submitting} className="h-11">{submitting ? "جارٍ..." : "سجّل"}</Button>
        </CardContent></Card>
      )}

      {/* Stats per category */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
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

      {prices.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp className="size-8 mx-auto mb-2" />
          <p>لا توجد أسعار مسجّلة بعد</p>
          <p className="text-sm mt-1">كن أول من يساعد جيرانك!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {prices.map(p => (
            <Card key={p.id} className="lift-on-hover">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading font-bold text-foreground">{p.productNameAr}</h3>
                  <Badge variant="secondary" className="text-xs">{categories.find(c => c.value === p.category)?.label ?? p.category}</Badge>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-2xl font-extrabold text-primary">{p.price.toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">{p.unit}</span>
                </div>
                {p.market && <p className="text-xs text-muted-foreground mt-1">{p.market}</p>}
                <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                  <Badge variant="outline" className="text-[10px]">{p.source === "user" ? "مستخدم" : p.source}</Badge>
                  <span>{new Date(p.reportedAt).toLocaleDateString("ar-MA")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
