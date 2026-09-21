"use client";

// ===================================================================
//  TwoFactorEnabled — مكوّن حالة "2FA مُفعّل"
//  يعرض: شارة "2FA مُفعّل" + أزرار (تعطيل / إعادة توليد رموز النسخ)
//        + جدول آخر محاولات الدخول المتعلّقة بـ2FA
// ===================================================================

import * as React from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Loader2,
  KeyRound,
  RefreshCw,
  Power,
  AlertTriangle,
  Copy,
  CheckCircle2,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDateTimeArabic } from "@/lib/constants";

interface AuditEntry {
  id: string;
  action: string;
  severity: string;
  metadata?: string | null;
  createdAt: string;
}

interface TwoFactorEnabledProps {
  auditLogs: AuditEntry[];
  onDisabled?: () => void;
}

type DialogKind = "disable" | "regenerate" | null;

// ترجمة أنواع الأحداث للعربية
const ACTION_LABELS: Record<string, string> = {
  "user.2fa.login": "دخول ناجح عبر 2FA",
  "user.2fa.login_failed": "محاولة دخول فاشلة",
  "user.2fa.backup_used": "استعمال رمز نسخ احتياطي",
  "user.2fa.backup_failed": "محاولة نسخ احتياطي فاشلة",
  "admin.2fa.enabled": "تفعيل 2FA",
  "admin.2fa.disabled": "تعطيل 2FA",
  "admin.2fa.backup_codes_regenerated": "إعادة توليد رموز النسخ",
};

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function severityColor(severity: string): string {
  switch (severity) {
    case "info":
      return "text-secondary";
    case "warning":
      return "text-amber-600 dark:text-amber-400";
    case "critical":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
}

export function TwoFactorEnabled({
  auditLogs,
  onDisabled,
}: TwoFactorEnabledProps) {
  const [dialogKind, setDialogKind] = React.useState<DialogKind>(null);
  const [token, setToken] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [newCodes, setNewCodes] = React.useState<string[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function openDialog(kind: DialogKind) {
    setDialogKind(kind);
    setToken("");
    setError(null);
    setNewCodes(null);
  }

  function closeDialog() {
    setDialogKind(null);
    setToken("");
    setError(null);
    setNewCodes(null);
  }

  async function submitDialog() {
    if (!dialogKind) return;
    const clean = token.replace(/\D/g, "");
    if (clean.length !== 6) {
      setError("الرمز يجب أن يكون 6 أرقام");
      toast.error("الرمز يجب أن يكون 6 أرقام");
      return;
    }

    const endpoint =
      dialogKind === "disable"
        ? "/api/admin/2fa/disable"
        : "/api/admin/2fa/regenerate-backup-codes";

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: clean }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        const msg = data?.error ?? "الرمز غير صحيح";
        setError(msg);
        toast.error(msg);
        return;
      }

      if (dialogKind === "disable") {
        toast.success("تم تعطيل المصادقة الثنائية. يمكنك إعادة تفعيلها لاحقاً.");
        closeDialog();
        // إعلام الأب ليُحدّث الحالة
        onDisabled?.();
      } else {
        // إعادة توليد رموز النسخ
        if (data.backupCodes && Array.isArray(data.backupCodes)) {
          setNewCodes(data.backupCodes);
          toast.success("تم توليد 10 رموز نسخ جديدة");
        } else {
          closeDialog();
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ ما";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function copyCodes() {
    if (!newCodes) return;
    const text = newCodes.join("\n");
    navigator.clipboard?.writeText(text).then(
      () => toast.success("تم نسخ الرموز"),
      () => toast.error("تعذّر النسخ")
    );
  }

  return (
    <div className="space-y-6">
      {/* بطاقة الحالة */}
      <Card className="border-secondary/40">
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base font-heading text-foreground">
                <ShieldCheck className="size-5 text-secondary" />
                المصادقة الثنائية مُفعّلة
              </CardTitle>
              <CardDescription>
                حسابك محميّ بطبقة إضافية. سيُطلب رمز تحقّق إضافي عند كل دخول.
              </CardDescription>
            </div>
            <Badge
              variant="secondary"
              className="gap-1 bg-secondary/10 text-secondary border-secondary/30"
            >
              <CheckCircle2 className="size-3.5" />
              2FA مُفعّل
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              variant="outline"
              className="h-11"
              onClick={() => openDialog("regenerate")}
            >
              <RefreshCw className="size-4" />
              إعادة توليد رموز النسخ الاحتياطي
            </Button>
            <Button
              variant="outline"
              className="h-11 text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/40"
              onClick={() => openDialog("disable")}
            >
              <Power className="size-4" />
              تعطيل 2FA
            </Button>
          </div>

          {/* آخر محاولات الدخول */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">
              آخر محاولات الدخول المتعلّقة بـ2FA
            </h3>
            <div className="rounded-lg border border-border overflow-hidden">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-start">الحدث</TableHead>
                      <TableHead className="text-start">التاريخ</TableHead>
                      <TableHead className="text-start">الخطورة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center text-muted-foreground py-6"
                        >
                          لا توجد محاولات دخول مسجّلة بعد.
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {actionLabel(log.action)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDateTimeArabic(log.createdAt)}
                          </TableCell>
                          <TableCell
                            className={`text-sm font-medium ${severityColor(
                              log.severity
                            )}`}
                          >
                            {log.severity === "info"
                              ? "عادي"
                              : log.severity === "warning"
                              ? "تحذير"
                              : "حرج"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* حوار تعطيل / إعادة توليد */}
      <Dialog
        open={dialogKind !== null && newCodes === null}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading">
              {dialogKind === "disable" ? (
                <>
                  <Power className="size-5 text-destructive" />
                  تعطيل المصادقة الثنائية
                </>
              ) : (
                <>
                  <RefreshCw className="size-5 text-accent" />
                  إعادة توليد رموز النسخ الاحتياطي
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {dialogKind === "disable"
                ? "أدخل رمز التحقّق الحالي من تطبيق المصادقة لتأكيد التعطيل. سيتم محو السرّ ورموز النسخ الاحتياطي."
                : "أدخل رمز التحقّق الحالي من تطبيق المصادقة. سيتم توليد 10 رموز نسخ جديدة استبدالاً بالقديمة."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex justify-center" dir="ltr">
              <InputOTP
                maxLength={6}
                value={token}
                onChange={(v) => setToken(v)}
                disabled={submitting}
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

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {dialogKind === "disable" && (
              <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                <AlertTriangle className="size-4" />
                <AlertTitle>تحذير</AlertTitle>
                <AlertDescription className="text-sm">
                  تعطيل 2FA يُضعف حماية حسابك. نوصي بإبقائها مُفعّلة.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="h-11"
              onClick={closeDialog}
              disabled={submitting}
            >
              إلغاء
            </Button>
            <Button
              onClick={submitDialog}
              disabled={
                submitting || token.replace(/\D/g, "").length !== 6
              }
              variant={dialogKind === "disable" ? "destructive" : "default"}
              className="h-11"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  جارٍ التأكيد...
                </>
              ) : dialogKind === "disable" ? (
                <>
                  <Power className="size-4" />
                  تأكيد التعطيل
                </>
              ) : (
                <>
                  <RefreshCw className="size-4" />
                  إعادة التوليد
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار عرض رموز النسخ الجديدة */}
      <Dialog
        open={newCodes !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading">
              <KeyRound className="size-5 text-accent" />
              رموز نسخ احتياطي جديدة
            </DialogTitle>
            <DialogDescription>
              احفظ هذه الرموز في مكان آمن. كل رمز يُستعمل مرة واحدة فقط، ولن
              تظهر مرة أخرى.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <ul className="grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-sm">
                {newCodes?.map((c, i) => (
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
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={copyCodes}
            >
              <Copy className="size-4" />
              نسخ الرموز
            </Button>
          </div>
          <DialogFooter>
            <Button className="w-full h-11" onClick={closeDialog}>
              <CheckCircle2 className="size-4" />
              حفظتُ الرموز
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
