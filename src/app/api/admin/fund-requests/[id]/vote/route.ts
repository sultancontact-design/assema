// ===================================================================
//  API: /api/admin/fund-requests/[id]/vote
//  POST — تصويت لجنة النزاهة (ETHICS_COMMITTEE أو SUPER_ADMIN)
//  الجسم: { decision: "APPROVE" | "REJECT" | "ABSTAIN", note?: string }
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLE_LABELS, ETHICS_COMMITTEE_THRESHOLD } from "@/lib/constants";
import { sendMail } from "@/lib/mailer";
import * as FundRequestStatusEmail from "@/emails/fund-request-status";
import type { FundRequestStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SUPER_ADMIN", "ETHICS_COMMITTEE"] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1) المصادقة
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(user.role as never)) {
      return NextResponse.json(
        {
          error: `هذا الإجراء يتطلب أحد الأدوار: ${ALLOWED_ROLES.map(
            (r) => ROLE_LABELS[r].label
          ).join("، ")}`,
        },
        { status: 403 }
      );
    }

    // 2) الجسم
    const body = (await request.json().catch(() => null)) as {
      decision?: string;
      note?: string;
    } | null;
    if (!body?.decision) {
      return NextResponse.json(
        { error: "القرار مطلوب" },
        { status: 400 }
      );
    }
    const decision = body.decision;
    if (!["APPROVE", "REJECT", "ABSTAIN"].includes(decision)) {
      return NextResponse.json(
        { error: "القرار يجب أن يكون APPROVE أو REJECT أو ABSTAIN" },
        { status: 400 }
      );
    }

    // 3) العثور على الطلب
    const fundRequest = await db.fundRequest.findUnique({
      where: { id },
      select: {
        id: true,
        districtId: true,
        userId: true,
        status: true,
        requiresEthics: true,
        amountRequested: true,
        anonymousCode: true,
      },
    });
    if (!fundRequest) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    if (fundRequest.districtId !== user.districtId) {
      return NextResponse.json(
        { error: "لا تملك صلاحية التصويت على هذا الطلب" },
        { status: 403 }
      );
    }
    if (!fundRequest.requiresEthics && fundRequest.amountRequested <= ETHICS_COMMITTEE_THRESHOLD) {
      return NextResponse.json(
        { error: "هذا الطلب لا يتطلّب تصويت لجنة النزاهة" },
        { status: 400 }
      );
    }
    if (fundRequest.status !== "SUBMITTED" && fundRequest.status !== "UNDER_REVIEW") {
      return NextResponse.json(
        { error: "الطلب لم يعد قابلاً للتصويت" },
        { status: 400 }
      );
    }

    // 4) منع التصويت المزدوج
    const existing = await db.fundRequestApproval.findUnique({
      where: {
        requestId_approverId: {
          requestId: id,
          approverId: user.id,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "لقد صوّتّ بالفعل على هذا الطلب" },
        { status: 400 }
      );
    }

    // 5) إنشاء التصويت
    const approval = await db.fundRequestApproval.create({
      data: {
        requestId: id,
        approverId: user.id,
        decision: decision as "APPROVE" | "REJECT" | "ABSTAIN",
        note: body.note?.trim() ?? null,
      },
    });

    // 6) عدّ الموافقات
    const approvalsCount = await db.fundRequestApproval.count({
      where: { requestId: id },
    });
    const approveCount = await db.fundRequestApproval.count({
      where: { requestId: id, decision: "APPROVE" },
    });

    // 7) سجل تدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "fund.request.vote",
        entity: "FundRequestApproval",
        entityId: approval.id,
        severity: "info",
      },
    });

    return NextResponse.json(
      {
        success: true,
        approval,
        approvalsCount,
        approveCount,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/fund-requests/[id]/vote]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء التصويت" },
      { status: 500 }
    );
  }
}

// ===================================================================
//  PATCH /api/admin/fund-requests/[id]/vote — تغيير حالة الطلب (موافقة/رفض)
//  - يتطلّب SUPER_ADMIN أو ETHICS_COMMITTEE
//  - الجسم: { status: "APPROVED" | "REJECTED", note?: string }
//  - عند تغيير الحالة، يُرسِل FundRequestStatusEmail لصاحب الطلب
// ===================================================================

