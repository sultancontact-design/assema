// ===================================================================
//  API: /api/admin/complaints/[id]/resolve
//  POST — معالجة شكوى: تحديث الحالة + قرار + تعيين المعالِج (complaint.resolve)
//  الجسم: { status: "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "REJECTED", resolution?: string }
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/roles";
import type { ComplaintStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const ALLOWED_NEXT_STATUSES: ComplaintStatus[] = [
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "REJECTED",
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1) المصادقة + الصلاحية
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }
    if (!hasPermission(user.role, "complaint.resolve")) {
      return NextResponse.json(
        {
          error: "هذا الإجراء يتطلب صلاحية معالجة الشكاوى (مشرف حي أو مشرف عام)",
        },
        { status: 403 }
      );
    }

    // 2) الجسم
    const body = (await request.json().catch(() => null)) as {
      status?: string;
      resolution?: string | null;
    } | null;
    if (!body?.status) {
      return NextResponse.json({ error: "الحالة مطلوبة" }, { status: 400 });
    }
    if (!ALLOWED_NEXT_STATUSES.includes(body.status as ComplaintStatus)) {
      return NextResponse.json(
        {
          error:
            "الحالة يجب أن تكون: قيد المعالجة، تم حلّها، مغلقة، أو مرفوضة",
        },
        { status: 400 }
      );
    }
    const newStatus = body.status as ComplaintStatus;

    // الحالات النهائية (RESOLVED / REJECTED) تتطلب قراراً
    if (
      (newStatus === "RESOLVED" || newStatus === "REJECTED") &&
      !body.resolution?.trim()
    ) {
      return NextResponse.json(
        { error: "قرار المعالجة مطلوب عند الحلّ أو الرفض" },
        { status: 400 }
      );
    }

    // 3) العثور على الشكوى
    const complaint = await db.complaint.findUnique({
      where: { id },
      select: {
        id: true,
        districtId: true,
        status: true,
        subject: true,
        filedById: true,
        resolution: true,
      },
    });
    if (!complaint) {
      return NextResponse.json({ error: "الشكوى غير موجودة" }, { status: 404 });
    }
    if (complaint.districtId !== user.districtId) {
      return NextResponse.json(
        { error: "لا تملك صلاحية معالجة هذه الشكوى" },
        { status: 403 }
      );
    }

    // 4) الحساب: التاريخ المتعلّق بالقرار
    const isResolved =
      newStatus === "RESOLVED" || newStatus === "CLOSED" || newStatus === "REJECTED";
    const resolvedAt = isResolved ? new Date() : null;

    // 5) التحديث
    const updated = await db.complaint.update({
      where: { id },
      data: {
        status: newStatus,
        resolution: body.resolution?.trim() || complaint.resolution,
        resolvedAt,
        handledById: user.id,
      },
      select: {
        id: true,
        status: true,
        resolution: true,
        resolvedAt: true,
      },
    });

    // 6) إشعار صاحب الشكوى (إن لم تكن مجهولة)
    if (complaint.filedById) {
      await db.notification.create({
        data: {
          userId: complaint.filedById,
          type: "COMPLAINT",
          title: "تحديث بخصوص شكواك",
          message: `تم تحديث حالة شكواك «${complaint.subject}» إلى: ${
            newStatus === "IN_PROGRESS"
              ? "قيد المعالجة"
              : newStatus === "RESOLVED"
                ? "تم حلّها"
                : newStatus === "CLOSED"
                  ? "مغلقة"
                  : "مرفوضة"
          }.`,
        },
      });
    }

    // 7) سجل تدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "complaint.resolved",
        entity: "Complaint",
        entityId: id,
        severity: newStatus === "REJECTED" ? "warning" : "info",
      },
    });

    return NextResponse.json({ success: true, complaint: updated });
  } catch (err) {
    console.error("[POST /api/admin/complaints/[id]/resolve]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة الشكوى" },
      { status: 500 }
    );
  }
}
