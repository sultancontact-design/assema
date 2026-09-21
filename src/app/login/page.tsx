"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, LogIn, AlertCircle, ArrowRight, Sparkles, Info, X } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteLogo } from "@/components/shared/site-logo";
import { ZelligeDivider } from "@/components/shared/zellige-divider";

// ===================================================================
//  ترجمة أخطاء next-auth إلى العربية
// ===================================================================
const AUTH_ERROR_TRANSLATIONS: Record<string, string> = {
  CredentialsSignin: "بيانات الدخول غير صحيحة",
  Default: "حدث خطأ ما",
  Configuration: "خطأ في تكوين الخادم",
  AccessDenied: "تم رفض الوصول",
  Verification: "تعذّر التحقق من البريد",
  OAuthCallbackError: "خطأ في مزوّد المصادقة",
  OAuthCreateAccount: "تعذّر إنشاء الحساب",
  EmailCreateAccount: "تعذّر إنشاء الحساب عبر البريد",
  Callback: "خطأ في استدعاء المصادقة",
  OAuthAccountNotLinked: "هذا البريد مرتبط بحساب آخر",
  EmailSignin: "تعذّر إرسال رسالة التحقق",
  SessionRequired: "يجب تسجيل الدخول للوصول لهذه الصفحة",
};

function translateAuthError(error: string | null): string {
  if (!error) return "حدث خطأ ما";
  const key = error.replace(/^Error: ?/, "").trim();
  return AUTH_ERROR_TRANSLATIONS[key] ?? "حدث خطأ ما";
}

