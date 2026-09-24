"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Heart, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

export default function StorySubmissionFormPage() {
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    body: "",
    consentGiven: false,
    anonymize: true,
    imageUrl: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || form.body.length < 50) {
      toast.error("العنوان والنص (50 حرف) مطلوبان");
      return;
    }
    if (!form.consentGiven) {
      toast.error("يجب الموافقة على النشر");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contributions/story-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? `فشل (HTTP ${res.status})`);
        setSubmitting(false);
        return;
      }
      toast.success("أُرسلت قصتك — في انتظار المراجعة");
      setForm({ title: "", body: "", consentGiven: false, anonymize: true, imageUrl: "" });
    } catch {
      toast.error("فشل الاتصال");
    }
    setSubmitting(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="size-4" /><span>العودة للرئيسية</span>
      </Link>
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1 flex items-center gap-2">
          <Heart className="size-7 text-primary" /><span>شارك قصة نجاحك معنا</span>
        </h1>
        <p className="text-sm text-muted-foreground">قصتك تُلهم الآخرين وتُذكّر بقيمة المعروف في حيّنا.</p>
      </header>
      <Card>
        <CardHeader><CardTitle className="text-lg">قصة جديدة</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="title" className="mb-1.5 block">العنوان <span className="text-destructive">*</span></Label>
              <Input id="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="كيف ساعدني الجيران في أزمة..." className="h-11" required />
            </div>
            <div>
              <Label htmlFor="body" className="mb-1.5 block">القصة <span className="text-destructive">*</span></Label>
              <Textarea id="body" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="اكتب قصتك بالتفصيل... (50 حرف على الأقل)" className="min-h-[180px]" minLength={50} required />
              <p className="text-xs text-muted-foreground mt-1">{form.body.length}/50 حرف كحد أدنى</p>
            </div>
            <div>
              <Label htmlFor="imageUrl" className="mb-1.5 block">رابط صورة (اختياري)</Label>
              <Input id="imageUrl" type="url" value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className="h-11" dir="ltr" />
            </div>
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="consentGiven" className="cursor-pointer flex-1">
                  أوافق على نشر قصتي <span className="text-destructive">*</span>
                  <p className="text-xs text-muted-foreground mt-0.5">بموافقتك، تخوّلنا نشر قصتك على المدوّنة ووسائل التواصل.</p>
                </Label>
                <Switch id="consentGiven" checked={form.consentGiven} onCheckedChange={(c) => setForm((f) => ({ ...f, consentGiven: c }))} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="anonymize" className="cursor-pointer flex-1">
                  نشر باسم مجهول
                  <p className="text-xs text-muted-foreground mt-0.5">لو رفضت، سيُظهر اسمك كما هو في ملفك.</p>
                </Label>
                <Switch id="anonymize" checked={form.anonymize} onCheckedChange={(c) => setForm((f) => ({ ...f, anonymize: c }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button asChild type="button" variant="outline"><Link href="/">إلغاء</Link></Button>
              <Button type="submit" disabled={submitting} className="min-w-[140px]">
                <Send className="size-4" /><span>{submitting ? "جاري..." : "أرسل القصة"}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
