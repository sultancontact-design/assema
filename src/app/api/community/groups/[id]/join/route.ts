// ===================================================================
//  API: /api/community/groups/[id]/join
//  POST — انضمام المستخدم الحالي إلى مجموعة في حيّه
//  - يتطلّب مصادقة
//  - يتحقّق أن المجموعة نشطة وفي نفس حي المستخدم
//  - يمنع الانضمام المكرّر (409)
//  - يُنشئ عضوية (isApproved = true للمجموعات الافتراضية، false للخاصة)
//  - يُنشئ إشعاراً لرئيس المجموعة + سجل تدقيق
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
        { error: "يجب تسجيل الدخول للانضمام إلى مجموعة" },
        { status: 401 }
      );
    }

    // 2) التحقّق من وجود المجموعة
    const group = await db.group.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        districtId: true,
        isPrivate: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (!group || group.deletedAt) {
      return NextResponse.json(
        { error: "المجموعة غير موجودة" },
        { status: 404 }
      );
    }

    // 3) نطاق الحي — لا يمكن الانضمام لمجموعة خارج الحي
    if (group.districtId !== user.districtId) {
      return NextResponse.json(
        { error: "لا يمكنك الانضمام إلى مجموعة خارج حيّك" },
        { status: 403 }
      );
    }

    if (!group.isActive) {
      return NextResponse.json(
        { error: "هذه المجموعة غير نشطة حالياً" },
        { status: 400 }
      );
    }

    // 4) منع الانضمام المكرّر
    const existing = await db.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: id, userId: user.id },
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "أنت عضو في هذه المجموعة بالفعل" },
        { status: 409 }
      );
    }

    // 5) إنشاء العضوية — المجموعات الافتراضية: قبول مباشر
    //    المجموعات الخاصة: تنتظر موافقة الرئيس
    const isApproved = !group.isPrivate;

    const membership = await db.groupMember.create({
      data: {
        groupId: id,
        userId: user.id,
        role: "member",
        isApproved,
      },
      select: { id: true },
    });

    // 6) إشعار رئيس المجموعة (إن وُجد)
    const leader = await db.groupMember.findFirst({
      where: { groupId: id, role: "leader" },
      select: { userId: true },
    });

    if (leader) {
      await db.notification.create({
        data: {
          userId: leader.userId,
          type: "GROUP",
          title: "عضو جديد في مجموعتك",
          message: isApproved
            ? `انضمّ ${user.name ?? "عضو جديد"} إلى مجموعتك «${group.name}».`
            : `${user.name ?? "عضو"} يطلب الانضمام إلى مجموعتك «${group.name}». راجع الطلب.`,
          link: "/community/groups",
        },
      });
    }

    // 7) سجل تدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "group.member.joined",
        entity: "Group",
        entityId: id,
        metadata: JSON.stringify({
          groupName: group.name,
          role: "member",
          isApproved,
        }),
        severity: "info",
      },
    });

    return NextResponse.json(
      { success: true, membershipId: membership.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/community/groups/[id]/join]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء الانضمام إلى المجموعة" },
      { status: 500 }
    );
  }
}
