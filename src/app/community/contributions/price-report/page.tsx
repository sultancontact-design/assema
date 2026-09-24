"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Tag, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { value: "VEGETABLE", label: "خضر" },
  { value: "FRUIT", label: "فواكه" },
  { value: "MEAT", label: "لحوم" },
  { value: "GRAIN", label: "حبوب" },
  { value: "DAIRY", label: "ألبان" },
];

const UNITS = [
  "درهم/كغ",
  "درهم/لتر",
  "درهم/حبة",
  "درهم/درز",
  "درهم/ربطة",
];

const MARKETS = [
  "سوق سيدي يوسف بن علي",
  "سوق جامع الفنا",
  "سوق الداخل",
  "سوق كليز",
  "سوق إنزكان",
  "سوق آخر",
];

export default function PriceReportFormPage() {
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    productName: "",
    productNameAr: "",
    category: "VEGETABLE",
    price: "",
    unit: "درهم/كغ",
    marketName: "",
    notes: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productNameAr.trim() || !form.price) {
      toast.error("المنتج والسعر مطلوبان");
      return;
    }
    const price = parseFloat(form.price);
    if (!isFinite(price) || price <= 0) {
      toast.error("السعر غير صالح");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contributions/price-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price,
          productName: form.productName || form.productNameAr,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? `فشل (HTTP ${res.status})`);
        setSubmitting(false);
        return;
      }
      toast.success("أُرسل تقريرك — في انتظار المراجعة");
      setForm({
        productName: "",
        productNameAr: "",
        category: "VEGETABLE",
        price: "",
        unit: "درهم/كغ",
        marketName: "",
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
        <span>العودة للأسعار</span>
      </Link>

      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1 flex items-center gap-2">
          <Tag className="size-7 text-primary" />
          <span>أبلغ عن سعر شاهدته</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          مساهمتك تُغني قاعدة الأسعار الحقيقية. كل تقرير يُراجعه مشرف قبل النشر.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">تقرير سعر جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="productNameAr" className="mb-1.5 block">
                  اسم المنتج (عربي) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="productNameAr"
                  value={form.productNameAr}
                  onChange={(e) => setForm((f) => ({ ...f, productNameAr: e.target.value }))}
                  placeholder="طماطم"
                  className="h-11"
                  required
                />
              </div>
              <div>
                <Label htmlFor="productName" className="mb-1.5 block">
                  اسم المنتج (فرنسي)
                </Label>
                <Input
                  id="productName"
                  value={form.productName}
                  onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                  placeholder="Tomate"
                  className="h-11"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">الفئة <span className="text-destructive">*</span></Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
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
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="8.50"
                  className="h-11"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">السوق</Label>
                <Select value={form.marketName} onValueChange={(v) => setForm((f) => ({ ...f, marketName: v }))}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="اختر السوق" /></SelectTrigger>
                  <SelectContent>
                    {MARKETS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">الوحدة</Label>
                <Select value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="notes" className="mb-1.5 block">ملاحظات</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="جودة المنتج، تاريخ الزيارة، أي تفاصيل مفيدة..."
                className="min-h-[80px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button asChild type="button" variant="outline">
                <Link href="/community/prices">إلغاء</Link>
              </Button>
              <Button type="submit" disabled={submitting} className="min-w-[140px]">
                <Send className="size-4" />
                <span>{submitting ? "جاري..." : "أرسل التقرير"}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
