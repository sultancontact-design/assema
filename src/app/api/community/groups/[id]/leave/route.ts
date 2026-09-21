// ===================================================================
//  API: /api/community/groups/[id]/leave
//  POST — مغادرة المستخدم الحالي لمجموعة
//  - يتطلّب مصادقة
//  - يتحقّق من وجود العضوية (404 إن لم توجد)
//  - يمنع رئيس المجموعة من المغادرة (400 — يجب نقل القيادة أولاً)
//  - يحذف العضوية + سجل تدقيق
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1) المصادقة
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول لمغادرة مجموعة" },
        { status: 401 }
      );
    }

    // 2) التحقّق من وجود المجموعة
    const group = await db.group.findUnique({
      where: { id },
      select: { id: true, name: true, districtId: true, deletedAt: true },
    });

    if (!group || group.deletedAt) {
      return NextResponse.json(
        { error: "المجموعة غير موجودة" },
        { status: 404 }
      );
    }

    // 3) نطاق الحي
    if (group.districtId !== user.districtId) {
      return NextResponse.json(
        { error: "لا يمكنك مغادرة مجموعة خارج حيّك" },
        { status: 403 }
      );
    }

    // 4) التحقّق من وجود العضوية
    const membership = await db.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: id, userId: user.id },
      },
      select: { id: true, role: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "أنت لست عضواً في هذه المجموعة" },
        { status: 404 }
      );
    }

    // 5) منع رئيس المجموعة من المغادرة
    if (membership.role === "leader") {
      return NextResponse.json(
        {
          error: "لا يمكن لرئيس المجموعة مغادرتها، نقل القيادة أولاً",
        },
        { status: 400 }
      );
    }

    // 6) حذف العضوية
    await db.groupMember.delete({
      where: { id: membership.id },
    });

    // 7) سجل تدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "group.member.left",
        entity: "Group",
        entityId: id,
        metadata: JSON.stringify({
          groupName: group.name,
        }),
        severity: "info",
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/community/groups/[id]/leave]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء مغادرة المجموعة" },
      { status: 500 }
    );
  }
}
