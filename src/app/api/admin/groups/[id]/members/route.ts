// ===================================================================
//  API: /api/admin/groups/[id]/members
//  POST — إضافة عضو إلى مجموعة (group.member.add)
//  الجسم: { userId: string }
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function POST(
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
    const newUserId = body.userId;

    // العثور على المجموعة
    const group = await db.group.findUnique({
      where: { id },
      select: {
        id: true,
        districtId: true,
        deletedAt: true,
        isPrivate: true,
        maxMembers: true,
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
      where: { id: newUserId },
      select: { id: true, districtId: true, deletedAt: true, status: true },
    });
    if (!candidate || candidate.deletedAt) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }
    if (candidate.districtId !== user.districtId) {
      return NextResponse.json(
        { error: "لا يمكن إضافة مستخدم من حي آخر" },
        { status: 400 }
      );
    }

    // منع الإضافة المزدوجة
    const existing = await db.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: id, userId: newUserId },
      },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "العضو موجود في المجموعة بالفعل" },
        { status: 409 }
      );
    }

    // فحص الحد الأقصى للأعضاء
    if (group.maxMembers) {
      const count = await db.groupMember.count({
        where: { groupId: id, isApproved: true },
      });
      if (count >= group.maxMembers) {
        return NextResponse.json(
          { error: "وصلت المجموعة إلى الحد الأقصى للأعضاء" },
          { status: 400 }
        );
      }
    }

    // الإنشاء — العضو يُضاف مباشرة (الأدمن يضيف)
    const membership = await db.groupMember.create({
      data: {
        groupId: id,
        userId: newUserId,
        role: "member",
        isApproved: true,
      },
      select: { id: true },
    });

    // سجل تدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "group.member.added",
        entity: "GroupMember",
        entityId: membership.id,
        severity: "info",
      },
    });

    return NextResponse.json({ success: true, membershipId: membership.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/groups/[id]/members]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة العضو" },
      { status: 500 }
    );
  }
}
