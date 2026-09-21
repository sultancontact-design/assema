"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Heart,
  Banknote,
  CreditCard,
  Wallet,
  Upload,
  FileText,
  CheckCircle2,
  Phone,
  User as UserIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import {
  formatMAD,
  formatDateArabic,
  CONTRIBUTION_METHOD_LABELS,
  CONTRIBUTION_STATUS_LABELS,
} from "@/lib/constants";
import type {
  ContributionMethod,
  ContributionStatus,
} from "@prisma/client";

// ===================================================================
//  أنواع
// ===================================================================

interface ExistingContribution {
  id: string;
  amount: number;
  month: string;
  year: number;
  method: ContributionMethod;
  receiptNumber: string | null;
  digitalReceipt: string | null;
  status: ContributionStatus;
  createdAt: string;
}

interface ContributeFormProps {
  treasurerName: string | null;
  treasurerPhone: string | null;
  existingContributions: ExistingContribution[];
}

// ===================================================================
//  قفف المساهمة المسبقة
// ===================================================================

const TIERS = [20, 50, 100, 200] as const;

// ===================================================================
//  مكوّن النموذج
// ===================================================================

export function ContributeForm({
  treasurerName,
  treasurerPhone,
  existingContributions,
}: ContributeFormProps) {
  // الحالة
  const [amount, setAmount] = React.useState<number>(50);
  const [customAmount, setCustomAmount] = React.useState<string>("");
  const [isCustom, setIsCustom] = React.useState<boolean>(false);
  const [method, setMethod] =
    React.useState<ContributionMethod>("BANK_TRANSFER");
  const [bankReference, setBankReference] = React.useState<string>("");
  const [note, setNote] = React.useState<string>("");
  const [receiptFileName, setReceiptFileName] = React.useState<string | null>(
    null
  );

  // الشهر الحالي (YYYY-MM)
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = React.useState<string>(defaultMonth);

  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [receipt, setReceipt] = React.useState<{
    receiptNumber: string;
    digitalReceipt: string;
    amount: number;
    createdAt: string;
  } | null>(null);

  // قيمة المبلغ النهائية
  const finalAmount = isCustom
    ? Number(customAmount) || 0
    : amount;

  const canSubmit =
    !submitting &&
    finalAmount > 0 &&
    finalAmount <= 5000 &&
    (!isCustom || customAmount.length > 0);

  // تنفيذ المساهمة
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setReceipt(null);
    try {
      const res = await fetch("/api/fund/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          month,
          method,
          bankReference: method === "BANK_TRANSFER" ? bankReference : undefined,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "تعذّر تسجيل المساهمة");
      }
      toast.success("تمّت مساهمتك بنجاح!", {
        description: `رقم الإيصال: ${data.receiptNumber}`,
      });
      setReceipt({
        receiptNumber: data.receiptNumber,
        digitalReceipt: data.digitalReceipt,
        amount: finalAmount,
        createdAt: new Date().toISOString(),
      });
      // إعادة ضبط جزئية
      setBankReference("");
      setNote("");
      setReceiptFileName(null);
      setCustomAmount("");
      setIsCustom(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطأ غير معروف";
      toast.error("فشل تسجيل المساهمة", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* بطاقة تقديم النموذج */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="warm-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Heart className="size-5 text-primary" />
              ساهم في صندوق المعروف
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              كل درهم تساهم به يصل مباشرةً إلى أسر الحي المستحقّة. تُحفظ
              مساهمتك برقم إيصال رقمي قابل للمراجعة.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 1) اختيار المبلغ */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-foreground">
                  اختر قيمة المساهمة
                </legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {TIERS.map((tier) => {
                    const active = !isCustom && amount === tier;
                    return (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => {
                          setAmount(tier);
                          setIsCustom(false);
                          setCustomAmount("");
                        }}
                        aria-pressed={active}
                        className={`flex h-14 flex-col items-center justify-center rounded-lg border-2 transition-all ${
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background hover:border-accent/60 hover:bg-accent/5"
                        }`}
                      >
                        <span className="font-heading text-lg font-bold">
                          {tier}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          درهم
                        </span>
                      </button>
                    );
                  })}
                </div>
                {/* خيار مبلغ مخصّص */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="custom-amount">مبلغ مخصّص</Label>
                    <Input
                      id="custom-amount"
                      type="number"
                      min={1}
                      max={5000}
                      inputMode="decimal"
                      placeholder="مثلاً 75"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setIsCustom(e.target.value.length > 0);
                      }}
                      className="h-11"
                      aria-describedby="custom-amount-hint"
                    />
                  </div>
                  <p id="custom-amount-hint" className="text-xs text-muted-foreground sm:pb-3">
                    حد أقصى 5000 درهم
                  </p>
                </div>
                <div className="rounded-lg bg-muted/60 p-3 text-sm">
                  <span className="text-muted-foreground">المبلغ المختار: </span>
                  <span className="font-bold text-primary">
                    {formatMAD(finalAmount)}
                  </span>
                </div>
              </fieldset>

              {/* 2) اختيار الشهر */}
              <div className="space-y-1.5">
                <Label htmlFor="month">شهر المساهمة</Label>
                <Input
                  id="month"
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="h-11 max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  الافتراضي: الشهر الحالي
                </p>
              </div>

              {/* 3) طريقة الدفع */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-foreground">
                  طريقة الدفع
                </legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <MethodCard
                    active={method === "BANK_TRANSFER"}
                    onClick={() => setMethod("BANK_TRANSFER")}
                    icon={<Banknote className="size-5" />}
                    label={CONTRIBUTION_METHOD_LABELS.BANK_TRANSFER}
                    description="حوّل من حسابك البنكي"
                  />
                  <MethodCard
                    active={method === "CASH"}
                    onClick={() => setMethod("CASH")}
                    icon={<Wallet className="size-5" />}
                    label={CONTRIBUTION_METHOD_LABELS.CASH}
                    description="سلّم المبلغ يدوياً"
                  />
                  <MethodCard
                    active={method === "CMI"}
                    onClick={() => setMethod("CMI")}
                    icon={<CreditCard className="size-5" />}
                    label={CONTRIBUTION_METHOD_LABELS.CMI}
                    description="بطاقة بنكية (CMI)"
                  />
                </div>
              </fieldset>

              {/* تفاصيل الطريقة المختارة */}
              <div className="rounded-lg border border-dashed border-border p-4 bg-muted/20">
                {method === "BANK_TRANSFER" && (
                  <div className="space-y-4">
                    <div className="rounded-md bg-card border border-border p-3">
                      <p className="text-sm font-medium text-foreground">
                        تفاصيل الحساب البنكي للصندوق
                      </p>
                      <dl className="mt-2 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
                        <div className="flex justify-between gap-2">
                          <dt className="text-muted-foreground">البنك:</dt>
                          <dd className="font-medium">التجاري وفا بنك (CFG)</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-muted-foreground">الحساب (RIB):</dt>
                          <dd className="font-mono text-xs">
                            011 780 0000123456789 01
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-muted-foreground">المستفيد:</dt>
                          <dd className="font-medium">جمعية المعروف — سيدي يوسف</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-muted-foreground">الغرض:</dt>
                          <dd className="font-medium">مساهمة صندوق المعروف</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bank-ref">مرجع التحويل (اختياري)</Label>
                      <Input
                        id="bank-ref"
                        value={bankReference}
                        onChange={(e) => setBankReference(e.target.value)}
                        placeholder="مثلاً VP-2024-00123"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="receipt-upload">
                        إرفاق صورة إيصال التحويل
                      </Label>
                      <label
                        htmlFor="receipt-upload"
                        className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 hover:border-accent/60 hover:bg-accent/5 transition-colors"
                      >
                        {receiptFileName ? (
                          <>
                            <FileText className="size-8 text-secondary" />
                            <span className="text-sm font-medium text-foreground">
                              {receiptFileName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              اضغط لتغيير الملف
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload className="size-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              اختر صورة الإيصال (PNG/JPG)
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ملفات حتى 5 ميغابايت
                            </span>
                          </>
                        )}
                        <input
                          id="receipt-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0] ?? null;
                            setReceiptFileName(f?.name ?? null);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {method === "CASH" && (
                  <div className="space-y-3">
                    <div className="rounded-md bg-card border border-border p-3">
                      <p className="text-sm font-medium text-foreground">
                        تواصل مع أمين الصندوق لتسليم المبلغ نقداً
                      </p>
                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <UserIcon className="size-4 text-secondary" />
                          <span className="text-muted-foreground">الاسم:</span>
                          <span className="font-medium">
                            {treasurerName ?? "غير محدّد"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="size-4 text-secondary" />
                          <span className="text-muted-foreground">الهاتف:</span>
                          <span className="font-mono" dir="ltr">
                            {treasurerPhone ?? "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      بعد تسليم المبلغ نقداً، سيصادق أمين الصندوق على مساهمتك
                      في لوحة الإدارة، وستتحوّل حالتها من «بانتظار التأكيد»
                      إلى «مؤكَّد».
                    </p>
                  </div>
                )}

                {method === "CMI" && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      ستُحوَّل إلى صفحة الدفع الآمن عبر بوّابة CMI لإتمام
                      المساهمة ببطاقتك البنكية. في هذه المرحلة،
                      المساهمة تُسجَّل بحالة «بانتظار التأكيد» إلى حين تفعيل
                      الربط مع CMI.
                    </p>
                  </div>
                )}
              </div>

              {/* ملاحظة اختيارية */}
              <div className="space-y-1.5">
                <Label htmlFor="note">ملاحظة (اختياري)</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="مثلاً: صدقة عن والدتي..."
                  className="min-h-20"
                  maxLength={300}
                />
              </div>

              {/* زر الإرسال */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  بتأكيدك المساهمة، توافق على شروط الصندوق وأخلاقيات المعروف
                  المغربي.
                </p>
                <Button
                  type="submit"
                  size="lg"
                  disabled={!canSubmit}
                  className="h-11 sm:px-8"
                >
                  <Heart className="size-4" />
                  <span>
                    {submitting ? "جارٍ التسجيل..." : "تأكيد المساهمة"}
                  </span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* الإيصال الرقمي بعد النجاح */}
      <AnimatePresence>
        {receipt && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="warm-shadow border-2 border-secondary/40 bg-card">
              <CardHeader className="bg-secondary/5 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-lg text-secondary">
                  <CheckCircle2 className="size-5" />
                  إيصال رقمي — مساهمتك مؤكَّدة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">رقم الإيصال</p>
                    <p className="font-mono text-sm font-bold text-primary">
                      {receipt.receiptNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">التاريخ</p>
                    <p className="text-sm font-medium">
                      {formatDateArabic(receipt.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">المبلغ</p>
                    <p className="font-heading text-xl font-bold text-foreground">
                      {formatMAD(receipt.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      المرجع الرقمي (UUID)
                    </p>
                    <p
                      className="font-mono text-xs text-muted-foreground break-all"
                      dir="ltr"
                    >
                      {receipt.digitalReceipt}
                    </p>
                  </div>
                </div>
                <ZelligeDivider variant="stars" />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    احتفظ بهذا الإيصال. حالة المساهمة حالياً:{" "}
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                      {CONTRIBUTION_STATUS_LABELS.PENDING}
                    </Badge>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11"
                    onClick={() => setReceipt(null)}
                  >
                    مساهمة جديدة
                  </Button>
                </div>
                {/* رمز QR شبيه — SVG بسيط منقّط */}
                <QrLikePattern value={receipt.digitalReceipt} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* مساهماتي الأخيرة */}
      <section aria-labelledby="my-contribs" className="space-y-3">
        <h2 id="my-contribs" className="font-heading text-xl font-bold text-foreground">
          مساهماتي الأخيرة
        </h2>
        {existingContributions.length === 0 && !receipt ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <Heart className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                لا توجد مساهمات بعد. كن أوّل من يساهم!
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="warm-shadow">
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-start font-medium">الإيصال</th>
                      <th className="px-4 py-3 text-start font-medium">المبلغ</th>
                      <th className="px-4 py-3 text-start font-medium">الشهر</th>
                      <th className="px-4 py-3 text-start font-medium">الطريقة</th>
                      <th className="px-4 py-3 text-start font-medium">الحالة</th>
                      <th className="px-4 py-3 text-start font-medium">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {existingContributions.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/40">
                        <td className="px-4 py-3 font-mono text-xs text-primary">
                          {c.receiptNumber ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {formatMAD(c.amount)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {c.month}
                        </td>
                        <td className="px-4 py-3">
                          {CONTRIBUTION_METHOD_LABELS[c.method]}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDateArabic(c.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

// ===================================================================
//  بطاقة طريقة دفع قابلة للنقر
// ===================================================================

function MethodCard({
  active,
  onClick,
  icon,
  label,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-auto flex-col items-start gap-1.5 rounded-lg border-2 p-4 text-start transition-all ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background hover:border-accent/60 hover:bg-accent/5"
      }`}
    >
      <div
        className={`shrink-0 rounded-md p-1.5 ${
          active ? "bg-primary/15 text-primary" : "bg-muted/60 text-muted-foreground"
        }`}
      >
        {icon}
      </div>
      <span className="font-medium text-sm">{label}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </button>
  );
}

// ===================================================================
//  شارة الحالة (محلية)
// ===================================================================

function StatusBadge({ status }: { status: ContributionStatus }) {
  const map: Record<ContributionStatus, string> = {
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
    REFUNDED: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <Badge variant="outline" className={map[status]}>
      {CONTRIBUTION_STATUS_LABELS[status]}
    </Badge>
  );
}

// ===================================================================
//  رمز QR شبيه (SVG منقّط ثابت للعرض فقط)
// ===================================================================

function QrLikePattern({ value }: { value: string }) {
  // توليد شبكة 21×21 زائفة من تجزئة الـUUID
  const size = 21;
  const cells: boolean[][] = [];
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      hash = (hash * 1103515245 + 12345) & 0x7fffffff;
      row.push((hash & 1) === 1);
    }
    cells.push(row);
  }
  // مربعات الزوايا الثلاثة (الزاوية الرابعة في RTL تختلف، نضع 3)
  const inFinder = (r: number, c: number) => {
    const inBox = (br: number, bc: number) =>
      r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return inBox(0, 0) || inBox(0, size - 7) || inBox(size - 7, 0);
  };
  return (
    <div className="flex justify-center pt-2">
      <svg
        width={140}
        height={140}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="رمز تحقق بصري شبيه بـ QR"
        className="rounded-md bg-white p-1 border border-border"
      >
        {cells.map((row, r) =>
          row.map((on, c) => {
            const isFrame = inFinder(r, c);
            const isOuter =
              isFrame &&
              (r % 6 === 0 || c % 6 === 0 || r % 6 === 6 || c % 6 === 6);
            const isInner =
              isFrame &&
              r >= 2 &&
              r <= 4 &&
              ((c >= 2 && c <= 4) ||
                (c >= size - 5 && c <= size - 3) ||
                (r >= size - 5 && r <= size - 3 && c >= 2 && c <= 4));
            const fill =
              isOuter || isInner || (!isFrame && on)
                ? "#1F1A17"
                : "transparent";
            if (fill === "transparent") return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={c}
                y={r}
                width={1}
                height={1}
                fill={fill}
              />
            );
          })
        )}
      </svg>
    </div>
  );
}
