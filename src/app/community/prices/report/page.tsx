"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Send, ShieldCheck, Store } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { value: "VEGETABLE", label: "خضر" },
  { value: "FRUIT", label: "فواكه" },
  { value: "MEAT", label: "لحوم" },
  { value: "GRAIN", label: "حبوب" },
  { value: "DAIRY", label: "ألبان" },
];

const UNITS = [
  { value: "درهم/كغ", label: "درهم/كغ" },
  { value: "درهم/لتر", label: "درهم/لتر" },
  { value: "درهم/حبة", label: "درهم/حبة" },
  { value: "درهم/درز", label: "درهم/درز" },
  { value: "درهم/ربطة", label: "درهم/ربطة" },
];

const MARKETS = [
  "سوق سيدي يوسف بن علي",
  "سوق جامع الفنا",
  "سوق الداخل",
  "سوق كليز",
  "سوق الحي المحمدي",
  "سوق إنزكان",
  "سوق آخر",
];

export default function PriceReportPage() {
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    productName: "",
    productNameAr: "",
    category: "VEGETABLE",
    price: "",
    market: "",
    unit: "درهم/كغ",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productNameAr.trim() || !form.price || !form.category) {
      toast.error("المنتج والسعر والفئة مطلوبة");
      return;
    }
    const priceNum = parseFloat(form.price);
    if (!isFinite(priceNum) || priceNum <= 0) {
      toast.error("السعر يجب أن يكون رقماً موجباً");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/community/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: form.productName.trim() || form.productNameAr.trim(),
          productNameAr: form.productNameAr.trim(),
          category: form.category,
          price: priceNum,
          market: form.market,
          unit: form.unit,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "فشل الإبلاغ");
        setSubmitting(false);
        return;
      }
      toast.success("تم إبلاغ السعر — في انتظار مراجعة مشرف");
      setForm({
        productName: "",
        productNameAr: "",
        category: "VEGETABLE",
        price: "",
        market: "",
        unit: "درهم/كغ",
        notes: "",
      });
    } catch {
      toast.error("فشل الاتصال");
    }
    setSubmitting(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link
        href="/community/prices"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="size-4" />
        <span>العودة لقائمة الأسعار</span>
      </Link>

      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1">📢 أبلغ عن سعر شاهدته</h1>
        <p className="text-sm text-muted-foreground">
          مساهمتك تُثري قاعدة بيانات الأسعار الحقيقية للمجتمع. كل تقرير يُراجعه مشرف قبل النشر.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Store className="size-5 text-primary" />
            <span>تقرير سعر جديد</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="productNameAr" className="mb-1.5 block">
                  اسم المنتج (بالعربية) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="productNameAr"
                  value={form.productNameAr}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, productNameAr: e.target.value }))
                  }
                  placeholder="مثال: طماطم"
                  className="h-11"
                  required
                />
              </div>
              <div>
                <Label htmlFor="productName" className="mb-1.5 block">
                  اسم المنتج (بالفرنسية) — اختياري
                </Label>
                <Input
                  id="productName"
                  value={form.productName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, productName: e.target.value }))
                  }
                  placeholder="مثال: Tomate"
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">
                  الفئة <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="price" className="mb-1.5 block">
                  السعر (درهم) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  placeholder="مثال: 8.50"
                  className="h-11"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">السوق / المكان</Label>
                <Select
                  value={form.market}
                  onValueChange={(v) => setForm((f) => ({ ...f, market: v }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="اختر السوق" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKETS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">الوحدة</Label>
                <Select
                  value={form.unit}
                  onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes" className="mb-1.5 block">
                ملاحظات (اختياري)
              </Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="مثال: سعر الصباح، جودة عادية، تاريخ الزيارة..."
                className="min-h-[80px]"
              />
            </div>

            <div className="rounded-md border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/10 p-3">
              <div className="flex items-start gap-2 text-sm text-emerald-900 dark:text-emerald-200">
                <ShieldCheck className="size-4 mt-0.5 flex-shrink-0" />
                <span>
                  كل تقرير يخضع للمراجعة من طرف مشرف معتمد قبل النشر. لا تُنشر سوى
                  التقارير الموثّقة. نُحاول تصديق المصادر الرسمية أولاً (FAOSTAT +
                  data.gov.ma).
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <Link href="/community/prices">إلغاء</Link>
              </Button>
              <Button type="submit" disabled={submitting} className="min-w-[140px]">
                <Send className="size-4" />
                <span>{submitting ? "جاري الإرسال..." : "أرسل التقرير"}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-bold text-foreground">ملاحظات:</p>
          <p>• الأسعار الحقيقية فقط — لا أرقام عشوائية.</p>
          <p>• نُصدّق المصادر الرسمية (FAOSTAT, data.gov.ma) قبل التحقق اليدوي.</p>
          <p>• المساهمة الصادقة بمنزلة <Badge variant="secondary" className="text-[10px]">معروف</Badge> تساهم في صندوق الدعم.</p>
        </CardContent>
      </Card>
    </div>
  );
}
