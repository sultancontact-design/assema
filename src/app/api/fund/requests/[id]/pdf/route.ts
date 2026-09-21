// ===================================================================
//  GET /api/fund/requests/[id]/pdf — توليد PDF تتبّع طلب معروف
//  - يتسلّم id كـparam
//  - يتطلّب المصادقة (المالك أو TREASURER/ETHICS_COMMITTEE/SUPER_ADMIN)
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  FundRequestPdfDocument,
  type FundRequestPdfData,
  type RequestApprovalRow,
  type RequestAuditEntry,
} from "@/lib/pdf/fund-request-pdf";
import {
  FUND_REQUEST_TYPE_LABELS,
  FUND_REQUEST_STATUS_LABELS,
  APPROVAL_DECISION_LABELS,
  formatDateTimeArabic,
  formatDateArabic,
} from "@/lib/constants";
import type {
  FundRequestType,
  FundRequestStatus,
  ApprovalDecision,
} from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
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
        },
      },
    });

    if (!request) {
      return NextResponse.json(
        { error: "الطلب غير موجود" },
        { status: 404 }
      );
    }

    // جلب أسماء المراجع والمنفق (لا توجد علاقة مباشرة — نستخدم id)
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
      return NextResponse.json(
        { error: "غير مصرّح لك بعرض هذا الطلب" },
        { status: 403 }
      );
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

    const approvals: RequestApprovalRow[] = committeeMembers.map((m) => {
      const a = approvalsByApprover.get(m.id);
      if (!a) {
        return {
          approverName: m.fullName,
          decision: "PENDING",
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
    const auditTrail: RequestAuditEntry[] = [];
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
        label: "بدء المراجعة",
        dateLabel: formatDateTimeArabic(request.reviewedAt),
        byName: reviewedBy?.fullName ?? "—",
        note: request.reviewedNote ?? null,
      });
    }
    if (request.status === "APPROVED" || request.status === "DISBURSED" || request.status === "COMPLETED") {
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
            : request.disbursementMethod ?? null,
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

    const typeMeta = FUND_REQUEST_TYPE_LABELS[request.type as FundRequestType];
    const statusMeta = FUND_REQUEST_STATUS_LABELS[request.status as FundRequestStatus];

    const district = await db.district.findFirst({
      where: { id: request.districtId },
      select: { name: true },
    });
    const organization = district?.name ?? "سيدي يوسف بن علي";

    const data: FundRequestPdfData = {
      organization,
      generatedAt: formatDateTimeArabic(new Date()),
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
      requiresEthics: request.requiresEthics,
      approvals,
      auditTrail,
    };

    const pdfBuffer = await renderToBuffer(
      React.createElement(FundRequestPdfDocument, { data })
    );

    const filename = `request-${request.anonymousCode ?? id}.pdf`;
    const asciiFilename = `request-${id}.pdf`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdfBuffer.length),
        "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[GET /api/fund/requests/[id]/pdf]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء توليد تقرير الطلب" },
      { status: 500 }
    );
  }
}
