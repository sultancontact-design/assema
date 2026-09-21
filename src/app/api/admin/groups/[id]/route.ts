// ===================================================================
//  API: /api/admin/groups/[id]
//  PATCH — تحديث مجموعة (group.edit)
//  DELETE — حذف ناعم للمجموعة (group.delete) — لا يُحذف الافتراضي
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/roles";

export const dynamic = "force-dynamic";

const ALLOWED_CATEGORIES = ["عائلي", "تنمية", "تعليم", "تراث", "عام"];

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
    if (!hasPermission(user.role, "group.edit")) {
      return NextResponse.json(
        { error: "هذا الإجراء يتطلب صلاحية تعديل المجموعات" },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      name?: string;
      description?: string | null;
      category?: string;
      isPrivate?: boolean;
      maxMembers?: number | null;
      isActive?: boolean;
    } | null;

    if (!body) {
      return NextResponse.json({ error: "الجسم مطلوب" }, { status: 400 });
    }

    const group = await db.group.findUnique({
      where: { id },
      select: { id: true, districtId: true, deletedAt: true },
    });
    if (!group || group.deletedAt) {
      return NextResponse.json({ error: "المجموعة غير موجودة" }, { status: 404 });
    }
    if (group.districtId !== user.districtId) {
      return NextResponse.json(
        { error: "لا تملك صلاحية الوصول لهذه المجموعة" },
        { status: 403 }
      );
    }

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json(
          { error: "اسم المجموعة لا يمكن أن يكون فارغاً" },
          { status: 400 }
        );
      }
      data.name = name;
    }
    if (body.description !== undefined) {
      data.description = body.description?.trim() || null;
    }
    if (body.category !== undefined) {
      if (!ALLOWED_CATEGORIES.includes(body.category)) {
        return NextResponse.json({ error: "فئة غير صالحة" }, { status: 400 });
      }
      data.category = body.category;
    }
    if (body.isPrivate !== undefined) {
      data.isPrivate = !!body.isPrivate;
    }
    if (body.maxMembers !== undefined) {
      data.maxMembers =
        typeof body.maxMembers === "number" && body.maxMembers > 0
          ? Math.floor(body.maxMembers)
          : null;
    }
    if (body.maxMembers !== undefined) {
      data.maxMembers =
        typeof body.maxMembers === "number" && body.maxMembers > 0
          ? Math.floor(body.maxMembers)
          : null;
    }
    if (body.isActive !== undefined) {
      data.isActive = !!body.isActive;
    }

    const updated = await db.group.update({
      where: { id },
      data,
      select: { id: true, name: true },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "group.updated",
        entity: "Group",
        entityId: id,
        severity: "info",
      },
    });

    return NextResponse.json({ success: true, group: updated });
  } catch (err) {
    console.error("[PATCH /api/admin/groups/[id]]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث المجموعة" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }
    if (!hasPermission(user.role, "group.delete")) {
      return NextResponse.json(
        { error: "هذا الإجراء يتطلب صلاحية حذف المجموعات" },
        { status: 403 }
      );
    }

    const group = await db.group.findUnique({
      where: { id },
      select: { id: true, districtId: true, deletedAt: true, isDefault: true, name: true },
    });
    if (!group || group.deletedAt) {
      return NextResponse.json({ error: "المجموعة غير موجودة" }, { status: 404 });
    }
    if (group.districtId !== user.districtId) {
      return NextResponse.json(
        { error: "لا تملك صلاحية حذف هذه المجموعة" },
        { status: 403 }
      );
    }
    if (group.isDefault) {
      return NextResponse.json(
        { error: "لا يمكن حذف المجموعات الافتراضية — أخفها بدلاً من ذلك" },
        { status: 400 }
      );
    }

    await db.group.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "group.deleted",
        entity: "Group",
        entityId: id,
        severity: "warning",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/groups/[id]]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف المجموعة" },
      { status: 500 }
    );
  }
}
