"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Mail,
  ShieldCheck,
  Users,
  User,
  FileText,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteLogo } from "@/components/shared/site-logo";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { cn } from "@/lib/utils";

// ===================================================================
//  ثوابت للتحقّق
// ===================================================================
const MOROCCAN_PHONE_REGEX = /^0[5-7]\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEMO_OTP = "123456";

type Strength = "weak" | "medium" | "strong" | "none";

function getPasswordStrength(pw: string): Strength {
  if (!pw) return "none";
  const hasLetter = /[a-zA-Z]/.test(pw);
  const hasNumber = /\d/.test(pw);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pw);
  if (pw.length < 8 || !hasLetter || !hasNumber) return "weak";
  if (hasSpecial && pw.length >= 10) return "strong";
  return "medium";
}

const STRENGTH_LABELS: Record<Strength, string> = {
  none: "",
  weak: "ضعيفة",
  medium: "متوسطة",
  strong: "قوية",
};

const STRENGTH_CLASSES: Record<Strength, string> = {
  none: "bg-muted",
  weak: "bg-destructive",
  medium: "bg-accent",
  strong: "bg-secondary",
};

interface RegisterFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  familyName: string;
  address: string;
  economicStatus: "ضعيف" | "متوسط" | "جيد";
  memberCount: string;
  profession: string;
  skills: string;
  interests: string;
  gender: "ذكر" | "أنثى" | "";
  birthDate: string;
  nationalId: string;
  agreedToTerms: boolean;
}

const INITIAL_STATE: RegisterFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  familyName: "",
  address: "",
  economicStatus: "متوسط",
  memberCount: "1",
  profession: "",
  skills: "",
  interests: "",
  gender: "",
  birthDate: "",
  nationalId: "",
  agreedToTerms: false,
};

type RegisterPhase = "form" | "otp" | "done";
type SubmitState = "idle" | "loading" | "error" | "success";

