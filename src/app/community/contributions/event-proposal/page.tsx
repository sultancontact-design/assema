"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarPlus, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { value: "SOCIAL", label: "اجتماعية" },
  { value: "EDUCATIONAL", label: "تعليمية" },
  { value: "CHARITY", label: "خيرية" },
  { value: "CULTURAL", label: "ثقافية" },
];

export default function EventProposalFormPage() {
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    proposedDate: "",
    location: "",
    expectedAttendees: "",
    category: "SOCIAL",
    budget: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || form.description.length < 20) {
      toast.error("العنوان والوصف (20 حرف) مطلوبان");
      return;
    }
    if (!form.proposedDate) { toast.error("التاريخ مطلوب"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contributions/event-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          expectedAttendees: form.expectedAttendees ? parseInt(form.expectedAttendees, 10) : null,
          budget: form.budget ? parseFloat(form.budget) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? `فشل (HTTP ${res.status})`);
        setSubmitting(false);
        return;
      }
      toast.success("أُرسل اقتراحك — في انتظار المراجعة");
      setForm({ title: "", description: "", proposedDate: "", location: "", expectedAttendees: "", category: "SOCIAL", budget: "" });
    } catch {
      toast.error("فشل الاتصال");
    }
    setSubmitting(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href="/community/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="size-4" /><span>العودة للفعاليات</span>
      </Link>
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1 flex items-center gap-2">
          <CalendarPlus className="size-7 text-primary" /><span>اقترح فعالية للمجتمع</span>
        </h1>
        <p className="text-sm text-muted-foreground">اقتراحك قد يتحوّل لفعالية رسمية على المنصّة.</p>
      </header>
      <Card>
        <CardHeader><CardTitle className="text-lg">اقتراح فعالية جديدة</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="title" className="mb-1.5 block">العنوان <span className="text-destructive">*</span></Label>
              <Input id="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="يوم تنظيف الحي" className="h-11" required />
            </div>
            <div>
              <Label htmlFor="description" className="mb-1.5 block">الوصف <span className="text-destructive">*</span></Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="اشرح الهدف، البرنامج، الفئة المستهدفة..." className="min-h-[120px]" minLength={20} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="proposedDate" className="mb-1.5 block">التاريخ المقترح <span className="text-destructive">*</span></Label>
                <Input id="proposedDate" type="datetime-local" value={form.proposedDate} onChange={(e) => setForm((f) => ({ ...f, proposedDate: e.target.value }))} className="h-11" required />
              </div>
              <div>
                <Label className="mb-1.5 block">الفئة</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="location" className="mb-1.5 block">المكان</Label>
                <Input id="location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="ساحة الحي" className="h-11" />
              </div>
              <div>
                <Label htmlFor="expectedAttendees" className="mb-1.5 block">المتوقع حضوره</Label>
                <Input id="expectedAttendees" type="number" min="1" value={form.expectedAttendees} onChange={(e) => setForm((f) => ({ ...f, expectedAttendees: e.target.value }))} placeholder="50" className="h-11" />
              </div>
              <div>
                <Label htmlFor="budget" className="mb-1.5 block">الميزانية (د.م)</Label>
                <Input id="budget" type="number" step="0.01" min="0" value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} placeholder="500" className="h-11" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button asChild type="button" variant="outline"><Link href="/community/events">إلغاء</Link></Button>
              <Button type="submit" disabled={submitting} className="min-w-[140px]">
                <Send className="size-4" /><span>{submitting ? "جاري..." : "أرسل الاقتراح"}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
