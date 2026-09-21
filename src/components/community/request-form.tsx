"use client";

import * as React from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  HandHeart,
  Upload,
  FileText,
  CheckCircle2,
  Scale,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import {
  formatMAD,
  formatDateArabic,
  FUND_REQUEST_TYPE_LABELS,
  FUND_REQUEST_STATUS_LABELS,
  ETHICS_COMMITTEE_THRESHOLD,
} from "@/lib/constants";
import type {
  FundRequestType,
  FundRequestStatus,
} from "@prisma/client";

// ===================================================================
//  الأنواع
// ===================================================================

interface ExistingRequest {
  id: string;
  anonymousCode: string | null;
  type: FundRequestType;
  title: string;
  amountRequested: number;
  status: FundRequestStatus;
  requiresEthics: boolean;
  createdAt: string;
  approvalsCount: number;
}

interface RequestFormProps {
  existingRequests: ExistingRequest[];
}

const TYPES = Object.keys(FUND_REQUEST_TYPE_LABELS) as FundRequestType[];

// ===================================================================
//  مكوّن نموذج طلب صرف
// ===================================================================

export function RequestForm({ existingRequests }: RequestFormProps) {
  const [type, setType] = React.useState<FundRequestType>("MEDICAL");
  const [title, setTitle] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [amountRequested, setAmountRequested] = React.useState<string>("");
  const [location, setLocation] = React.useState<string>("");
  const [fileNames, setFileNames] = React.useState<string[]>([]);

  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [createdCode, setCreatedCode] = React.useState<string | null>(null);

  // حسابات
  const amountNum = Number(amountRequested) || 0;
  const requiresEthics = amountNum > ETHICS_COMMITTEE_THRESHOLD;
  const titleValid = title.trim().length >= 5;
  const descriptionValid = description.trim().length >= 20;
  const amountValid = amountNum > 0 && amountNum <= 20000;

  const canSubmit =
    !submitting && titleValid && descriptionValid && amountValid;

  // تنفيذ
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setCreatedCode(null);
    try {
      const res = await fetch("/api/fund/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim(),
          amountRequested: amountNum,
          location: location.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "تعذّر تقديم الطلب");
      }
      toast.success("تمّ تقديم طلبك بنجاح!", {
        description: `الرمز الرمزي: ${data.anonymousCode}`,
      });
      setCreatedCode(data.anonymousCode);
      // إعادة ضبط
      setTitle("");
      setDescription("");
      setAmountRequested("");
      setLocation("");
      setFileNames([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطأ غير معروف";
      toast.error("فشل تقديم الطلب", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* النموذج */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="warm-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <HandHeart className="size-5 text-primary" />
              اطلب من صندوق المعروف
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              طلبك يُعالَج بسرّية تامة. لا يُذكر اسمك في العلن، بل رمز
              مجهول. موافقة اللجنة تُحسم داخل 72 ساعة.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 1) نوع الطلب */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-foreground">
                  نوع الطلب
                </legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {TYPES.map((t) => {
                    const meta = FUND_REQUEST_TYPE_LABELS[t];
                    const active = type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        aria-pressed={active}
                        className={`flex h-auto flex-col items-start gap-1.5 rounded-lg border-2 p-4 text-start transition-all ${
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background hover:border-accent/60 hover:bg-accent/5"
                        }`}
                      >
                        <span className="text-2xl" aria-hidden>
                          {meta.emoji}
                        </span>
                        <span className="font-medium text-sm">
                          {meta.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {meta.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* 2) العنوان */}
              <div className="space-y-1.5">
                <Label htmlFor="title">
                  عنوان الطلب{" "}
                  <span className="text-destructive">*</span>
                  <span className="text-xs text-muted-foreground ms-2">
                    (5 أحرف على الأقل)
                  </span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلاً: مساعدة في علاج كسر ساق"
                  className="h-11"
                  maxLength={120}
                  required
                  aria-invalid={!titleValid && title.length > 0}
                />
              </div>

              {/* 3) الوصف */}
              <div className="space-y-1.5">
                <Label htmlFor="description">
                  وصف الحالة{" "}
                  <span className="text-destructive">*</span>
                  <span className="text-xs text-muted-foreground ms-2">
                    (20 حرفاً على الأقل)
                  </span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اشرح حالتك بإيجاز ودقّة. ما الحاجة؟ ما الذي حدث؟ كم المبلغ المطلوب تقريباً؟"
                  className="min-h-32"
                  maxLength={1000}
                  required
                  aria-invalid={!descriptionValid && description.length > 0}
                />
                <p className="text-xs text-muted-foreground">
                  {description.trim().length} / 1000 حرف
                </p>
              </div>

              {/* 4) المبلغ المطلوب */}
              <div className="space-y-1.5">
                <Label htmlFor="amount">
                  المبلغ المطلوب (درهم){" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min={1}
                  max={20000}
                  value={amountRequested}
                  onChange={(e) => setAmountRequested(e.target.value)}
                  placeholder="مثلاً 800"
                  className="h-11 max-w-xs"
                  inputMode="decimal"
                  required
                />
                {amountValid && (
                  <p className="text-sm font-medium text-primary">
                    القيمة بالحروف: {formatMAD(amountNum)}
                  </p>
                )}
              </div>

              {/* 5) الموقع (اختياري) */}
              <div className="space-y-1.5">
                <Label htmlFor="location">
                  الموقع{" "}
                  <span className="text-xs text-muted-foreground">
                    (اختياري)
                  </span>
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="مثلاً: المستشفى الإقليمي بمراكش"
                  className="h-11"
                  maxLength={100}
                />
              </div>

              {/* 6) مرفقات */}
              <div className="space-y-1.5">
                <Label htmlFor="attach">مرفقات (اختياري)</Label>
                <label
                  htmlFor="attach"
                  className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 hover:border-accent/60 hover:bg-accent/5 transition-colors"
                >
                  <Upload className="size-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    اختر مرفقات متعددة (صور، شهادات طبية، فواتير)
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF / PNG / JPG — حتى 5 ميغابايت لكل ملف
                  </span>
                  <input
                    id="attach"
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        const names = Array.from(files).map((f) => f.name);
                        setFileNames(names);
                      }
                    }}
                  />
                </label>
                {fileNames.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {fileNames.map((n) => (
                      <li
                        key={n}
                        className="flex items-center gap-2 text-sm text-foreground"
                      >
                        <FileText className="size-4 text-secondary" />
                        <span className="truncate">{n}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* تنبيه اللجنة */}
              <AnimatePresence>
                {requiresEthics && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert className="border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
                      <Scale className="size-5" />
                      <AlertTitle>هذا الطلب يحتاج موافقة لجنة النزاهة</AlertTitle>
                      <AlertDescription>
                        <p>
                          المبلغ المطلوب ({formatMAD(amountNum)}) يفوق حدّ
                          اللجنة ({formatMAD(ETHICS_COMMITTEE_THRESHOLD)}).
                          سيُبلَّغ 5 أعضاء من لجنة النزاهة، ويُفتَتح تصويت
                          يلزم 3 موافقات على الأقل للقبول.
                        </p>
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* تنبيه أصغر */}
              <Alert className="bg-muted/30 border-border">
                <Info className="size-4" />
                <AlertDescription>
                  طلبك سيُحفظ بسرّية تامة. يظهر لك فقط برمز مجهول{" "}
                  <span className="font-mono text-xs">SY-XXX</span>. لن
                  يطّلع على هويتك سوى أمين الصندوق ولجنة النزاهة.
                </AlertDescription>
              </Alert>

              {/* زر التقديم */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <p className="text-xs text-muted-foreground sm:flex-1">
                  بالضغط على «تقديم الطلب»، تؤكّد صحّة المعلومات وتقبل
                  بمراجعة اللجنة.
                </p>
                <Button
                  type="submit"
                  size="lg"
                  disabled={!canSubmit}
                  className="h-11 sm:px-8"
                >
                  <HandHeart className="size-4" />
                  <span>
                    {submitting ? "جارٍ التقديم..." : "تقديم الطلب"}
                  </span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* بطاقة الطلب بعد النجاح */}
      <AnimatePresence>
        {createdCode && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="warm-shadow border-2 border-secondary/40">
              <CardHeader className="bg-secondary/5 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-lg text-secondary">
                  <CheckCircle2 className="size-5" />
                  تمّ تقديم طلبك — رمز التتبّع
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      الرمز الرمزي للطلب
                    </p>
                    <p className="font-mono text-3xl font-bold text-primary">
                      {createdCode}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="text-xs text-muted-foreground">الحالة</p>
                    <Badge
                      variant="outline"
                      className="bg-slate-100 text-slate-700 border-slate-200 text-sm"
                    >
                      {FUND_REQUEST_STATUS_LABELS.SUBMITTED.label}
                    </Badge>
                  </div>
                </div>
                <ZelligeDivider variant="minimal" />
                <p className="text-sm text-muted-foreground">
                  احتفظ بهذا الرمز لمتابعة طلبك. ستصلك إشعارات عند كل تغيّر
                  في الحالة (قيد المراجعة ← موافَق ← مَصروف ← مكتمل).
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11"
                  onClick={() => setCreatedCode(null)}
                >
                  تقديم طلب آخر
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* طلباتي الأخيرة */}
      <section aria-labelledby="my-requests" className="space-y-3">
        <h2
          id="my-requests"
          className="font-heading text-xl font-bold text-foreground"
        >
          طلباتي الأخيرة
        </h2>
        {existingRequests.length === 0 && !createdCode ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <HandHeart className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                لا توجد طلبات بعد. ابدأ بطلب بسيط!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {existingRequests.map((r) => (
              <RequestRow key={r.id} request={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ===================================================================
//  صف طلب مع مؤشّر 5 خطوات
// ===================================================================

function RequestRow({ request }: { request: ExistingRequest }) {
  const meta = FUND_REQUEST_STATUS_LABELS[request.status];
  const isRejected = request.status === "REJECTED";
  const isCompleted = request.status === "COMPLETED";
  const typeMeta = FUND_REQUEST_TYPE_LABELS[request.type];

  // حساب نسبة التقدّم
  const progressValue = isRejected ? 100 : (meta.step / 5) * 100;

  const steps = [
    "مُقدَّم",
    "قيد المراجعة",
    "موافَق",
    "مَصروف",
    "مكتمل",
  ];

  return (
    <Card className="warm-shadow">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden>
                {typeMeta.emoji}
              </span>
              <span className="font-mono text-sm font-bold text-primary">
                {request.anonymousCode ?? "SY-???"}
              </span>
              <StatusBadge status={request.status} />
              {request.requiresEthics && (
                <Badge
                  variant="outline"
                  className="bg-accent/10 text-accent border-accent/20"
                >
                  <Scale className="size-3" />
                  لجنة النزاهة
                </Badge>
              )}
            </div>
            <p className="font-medium text-foreground">{request.title}</p>
            <p className="text-sm text-muted-foreground">
              المبلغ المطلوب:{" "}
              <span className="font-semibold text-foreground">
                {formatMAD(request.amountRequested)}
              </span>
              {request.approvalsCount > 0 && (
                <span className="ms-3">
                  موافقات اللجنة: {request.approvalsCount}/5
                </span>
              )}
              <span className="ms-3 text-xs">
                {formatDateArabic(request.createdAt)}
              </span>
            </p>
          </div>
        </div>

        {/* مؤشّر 5 خطوات */}
        {!isRejected && (
          <div className="space-y-2">
            <Progress value={progressValue} className="h-2" />
            <ol className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
              {steps.map((stepLabel, i) => {
                const stepNum = i + 1;
                const done = meta.step >= stepNum;
                const current = meta.step === stepNum;
                return (
                  <li
                    key={stepLabel}
                    className={`flex items-center gap-1.5 rounded-md px-2 py-1 ${
                      current
                        ? "bg-primary/10 text-primary font-medium"
                        : done
                          ? "text-secondary"
                          : "text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`size-2 rounded-full ${
                        current
                          ? "bg-primary"
                          : done
                            ? "bg-secondary"
                            : "bg-muted-foreground/30"
                      }`}
                      aria-hidden
                    />
                    <span>{stepLabel}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {isRejected && (
          <Alert className="border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-200">
            <AlertDescription>
              لم تُوافق اللجنة على هذا الطلب. يمكنك تقديم طلب جديد بعد
              مراجعة الأسباب.
            </AlertDescription>
          </Alert>
        )}

        {isCompleted && (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-200">
            <CheckCircle2 className="size-4" />
            <AlertDescription>
              اكتمل هذا الطلب وصرف المبلغ. شكراً لثقتك بصندوق المعروف.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// ===================================================================
//  شارة حالة ملوّنة (محلية)
// ===================================================================

function StatusBadge({ status }: { status: FundRequestStatus }) {
  const meta = FUND_REQUEST_STATUS_LABELS[status];
  const colorMap: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rose: "bg-rose-100 text-rose-700 border-rose-200",
    secondary: "bg-secondary/10 text-secondary border-secondary/20",
  };
  return (
    <Badge variant="outline" className={colorMap[meta.color] ?? colorMap.slate}>
      {meta.label}
    </Badge>
  );
}
