"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Star, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

interface Service { id: string; title: string; titleAr: string; }

export function ServiceReviewForm({ services }: { services: Service[] }) {
  const [submitting, setSubmitting] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [form, setForm] = React.useState({
    serviceId: "",
    title: "",
    body: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serviceId) { toast.error("اختر خدمة"); return; }
    if (!form.title.trim() || form.body.length < 10) {
      toast.error("العنوان والنص (10 أحرف) مطلوبان");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contributions/service-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, rating }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? `فشل (HTTP ${res.status})`);
        setSubmitting(false);
        return;
      }
      toast.success("أُرسل تقييمك — في انتظار المراجعة");
      setForm({ serviceId: "", title: "", body: "" });
      setRating(5);
    } catch {
      toast.error("فشل الاتصال");
    }
    setSubmitting(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href="/community/services" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="size-4" /><span>العودة للخدمات</span>
      </Link>
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1 flex items-center gap-2">
          <Star className="size-7 text-primary" /><span>قيّم خدمة استفدت منها</span>
        </h1>
        <p className="text-sm text-muted-foreground">مشاركتك لتجربتك تساعد الجيران على اختيار الخدمات الموثوقة.</p>
      </header>
      <Card>
        <CardHeader><CardTitle className="text-lg">تقييم جديد</CardTitle></CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">لا توجد خدمات بعد — أضف خدمة أولاً.</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label className="mb-1.5 block">الخدمة <span className="text-destructive">*</span></Label>
                <Select value={form.serviceId} onValueChange={(v) => setForm((f) => ({ ...f, serviceId: v }))}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="اختر خدمة" /></SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.titleAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">التقييم <span className="text-destructive">*</span></Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRating(n)} className="p-1" aria-label={`${n} نجوم`}>
                      <Star className={`size-7 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="title" className="mb-1.5 block">العنوان <span className="text-destructive">*</span></Label>
                <Input id="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="خدمة سريعة وأمين" className="h-11" required />
              </div>
              <div>
                <Label htmlFor="body" className="mb-1.5 block">تفاصيل التجربة <span className="text-destructive">*</span></Label>
                <Textarea id="body" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="اشرح تجربتك بالتفصيل..." className="min-h-[120px]" minLength={10} required />
              </div>
              <div className="flex justify-end gap-2">
                <Button asChild type="button" variant="outline"><Link href="/community/services">إلغاء</Link></Button>
                <Button type="submit" disabled={submitting} className="min-w-[140px]">
                  <Send className="size-4" /><span>{submitting ? "جاري..." : "أرسل التقييم"}</span>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
