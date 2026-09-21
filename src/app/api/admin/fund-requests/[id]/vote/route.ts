// ===================================================================
//  API: /api/admin/fund-requests/[id]/vote
//  POST — تصويت لجنة النزاهة (ETHICS_COMMITTEE أو SUPER_ADMIN)
//  الجسم: { decision: "APPROVE" | "REJECT" | "ABSTAIN", note?: string }
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLE_LABELS, ETHICS_COMMITTEE_THRESHOLD } from "@/lib/constants";

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
