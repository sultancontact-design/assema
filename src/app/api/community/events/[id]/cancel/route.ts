// ===================================================================
//  API: /api/community/events/[id]/cancel
//  POST — إلغاء تسجيل المستخدم الحالي في فعالية
//  - يتطلّب مصادقة
//  - يبحث عن التسجيل النشط (REGISTERED أو ATTENDED) للمستخدم
//  - يضع status=CANCELLED
//  - يُنشئ سجل تدقيق
//  - لا يمكن إلغاء تسجيل NO_SHOW
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
        { error: "يجب تسجيل الدخول لإلغاء التسجيل" },
        { status: 401 }
      );
    }

    // 2) التحقّق من وجود الفعالية
    const event = await db.event.findUnique({
      where: { id },
      select: { id: true, title: true, deletedAt: true },
    });

    if (!event || event.deletedAt) {
      return NextResponse.json(
        { error: "الفعالية غير موجودة" },
        { status: 404 }
      );
    }

    // 3) البحث عن التسجيل النشط للمستخدم
    const registration = await db.eventRegistration.findFirst({
      where: {
        eventId: id,
        userId: user.id,
        status: { in: ["REGISTERED", "ATTENDED"] },
      },
      select: { id: true, ticketCode: true, status: true },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "لا يوجد تسجيل نشط لإلغائه" },
        { status: 404 }
      );
    }

    // لا نسمح بإلغاء تسجيل ATTENDED (الحضور سبق وتُسجِّل)
    if (registration.status === "ATTENDED") {
      return NextResponse.json(
        {
          error:
            "لا يمكن إلغاء التسجيل بعد تسجيل الحضور. تواصل مع المنظِّم للحصول على مساعدة.",
        },
        { status: 400 }
      );
    }

    // 4) تحديث الحالة إلى CANCELLED
    await db.eventRegistration.update({
      where: { id: registration.id },
      data: { status: "CANCELLED" },
    });

    // 5) سجل تدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "event.registration.cancelled",
        entity: "Event",
        entityId: id,
        metadata: JSON.stringify({
          eventTitle: event.title,
          ticketCode: registration.ticketCode,
        }),
        severity: "warning",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم إلغاء التسجيل",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/community/events/[id]/cancel]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إلغاء التسجيل" },
      { status: 500 }
    );
  }
}