function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = React.useState<RegisterFormState>(INITIAL_STATE);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [submitState, setSubmitState] = React.useState<SubmitState>("idle");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [phase, setPhase] = React.useState<RegisterPhase>("form");

  // حالة OTP
  const [otp, setOtp] = React.useState("");
  const [otpState, setOtpState] = React.useState<SubmitState>("idle");
  const [otpError, setOtpError] = React.useState<string | null>(null);

  // معرّفات بعد التسجيل الناجح
  const [registeredEmail, setRegisteredEmail] = React.useState("");

  function updateField<K extends keyof RegisterFormState>(
    key: K,
    value: RegisterFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string | null {
    if (!form.firstName.trim()) return "الاسم الشخصي مطلوب";
    if (!form.lastName.trim()) return "اسم العائلة مطلوب";
    if (!form.email.trim()) return "البريد الإلكتروني مطلوب";
    if (!EMAIL_REGEX.test(form.email.trim())) return "صيغة البريد غير صحيحة";
    if (!form.phone.trim()) return "رقم الهاتف مطلوب";
    if (!MOROCCAN_PHONE_REGEX.test(form.phone.trim()))
      return "رقم الهاتف يجب أن يكون بصيغة 06XXXXXXXX أو 07XXXXXXXX أو 05XXXXXXXX";
    if (!form.password) return "كلمة المرور مطلوبة";
    if (form.password.length < 8) return "كلمة المرور يجب ألاّ تقلّ عن 8 أحرف";
    if (!/[a-zA-Z]/.test(form.password) || !/\d/.test(form.password))
      return "كلمة المرور يجب أن تحتوي على حرف ورقم على الأقل";
    if (form.password !== form.confirmPassword)
      return "كلمة المرور وتأكيدها غير متطابقتين";
    if (!form.familyName.trim()) return "اسم العائلة الجديدة مطلوب";
    const mc = Number(form.memberCount);
    if (!Number.isFinite(mc) || mc < 1) return "عدد الأفراد غير صحيح";
    if (!form.agreedToTerms) return "يجب الموافقة على الشروط والأحكام للمتابعة";
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setSubmitState("error");
      setFormError(err);
      toast.error(err);
      return;
    }

    setSubmitState("loading");
    setFormError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
          familyName: form.familyName.trim(),
          address: form.address.trim() || null,
          economicStatus: form.economicStatus,
          memberCount: Number(form.memberCount),
          profession: form.profession.trim() || null,
          skills: form.skills.trim() || null,
          interests: form.interests.trim() || null,
          gender: form.gender || null,
          birthDate: form.birthDate || null,
          nationalId: form.nationalId.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.error ?? "حدث خطأ ما";
        setSubmitState("error");
        setFormError(msg);
        toast.error(msg);
        return;
      }

      setSubmitState("success");
      setRegisteredEmail(form.email.trim().toLowerCase());
      toast.success("تم إنشاء حسابك بنجاح. أدخل رمز التحقق لإكمال العملية");
      setPhase("otp");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ ما";
      setSubmitState("error");
      setFormError(msg);
      toast.error(msg);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!otp.trim()) {
      setOtpError("أدخل رمز التحقق المكوّن من 6 أرقام");
      toast.error("أدخل رمز التحقق المكوّن من 6 أرقام");
      return;
    }
    setOtpState("loading");
    setOtpError(null);

    // محاكاة التحقق من الرمز
    await new Promise((r) => setTimeout(r, 800));

    if (otp.trim() !== DEMO_OTP) {
      const msg = "رمز التحقق غير صحيح. الرمز هو 123456";
      setOtpState("error");
      setOtpError(msg);
      toast.error(msg);
      return;
    }

    setOtpState("success");
    toast.success("تم التحقق من بريدك. يمكنك الآن تسجيل الدخول");
    setPhase("done");
    setTimeout(() => {
      router.push("/login");
    }, 1800);
  }

  const strength = getPasswordStrength(form.password);

  // ===================================================================
  //  شاشة التحقق OTP
  // ===================================================================
  if (phase === "otp" || phase === "done") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/40 py-10 px-4">
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
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-secondary/10">
                <ShieldCheck className="size-7 text-secondary" />
              </div>
              <CardTitle className="text-2xl font-heading text-foreground">
                تحقّق من بريدك الإلكتروني
              </CardTitle>
              <CardDescription className="text-base">
                أرسلنا رمز تحقق مكوّن من 6 أرقام إلى بريدك
              </CardDescription>
              <ZelligeDivider variant="diamond" className="mt-2 text-primary" />
            </CardHeader>

            <CardContent className="space-y-4">
              {registeredEmail && (
                <div className="rounded-md border border-border bg-muted/40 p-3 text-center text-sm">
                  <Mail className="size-4 inline-block -translate-y-0.5 ms-1" />
                  <code dir="ltr" className="font-mono">{registeredEmail}</code>
                </div>
              )}

              {/* وضع التجربة */}
              <div className="rounded-lg border border-accent/40 bg-accent/10 p-4 text-center space-y-1">
                <div className="flex items-center justify-center gap-2 text-accent-foreground">
                  <Sparkles className="size-4 text-accent" />
                  <span className="font-heading font-semibold text-sm">
                    رمز التحقق
                  </span>
                </div>
                <p dir="ltr" className="text-3xl font-heading font-bold tracking-[0.3em] text-primary">
                  {DEMO_OTP}
                </p>
                <p className="text-xs text-muted-foreground">
                  في وضع الإنتاج سيصلك الرمز عبر البريد الإلكتروني
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-start">
                    رمز التحقق
                  </Label>
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    dir="ltr"
                    maxLength={6}
                    className="text-center text-2xl tracking-[0.5em] font-mono h-12"
                    placeholder="______"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    aria-describedby="otp-help"
                    aria-invalid={otpState === "error"}
                    disabled={otpState === "loading" || otpState === "success"}
                  />
                  <p id="otp-help" className="sr-only">
                    أدخل الرمز المكوّن من 6 أرقام
                  </p>
                </div>

                {otpState === "error" && otpError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                  >
                    <AlertCircle className="size-4 mt-0.5 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                {otpState === "success" ? (
                  <div className="flex items-center justify-center gap-2 rounded-md border border-secondary/30 bg-secondary/5 p-3 text-sm text-secondary">
                    <Sparkles className="size-4" />
                    <span>تم التحقق! سيتم توجيهك إلى صفحة الدخول...</span>
                  </div>
                ) : (
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-11 text-base"
                    disabled={otpState === "loading"}
                  >
                    {otpState === "loading" ? (
                      <>
                        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        جاري التحقق...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="size-4" />
                        تحقّق وتفعيل الحساب
                      </>
                    )}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowRight className="size-4" />
              العودة لتسجيل الدخول
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ===================================================================
  //  نموذج التسجيل
  // ===================================================================
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40 py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="container mx-auto max-w-2xl"
      >
        <div className="flex justify-center mb-6">
          <SiteLogo size="lg" />
        </div>

        <Card className="warm-shadow border-border/60">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-heading text-foreground">
              إنشاء حساب جديد
            </CardTitle>
            <CardDescription className="text-base">
              سجّل أنت وعائلتك في منصة المعروف الرقمي لحي سيدي يوسف بن علي
            </CardDescription>
            <ZelligeDivider variant="diamond" className="mt-2 text-primary" />
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8" noValidate>
              {/* القسم الأول: بيانات الحساب */}
              <fieldset className="space-y-4" disabled={submitState === "loading"}>
                <legend className="flex items-center gap-2 text-base font-heading font-semibold text-foreground">
                  <User className="size-5 text-primary" />
                  بيانات الحساب
                </legend>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-start">
                      الاسم الشخصي <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      required
                      placeholder="محمد"
                      value={form.firstName}
                      onChange={(e) => updateField("firstName", e.target.value)}
                      aria-describedby="firstName-help"
                    />
                    <p id="firstName-help" className="sr-only">
                      أدخل اسمك الشخصي
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-start">
                      اسم العائلة <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      placeholder="بنشقرون"
                      value={form.lastName}
                      onChange={(e) => updateField("lastName", e.target.value)}
                      aria-describedby="lastName-help"
                    />
                    <p id="lastName-help" className="sr-only">
                      أدخل اسم عائلتك
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-start">
                    البريد الإلكتروني <span className="text-destructive">*</span>
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
                    placeholder="name@example.ma"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    aria-describedby="email-help"
                  />
                  <p id="email-help" className="sr-only">
                    أدخل بريداً إلكترونياً صالحاً
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-start">
                    رقم الهاتف <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-stretch gap-2">
                    <span className="inline-flex items-center px-3 rounded-md border border-input bg-muted/40 text-sm text-muted-foreground font-mono">
                      +212
                    </span>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      required
                      dir="ltr"
                      className="text-start flex-1"
                      placeholder="06XXXXXXXX"
                      value={form.phone}
                      onChange={(e) =>
                        updateField(
                          "phone",
                          e.target.value.replace(/[^\d]/g, "").slice(0, 10)
                        )
                      }
                      aria-describedby="phone-help"
                    />
                  </div>
                  <p id="phone-help" className="text-xs text-muted-foreground">
                    مثال: 0612345678 — يبدأ بـ 0 ثم 5 أو 6 أو 7 ثم 8 أرقام
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-start">
                    كلمة المرور <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      dir="ltr"
                      className="text-start pe-11"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      aria-describedby="password-help password-strength"
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
                  <p id="password-help" className="text-xs text-muted-foreground">
                    8 أحرف على الأقل، تحتوي على حرف ورقم
                  </p>
                  {strength !== "none" && (
                    <div
                      id="password-strength"
                      className="flex items-center gap-2"
                      role="status"
                      aria-live="polite"
                    >
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            STRENGTH_CLASSES[strength]
                          )}
                          style={{
                            width:
                              strength === "weak"
                                ? "33%"
                                : strength === "medium"
                                ? "66%"
                                : "100%",
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {STRENGTH_LABELS[strength]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-start">
                    تأكيد كلمة المرور <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      dir="ltr"
                      className="text-start pe-11"
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={(e) =>
                        updateField("confirmPassword", e.target.value)
                      }
                      aria-describedby="confirmPassword-help"
                      aria-invalid={
                        form.confirmPassword.length > 0 &&
                        form.confirmPassword !== form.password
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute inset-y-0 end-0 h-full px-3 hover:bg-transparent"
                      aria-label={
                        showConfirmPassword
                          ? "إخفاء كلمة المرور"
                          : "إظهار كلمة المرور"
                      }
                      aria-pressed={showConfirmPassword}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4 text-muted-foreground" />
                      ) : (
                        <Eye className="size-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p id="confirmPassword-help" className="sr-only">
                    أعد إدخال نفس كلمة المرور
                  </p>
                </div>
              </fieldset>

              <ZelligeDivider variant="minimal" className="text-border" />

              {/* القسم الثاني: بيانات الأسرة */}
              <fieldset className="space-y-4" disabled={submitState === "loading"}>
                <legend className="flex items-center gap-2 text-base font-heading font-semibold text-foreground">
                  <Users className="size-5 text-primary" />
                  بيانات الأسرة
                </legend>

                <p className="text-sm text-muted-foreground bg-muted/30 rounded-md p-3">
                  تنشئ منصتنا لكل مسجّل جديد سجل عائلة جديد باسمك. يمكنك لاحقاً
                  دعوة بقية أفراد عائلتك للانضمام.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="familyName" className="text-start">
                    اسم العائلة <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="familyName"
                    name="familyName"
                    type="text"
                    autoComplete="family-name"
                    required
                    placeholder="بنشقرون"
                    value={form.familyName}
                    onChange={(e) => updateField("familyName", e.target.value)}
                    aria-describedby="familyName-help"
                  />
                  <p id="familyName-help" className="text-xs text-muted-foreground">
                    سيُستخدم هذا الاسم لإنشاء سجل أسرة جديد في الحي
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-start">
                    العنوان <span className="text-muted-foreground text-xs">(اختياري)</span>
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    autoComplete="street-address"
                    placeholder="حي سيدي يوسف بن علي، زنقة..."
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    aria-describedby="address-help"
                  />
                  <p id="address-help" className="sr-only">
                    عنوان سكن العائلة في الحي
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="economicStatus" className="text-start">
                      الحالة الاقتصادية
                    </Label>
                    <select
                      id="economicStatus"
                      name="economicStatus"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      value={form.economicStatus}
                      onChange={(e) =>
                        updateField(
                          "economicStatus",
                          e.target.value as RegisterFormState["economicStatus"]
                        )
                      }
                      aria-describedby="economicStatus-help"
                    >
                      <option value="ضعيف">ضعيف</option>
                      <option value="متوسط">متوسط</option>
                      <option value="جيد">جيد</option>
                    </select>
                    <p id="economicStatus-help" className="sr-only">
                      اختر الحالة الاقتصادية للأسرة
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="memberCount" className="text-start">
                      عدد الأفراد
                    </Label>
                    <Input
                      id="memberCount"
                      name="memberCount"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={30}
                      step={1}
                      required
                      value={form.memberCount}
                      onChange={(e) =>
                        updateField("memberCount", e.target.value)
                      }
                      aria-describedby="memberCount-help"
                    />
                    <p id="memberCount-help" className="sr-only">
                      عدد أفراد الأسرة
                    </p>
                  </div>
                </div>
              </fieldset>

              <ZelligeDivider variant="minimal" className="text-border" />

              {/* القسم الثالث: بيانات إضافية */}
              <fieldset className="space-y-4" disabled={submitState === "loading"}>
                <legend className="flex items-center gap-2 text-base font-heading font-semibold text-foreground">
                  <FileText className="size-5 text-primary" />
                  بيانات إضافية
                </legend>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profession" className="text-start">
                      المهنة <span className="text-muted-foreground text-xs">(اختياري)</span>
                    </Label>
                    <Input
                      id="profession"
                      name="profession"
                      type="text"
                      placeholder="معلم، تاجر، حرفي..."
                      value={form.profession}
                      onChange={(e) => updateField("profession", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-start">
                      الجنس
                    </Label>
                    <select
                      id="gender"
                      name="gender"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      value={form.gender}
                      onChange={(e) =>
                        updateField(
                          "gender",
                          e.target.value as RegisterFormState["gender"]
                        )
                      }
                      aria-describedby="gender-help"
                    >
                      <option value="">— اختر —</option>
                      <option value="ذكر">ذكر</option>
                      <option value="أنثى">أنثى</option>
                    </select>
                    <p id="gender-help" className="sr-only">
                      اختر الجنس
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-start">
                    تاريخ الميلاد <span className="text-muted-foreground text-xs">(اختياري)</span>
                  </Label>
                  <Input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => updateField("birthDate", e.target.value)}
                    aria-describedby="birthDate-help"
                  />
                  <p id="birthDate-help" className="sr-only">
                    تاريخ ميلادك
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills" className="text-start">
                    المهارات <span className="text-muted-foreground text-xs">(اختياري)</span>
                  </Label>
                  <Textarea
                    id="skills"
                    name="skills"
                    rows={2}
                    placeholder="مثال: خياطة، طبخ تقليدي، إصلاح كهربائي..."
                    value={form.skills}
                    onChange={(e) => updateField("skills", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interests" className="text-start">
                    الاهتمامات <span className="text-muted-foreground text-xs">(اختياري)</span>
                  </Label>
                  <Textarea
                    id="interests"
                    name="interests"
                    rows={2}
                    placeholder="مثال: الأنشطة الثقافية، العمل التطوّعي، الرياضة..."
                    value={form.interests}
                    onChange={(e) => updateField("interests", e.target.value)}
                  />
                </div>
              </fieldset>

              <ZelligeDivider variant="minimal" className="text-border" />

              {/* القسم الرابع: التحقق */}
              <fieldset className="space-y-4" disabled={submitState === "loading"}>
                <legend className="flex items-center gap-2 text-base font-heading font-semibold text-foreground">
                  <ShieldCheck className="size-5 text-primary" />
                  التحقق والموافقة
                </legend>

                <div className="space-y-2">
                  <Label htmlFor="nationalId" className="text-start">
                    رقم البطاقة الوطنية <span className="text-muted-foreground text-xs">(اختياري، يُشفَّر)</span>
                  </Label>
                  <Input
                    id="nationalId"
                    name="nationalId"
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    className="text-start"
                    placeholder="AB123456"
                    value={form.nationalId}
                    onChange={(e) => updateField("nationalId", e.target.value)}
                    aria-describedby="nationalId-help"
                  />
                  <p id="nationalId-help" className="text-xs text-muted-foreground">
                    يُخزَّن مشفّراً بالكامل — لن يُطْلَع عليه أحد
                  </p>
                </div>

                <div className="flex items-start gap-2 rounded-md border border-border p-3">
                  <Checkbox
                    id="agreedToTerms"
                    checked={form.agreedToTerms}
                    onCheckedChange={(v) => updateField("agreedToTerms", Boolean(v))}
                    aria-describedby="terms-help"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="agreedToTerms" className="cursor-pointer text-sm leading-relaxed">
                      أوافق على{" "}
                      <Link href="/terms" className="text-primary hover:underline underline-offset-4">
                        الشروط والأحكام
                      </Link>{" "}
                      و{" "}
                      <Link href="/privacy" className="text-primary hover:underline underline-offset-4">
                        سياسة الخصوصية
                      </Link>
                      <span className="text-destructive"> *</span>
                    </Label>
                    <p id="terms-help" className="text-xs text-muted-foreground">
                      الموافقة مطلوبة لإكمال إنشاء الحساب
                    </p>
                  </div>
                </div>
              </fieldset>

              {/* عرض الخطأ */}
              {submitState === "error" && formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  <AlertCircle className="size-4 mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* زر الإرسال */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 h-11 text-base"
                  disabled={submitState === "loading" || submitState === "success"}
                >
                  {submitState === "loading" ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      جاري إنشاء الحساب...
                    </>
                  ) : submitState === "success" ? (
                    <>
                      <Sparkles className="size-4" />
                      تم إنشاء الحساب
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-4" />
                      إنشاء الحساب
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-11"
                  onClick={() => {
                    setForm(INITIAL_STATE);
                    setFormError(null);
                    setSubmitState("idle");
                  }}
                  disabled={submitState === "loading"}
                >
                  مسح النموذج
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* روابط أسفل */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            لديك حساب بالفعل؟{" "}
            <span className="text-primary font-medium hover:underline underline-offset-4">
              سجّل الدخول
            </span>
          </Link>
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

export default function RegisterPage() {
  return <RegisterForm />;
}
