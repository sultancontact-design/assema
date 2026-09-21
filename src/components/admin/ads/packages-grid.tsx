"use client";

// ===================================================================
//  PackagesGrid — شبكة الباقات (5 بطاقات)
//  - يعرض الباقة + السعر + المدة + عدد الحملات النشطة + الإيراد
//  - زر "تعديل" → Dialog لتعديل السعر والمدة (محفوظة في Setting)
// ===================================================================

import * as React from "react";
import { Pencil, Megaphone, Wallet, Clock, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AD_PACKAGE_LABELS, formatMAD } from "@/lib/constants";
import { PACKAGE_COLORS } from "@/lib/ads-utils";
import { cn } from "@/lib/utils";
import type { AdPackage } from "@prisma/client";

// ===================================================================
//  الأنواع
// ===================================================================

export interface PackageStats {
  key: AdPackage;
  label: string;
  price: number;        // السعر الفعلي (مع تجاوز الإعدادات)
  duration: string;     // المدة الفعلية
  basePrice: number;   // السعر الافتراضي من الثوابت
  baseDuration: string; // المدة الافتراضية
  activeCount: number;
  revenue: number;
  totalAds: number;
  featured?: boolean;
  includedPlacements?: string[];
}

interface PackagesGridProps {
  packages: PackageStats[];
}

// ===================================================================
//  المُكوّن
// ===================================================================

export function PackagesGrid({ packages }: PackagesGridProps) {
  const [editing, setEditing] = React.useState<PackageStats | null>(null);
  const [price, setPrice] = React.useState<number>(0);
  const [duration, setDuration] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);

  function openEditor(p: PackageStats) {
    setEditing(p);
    setPrice(p.price);
    setDuration(p.duration);
  }

  async function handleSave() {
    if (!editing) return;
    if (price < 0) {
      toast.error("السعر يجب أن يكون موجباً");
      return;
    }
    if (!duration.trim()) {
      toast.error("المدة مطلوبة");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        [`ads.packages.${editing.key}.price`]: String(price),
        [`ads.packages.${editing.key}.duration`]: duration.trim(),
      };
      const res = await fetch("/api/admin/ads/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "فشل حفظ الباقة");
        return;
      }
      toast.success("تم تحديث الباقة بنجاح");
      setEditing(null);
      setTimeout(() => window.location.reload(), 400);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {packages.map((p) => (
          <Card
            key={p.key}
            className={cn(
              "relative flex flex-col border bg-card p-0",
              p.featured ? "border-accent shadow-sm" : "border-border"
            )}
          >
            {p.featured && (
              <div className="absolute -top-2 end-4">
                <Badge className="border-0 bg-accent text-background">
                  الأكثر طلباً
                </Badge>
              </div>
            )}
            <CardContent className="flex flex-1 flex-col p-4 space-y-3">
              {/* الترويسة */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading text-lg font-bold text-foreground">
                    {p.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground" dir="ltr">
                    {p.key}
                  </p>
                </div>
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: PACKAGE_COLORS[p.key] }}
                  aria-hidden="true"
                />
              </div>

              {/* السعر */}
              <div className="rounded-md border border-border bg-muted/30 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  السعر
                </p>
                <p className="font-heading text-2xl font-bold text-foreground">
                  {formatMAD(p.price)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  المدة: {p.duration}
                </p>
              </div>

              {/* المؤشرات */}
              <div className="space-y-1.5 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Megaphone className="size-3" strokeWidth={1.5} />
                    <span>الحملات النشطة</span>
                  </span>
                  <span className="font-medium text-foreground">
                    {p.activeCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Wallet className="size-3" strokeWidth={1.5} />
                    <span>إجمالي الإيراد</span>
                  </span>
                  <span className="font-medium text-foreground">
                    {formatMAD(p.revenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-3" strokeWidth={1.5} />
                    <span>إجمالي الحملات</span>
                  </span>
                  <span className="font-medium text-foreground">
                    {p.totalAds}
                  </span>
                </div>
              </div>

              <div className="mt-auto pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-full gap-2"
                  onClick={() => openEditor(p)}
                >
                  <Pencil className="size-3.5" strokeWidth={1.5} />
                  <span>تعديل الباقة</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* نافذة التعديل */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="border-b border-border p-4">
            <DialogTitle className="text-start">
              تعديل الباقة: {editing?.label}
            </DialogTitle>
            <DialogDescription className="text-start">
              السعر الافتراضي: {editing ? formatMAD(editing.basePrice) : ""} —
              المدة الافتراضية: {editing?.baseDuration}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="pkg-price">السعر (درهم)</Label>
              <Input
                id="pkg-price"
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min={0}
                step="0.01"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pkg-duration">المدة</Label>
              <Input
                id="pkg-duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="مثال: شهر / 3 أشهر / سنة"
              />
            </div>
            <div className="rounded-md border border-accent/30 bg-accent/5 p-3 text-[11px] text-accent">
              <p className="flex items-center gap-1.5 font-medium">
                <Check className="size-3.5" strokeWidth={1.5} />
                <span>يُحفظ في جدول الإعدادات ويتجاوز القيم الافتراضية.</span>
              </p>
            </div>
          </div>

          <DialogFooter className="border-t border-border p-3">
            <Button
              variant="outline"
              className="h-11"
              onClick={() => setEditing(null)}
              disabled={saving}
            >
              إلغاء
            </Button>
            <Button
              className="h-11 bg-foreground text-background hover:bg-foreground/90"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "جارٍ الحفظ…" : "حفظ الباقة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { AD_PACKAGE_LABELS };