type LoginState = "idle" | "loading" | "error" | "success";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/community";
  const urlError = searchParams.get("error");
  const prefillEmail = searchParams.get("email");
  const isDemoMode = prefillEmail !== null;
  const [showDemoBanner, setShowDemoBanner] = React.useState(true);

  const [email, setEmail] = React.useState(prefillEmail ?? "");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [state, setState] = React.useState<LoginState>("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(
    urlError ? translateAuthError(urlError) : null
  );

  // عند تغيّر `prefillEmail` (انتقال من /demo-access?email=...) حدّث الحقل
  React.useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail);
  }, [prefillEmail]);

  function validate(): string | null {
    if (!email.trim()) return "البريد الإلكتروني مطلوب";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return "صيغة البريد غير صحيحة";
    if (!password) return "كلمة المرور مطلوبة";
    if (password.length < 8) return "كلمة المرور يجب ألاّ تقلّ عن 8 أحرف";
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setState("error");
      setErrorMsg(validationError);
      toast.error(validationError);
      return;
    }

    setState("loading");
    setErrorMsg(null);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!res || res.error) {
        const errKey = res?.error ?? "Default";
        // التحقّق من رمز "2FA مطلوب" — نُعيد التوجيه لصفحة /login/2fa
        if (errKey.startsWith("TwoFactorRequired:")) {
          const userId = errKey.slice("TwoFactorRequired:".length);
          if (userId) {
            toast.info("حسابك محميّ بالمصادقة الثنائية. أدخل رمز التحقّق.");
            const target = `/login/2fa?userId=${encodeURIComponent(
              userId
            )}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
            router.push(target);
            return;
          }
        }
        const msg = translateAuthError(errKey);
        setState("error");
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }

      setState("success");
      toast.success("تم تسجيل الدخول بنجاح. مرحباً بك في منصة المعروف الرقمي");
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ ما";
      // فحص إضافي لو رمى credentials provider الخطأ قبل صياغته كـ res.error
      if (msg.startsWith("TwoFactorRequired:")) {
        const userId = msg.slice("TwoFactorRequired:".length);
        if (userId) {
          toast.info("حسابك محميّ بالمصادقة الثنائية. أدخل رمز التحقّق.");
          const target = `/login/2fa?userId=${encodeURIComponent(
            userId
          )}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
          router.push(target);
          return;
        }
      }
      setState("error");
      setErrorMsg(msg);
      toast.error(msg);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/40 py-10 px-4">
      {/* شريط وضع العرض التوضيحي */}
      {showDemoBanner && (
        <div className="w-full max-w-md mb-4">
          <div className="relative rounded-lg border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/40 p-3 ps-9 pe-9">
            <button
              type="button"
              onClick={() => setShowDemoBanner(false)}
              aria-label="إغلاق التنبيه"
              className="absolute top-2 end-2 grid size-7 place-items-center rounded-md text-amber-700 dark:text-amber-300 hover:bg-amber-200/50 dark:hover:bg-amber-900/40 transition-colors"
            >
              <X className="size-4" />
            </button>
            <div className="flex items-start gap-2.5">
              <span className="grid place-items-center size-7 rounded-md bg-amber-200/70 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 shrink-0 mt-0.5">
                <Info className="size-4" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  🎬 وضع العرض — جرّب المنصة ببيانات جاهزة
                </p>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1 leading-relaxed">
                  استعرض كل الأدوار والصلاحيات من{" "}
                  <Link
                    href="/demo-access"
                    className="font-medium underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-100"
                  >
                    صفحة وصول العرض
                  </Link>
                  . كلمة المرور لكل الحسابات:{" "}
                  <code dir="ltr" className="font-mono">Demo@1234</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-6">
          <SiteLogo size="lg" />
        </div>

        <Card className="warm-shadow border-border/60">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-heading text-foreground">
              تسجيل الدخول
            </CardTitle>
            <CardDescription className="text-base">
              ادخل إلى منصة المعروف الرقمي لحي سيدي يوسف بن علي
            </CardDescription>
            <ZelligeDivider variant="diamond" className="mt-2 text-primary" />
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* البريد الإلكتروني */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-start">
                  البريد الإلكتروني
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  dir="ltr"
                  className="text-start"
                  placeholder="name@syba-community.ma"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-describedby="email-help"
                  aria-invalid={state === "error"}
                  disabled={state === "loading"}
                />
                {isDemoMode && prefillEmail && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1 mt-1">
                    <Sparkles className="size-3" />
                    تم تعبئة البريد تلقائياً من صفحة العرض التوضيحي
                  </p>
                )}
                <p id="email-help" className="sr-only">
                  أدخل بريدك الإلكتروني المسجّل في المنصة
                </p>
              </div>

              {/* كلمة المرور */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-start">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    dir="ltr"
                    className="text-start pe-11"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-describedby="password-help"
                    aria-invalid={state === "error"}
                    disabled={state === "loading"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 end-0 h-full px-3 hover:bg-transparent"
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    aria-pressed={showPassword}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4 text-muted-foreground" />
                    ) : (
                      <Eye className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p id="password-help" className="sr-only">
                  أدخل كلمة المرور الخاصة بحسابك
                </p>
              </div>

              {/* تذكّرني + نسيت كلمة المرور */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={remember}
                    onCheckedChange={(v) => setRemember(Boolean(v))}
                    disabled={state === "loading"}
                    aria-describedby="remember-help"
                  />
                  <Label htmlFor="remember" className="cursor-pointer text-sm">
                    تذكّرني
                  </Label>
                  <p id="remember-help" className="sr-only">
                    ابقني مسجّلاً للدخول لمدة 30 يوماً
                  </p>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline underline-offset-4"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>

              {/* عرض الخطأ */}
              {state === "error" && errorMsg && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  <AlertCircle className="size-4 mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* زر الإرسال */}
              <Button
                type="submit"
                size="lg"
                className="w-full h-11 text-base"
                disabled={state === "loading" || state === "success"}
              >
                {state === "loading" ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    جاري الدخول...
                  </>
                ) : state === "success" ? (
                  <>
                    <Sparkles className="size-4" />
                    تم الدخول بنجاح
                  </>
                ) : (
                  <>
                    <LogIn className="size-4" />
                    تسجيل الدخول
                  </>
                )}
              </Button>
            </form>

            {/* وضع التجربة */}
            <div className="mt-6 rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-accent-foreground">
                <Sparkles className="size-4 text-accent" />
                <span className="font-heading font-semibold text-sm">
                  وضع التجربة — حسابات جاهزة
                </span>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">مشرف عام</span>
                  <code dir="ltr" className="block text-start font-mono text-xs bg-muted/60 rounded px-2 py-1">
                    admin@syba-community.ma / Demo@1234
                  </code>
                </li>
                <li className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">عضو عادي</span>
                  <code dir="ltr" className="block text-start font-mono text-xs bg-muted/60 rounded px-2 py-1">
                    member@syba-community.ma / Demo@1234
                  </code>
                </li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 text-center">
            <p className="text-sm text-muted-foreground">
              ليس لديك حساب؟{" "}
              <Link
                href="/register"
                className="text-primary font-medium hover:underline underline-offset-4"
              >
                سجّل الآن
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* العودة للرئيسية */}
        <div className="mt-6 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowRight className="size-4" />
            العودة للرئيسية
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  // useSearchParams يحتاج إلى Suspense boundary في Next.js 16
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
