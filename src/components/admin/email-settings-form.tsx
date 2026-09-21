"use client";

// ===================================================================
//  EmailSettingsForm — نموذج إعدادات SMTP + زر الاختبار
//  - يستقبل الإعدادات الأولية (من props)
//  - يُرسِل POST /api/admin/settings/email للحفظ
//  - يفتح Dialog لاختبار الإرسال إلى بريد معيّن
// ===================================================================

import * as React from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Mail,
  Save,
  Send,
  Server,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export interface SmtpSettingsState {
  host: string;
  port: number;
  user: string;
  pass: string;
  passSet: boolean;
  from: string;
  enabled: boolean;
}

interface Props {
  initialSettings: SmtpSettingsState;
  currentEmail: string;
}

export function EmailSettingsForm({ initialSettings, currentEmail }: Props) {
  const [settings, setSettings] = React.useState<SmtpSettingsState>(initialSettings);
  const [saving, setSaving] = React.useState(false);
  const [testOpen, setTestOpen] = React.useState(false);
  const [testEmail, setTestEmail] = React.useState(currentEmail);
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  function update<K extends keyof SmtpSettingsState>(
    key: K,
    value: SmtpSettingsState[K]
  ) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "smtp.host": settings.host,
          "smtp.port": settings.port,
          "smtp.user": settings.user,
          // إن كان passSet ولم يُكتب شيء جديد، نُرسل سلسلة فارغة (لن يُمسح)
          // إن كتب شيئاً جديداً نُرسله (سيُستبدل)
          "smtp.pass": settings.pass,
          "smtp.from": settings.from,
          "smtp.enabled": settings.enabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "فشل حفظ الإعدادات");
        return;
      }
      toast.success("تمّ حفظ إعدادات SMTP بنجاح");
      // بعد الحفظ: نظّف حقل كلمة المرور
      setSettings((prev) => ({
        ...prev,
        pass: "",
        passSet: prev.passSet || prev.pass.length > 0,
      }));
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/settings/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      setTestResult({
        success: data.success === true,
        error: data.error,
      });
      if (data.success) {
        toast.success("تمّ الإرسال التجريبي بنجاح — تحقّق من صندوق البريد");
      } else {
        toast.warning(
          "تمّ تسجيل البريد في السجلّ (وضع pending). تفعّل SMTP للإرسال الفعلي."
        );
      }
    } catch {
      setTestResult({ success: false, error: "تعذّر الاتصال بالخادم" });
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setTesting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Server className="size-5 text-accent" strokeWidth={1.5} />
                إعدادات خادم SMTP
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-muted-foreground">
                اضبط بيانات اعتماد Brevo أو أي مزوّد SMTP آخر. تُحفظ
                الإعدادات في جدول Setting (category=smtp).
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setTestOpen(true)}
              className="h-11 gap-2"
              type="button"
            >
              <Send className="size-4" strokeWidth={1.5} />
              اختبار الإرسال
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              {/* SMTP_HOST */}
              <div className="space-y-2">
                <Label htmlFor="smtp-host" className="text-sm font-medium">
                  خادم SMTP
                </Label>
                <Input
                  id="smtp-host"
                  dir="ltr"
                  className="h-11 text-start"
                  placeholder="smtp-relay.brevo.com"
                  value={settings.host}
                  onChange={(e) => update("host", e.target.value)}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  اسم نطاق خادم البريد المُرسِل.
                </p>
              </div>
              {/* SMTP_PORT */}
              <div className="space-y-2">
                <Label htmlFor="smtp-port" className="text-sm font-medium">
                  المنفذ
                </Label>
                <Input
                  id="smtp-port"
                  dir="ltr"
                  className="h-11 text-start"
                  type="number"
                  placeholder="587"
                  value={settings.port}
                  onChange={(e) =>
                    update("port", parseInt(e.target.value, 10) || 587)
                  }
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  587 (TLS) أو 465 (SSL).
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* SMTP_USER */}
              <div className="space-y-2">
                <Label htmlFor="smtp-user" className="text-sm font-medium">
                  اسم المستخدم (SMTP_USER)
                </Label>
                <Input
                  id="smtp-user"
                  dir="ltr"
                  className="h-11 text-start"
                  placeholder="user@example.com"
                  value={settings.user}
                  onChange={(e) => update("user", e.target.value)}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  غالباً بريدك المسجّل في Brevo.
                </p>
              </div>
              {/* SMTP_PASS */}
              <div className="space-y-2">
                <Label htmlFor="smtp-pass" className="text-sm font-medium">
                  كلمة المرور (SMTP_PASS)
                </Label>
                <Input
                  id="smtp-pass"
                  dir="ltr"
                  type="password"
                  className="h-11 text-start"
                  placeholder={
                    settings.passSet ? "كلمة المرور محفوظة — اكتب جديدة للاستبدال" : "••••••••••••"
                  }
                  value={settings.pass}
                  onChange={(e) => update("pass", e.target.value)}
                  autoComplete="off"
                />
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="size-3" strokeWidth={1.5} />
                  {settings.passSet
                    ? "موجودة — اكتب قيمة جديدة للاستبدال."
                    : "لن تُحفظ إلا إذا كتبت شيئاً."}
                </p>
              </div>
            </div>

            {/* SMTP_FROM */}
            <div className="space-y-2">
              <Label htmlFor="smtp-from" className="text-sm font-medium">
                المُرسِل (SMTP_FROM)
              </Label>
              <Input
                id="smtp-from"
                dir="ltr"
                className="h-11 text-start"
                placeholder='سيدي يوسف بن علي العاصمة <noreply@syba-community.ma>'
                value={settings.from}
                onChange={(e) => update("from", e.target.value)}
                autoComplete="off"
              />
              <p className="flex items-start gap-1 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3 shrink-0" strokeWidth={1.5} />
                الصيغة الموصى بها: <span dir="ltr" className="font-mono">الاسم &lt;email@domain&gt;</span>. يجب أن يكون النطاق موثَّقاً في Brevo لتفادي السبام.
              </p>
            </div>

            {/* SMTP_ENABLED toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
              <div className="space-y-1">
                <Label
                  htmlFor="smtp-enabled"
                  className="text-sm font-medium text-foreground"
                >
                  تفعيل الإرسال الفعلي
                </Label>
                <p className="text-xs text-muted-foreground">
                  عند التعطيل: كل بريد يُسجَّل في الكونسول + قاعدة البيانات
                  بحالة pending.
                </p>
              </div>
              <Switch
                id="smtp-enabled"
                checked={settings.enabled}
                onCheckedChange={(v) => update("enabled", v)}
                aria-label="تفعيل SMTP"
              />
            </div>

            {/* تنبيه أمني */}
            <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangle className="size-4" strokeWidth={1.5} />
              <AlertTitle className="text-sm">تنبيه أمني</AlertTitle>
              <AlertDescription className="text-xs">
                تُخزَّن كلمة مرور SMTP كنص عادي في جدول Setting (MVP). أقصِر
                الوصول لقاعدة البيانات، واستعمل بيانات اعتماد SMTP مخصّصة
                لتفادي التسريب.
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="h-11 min-w-32 gap-2"
              >
                {saving ? (
                  <>
                    <span
                      className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                      aria-hidden="true"
                    />
                    جارٍ الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="size-4" strokeWidth={1.5} />
                    حفظ الإعدادات
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Dialog اختبار الإرسال */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="size-5 text-accent" strokeWidth={1.5} />
              إرسال بريد اختباري
            </DialogTitle>
            <DialogDescription>
              سيُرسَل بريد إلى العنوان المُدخل للتحقّق من صحة الإعدادات. إن
              كان SMTP مُعطَّلاً، سيُسجَّل البريد في قاعدة البيانات بحالة
              pending ولن يصل فعلياً.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="test-to" className="text-sm font-medium">
              إلى
            </Label>
            <Input
              id="test-to"
              dir="ltr"
              className="h-11 text-start"
              type="email"
              placeholder="you@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              autoComplete="off"
            />
          </div>

          {testResult && (
            <Alert
              className={
                testResult.success
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200"
                  : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
              }
            >
              {testResult.success ? (
                <CheckCircle2 className="size-4" strokeWidth={1.5} />
              ) : (
                <AlertTriangle className="size-4" strokeWidth={1.5} />
              )}
              <AlertTitle className="text-sm">
                {testResult.success ? "تمّ الإرسال بنجاح" : "لم يصل الإرسال"}
              </AlertTitle>
              {testResult.error && (
                <AlertDescription className="text-xs font-mono">
                  {testResult.error}
                </AlertDescription>
              )}
              {!testResult.error && !testResult.success && (
                <AlertDescription className="text-xs">
                  سُجّل البريد في قاعدة البيانات بحالة pending. فعّل SMTP
                  للإرسال الفعلي.
                </AlertDescription>
              )}
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTestOpen(false)}
              className="h-11"
              disabled={testing}
            >
              إغلاق
            </Button>
            <Button
              onClick={handleTest}
              disabled={testing || !testEmail.trim()}
              className="h-11 gap-2"
            >
              {testing ? (
                <>
                  <span
                    className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                  />
                  جارٍ الإرسال...
                </>
              ) : (
                <>
                  <Send className="size-4" strokeWidth={1.5} />
                  أرسِل
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
