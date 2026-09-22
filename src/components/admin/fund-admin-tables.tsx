"use client";

// ===================================================================
//  FundAdminTables — جداول إدارة الصندوق (مساهمات + طلبات)
//  - تبويبان: المساهمات + الطلبات
//  - فلتر الحالة (Select)
//  - أمين الصندوق يؤكّد/يرفض المساهمات المعلّقة
//  - لجنة النزاهة تصوّت على الطلبات التي يتطلّبها (requiresEthics)
// ===================================================================

import * as React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Check,
  X,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Heart,
  Scale,
  ShieldCheck,
} from "lucide-react";
import {
  formatMAD,
  formatDateTimeArabic,
  CONTRIBUTION_METHOD_LABELS,
  CONTRIBUTION_STATUS_LABELS,
  FUND_REQUEST_TYPE_LABELS,
  FUND_REQUEST_STATUS_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type {
  ContributionStatus,
  ContributionMethod,
  FundRequestStatus,
  FundRequestType,
  ApprovalDecision,
  Role,
} from "@prisma/client";

// ===================================================================
//  الأنواع
// ===================================================================

export interface AdminContributionRow {
  id: string;
  receiptNumber: string | null;
  user: { id: string; fullName: string } | null;
  amount: number;
  method: ContributionMethod;
  month: string;
  status: ContributionStatus;
  createdAt: string;
}

export interface AdminFundRequestRow {
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

interface FundAdminTablesProps {
  contributions: AdminContributionRow[];
  requests: AdminFundRequestRow[];
  currentUserRole: Role;
}

// ===================================================================
//  شارات مساعدة
// ===================================================================

function ContributionStatusBadge({ status }: { status: ContributionStatus }) {
  const styles: Record<ContributionStatus, string> = {
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
    REFUNDED: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <Badge variant="outline" className={cn("text-xs", styles[status])}>
      {CONTRIBUTION_STATUS_LABELS[status]}
    </Badge>
  );
}

function RequestStatusBadge({ status }: { status: FundRequestStatus }) {
  const meta = FUND_REQUEST_STATUS_LABELS[status];
  const styles: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    rose: "bg-rose-100 text-rose-700 border-rose-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    secondary: "bg-secondary/10 text-secondary border-secondary/20",
  };
  return (
    <Badge variant="outline" className={cn("text-xs", styles[meta.color] ?? styles.slate)}>
      {meta.label}
    </Badge>
  );
}

// ===================================================================
//  جدول المساهمات
// ===================================================================

function ContributionsTable({
  contributions,
  canConfirm,
}: {
  contributions: AdminContributionRow[];
  canConfirm: boolean;
}) {
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [actioning, setActioning] = React.useState<string | null>(null);
  const [noteUser, setNoteUser] = React.useState<AdminContributionRow | null>(null);
  const [note, setNote] = React.useState("");

  const filtered = React.useMemo(() => {
    if (statusFilter === "ALL") return contributions;
    return contributions.filter((c) => c.status === statusFilter);
  }, [contributions, statusFilter]);

  async function act(contributionId: string, newStatus: "CONFIRMED" | "REJECTED") {
    setActioning(contributionId);
    try {
      const res = await fetch(
        `/api/admin/contributions/${contributionId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, note: note || undefined }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "فشل تحديث المساهمة");
        return;
      }
      toast.success(
        newStatus === "CONFIRMED"
          ? "تم تأكيد المساهمة بنجاح"
          : "تم رفض المساهمة"
      );
      // تحديث محلي للسطر
      const idx = contributions.findIndex((c) => c.id === contributionId);
      if (idx >= 0) {
        contributions[idx] = {
          ...contributions[idx],
          status: newStatus,
        };
      }
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setActioning(null);
      setNoteUser(null);
      setNote("");
    }
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Heart className="size-4 text-accent" strokeWidth={1.5} />
          <span>المساهمات ({filtered.length})</span>
        </CardTitle>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-40" aria-label="فلتر الحالة">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">كل الحالات</SelectItem>
            {Object.entries(CONTRIBUTION_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-start text-xs text-muted-foreground">
                رقم الإيصال
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                المستخدم
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                المبلغ
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                الطريقة
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                الشهر
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                الحالة
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                التاريخ
              </TableHead>
              {canConfirm && (
                <TableHead className="text-start text-xs text-muted-foreground">
                  إجراءات
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canConfirm ? 8 : 7}>
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    لا توجد مساهمات مطابقة
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id} className="text-sm">
                  <TableCell className="font-mono text-[11px] text-accent">
                    {c.receiptNumber ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {c.user?.fullName ?? "متبرّع كريم"}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatMAD(c.amount)}
                  </TableCell>
                  <TableCell className="text-xs text-foreground">
                    {CONTRIBUTION_METHOD_LABELS[c.method]}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground" dir="ltr">
                    {c.month}
                  </TableCell>
                  <TableCell>
                    <ContributionStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTimeArabic(c.createdAt)}
                  </TableCell>
                  {canConfirm && (
                    <TableCell>
                      {c.status === "PENDING" ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            onClick={() => act(c.id, "CONFIRMED")}
                            disabled={actioning === c.id}
                            aria-label="تأكيد"
                            title="تأكيد"
                          >
                            <Check className="size-4" strokeWidth={1.5} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => {
                              setNoteUser(c);
                              setNote("");
                            }}
                            disabled={actioning === c.id}
                            aria-label="رفض"
                            title="رفض مع سبب"
                          >
                            <X className="size-4" strokeWidth={1.5} />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* نافذة الرفض مع سبب */}
      <Dialog
        open={!!noteUser}
        onOpenChange={(v) => {
          if (!v) {
            setNoteUser(null);
            setNote("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>رفض مساهمة</DialogTitle>
            <DialogDescription>
              اذكر سبب الرفض — سيصل صاحب المساهمة إشعار بذلك.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-note">السبب (اختياري)</Label>
            <Textarea
              id="reject-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثال: المبلغ غير مطابق للمرجع البنكي"
              className="min-h-[80px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNoteUser(null);
                setNote("");
              }}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => noteUser && act(noteUser.id, "REJECTED")}
              disabled={actioning === noteUser?.id}
            >
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ===================================================================
//  جدول الطلبات
// ===================================================================

function RequestsTable({
  requests,
  canVote,
  canReview = true,
}: {
  requests: AdminFundRequestRow[];
  canVote: boolean;
  canReview?: boolean;
}) {
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [voteRequest, setVoteRequest] = React.useState<AdminFundRequestRow | null>(null);
  const [voteDecision, setVoteDecision] = React.useState<ApprovalDecision>("APPROVE");
  const [voteNote, setVoteNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // حالة تحديث الحالة (للأمين)
  const [statusRequest, setStatusRequest] = React.useState<AdminFundRequestRow | null>(null);
  const [newStatus, setNewStatus] = React.useState<string>("");
  const [reviewNote, setReviewNote] = React.useState("");
  // تفاصيل الصرف
  const [disbursementMethod, setDisbursementMethod] = React.useState<string>("BANK_TRANSFER");
  const [disbursementRef, setDisbursementRef] = React.useState<string>("");
  const [submittingStatus, setSubmittingStatus] = React.useState(false);

  const filtered = React.useMemo(() => {
    if (statusFilter === "ALL") return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  async function submitVote() {
    if (!voteRequest) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/fund-requests/${voteRequest.id}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision: voteDecision,
            note: voteNote || undefined,
          }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "فشل التصويت");
        return;
      }
      toast.success("تم تسجيل صوتك بنجاح");
      // تحديث محلي لعدّاد الموافقات
      const idx = requests.findIndex((r) => r.id === voteRequest.id);
      if (idx >= 0) {
        requests[idx] = {
          ...requests[idx],
          approvalsCount: data.approvalsCount ?? requests[idx].approvalsCount + 1,
        };
      }
      setVoteRequest(null);
      setVoteNote("");
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  }

  // إرسال تحديث الحالة (PATCH endpoint جديد للأمين)
  async function submitStatusUpdate() {
    if (!statusRequest || !newStatus) return;
    setSubmittingStatus(true);
    try {
      const payload: Record<string, unknown> = {
        status: newStatus,
        note: reviewNote || undefined,
      };
      // إذا الانتقال إلى DISBURSED، أضف تفاصيل الصرف
      if (newStatus === "DISBURSED") {
        payload.disbursementMethod = disbursementMethod;
        payload.disbursementRef = disbursementRef || undefined;
      }
      const res = await fetch(
        `/api/admin/fund-requests/${statusRequest.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "فشل تحديث الحالة");
        return;
      }
      toast.success(data.message ?? "تم تحديث الحالة");
      // تحديث محلي للحالة
      const idx = requests.findIndex((r) => r.id === statusRequest.id);
      if (idx >= 0) {
        requests[idx] = {
          ...requests[idx],
          status: newStatus as AdminFundRequestRow["status"],
        };
      }
      setStatusRequest(null);
      setNewStatus("");
      setReviewNote("");
      setDisbursementRef("");
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setSubmittingStatus(false);
    }
  }

  // تحديد الأزرار الديناميكية حسب الحالة الحالية
  function getTreasurerActions(r: AdminFundRequestRow): { label: string; to: string; variant?: "default" | "outline" | "destructive" | "secondary" }[] {
    const actions: { label: string; to: string; variant?: "default" | "outline" | "destructive" | "secondary" }[] = [];
    switch (r.status) {
      case "SUBMITTED":
        actions.push({ label: "بدء المراجعة", to: "UNDER_REVIEW", variant: "default" });
        actions.push({ label: "رفض", to: "REJECTED", variant: "destructive" });
        break;
      case "UNDER_REVIEW":
        if (r.amountRequested < 1000) {
          actions.push({ label: "موافقة", to: "APPROVED", variant: "default" });
        }
        actions.push({ label: "رفض", to: "REJECTED", variant: "destructive" });
        break;
      case "APPROVED":
        actions.push({ label: "تسجيل الصرف", to: "DISBURSED", variant: "default" });
        actions.push({ label: "رفض", to: "REJECTED", variant: "destructive" });
        break;
      case "DISBURSED":
        actions.push({ label: "إغلاق الطلب", to: "COMPLETED", variant: "secondary" });
        break;
    }
    return actions;
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Scale className="size-4 text-accent" strokeWidth={1.5} />
          <span>طلبات الصرف ({filtered.length})</span>
        </CardTitle>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-40" aria-label="فلتر الحالة">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">كل الحالات</SelectItem>
            {Object.entries(FUND_REQUEST_STATUS_LABELS).map(([value, meta]) => (
              <SelectItem key={value} value={value}>
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-start text-xs text-muted-foreground">
                الرمز
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                النوع
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                العنوان
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                المبلغ
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                الحالة
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                اللجنة
              </TableHead>
              <TableHead className="text-start text-xs text-muted-foreground">
                التاريخ
              </TableHead>
              {canVote && (
                <TableHead className="text-start text-xs text-muted-foreground">
                  تصويت
                </TableHead>
              )}
              {canReview && (
                <TableHead className="text-start text-xs text-muted-foreground">
                  إجراءات الأمين
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canVote ? 8 : 7}>
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    لا توجد طلبات مطابقة
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id} className="text-sm">
                  <TableCell className="font-mono text-[11px] text-accent">
                    {r.anonymousCode ?? "SY-???"}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1">
                      <span aria-hidden>
                        {FUND_REQUEST_TYPE_LABELS[r.type].emoji}
                      </span>
                      <span className="text-xs text-foreground">
                        {FUND_REQUEST_TYPE_LABELS[r.type].label}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-foreground">
                    {r.title}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatMAD(r.amountRequested)}
                  </TableCell>
                  <TableCell>
                    <RequestStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ShieldCheck
                        className={cn(
                          "size-3.5",
                          r.requiresEthics
                            ? "text-accent"
                            : "text-muted-foreground/30"
                        )}
                        strokeWidth={1.5}
                      />
                      <span className="text-xs text-muted-foreground">
                        {r.approvalsCount}/5
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTimeArabic(r.createdAt)}
                  </TableCell>
                  {canVote && (
                    <TableCell>
                      {r.requiresEthics &&
                      (r.status === "SUBMITTED" || r.status === "UNDER_REVIEW") ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9"
                          onClick={() => {
                            setVoteRequest(r);
                            setVoteDecision("APPROVE");
                            setVoteNote("");
                          }}
                        >
                          تصويت اللجنة
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                  {canReview && (
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {getTreasurerActions(r).map((action) => (
                          <Button
                            key={action.to}
                            variant={action.variant ?? "outline"}
                            size="sm"
                            className="h-9 text-xs"
                            onClick={() => {
                              setStatusRequest(r);
                              setNewStatus(action.to);
                              setReviewNote("");
                              setDisbursementRef("");
                              setDisbursementMethod("BANK_TRANSFER");
                            }}
                          >
                            {action.label}
                          </Button>
                        ))}
                        {getTreasurerActions(r).length === 0 && (
                          <span className="text-xs text-muted-foreground">
                            حالة نهائية
                          </span>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* نافذة التصويت */}
      <Dialog
        open={!!voteRequest}
        onOpenChange={(v) => {
          if (!v) {
            setVoteRequest(null);
            setVoteNote("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تصويت لجنة النزاهة</DialogTitle>
            <DialogDescription>
              {voteRequest?.anonymousCode} — {voteRequest ? FUND_REQUEST_TYPE_LABELS[voteRequest.type].label : ""}
              {" · "}
              {voteRequest ? formatMAD(voteRequest.amountRequested) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">عنوان الطلب</p>
              <p className="text-sm text-foreground">
                {voteRequest?.title}
              </p>
            </div>

            <div className="rounded-md border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">عدّاد التصويت</p>
                <Badge
                  variant="outline"
                  className="border-accent/30 bg-accent/10 text-accent"
                >
                  {voteRequest?.approvalsCount ?? 0}/5
                </Badge>
              </div>
              <div className="mt-2 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full",
                      i < (voteRequest?.approvalsCount ?? 0)
                        ? "bg-accent"
                        : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label>القرار</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setVoteDecision("APPROVE")}
                  className={cn(
                    "flex h-11 items-center justify-center gap-1.5 rounded-md border text-sm font-medium transition-colors",
                    voteDecision === "APPROVE"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-border bg-background hover:bg-muted/50"
                  )}
                >
                  <ThumbsUp className="size-4" strokeWidth={1.5} />
                  موافقة
                </button>
                <button
                  type="button"
                  onClick={() => setVoteDecision("REJECT")}
                  className={cn(
                    "flex h-11 items-center justify-center gap-1.5 rounded-md border text-sm font-medium transition-colors",
                    voteDecision === "REJECT"
                      ? "border-rose-300 bg-rose-50 text-rose-700"
                      : "border-border bg-background hover:bg-muted/50"
                  )}
                >
                  <ThumbsDown className="size-4" strokeWidth={1.5} />
                  رفض
                </button>
                <button
                  type="button"
                  onClick={() => setVoteDecision("ABSTAIN")}
                  className={cn(
                    "flex h-11 items-center justify-center gap-1.5 rounded-md border text-sm font-medium transition-colors",
                    voteDecision === "ABSTAIN"
                      ? "border-slate-300 bg-slate-50 text-slate-700"
                      : "border-border bg-background hover:bg-muted/50"
                  )}
                >
                  <Minus className="size-4" strokeWidth={1.5} />
                  امتناع
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vote-note">ملاحظة (اختيارية)</Label>
              <Textarea
                id="vote-note"
                value={voteNote}
                onChange={(e) => setVoteNote(e.target.value)}
                placeholder="سبب التصويت أو شرط إضافي"
                className="min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setVoteRequest(null);
                setVoteNote("");
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={submitVote}
              disabled={submitting}
            >
              {submitting ? "جارٍ التسجيل..." : "تسجيل الصوت"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة تحديث الحالة (للأمين) */}
      <Dialog
        open={!!statusRequest}
        onOpenChange={(v) => {
          if (!v) {
            setStatusRequest(null);
            setNewStatus("");
            setReviewNote("");
            setDisbursementRef("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تحديث حالة الطلب</DialogTitle>
            <DialogDescription>
              {statusRequest?.anonymousCode} — {statusRequest ? FUND_REQUEST_TYPE_LABELS[statusRequest.type].label : ""}
              {" · "}
              {statusRequest ? formatMAD(statusRequest.amountRequested) : ""}
              {" · "}
              {statusRequest ? `الحالة: ${FUND_REQUEST_STATUS_LABELS[statusRequest.status].label}` : ""}
              {" → "}
              {newStatus ? FUND_REQUEST_STATUS_LABELS[newStatus as keyof typeof FUND_REQUEST_STATUS_LABELS]?.label : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">عنوان الطلب</p>
              <p className="text-sm text-foreground">{statusRequest?.title}</p>
            </div>

            {/* تفاصيل الصرف — تظهر فقط عند الانتقال إلى DISBURSED */}
            {newStatus === "DISBURSED" && (
              <div className="space-y-3 rounded-md border border-emerald-200 bg-emerald-50/50 p-3">
                <p className="text-xs font-medium text-emerald-700">
                  تفاصيل الصرف
                </p>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">طريقة الصرف</Label>
                    <Select value={disbursementMethod} onValueChange={setDisbursementMethod}>
                      <SelectTrigger className="h-9 mt-1" aria-label="طريقة الصرف">
                        <SelectValue placeholder="اختر الطريقة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BANK_TRANSFER">تحويل بنكي</SelectItem>
                        <SelectItem value="CASH">نقدي</SelectItem>
                        <SelectItem value="CMI">CMI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">مرجع الصرف (اختياري)</Label>
                    <Input
                      className="h-9 mt-1"
                      placeholder="رقم التحويل، إيصال، إلخ."
                      value={disbursementRef}
                      onChange={(e) => setDisbursementRef(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label>ملاحظة (اختياري)</Label>
              <Textarea
                className="mt-1 min-h-20"
                placeholder={
                  newStatus === "REJECTED"
                    ? "سبب الرفض..."
                    : newStatus === "DISBURSED"
                    ? "تفاصيل الصرف..."
                    : "ملاحظات المراجعة..."
                }
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStatusRequest(null);
                setNewStatus("");
                setReviewNote("");
              }}
              className="h-10"
            >
              إلغاء
            </Button>
            <Button
              onClick={submitStatusUpdate}
              disabled={submittingStatus}
              variant={newStatus === "REJECTED" ? "destructive" : "default"}
              className="h-10"
            >
              {submittingStatus ? "جارٍ التحديث..." : "تأكيد التحديث"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ===================================================================
//  المكوّن الرئيسي — يلفّ الجدولين في تبويبات
// ===================================================================

export function FundAdminTables({
  contributions,
  requests,
  currentUserRole,
}: FundAdminTablesProps) {
  const canConfirm =
    currentUserRole === "TREASURER" || currentUserRole === "SUPER_ADMIN";
  const canVote =
    currentUserRole === "ETHICS_COMMITTEE" ||
    currentUserRole === "SUPER_ADMIN";

  return (
    <Tabs defaultValue="contributions" className="w-full">
      <TabsList className="h-10">
        <TabsTrigger value="contributions" className="px-4">
          <Heart className="size-4" strokeWidth={1.5} />
          <span>المساهمات</span>
          <Badge
            variant="outline"
            className="ms-1 border-border bg-background text-muted-foreground"
          >
            {contributions.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="requests" className="px-4">
          <Scale className="size-4" strokeWidth={1.5} />
          <span>الطلبات</span>
          <Badge
            variant="outline"
            className="ms-1 border-border bg-background text-muted-foreground"
          >
            {requests.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="contributions" className="mt-3">
        <ContributionsTable contributions={contributions} canConfirm={canConfirm} />
      </TabsContent>

      <TabsContent value="requests" className="mt-3">
        <RequestsTable requests={requests} canVote={canVote} />
      </TabsContent>
    </Tabs>
  );
}
