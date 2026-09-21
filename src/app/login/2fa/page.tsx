"use client";

// ===================================================================
//  /login/2fa — صفحة التحقّق الثنائي
//  تستقبل userId من الـsearch params (بعد أن رمى credentials provider
//  خطأ "TwoFactorRequired:<id>"). تعرض مدخل OTP 6 أرقام + خيار رمز النسخ
//  الاحتياطي. عند النجاح تستدعي signIn("credentials-2fa", {userId, ticket}).
// ===================================================================

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowRight,
  KeyRound,
  ShieldCheck,
  Copy,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { SiteLogo } from "@/components/shared/site-logo";
import { ZelligeDivider } from "@/components/shared/zellige-divider";

type Mode = "totp" | "backup";
type State = "idle" | "loading" | "error" | "success";

function TwoFactorForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? "";
  const callbackUrl = searchParams.get("callbackUrl") ?? "/community";

  const [mode, setMode] = React.useState<Mode>("totp");
  const [totp, setTotp] = React.useState("");
  const [backupCode, setBackupCode] = React.useState("");
  const [state, setState] = React.useState<State>("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [newBackupCodes, setNewBackupCodes] = React.useState<string[] | null>(
    null
  );

  // لو لم يصل userId — لا يمكن للمستخدم المتابعة
  if (!userId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/40 px-4 py-10">
        <Card className="max-w-md w-full border-destructive/40">
          <CardHeader className="text-center">
            <AlertCircle className="size-10 mx-auto text-destructive" />
            <CardTitle className="text-xl mt-2">رابط غير صالح</CardTitle>
            <CardDescription>
              لا توجد معلومات كافية لإكمال التحقّق الثنائي. عُد إلى صفحة الدخول
              وأعد المحاولة.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild variant="outline">
              <Link href="/login">
                <ArrowRight className="size-4" />
                العودة لتسجيل الدخول
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  async function handleTotpVerify(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    const clean = totp.replace(/\D/g, "");
    if (clean.length !== 6) {
      setState("error");
      setErrorMsg("الرمز يجب أن يكون 6 أرقام");
      toast.error("الرمز يجب أن يكون 6 أرقام");
      return;
    }

    setState("loading");
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, token: clean }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ticket) {
        const msg = data?.error ?? "الرمز غير صحيح أو منتهي الصلاحية";
        setState("error");
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }

      // إنشاء الجلسة عبر credentials-2fa provider باستخدام التذكرة
      const signInRes = await signIn("credentials-2fa", {
        userId,
        ticket: data.ticket,
        redirect: false,
      });

      if (!signInRes || signInRes.error) {
        setState("error");
        const msg = "تعذّر إنشاء الجلسة بعد التحقّق. حاول مجدداً";
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }

      setState("success");
      toast.success("تم التحقّق بنجاح — أهلاً بك");
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ ما";
      setState("error");
      setErrorMsg(msg);
      toast.error(msg);
    }
  }

  async function handleBackupVerify(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    const clean = backupCode.trim().toUpperCase();
    if (clean.length < 8 || clean.length > 12) {
      setState("error");
      setErrorMsg("رمز النسخ الاحتياطي يجب أن يكون 8 أحرف على الأقل");
      toast.error("تحقّق من طول رمز النسخ الاحتياطي");
      return;
    }

    setState("loading");
    try {
      const res = await fetch("/api/auth/2fa/verify-backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: clean }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ticket) {
        const msg = data?.error ?? "رمز النسخ الاحتياطي غير صحيح";
        setState("error");
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }

      // حفظ رموز النسخ الجديدة قبل إنشاء الجلسة لعرضها بعد الدخول
      if (data.newBackupCodes && Array.isArray(data.newBackupCodes)) {
        setNewBackupCodes(data.newBackupCodes);
      }

      const signInRes = await signIn("credentials-2fa", {
        userId,
        ticket: data.ticket,
        redirect: false,
      });

      if (!signInRes || signInRes.error) {
        setState("error");
        setNewBackupCodes(null);
        const msg = "تعذّر إنشاء الجلسة بعد التحقّق. حاول مجدداً";
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }

      setState("success");
      toast.success("تم التحقّق بنجاح — تم استهلاك رمز النسخ الاحتياطي");
      // لا نُعيد التوجيه فوراً إن كان هناك رموز جديدة لعرضها
      if (!data.newBackupCodes) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ ما";
      setState("error");
      setErrorMsg(msg);
      toast.error(msg);
    }
  }

  function copyCodes() {
    if (!newBackupCodes) return;
    const text = newBackupCodes.join("\n");
    navigator.clipboard?.writeText(text).then(
      () => toast.success("تم نسخ الرموز إلى الحافظة"),
      () => toast.error("تعذّر النسخ — انسخها يدوياً")
    );
  }

  function proceedAfterBackup() {
    router.push(callbackUrl);
    router.refresh();
  }

  // عرض رموز النسخ الجديدة بعد الدخول عبر رمز نسخ احتياطي
  if (newBackupCodes) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="border-accent/40 warm-shadow">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center">
              <CheckCircle2 className="size-10 text-accent" />
            </div>
            <CardTitle className="text-xl">رموز نسخ احتياطي جديدة</CardTitle>
            <CardDescription>
              تم استهلاك رمز النسخ الاحتياطي. ولّدنا لك 10 رموز جديدة — احفظها
              في مكان آمن. لن تظهر مرة أخرى.
            </CardDescription>
            <ZelligeDivider variant="diamond" className="mt-2 text-primary" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <ul className="grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-sm">
                {newBackupCodes.map((c, i) => (
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
            <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertCircle className="size-4" />
              <AlertTitle>تحذير أمني</AlertTitle>
              <AlertDescription className="text-sm">
                هذه الرموز بديلة عن جهازك عند فقدانه. احفظها مطبوعة في درج آمن
                ولا تشاركها مع أحد.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={copyCodes}
            >
              <Copy className="size-4" />
              نسخ الرموز
            </Button>
            <Button className="w-full h-11" onClick={proceedAfterBackup}>
              <ShieldCheck className="size-4" />
              حفظتُ الرموز — متابعة
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-md"
    >
      <Card className="warm-shadow border-border/60">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <SiteLogo size="lg" />
          </div>
          <div className="flex justify-center">
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="size-3.5" />
              مصادقة ثنائية
            </Badge>
          </div>
          <CardTitle className="text-2xl font-heading text-foreground">
            أدخل رمز التحقّق الثنائي
          </CardTitle>
          <CardDescription className="text-base">
            افتح تطبيق المصادقة (Google Authenticator أو Authy) واقرأ الرمز
            المكوّن من 6 أرقام.
          </CardDescription>
          <ZelligeDivider variant="diamond" className="mt-2 text-primary" />
        </CardHeader>

        <CardContent>
          {/* تبديل بين OTP ورمز النسخ الاحتياطي */}
          <div className="flex items-center justify-center gap-1 mb-4 rounded-lg bg-muted/60 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("totp");
                setErrorMsg(null);
              }}
              className={`flex-1 h-9 rounded-md text-sm font-medium transition ${
                mode === "totp"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={mode === "totp"}
            >
              رمز التطبيق
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("backup");
                setErrorMsg(null);
              }}
              className={`flex-1 h-9 rounded-md text-sm font-medium transition ${
                mode === "backup"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={mode === "backup"}
            >
              رمز نسخ احتياطي
            </button>
          </div>

          {mode === "totp" ? (
            <form onSubmit={handleTotpVerify} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="totp" className="text-center block">
                  رمز التحقّق (6 أرقام)
                </Label>
                <div className="flex justify-center" dir="ltr">
                  <InputOTP
                    id="totp"
                    maxLength={6}
                    value={totp}
                    onChange={(v) => setTotp(v)}
                    disabled={state === "loading"}
                    autoFocus
                    pattern="^[0-9]*$"
                    inputMode="numeric"
                    aria-label="رمز التحقّق المكوّن من 6 أرقام"
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

              {state === "error" && errorMsg && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full h-11 text-base"
                disabled={
                  state === "loading" || totp.replace(/\D/g, "").length !== 6
                }
              >
                {state === "loading" ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    جارٍ التحقّق...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    تحقّق
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={handleBackupVerify}
              className="space-y-4"
              noValidate
            >
              <div className="space-y-2">
                <Label htmlFor="backup-code" className="text-start block">
                  رمز النسخ الاحتياطي (8 أحرف)
                </Label>
                <Input
                  id="backup-code"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  disabled={state === "loading"}
                  dir="ltr"
                  className="text-center text-lg tracking-[0.3em] font-mono h-12 uppercase"
                  placeholder="XXXXXXXX"
                  maxLength={12}
                  autoComplete="off"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground text-center">
                  أدخل أحد الرموز الـ10 التي حصلت عليها عند تفعيل 2FA. سيتم
                  استهلاكه فوراً وتوليد رمز جديد بدلاً منه.
                </p>
              </div>

              {state === "error" && errorMsg && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full h-11 text-base"
                disabled={
                  state === "loading" || backupCode.trim().length < 8
                }
              >
                {state === "loading" ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    جارٍ التحقّق...
                  </>
                ) : (
                  <>
                    <KeyRound className="size-4" />
                    تحقّق برمز النسخ
                  </>
                )}
              </Button>
            </form>
          )}

          <Separator className="my-4" />

          <div className="flex flex-col gap-2 text-center">
            <p className="text-xs text-muted-foreground">
              واجهت مشكلة في التحقّق؟ تواصل مع إدارة الحي إن فقدت جهازك.
            </p>
            <Link
              href="/login"
              className="text-sm text-primary hover:underline underline-offset-4 inline-flex items-center justify-center gap-1.5"
            >
              <ArrowRight className="size-4" />
              العودة لتسجيل الدخول
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function TwoFactorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/40 py-10 px-4">
      <React.Suspense
        fallback={
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        }
      >
        <TwoFactorForm />
      </React.Suspense>
    </div>
  );
}
