// ===================================================================
//  API: /api/admin/families/[id]
//  PATCH — تحديث بيانات عائلة (family.edit)
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/roles";

export const dynamic = "force-dynamic";

const ALLOWED_ECONOMIC_STATUSES = ["ضعيف", "متوسط", "جيد"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }
    if (!hasPermission(user.role, "family.edit")) {
      return NextResponse.json(
        {
          error: "هذا الإجراء يتطلب صلاحية تعديل العائلات (مشرف حي أو مشرف عام)",
        },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      familyName?: string;
      address?: string | null;
      economicStatus?: string;
      memberCount?: number;
      notes?: string | null;
      isActive?: boolean;
    } | null;

    if (!body) {
      return NextResponse.json({ error: "الجسم مطلوب" }, { status: 400 });
    }

    const family = await db.family.findUnique({
      where: { id },
      select: { id: true, districtId: true, deletedAt: true },
    });
    if (!family || family.deletedAt) {
      return NextResponse.json({ error: "العائلة غير موجودة" }, { status: 404 });
    }
    if (family.districtId !== user.districtId) {
      return NextResponse.json(
        { error: "لا تملك صلاحية الوصول لهذه العائلة" },
        { status: 403 }
      );
    }

    const data: Record<string, unknown> = {};
    if (body.familyName !== undefined) {
      const name = body.familyName.trim();
      if (!name) {
        return NextResponse.json(
          { error: "اسم العائلة لا يمكن أن يكون فارغاً" },
          { status: 400 }
        );
      }
      data.familyName = name;
    }
    if (body.address !== undefined) {
      data.address = body.address?.trim() || null;
    }
    if (body.economicStatus !== undefined) {
      if (!ALLOWED_ECONOMIC_STATUSES.includes(body.economicStatus)) {
        return NextResponse.json(
          { error: "الحالة الاقتصادية يجب أن تكون: ضعيف، متوسط، أو جيد" },
          { status: 400 }
        );
      }
      data.economicStatus = body.economicStatus;
    }
    if (body.memberCount !== undefined) {
      const mc = Math.max(1, Math.floor(Number(body.memberCount) || 1));
      data.memberCount = mc;
    }
    if (body.notes !== undefined) {
      data.notes = body.notes?.trim() || null;
    }
    if (body.isActive !== undefined) {
      data.isActive = !!body.isActive;
    }

    const updated = await db.family.update({
      where: { id },
      data,
      select: { id: true, familyName: true },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "family.updated",
        entity: "Family",
        entityId: id,
        severity: "info",
      },
    });

    return NextResponse.json({ success: true, family: updated });
  } catch (err) {
    console.error("[PATCH /api/admin/families/[id]]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث العائلة" },
      { status: 500 }
    );
  }
}
