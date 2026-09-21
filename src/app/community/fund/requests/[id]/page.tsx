// ===================================================================
//  صفحة تتبّع طلب معروف — /community/fund/requests/[id]
//  Server Component يعرض الطلب + الموافقات + الخط الزمني
//  يُمرّر البيانات لـ FundRequestClient للتفاعل (تنزيل PDF)
// ===================================================================

import { notFound, redirect } from "next/navigation";
import * as React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Download,
  MapPin,
  Paperclip,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import {
  FundRequestClient,
  type RequestClientProps,
} from "@/components/community/fund-request-client";
import {
  FUND_REQUEST_TYPE_LABELS,
  FUND_REQUEST_STATUS_LABELS,
  APPROVAL_DECISION_LABELS,
  formatMAD,
  formatDateTimeArabic,
  formatDateArabic,
} from "@/lib/constants";
import type {
  FundRequestType,
  FundRequestStatus,
  ApprovalDecision,
} from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function RequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/community/fund");
  }

  const { id } = await params;
  const request = await db.fundRequest.findUnique({
    where: { id },
    include: {
      user: { select: { fullName: true } },
      family: { select: { familyName: true } },
      approvals: {
        include: {
          approver: { select: { fullName: true, role: true } },
        },
        orderBy: { decidedAt: "asc" },
      },
    },
  });

  if (!request) {
    notFound();
  }

  // جلب أسماء المراجع والمُصرِّف (لا توجد علاقة — نستخدم id)
  const [reviewedBy, disbursedBy] = await Promise.all([
    request.reviewedById
      ? db.user.findUnique({
          where: { id: request.reviewedById },
          select: { fullName: true },
        })
      : Promise.resolve(null),
    request.disbursedById
      ? db.user.findUnique({
          where: { id: request.disbursedById },
          select: { fullName: true },
        })
      : Promise.resolve(null),
  ]);

  // التحقّق من الصلاحية
  const isOwner = request.userId === user.id;
  const isStaff =
    user.role === "TREASURER" ||
    user.role === "ETHICS_COMMITTEE" ||
    user.role === "SUPER_ADMIN" ||
    user.role === "DISTRICT_MOD";
  if (!isOwner && !isStaff) {
    redirect("/community/fund?error=forbidden");
  }

  // جلب 5 أعضاء لجنة النزاهة في الحي
  const committeeMembers = await db.user.findMany({
    where: {
      role: "ETHICS_COMMITTEE",
      districtId: request.districtId,
      status: "ACTIVE",
    },
    select: { id: true, fullName: true },
    take: 5,
  });

  const approvalsByApprover = new Map(
    request.approvals.map((a) => [a.approverId, a])
  );

  const approvals = committeeMembers.map((m) => {
    const a = approvalsByApprover.get(m.id);
    if (!a) {
      return {
        approverName: m.fullName,
        decision: "PENDING" as const,
        decisionLabel: "بانتظار التصويت",
        note: null,
        decidedAtLabel: null,
      };
    }
    const decision = a.decision as ApprovalDecision;
    return {
      approverName: m.fullName,
      decision,
      decisionLabel: APPROVAL_DECISION_LABELS[decision] ?? decision,
      note: a.note,
      decidedAtLabel: a.decidedAt
        ? formatDateTimeArabic(a.decidedAt)
        : null,
    };
  });

  // الخط الزمني للتدقيق
  const auditTrail: RequestClientProps["auditTrail"] = [];
  auditTrail.push({
    step: "1",
    label: "تقديم الطلب",
    dateLabel: formatDateTimeArabic(request.createdAt),
    byName: request.user?.fullName ?? "—",
    note: null,
  });
  if (request.reviewedAt) {
    auditTrail.push({
      step: "2",
      label: request.status === "UNDER_REVIEW" ? "بدء المراجعة" : "المراجعة",
      dateLabel: formatDateTimeArabic(request.reviewedAt),
      byName: reviewedBy?.fullName ?? "—",
      note: request.reviewedNote ?? null,
    });
  }
  if (
    request.status === "APPROVED" ||
    request.status === "DISBURSED" ||
    request.status === "COMPLETED"
  ) {
    auditTrail.push({
      step: "3",
      label: "الاعتماد",
      dateLabel: request.reviewedAt
        ? formatDateTimeArabic(request.reviewedAt)
        : "—",
      byName: reviewedBy?.fullName ?? "—",
      note: request.reviewedNote ?? null,
    });
  }
  if (request.status === "REJECTED") {
    auditTrail.push({
      step: "X",
      label: "الرفض",
      dateLabel: request.reviewedAt
        ? formatDateTimeArabic(request.reviewedAt)
        : "—",
      byName: reviewedBy?.fullName ?? "—",
      note: request.reviewedNote ?? null,
    });
  }
  if (request.disbursedAt) {
    auditTrail.push({
      step: "4",
      label: "الصرف",
      dateLabel: formatDateTimeArabic(request.disbursedAt),
      byName: disbursedBy?.fullName ?? "—",
      note:
        request.disbursementMethod && request.disbursementRef
          ? `${request.disbursementMethod} — ${request.disbursementRef}`
          : (request.disbursementMethod ?? null),
    });
  }
  if (request.completedAt) {
    auditTrail.push({
      step: "5",
      label: "الإغلاق",
      dateLabel: formatDateArabic(request.completedAt),
      byName: "—",
      note: null,
    });
  }

  // المرفقات
  let attachments: string[] = [];
  if (request.attachments) {
    try {
      const parsed = JSON.parse(request.attachments);
      if (Array.isArray(parsed)) {
        attachments = parsed.filter((s) => typeof s === "string");
      }
    } catch {
      // تجاهل
    }
  }

  const typeMeta = FUND_REQUEST_TYPE_LABELS[request.type as FundRequestType];
  const statusMeta = FUND_REQUEST_STATUS_LABELS[request.status as FundRequestStatus];

  const district = await db.district.findFirst({
    where: { id: request.districtId },
    select: { name: true },
  });
  const organization = district?.name ?? "سيدي يوسف بن علي";

  const props: RequestClientProps = {
    id: request.id,
    organization,
    anonymousCode: request.anonymousCode ?? "—",
    typeLabel: typeMeta?.label ?? request.type,
    typeEmoji: typeMeta?.emoji ?? "📋",
    title: request.title,
    description: request.description,
    amountRequested: request.amountRequested,
    amountApproved: request.amountApproved,
    amountDisbursed: request.amountDisbursed,
    location: request.location,
    statusLabel: statusMeta?.label ?? request.status,
    statusStep: statusMeta?.step ?? 0,
    status: request.status as FundRequestStatus,
    requiresEthics: request.requiresEthics,
    attachments,
    approvals,
    auditTrail,
  };

  const approveCount = approvals.filter((a) => a.decision === "APPROVE").length;
  const rejectCount = approvals.filter((a) => a.decision === "REJECT").length;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* رأس الصفحة */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/community/fund"
            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="size-4" />
            <span>صندوق المعروف</span>
          </Link>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-2">
              <span className="text-3xl">{typeMeta?.emoji}</span>
              تتبّع طلب المعروف
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              رمز الطلب المجهول{" "}
              <span className="font-mono font-bold text-primary">
                {request.anonymousCode}
              </span>{" "}
              — {typeMeta?.label}
            </p>
          </div>
          <Badge
            className={
              statusMeta?.color === "rose"
                ? "bg-rose-100 text-rose-800 border-rose-200"
                : statusMeta?.color === "emerald"
                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : statusMeta?.color === "amber"
                ? "bg-amber-100 text-amber-800 border-amber-200"
                : statusMeta?.color === "blue"
                ? "bg-blue-100 text-blue-800 border-blue-200"
                : statusMeta?.color === "slate"
                ? "bg-slate-100 text-slate-800 border-slate-200"
                : "bg-secondary/10 text-secondary border-secondary/30"
            }
          >
            {statusMeta?.label}
          </Badge>
        </div>
      </section>

      <ZelligeDivider variant="diamond" />

      {/* الخط الزمني المرئي */}
      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="size-5 text-primary" />
            مخطّط سير الطلب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowTimeline currentStep={props.statusStep} status={props.status} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* بطاقة الطلب */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="warm-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-xl">{typeMeta?.emoji}</span>
                معلومات الطلب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <DetailCard label="النوع" value={`${typeMeta?.emoji} ${typeMeta?.label}`} />
                <DetailCard label="العنوان" value={request.title} />
                <DetailCard
                  label="المبلغ المطلوب"
                  value={formatMAD(request.amountRequested)}
                />
                <DetailCard
                  label="المبلغ المعتمد"
                  value={
                    request.amountApproved !== null
                      ? formatMAD(request.amountApproved)
                      : "—"
                  }
                />
                <DetailCard
                  label="المبلغ المصروف"
                  value={
                    request.amountDisbursed !== null
                      ? formatMAD(request.amountDisbursed)
                      : "—"
                  }
                />
                <DetailCard
                  label="الموقع"
                  value={request.location ?? "—"}
                  icon={<MapPin className="size-3" />}
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">الوصف</p>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed">
                  {request.description}
                </div>
              </div>

              {attachments.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Paperclip className="size-3" />
                    المرفقات ({attachments.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att, i) => (
                      <a
                        key={i}
                        href={att}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs hover:bg-muted/50 transition-colors"
                      >
                        <Paperclip className="size-3" />
                        مرفق {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {request.requiresEthics && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
                  <p className="text-xs text-amber-800">
                    ⚠️ هذا الطلب يتطلّب موافقة لجنة النزاهة (3 من 5 أعضاء)
                    لأن المبلغ المطلوب ≥ 1000 د.م
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* عمود جانبي: الموافقات */}
        <div className="space-y-4">
          <Card className="warm-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="size-5 text-primary" />
                موافقات اللجنة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">موافق</span>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  {approveCount} / 5
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">رافض</span>
                <Badge className="bg-rose-100 text-rose-800 border-rose-200">
                  {rejectCount} / 5
                </Badge>
              </div>
              <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">مطلوب للقبول</p>
                <p className="text-lg font-bold text-primary">3 / 5 موافقين</p>
              </div>
              <div className="space-y-2 mt-3">
                {approvals.map((a, i) => (
                  <ApprovalRow key={i} {...a} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* زر تنزيل PDF */}
          <Card className="warm-shadow bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-4">
              <FundRequestClient {...props} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* الخط الزمني للتدقيق */}
      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="size-5 text-primary" />
            الخط الزمني للتدقيق
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-y-auto custom-scrollbar rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 sticky top-0">
                <tr>
                  <th className="text-start px-3 py-2.5 font-semibold text-muted-foreground text-xs">#</th>
                  <th className="text-start px-3 py-2.5 font-semibold text-muted-foreground text-xs">المرحلة</th>
                  <th className="text-start px-3 py-2.5 font-semibold text-muted-foreground text-xs">التاريخ</th>
                  <th className="text-start px-3 py-2.5 font-semibold text-muted-foreground text-xs">بواسطة</th>
                  <th className="text-start px-3 py-2.5 font-semibold text-muted-foreground text-xs">ملاحظة</th>
                </tr>
              </thead>
              <tbody>
                {auditTrail.map((a, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2.5 text-xs font-mono">{a.step}</td>
                    <td className="px-3 py-2.5 text-xs font-medium">{a.label}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{a.dateLabel}</td>
                    <td className="px-3 py-2.5 text-xs">{a.byName ?? "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {a.note ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-sm font-bold text-foreground break-words">{value}</p>
    </div>
  );
}

function ApprovalRow({
  approverName,
  decision,
  decisionLabel,
  decidedAtLabel,
  note,
}: {
  approverName: string;
  decision: "APPROVE" | "REJECT" | "ABSTAIN" | "PENDING";
  decisionLabel: string;
  decidedAtLabel: string | null;
  note: string | null;
}) {
  const Icon =
    decision === "APPROVE"
      ? CheckCircle2
      : decision === "REJECT"
      ? XCircle
      : decision === "ABSTAIN"
      ? HelpCircle
      : Clock;
  const color =
    decision === "APPROVE"
      ? "text-emerald-600"
      : decision === "REJECT"
      ? "text-rose-600"
      : decision === "ABSTAIN"
      ? "text-amber-600"
      : "text-muted-foreground";

  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-card p-2.5">
      <Icon className={`size-5 ${color} mt-0.5 shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground truncate">
          {approverName}
        </p>
        <p className={`text-xs ${color}`}>{decisionLabel}</p>
        {decidedAtLabel && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {decidedAtLabel}
          </p>
        )}
        {note && (
          <p className="text-[10px] text-muted-foreground italic mt-0.5">
            "{note}"
          </p>
        )}
      </div>
    </div>
  );
}

// مخطّط سير الطلب (5 خطوات أفقية)
function WorkflowTimeline({
  currentStep,
  status,
}: {
  currentStep: number;
  status: FundRequestStatus;
}) {
  const steps = [
    { step: 1, label: "مُقدَّم", emoji: "📥" },
    { step: 2, label: "قيد المراجعة", emoji: "🔍" },
    { step: 3, label: "موافَق عليه", emoji: "✅" },
    { step: 4, label: "مَصروف", emoji: "💰" },
    { step: 5, label: "مكتمل", emoji: "🎉" },
  ];
  const isRejected = status === "REJECTED";

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between min-w-[36rem] py-2">
        {steps.map((s, i) => {
          const isDone = !isRejected && currentStep >= s.step;
          const isCurrent = !isRejected && currentStep === s.step;
          return (
            <React.Fragment key={s.step}>
              <div className="flex flex-col items-center gap-1 min-w-[5rem]">
                <div
                  className={`flex size-12 items-center justify-center rounded-full text-xl font-bold transition-all ${
                    isCurrent
                      ? "bg-primary text-primary-foreground scale-110 warm-shadow"
                      : isDone
                      ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-300"
                      : "bg-muted text-muted-foreground border-2 border-border"
                  }`}
                >
                  {isDone && !isCurrent ? "✓" : s.emoji}
                </div>
                <p
                  className={`text-xs text-center ${
                    isCurrent
                      ? "font-bold text-primary"
                      : isDone
                      ? "text-emerald-700"
                      : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 rounded-full ${
                    !isRejected && currentStep > s.step
                      ? "bg-emerald-400"
                      : "bg-border"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {isRejected && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border-2 border-rose-200 bg-rose-50 p-3 text-rose-800">
          <XCircle className="size-5" />
          <p className="font-bold">تم رفض هذا الطلب</p>
        </div>
      )}
    </div>
  );
}
