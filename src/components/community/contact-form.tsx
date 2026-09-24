// ===================================================================
//  ContactForm — نموذج رسالة للتواصل (Client Component)
//  يPOST على /api/contact — يحوّل إلى Complaint (OTHER) أو Notification
// ===================================================================

"use client";

import * as React from "react";
import { toast } from "sonner";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ZelligeDivider } from "@/components/shared/zellige-divider";

interface ContactFormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const EMPTY: ContactFormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export function ContactForm() {
  const [form, setForm] = React.useState<ContactFormState>(EMPTY);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  function update<K extends keyof ContactFormState>(
    key: K,
    value: ContactFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string | null {
    if (!form.name.trim() || form.name.trim().length < 3) {
      return "الاسم الكامل مطلوب (3 أحرف على الأقل)";
    }
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return "بريد إلكتروني صحيح مطلوب";
    }
    if (!form.subject.trim() || form.subject.trim().length < 3) {
      return "موضوع الرسالة مطلوب (3 أحرف على الأقل)";
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      return "نصّ الرسالة مطلوب (10 أحرف على الأقل)";
    }
    if (form.message.length > 2000) {
      return "الرسالة طويلة جداً (2000 حرف كحد أقصى)";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { success?: boolean; error?: string; complaintId?: string }
        | null;
      if (!res.ok || !data?.success) {
        throw new Error(data?.error ?? "تعذّر إرسال الرسالة");
      }
      toast.success("تمّ إرسال رسالتك بنجاح — سنردّ عليك قريباً.");
      setForm(EMPTY);
      setDone(true);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "حدث خطأ غير متوقّع، حاول مرّة أخرى"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="warm-shadow">
      <CardContent className="p-6 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* الاسم + البريد */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-name" className="text-sm">
                الاسم الكامل <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-name"
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="مثال: محمد بنشقرون"
                disabled={submitting}
                maxLength={100}
                required
                autoComplete="name"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email" className="text-sm">
                البريد الإلكتروني <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@example.com"
                dir="ltr"
                disabled={submitting}
                maxLength={150}
                required
                autoComplete="email"
                className="h-11 text-start"
              />
            </div>
          </div>

          {/* الموضوع */}
          <div className="space-y-2">
            <Label htmlFor="contact-subject" className="text-sm">
              الموضوع <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contact-subject"
              type="text"
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
              placeholder="مثال: استفسار عن المساهمة الشهرية"
              disabled={submitting}
              maxLength={200}
              required
              className="h-11"
            />
          </div>

          {/* الرسالة */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="contact-message" className="text-sm">
                الرسالة <span className="text-destructive">*</span>
              </Label>
              <span className="text-[10px] text-muted-foreground">
                {form.message.length}/2000
              </span>
            </div>
            <Textarea
              id="contact-message"
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              placeholder="اكتب رسالتك هنا... كلّ ما يساعدنا على فهم طلبك أفضل."
              disabled={submitting}
              rows={6}
              maxLength={2000}
              required
              className="resize-y min-h-[120px]"
            />
          </div>

          {/* الأزرار */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <p className="text-xs text-muted-foreground">
              بحفظك للرسالة، أنت توافق على{" "}
              <a
                href="/privacy-policy"
                className="text-primary underline underline-offset-2"
              >
                سياسة الخصوصية
              </a>
              .
            </p>
            <Button
              type="submit"
              disabled={submitting || done}
              className="h-11 sm:min-w-[180px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : done ? (
                <>
                  <CheckCircle2 className="size-4" />
                  تمّ الإرسال
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  إرسال الرسالة
                </>
              )}
            </Button>
          </div>
        </form>

        {/* رسالة نجاح */}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <ZelligeDivider variant="minimal" className="my-2 opacity-50" />
              <div className="rounded-lg border border-secondary/20 bg-secondary/5 p-4 text-center">
                <CheckCircle2 className="mx-auto size-6 text-secondary" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  وصلتنا رسالتك. سنتواصل معك على البريد الذي أرسلته خلال 48
                  ساعة.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 h-9"
                  onClick={() => setDone(false)}
                >
                  إرسال رسالة أخرى
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
