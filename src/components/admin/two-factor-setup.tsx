"use client";

// ===================================================================
//  TwoFactorSetup — مكوّن تفعيل المصادقة الثنائية
//  المراحل:
//   1) idle: زر "تفعيل 2FA"
//   2) qr: عرض رمز QR + السرّ (للإدخال اليدوي) + مدخل رمز 6 أرقام
//   3) backupCodes: عرض 10 رموز نسخ احتياطي (لمرة واحدة)
//  يستدعي:
//   - POST /api/admin/2fa/setup
//   - POST /api/admin/2fa/enable
// ===================================================================

import * as React from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  QrCode,
  ShieldCheck,
  Loader2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type Step = "idle" | "qr" | "backupCodes";
type LoadingState = "idle" | "setup" | "enable";

interface SetupData {
  secret: string;
  otpauth_url: string;
}

export function TwoFactorSetup({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = React.useState<Step>("idle");
  const [loading, setLoading] = React.useState<LoadingState>("idle");
  const [setupData, setSetupData] = React.useState<SetupData | null>(null);
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const [token, setToken] = React.useState("");
  const [backupCodes, setBackupCodes] = React.useState<string[] | null>(null);
  const [hasSavedCodes, setHasSavedCodes] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSetup() {
    setLoading("setup");
    setError(null);
    try {
      const res = await fetch("/api/admin/2fa/setup", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.secret || !data?.otpauth_url) {
        const msg = data?.error ?? "تعذّر توليد السرّ";
        setError(msg);
        toast.error(msg);
        return;
      }
      setSetupData({ secret: data.secret, otpauth_url: data.otpauth_url });

      // توليد QR
      try {
        const url = await QRCode.toDataURL(data.otpauth_url, {
          width: 240,
          margin: 2,
          color: { dark: "#1F1A17", light: "#FBF6EE" },
        });
        setQrDataUrl(url);
      } catch {
        // تعطّل QR — يكفي عرض السرّ للإدخال اليدوي
        setQrDataUrl(null);
        toast.warning("تعذّر توليد صورة QR — استخدم الإدخال اليدوي");
      }

      setStep("qr");
      toast.success("تم توليد السرّ. أضفه إلى تطبيق المصادقة.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ ما";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading("idle");
    }
  }

  async function handleEnable() {
    if (!setupData) return;
    const clean = token.replace(/\D/g, "");
    if (clean.length !== 6) {
      setError("الرمز يجب أن يكون 6 أرقام");
      toast.error("الرمز يجب أن يكون 6 أرقام");
      return;
    }
    setLoading("enable");
    setError(null);
    try {
      const res = await fetch("/api/admin/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: setupData.secret,
          token: clean,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.backupCodes || !Array.isArray(data.backupCodes)) {
        const msg = data?.error ?? "الرمز غير صحيح";
        setError(msg);
        toast.error(msg);
        return;
      }
      setBackupCodes(data.backupCodes);
      setHasSavedCodes(false);
      setStep("backupCodes");
      toast.success("تم تفعيل المصادقة الثنائية بنجاح");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ ما";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading("idle");
    }
  }

  function copySecret() {
    if (!setupData) return;
    navigator.clipboard?.writeText(setupData.secret).then(
      () => toast.success("تم نسخ السرّ"),
      () => toast.error("تعذّر النسخ — انسخ يدوياً")
    );
  }

  function copyCodes() {
    if (!backupCodes) return;
    const text = backupCodes.join("\n");
    navigator.clipboard?.writeText(text).then(
      () => toast.success("تم نسخ الرموز"),
      () => toast.error("تعذّر النسخ")
    );
  }

  function finish() {
    setStep("idle");
    setSetupData(null);
    setQrDataUrl(null);
    setToken("");
    setBackupCodes(null);
    setHasSavedCodes(false);
    setError(null);
    onComplete?.();
  }

  // ===================================================================
  //  الخطوة 1: زر التفعيل
  // ===================================================================
  if (step === "idle") {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-heading text-foreground">
            <ShieldCheck className="size-5 text-secondary" />
            تفعيل المصادقة الثنائية
          </CardTitle>
          <CardDescription>
            زيادة حماية حسابك ضدّ الاختراق. بعد التفعيل سيُطلب منك رمز تحقّق
            إضافي عند كل دخول.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-secondary mt-0.5 shrink-0" />
              <span>
                نُولّد لك سرّاً فريداً ورمز QR تضيفه إلى تطبيق المصادقة
                (Google Authenticator, Authy, Microsoft Authenticator...).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-secondary mt-0.5 shrink-0" />
              <span>
                عند كل دخول لاحق، سيطلب منك رمزاً من 6 أرقام يولّده التطبيق كل
                30 ثانية.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-secondary mt-0.5 shrink-0" />
              <span>
                نُولّد 10 رموز نسخ احتياطي تُستعمل مرة واحدة عند فقد جهازك.
              </span>
            </li>
          </ul>
          <Button
            onClick={handleSetup}
            disabled={loading === "setup"}
            className="h-11 px-6 w-full sm:w-auto"
          >
            {loading === "setup" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                جارٍ التوليد...
              </>
            ) : (
              <>
                <ShieldCheck className="size-4" />
                تفعيل 2FA
              </>
            )}
          </Button>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  // ===================================================================
  //  الخطوة 2: رمز QR + مدخل الرمز
  // ===================================================================
  if (step === "qr" && setupData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-accent/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-heading text-foreground">
              <QrCode className="size-5 text-accent" />
              إضافة السرّ إلى تطبيق المصادقة
            </CardTitle>
            <CardDescription>
              امسح رمز QR بتطبيق المصادقة لديك. أو أدخل السرّ يدوياً.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* رمز QR */}
            {qrDataUrl ? (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={qrDataUrl}
                  alt="QR للمصادقة الثنائية"
                  width={240}
                  height={240}
                  className="rounded-lg border border-border bg-background"
                />
                <Badge variant="outline" className="text-xs">
                  امسح بالكاميرا داخل تطبيق المصادقة
                </Badge>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                تعذّر توليد صورة QR — استخدم الإدخال اليدوي بالأسفل.
              </div>
            )}

            <Separator />

            {/* الإدخال اليدوي للسرّ */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  الإدخال اليدوي (32 حرفاً base32)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={copySecret}
                >
                  <Copy className="size-3" />
                  نسخ
                </Button>
              </div>
              <code
                dir="ltr"
                className="block text-start font-mono text-xs bg-muted/60 rounded px-3 py-2 break-all"
              >
                {setupData.secret}
              </code>
            </div>

            <Separator />

            {/* مدخل الرمز */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground text-center">
                أدخل الرمز المكوّن من 6 أرقام من تطبيقك
              </p>
              <div className="flex justify-center" dir="ltr">
                <InputOTP
                  maxLength={6}
                  value={token}
                  onChange={(v) => setToken(v)}
                  disabled={loading === "enable"}
                  autoFocus
                  pattern="^[0-9]*$"
                  inputMode="numeric"
                  aria-label="رمز التحقّق 6 أرقام"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="size-11 text-base" />
                    <InputOTPSlot index={1} className="size-11 text-base" />
                    <InputOTPSlot index={2} className="size-11 text-base" />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} className="size-11 text-base" />
                    <InputOTPSlot index={4} className="size-11 text-base" />
                    <InputOTPSlot index={5} className="size-11 text-base" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                className="h-11"
                onClick={() => {
                  setStep("idle");
                  setSetupData(null);
                  setQrDataUrl(null);
                  setToken("");
                  setError(null);
                }}
                disabled={loading === "enable"}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleEnable}
                disabled={
                  loading === "enable" ||
                  token.replace(/\D/g, "").length !== 6
                }
                className="h-11 px-6"
              >
                {loading === "enable" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    جارٍ التحقّق...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    تحقّق وتفعيل
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ===================================================================
  //  الخطوة 3: عرض رموز النسخ الاحتياطي
  // ===================================================================
  if (step === "backupCodes" && backupCodes) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-accent/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-heading text-foreground">
              <CheckCircle2 className="size-5 text-secondary" />
              تم التفعيل! احفظ رموز النسخ الاحتياطي
            </CardTitle>
            <CardDescription>
              هذه الرموز تُستعمل بدلاً من تطبيق المصادقة عند فقد جهازك. كل رمز
              يُستعمل مرة واحدة فقط. <strong>لن تظهر مرة أخرى</strong> — احفظها
              في مكان آمن.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <ul className="grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-sm">
                {backupCodes.map((c, i) => (
                  <li
                    key={i}
                    dir="ltr"
                    className="text-center bg-background rounded px-2 py-1 border border-border/60"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-11"
                onClick={copyCodes}
              >
                <Copy className="size-4" />
                نسخ الرموز
              </Button>
            </div>

            <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangle className="size-4" />
              <AlertTitle>تحذير أمني</AlertTitle>
              <AlertDescription className="text-sm">
                لا نُخزّل رموز النسخ بصيغة قابلة للقراءة — فقط بصيغة مجزّأة
                بـ bcrypt. لو فقدت نسختك ونفدت منك جميع الرموز العشرة، فلن
                تستطيع الدخول حتى يُعيد الإدارة الأعلى تعطيل 2FA يدوياً من قاعدة
                البيانات.
              </AlertDescription>
            </Alert>

            <Separator />

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <Checkbox
                checked={hasSavedCodes}
                onCheckedChange={(v) => setHasSavedCodes(Boolean(v))}
                className="mt-0.5"
              />
              <span className="text-sm text-foreground">
                أؤكّد أنني حفظتُ هذه الرموز في مكان آمن (مطبوعة أو في مُدير
                كلمات مرور). أعلم أنني لن أراها مرة أخرى.
              </span>
            </label>

            <Button
              onClick={finish}
              disabled={!hasSavedCodes}
              className="w-full h-11"
            >
              <ArrowRight className="size-4" />
              تمّ — إنهاء التهيئة
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return null;
}
