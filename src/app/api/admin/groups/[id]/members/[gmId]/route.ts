// ===================================================================
//  API: /api/admin/groups/[id]/members/[gmId]
//  DELETE — إزالة عضو من مجموعة (group.member.remove)
//  - gmId = GroupMember.id
//  - لا يمكن إزالة الرئيس (group.leader)
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; gmId: string }> }
) {
  try {
    const { id, gmId } = await params;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }
    if (!hasPermission(user.role, "group.member.remove")) {
      return NextResponse.json(
        { error: "هذا الإجراء يتطلب صلاحية إزالة الأعضاء" },
        { status: 403 }
      );
    }

    // العثور على العضوية + التحقق من الحي
    const membership = await db.groupMember.findUnique({
      where: { id: gmId },
      select: {
        id: true,
        groupId: true,
        userId: true,
        role: true,
        group: { select: { districtId: true, deletedAt: true, name: true } },
      },
    });
    if (!membership) {
      return NextResponse.json({ error: "العضوية غير موجودة" }, { status: 404 });
    }
    // التحقق من أن العضوية تنتمي للمجموعة الصحيحة
    if (membership.groupId !== id) {
      return NextResponse.json(
        { error: "العضوية لا تنتمي لهذه المجموعة" },
        { status: 400 }
      );
    }
    if (membership.group.deletedAt) {
      return NextResponse.json({ error: "المجموعة محذوفة" }, { status: 400 });
    }
    if (membership.group.districtId !== user.districtId) {
      return NextResponse.json(
        { error: "لا تملك صلاحية إدارة هذه المجموعة" },
        { status: 403 }
      );
    }
    // منع إزالة الرئيس
    if (membership.role === "leader") {
      return NextResponse.json(
        { error: "لا يمكن إزالة رئيس المجموعة — انقل القيادة أولاً" },
        { status: 400 }
      );
    }

    await db.groupMember.delete({
      where: { id: gmId },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "group.member.removed",
        entity: "GroupMember",
        entityId: gmId,
        severity: "info",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/groups/[id]/members/[gmId]]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إزالة العضو" },
      { status: 500 }
    );
  }
}
