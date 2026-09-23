// ===================================================================
//  PATCH /api/admin/fund-requests/[id]/status
//  يسمح للأمين بتحديث حالة الطلب وفق state machine
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import { canTransition, needsDisbursement } from "@/lib/fund-state-machine";
import type { FundRequestStatus } from "@prisma/client";

interface StatusUpdateBody {
  status: FundRequestStatus;
  note?: string;
  // تفاصيل الصرف (للانتقال إلى DISBURSED)
  disbursementMethod?: string;
  disbursementRef?: string;
  disbursementNote?: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  if (!hasPermission(user.role, "fund.request.review")) {
    return NextResponse.json(
      { error: "هذا الإجراء يتطلب دور أمين الصندوق أو مشرف عام" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = (await request.json()) as StatusUpdateBody;
  const { status: newStatus, note, disbursementMethod, disbursementRef, disbursementNote } = body;

  if (!newStatus) {
    return NextResponse.json({ error: "الحالة الجديدة مطلوبة" }, { status: 400 });
  }

  // جلب الطلب الحالي
  const existing = await db.fundRequest.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      amountRequested: true,
      amountApproved: true,
      amountDisbursed: true,
      userId: true,
      familyId: true,
      districtId: true,
      title: true,
      anonymousCode: true,
      type: true,
      requiresEthics: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }

  // التحقق من الانتقال المسموح
  if (!canTransition(existing.status, newStatus, user.role, existing.amountRequested)) {
    return NextResponse.json(
      {
        error: `انتقال غير مسموح من ${existing.status} إلى ${newStatus}`,
      },
      { status: 400 }
    );
  }

  // إذا يتطلّب تفاصيل الصرف
  const requiresDisbursement = needsDisbursement(existing.status, newStatus);
  if (requiresDisbursement && !disbursementMethod) {
    return NextResponse.json(
      { error: "طريقة الصرف مطلوبة لهذا الانتقال" },
      { status: 400 }
    );
  }

  // بناء بيانات التحديث
  const updateData: Record<string, unknown> = {
    status: newStatus,
    reviewedById: user.id,
    reviewedAt: new Date(),
    reviewedNote: note ?? existing.title, // نحفظ الملاحظة
  };

  if (newStatus === "DISBURSED") {
    updateData.disbursedAt = new Date();
    updateData.disbursedById = user.id;
    updateData.disbursementMethod = disbursementMethod ?? "BANK_TRANSFER";
    updateData.disbursementRef = disbursementRef ?? null;
    updateData.amountDisbursed = existing.amountApproved ?? existing.amountRequested;
  }

  if (newStatus === "COMPLETED") {
    updateData.completedAt = new Date();
  }

  // تنفيذ التحديث
  const updated = await db.fundRequest.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      status: true,
      reviewedAt: true,
      disbursedAt: true,
      amountDisbursed: true,
      disbursementMethod: true,
    },
  });

  // Audit Log
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: `fund.request.status_changed`,
      entity: "FundRequest",
      entityId: id,
      metadata: JSON.stringify({
        from: existing.status,
        to: newStatus,
        anonymousCode: existing.anonymousCode,
        amount: existing.amountRequested,
        note: note ?? null,
        disbursementMethod: disbursementMethod ?? null,
      }),
      severity: newStatus === "DISBURSED" || newStatus === "COMPLETED" ? "critical" : "info",
    },
  });

  // إشعار للطالب
  await db.notification.create({
    data: {
      userId: existing.userId,
      type: "FUND_REQUEST",
      title: `تحديث طلبك ${existing.anonymousCode}`,
      message: `حالة طلبك "${existing.title}" تغيّرت إلى: ${newStatus}`,
      link: `/community/fund/requests/${id}`,
    },
  });

  // إرسال بريد (graceful إذا SMTP معطّل)
  try {
    const { sendMail } = await import("@/lib/mailer");
    const fundRequestEmailModule = await import("@/emails/fund-request-status");
    const userOwner = await db.user.findUnique({
      where: { id: existing.userId },
      select: { email: true, fullName: true },
    });
    if (userOwner) {
      const emailHtml = fundRequestEmailModule.html({
        userName: userOwner.fullName,
        requestTitle: existing.title,
        anonymousCode: existing.anonymousCode ?? "",
        newStatus,
        amount: existing.amountRequested,
        note,
      });
      await sendMail({
        to: userOwner.email,
        subject: fundRequestEmailModule.subject({
          userName: userOwner.fullName,
          requestTitle: existing.title,
          anonymousCode: existing.anonymousCode ?? "",
          newStatus,
          amount: existing.amountRequested,
          note,
        }),
        html: emailHtml,
      });
    }
  } catch {
    // فشل البريد لا يمنع العملية الأساسية
  }

  return NextResponse.json({
    success: true,
    request: updated,
    message: `تم تحديث الحالة إلى ${newStatus}`,
  });
}
