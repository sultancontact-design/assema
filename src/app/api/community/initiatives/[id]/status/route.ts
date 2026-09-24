// ===================================================================
//  API: /api/community/initiatives/[id]/status
//  PATCH — تغيير حالة المبادرة (SUPER_ADMIN فقط)
//  Query: ?status=<new status>
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_STATUSES = [
  "proposed",
  "under_review",
  "approved",
  "rejected",
  "in_progress",
  "completed",
];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "DISTRICT_MOD") {
      return NextResponse.json(
        { error: "ليس لديك صلاحية لتغيير حالة المبادرة" },
        { status: 403 }
      );
    }

    const { id: initiativeId } = await params;
    if (!initiativeId) {
      return NextResponse.json(
        { error: "معرّف المبادرة مطلوب" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const newStatus =
      typeof body.status === "string" && VALID_STATUSES.includes(body.status)
        ? body.status
        : null;

    if (!newStatus) {
      return NextResponse.json(
        { error: "حالة غير صالحة" },
        { status: 400 }
      );
    }

    const initiative = await db.initiative.findUnique({
      where: { id: initiativeId },
      select: { id: true, status: true },
    });
    if (!initiative) {
      return NextResponse.json(
        { error: "المبادرة غير موجودة" },
        { status: 404 }
      );
    }

    const updated = await db.initiative.update({
      where: { id: initiativeId },
      data: { status: newStatus },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      initiative: {
        ...updated,
        updatedAt:
          updated.updatedAt instanceof Date
            ? updated.updatedAt.toISOString()
            : updated.updatedAt,
      },
    });
  } catch (err) {
    console.error("[PATCH /api/community/initiatives/[id]/status]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث حالة المبادرة" },
      { status: 500 }
    );
  }
}
