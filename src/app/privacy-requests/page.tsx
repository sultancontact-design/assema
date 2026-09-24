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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ShieldCheck,
  FileText,
  Lock,
  Clock,
  AlertTriangle,
  Send,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const REQUEST_TYPES = [
  {
    value: "ACCESS",
    label: "حق الوصول — الاطلاع على بياناتي",
    description: "اطلب نسخة من كل البيانات الشخصية التي يحتفظ بها الموقع عنك",
    icon: "👁️",
  },
  {
    value: "RECTIFICATION",
    label: "حق التصحيح — تعديل بياناتي",
    description: "صحّح معلومة غير دقيقة أو ناقصة في ملفك الشخصي",
    icon: "✏️",
  },
  {
    value: "ERASURE",
    label: "حق المحو — حذف بياناتي",
    description: "اطلب حذف بياناتك الشخصية من قاعدة البيانات",
    icon: "🗑️",
  },
  {
    value: "RESTRICTION",
    label: "حق تقييد المعالجة",
    description: "وقّف معالجة بياناتك مؤقتاً (مثلاً أثناء النزاع)",
    icon: "⏸️",
  },
  {
    value: "PORTABILITY",
    label: "حق النقل — استخراج بياناتي",
    description: "استلم بياناتك بصيغة JSON قابلة للنقل لمنصّة أخرى",
    icon: "📦",
  },
  {
    value: "OBJECTION",
    label: "حق الاعتراض",
    description: "اعترض على معالجة بياناتك لأسباب مشروعة",
    icon: "🚫",
  },
];

export default function CndpRequestPage() {
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [requestId, setRequestId] = React.useState<string | null>(null);
  const [expiresAt, setExpiresAt] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    fullName: "",
    email: "",
    phone: "",
    nationalId: "",
    requestType: "ACCESS",
    description: "",
    targetData: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error("الاسم والبريد الإلكتروني مطلوبان");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("البريد الإلكتروني غير صالح");
      return;
    }
    if (!form.description.trim() || form.description.length < 20) {
      toast.error("الوصف مطلوب (20 حرف على الأقل)");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/cndp/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? `فشل الإرسال (HTTP ${res.status})`);
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      setRequestId(data.id);
      setExpiresAt(data.expiresAt);
      setSubmitted(true);
      toast.success("تم استلام طلبك");
    } catch {
      toast.error("فشل الاتصال");
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
              <ShieldCheck className="size-6" />
              <span>تم استلام طلبك بنجاح</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-emerald-900 dark:text-emerald-200">
              <p>
                رقم الطلب: <Badge variant="secondary" className="font-mono">{requestId}</Badge>
              </p>
              <p>
                ستنتهي مهلة الاستجابة في:{" "}
                <strong>
                  {expiresAt
                    ? new Date(expiresAt).toLocaleDateString("ar-MA", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </strong>
              </p>
            </div>
            <div className="rounded-md bg-emerald-100/50 dark:bg-emerald-900/20 p-3 text-sm space-y-1">
              <p className="font-bold">📋 ماذا الآن؟</p>
              <p>• ستصلك رسالة تأكيد على بريدك الإلكتروني خلال 24 ساعة</p>
              <p>• فريق الحماية سيدرس طلبك خلال 30 يوماً كحد أقصى (المادة 31)</p>
              <p>• إذا لم تتلقَ ردّاً، يحقّ لك رفع شكوى للّجنة الوطنية (CNDP)</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/">العودة للرئيسية</Link>
            </Button>
            <Button variant="ghost" onClick={() => setSubmitted(false)}>
              تقديم طلب آخر
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="size-4" />
        <span>العودة للرئيسية</span>
      </Link>

      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1 flex items-center gap-2">
          <ShieldCheck className="size-7 text-primary" />
          <span>طلب حماية البيانات (CNDP)</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          وفقاً للقانون 09-08 المتعلّق بحماية الأشخاص الذاتيين تجاه معالجة
          البيانات ذات الطابع الشخصي، يحقّ لك الاطلاع على بياناتك وتصحيحها
          ومحوها.
        </p>
      </header>

      {/* Legal info */}
      <Card className="mb-6 border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/5">
        <CardContent className="p-4 space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Clock className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">مهلة الاستجابة: 30 يوماً</p>
              <p className="text-muted-foreground text-xs">
                المادة 31 من القانون 09-08 تُلزمنا بالاستجابة في أجل أقصاه 30
                يوماً من تاريخ استلام طلبك.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">غرامة المخالفة: حتى 300,000 درهم</p>
              <p className="text-muted-foreground text-xs">
                عدم الاستجابة لطلبك في الأجل القانوني يُعرّضنا للمساءلة
                القانونية أمام اللجنة الوطنية لمراقبة حماية البيانات.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">سرّية البيانات</p>
              <p className="text-muted-foreground text-xs">
                رقم البطاقة الوطنية (لو أرسلتها) يُخزَّن مُعمّىً فقط. لا
                نُشارك بياناتك مع أيّ جهة خارجية.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="size-5" />
            <span>نموذج الطلب</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName" className="mb-1.5 block">
                  الاسم الكامل <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                  placeholder="محمد بنشقرون"
                  className="h-11"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email" className="mb-1.5 block">
                  البريد الإلكتروني <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="you@example.com"
                  className="h-11"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="mb-1.5 block">
                  الهاتف (اختياري)
                </Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="06XXXXXXXX"
                  className="h-11"
                  dir="ltr"
                />
              </div>
              <div>
                <Label htmlFor="nationalId" className="mb-1.5 block">
                  رقم البطاقة الوطنية (اختياري — يُخزَّن مُعمّىً)
                </Label>
                <Input
                  id="nationalId"
                  value={form.nationalId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nationalId: e.target.value }))
                  }
                  placeholder="BC1234567"
                  className="h-11"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">نوع الطلب <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {REQUEST_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, requestType: t.value }))
                    }
                    className={`text-start p-3 rounded-md border text-sm transition-all ${
                      form.requestType === t.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{t.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground">{t.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="targetData" className="mb-1.5 block">
                نوع البيانات المعنية (اختياري)
              </Label>
              <Input
                id="targetData"
                value={form.targetData}
                onChange={(e) =>
                  setForm((f) => ({ ...f, targetData: e.target.value }))
                }
                placeholder="مثال: ملفي الشخصي، رسائلي، مساهماتي في صندوق المعروف..."
                className="h-11"
              />
            </div>

            <div>
              <Label htmlFor="description" className="mb-1.5 block">
                تفاصيل الطلب <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="اشرح طلبك بالتفصيل... (20 حرف على الأقل)"
                className="min-h-[120px]"
                minLength={20}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {form.description.length}/20 حرف كحد أدنى
              </p>
            </div>

            <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
              <p>
                🔒 بإرسالك هذا النموذج، توافق على أن تُعالَج بياناتك وفقاً لـ
                <Link
                  href="/privacy-policy"
                  className="text-primary hover:underline mx-1"
                >
                  سياسة الخصوصية
                </Link>
                الخاصة بنا والمنصّبة على قانون 09-08 المغربي.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button asChild type="button" variant="outline">
                <Link href="/">إلغاء</Link>
              </Button>
              <Button type="submit" disabled={submitting} className="min-w-[140px]">
                <Send className="size-4" />
                <span>{submitting ? "جاري الإرسال..." : "أرسل الطلب"}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
