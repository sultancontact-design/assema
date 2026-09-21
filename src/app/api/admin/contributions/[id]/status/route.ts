// ===================================================================
//  API: /api/admin/contributions/[id]/status
//  PATCH — تأكيد أو رفض مساهمة (TREASURER أو SUPER_ADMIN)
//  الجسم: { status: "CONFIRMED" | "REJECTED", note?: string }
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SUPER_ADMIN", "TREASURER"] as const;

export async function PATCH(
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
      status?: string;
      note?: string;
    } | null;
    if (!body?.status) {
      return NextResponse.json(
        { error: "الحالة الجديدة مطلوبة" },
        { status: 400 }
      );
    }
    const newStatus = body.status;
    if (!["CONFIRMED", "REJECTED"].includes(newStatus)) {
      return NextResponse.json(
        { error: "الحالة يجب أن تكون CONFIRMED أو REJECTED" },
        { status: 400 }
      );
    }

    // 3) العثور على المساهمة
    const contribution = await db.contribution.findUnique({
      where: { id },
      select: { id: true, userId: true, districtId: true, status: true, receiptNumber: true },
    });
    if (!contribution) {
      return NextResponse.json(
        { error: "المساهمة غير موجودة" },
        { status: 404 }
      );
    }
    if (contribution.districtId !== user.districtId) {
      return NextResponse.json(
        { error: "لا تملك صلاحية الوصول لهذه المساهمة" },
        { status: 403 }
      );
    }
    if (contribution.status !== "PENDING") {
      return NextResponse.json(
        { error: "المساهمة ليست بانتظار التأكيد" },
        { status: 400 }
      );
    }

    // 4) التحديث
    const updated = await db.contribution.update({
      where: { id },
      data: {
        status: newStatus as "CONFIRMED" | "REJECTED",
        confirmedById: user.id,
        confirmedAt: new Date(),
        note: body.note?.trim() ?? null,
      },
    });

    // 5) إشعار صاحب المساهمة
    await db.notification.create({
      data: {
        userId: contribution.userId,
        type: "CONTRIBUTION",
        title:
          newStatus === "CONFIRMED"
            ? "تم تأكيد مساهمتك"
            : "تم رفض مساهمتك",
        message:
          newStatus === "CONFIRMED"
            ? `تم تأكيد مساهمتك برقم ${updated.receiptNumber ?? "—"}`
            : `تم رفض مساهمتك برقم ${updated.receiptNumber ?? "—"}. تواصل مع أمين الصندوق.`,
        link: "/community/fund",
      },
    });

    // 6) سجل تدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action:
          newStatus === "CONFIRMED"
            ? "fund.contribution.confirmed"
            : "fund.contribution.rejected",
        entity: "Contribution",
        entityId: id,
        severity: "info",
      },
    });

    return NextResponse.json({
      success: true,
      contribution: { id: updated.id, status: updated.status },
    });
  } catch (err) {
    console.error("[PATCH /api/admin/contributions/[id]/status]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث المساهمة" },
      { status: 500 }
    );
  }
}
