// ===================================================================
//  API: /api/admin/groups/[id]/leader
//  PATCH — تعيين رئيس جديد للمجموعة (group.member.add / group.member.approve)
//  الجسم: { userId: string }
//  — إذا كان العضو موجوداً، يُرقّى إلى leader؛ وإلا يُضاف كـleader
//  — الرئيس الحالي يُنزَل إلى member
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/roles";

export const dynamic = "force-dynamic";

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
    if (!hasPermission(user.role, "group.member.add")) {
      return NextResponse.json(
        { error: "هذا الإجراء يتطلب صلاحية إدارة أعضاء المجموعات" },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      userId?: string;
    } | null;
    if (!body?.userId) {
      return NextResponse.json({ error: "المستخدم مطلوب" }, { status: 400 });
    }
    const newLeaderId = body.userId;

    // العثور على المجموعة
    const group = await db.group.findUnique({
      where: { id },
      select: {
        id: true,
        districtId: true,
        deletedAt: true,
        name: true,
      },
    });
    if (!group || group.deletedAt) {
      return NextResponse.json({ error: "المجموعة غير موجودة" }, { status: 404 });
    }
    if (group.districtId !== user.districtId) {
      return NextResponse.json(
        { error: "لا تملك صلاحية إدارة هذه المجموعة" },
        { status: 403 }
      );
    }

    // التحقق من المرشّح
    const candidate = await db.user.findUnique({
      where: { id: newLeaderId },
      select: { id: true, districtId: true, deletedAt: true, fullName: true },
    });
    if (!candidate || candidate.deletedAt) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }
    if (candidate.districtId !== user.districtId) {
      return NextResponse.json(
        { error: "لا يمكن تعيين مستخدم من حي آخر" },
        { status: 400 }
      );
    }

    // المعاملة: تنزيل الرئيس الحالي + ترقية الجديد
    await db.$transaction([
      // تنزيل أي رئيس حالي
      db.groupMember.updateMany({
        where: { groupId: id, role: "leader" },
        data: { role: "member" },
      }),
      // ترقية أو إنشاء العضوية الجديدة كـleader
      db.groupMember.upsert({
        where: {
          groupId_userId: { groupId: id, userId: newLeaderId },
        },
        update: { role: "leader", isApproved: true },
        create: {
          groupId: id,
          userId: newLeaderId,
          role: "leader",
          isApproved: true,
        },
      }),
    ]);

    // سجل تدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "group.leader.assigned",
        entity: "Group",
        entityId: id,
        severity: "info",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/admin/groups/[id]/leader]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تعيين الرئيس" },
      { status: 500 }
    );
  }
}