const PATCH_ALLOWED_STATUSES: FundRequestStatus[] = ["APPROVED", "REJECTED"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1) المصادقة + الدور
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(user.role as never)) {
      return NextResponse.json(
        {
          error: `هذا الإجراء يتطلب أحد الأدوار: ${ALLOWED_ROLES.map(
            (r) => ROLE_LABELS[r].label
          ).join("، ")}`,
        },
        { status: 403 }
      );
    }

    // 2) الجسم
    const body = (await request.json().catch(() => null)) as
      | { status?: string; note?: string }
      | null;

    if (!body?.status) {
      return NextResponse.json({ error: "الحالة الجديدة مطلوبة" }, { status: 400 });
    }

    const targetStatus = body.status as FundRequestStatus;
    if (!PATCH_ALLOWED_STATUSES.includes(targetStatus)) {
      return NextResponse.json(
        {
          error: `الحالة يجب أن تكون: ${PATCH_ALLOWED_STATUSES.join(" أو ")}`,
        },
        { status: 400 }
      );
    }

    // 3) جلب الطلب
    const fundRequest = await db.fundRequest.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        title: true,
        anonymousCode: true,
        amountRequested: true,
        status: true,
        districtId: true,
      },
    });

    if (!fundRequest) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    if (fundRequest.districtId !== user.districtId) {
      return NextResponse.json(
        { error: "لا تملك صلاحية تعديل هذا الطلب" },
        { status: 403 }
      );
    }

    if (fundRequest.status === targetStatus) {
      return NextResponse.json(
        { error: "الطلب في هذه الحالة مسبقاً" },
        { status: 400 }
      );
    }

    // 4) تحديث الحالة
    const updated = await db.fundRequest.update({
      where: { id },
      data: {
        status: targetStatus,
        reviewedById: user.id,
        reviewedAt: new Date(),
        reviewedNote: body.note?.trim() ?? null,
      },
      select: { id: true, status: true },
    });

    // 5) سجلّ تدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "fund.request.status_changed",
        entity: "FundRequest",
        entityId: id,
        metadata: JSON.stringify({
          oldStatus: fundRequest.status,
          newStatus: targetStatus,
          anonymousCode: fundRequest.anonymousCode,
          note: body.note?.trim() ?? null,
        }),
        severity: targetStatus === "APPROVED" ? "info" : "warning",
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    // 6) إشعار للمستخدم
    try {
      await db.notification.create({
        data: {
          userId: fundRequest.userId,
          type: "FUND_REQUEST",
          title:
            targetStatus === "APPROVED"
              ? "تمّت الموافقة على طلبك"
              : "تعذّرت الموافقة على طلبك",
          message: `طلبك برمز ${fundRequest.anonymousCode} — الحالة: ${
            targetStatus === "APPROVED" ? "موافَق عليه" : "مرفوض"
          }`,
          link: "/community/fund",
          metadata: JSON.stringify({ requestId: id }),
        },
      });
    } catch (notifErr) {
      console.error("[PATCH vote] notification failed:", notifErr);
    }

    // 7) إرسال بريد تحديث الحالة (غير حرج)
    try {
      const dbUser = await db.user.findUnique({
        where: { id: fundRequest.userId },
        select: { email: true, fullName: true },
      });
      if (dbUser?.email) {
        const params = {
          userName: dbUser.fullName || "الفاضل",
          requestTitle: fundRequest.title,
          anonymousCode: fundRequest.anonymousCode ?? "—",
          newStatus: targetStatus,
          amount: fundRequest.amountRequested,
          note: body.note?.trim() ?? null,
        };
        await sendMail({
          to: dbUser.email,
          subject: FundRequestStatusEmail.subject(params),
          html: FundRequestStatusEmail.html(params),
        });
      }
    } catch (mailErr) {
      console.error("[PATCH vote] status email failed:", mailErr);
    }

    return NextResponse.json({
      success: true,
      request: updated,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/fund-requests/[id]/vote]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث حالة الطلب" },
      { status: 500 }
    );
  }
}
