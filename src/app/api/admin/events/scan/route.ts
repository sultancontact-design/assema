// ===================================================================
//  API: /api/admin/events/scan
//  POST — تسجيل الحضور عبر رقم تذكرة
//  - يتطلّب مصادقة + صلاحية (SUPER_ADMIN, DISTRICT_MOD، أو المنظِّم)
//  - Body: { ticketCode }
//  - يبحث عن التسجيل بـ ticketCode (case-insensitive)
//  - إن لم يُوجد: 404
//  - إن كان ATTENDED مسبقاً: 409 + معلومات الحاضر
//  - وإلا: يحدّث status=ATTENDED, attendedAt=now
//  - يُرجع 200 مع { attendee, event, registration }
//  - يُنشئ سجل تدقيق
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/roles";

export const dynamic = "force-dynamic";

interface ScanBody {
  ticketCode?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1) المصادقة + الصلاحية
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const isStaff = hasPermission(user.role, "event.manage-registrations");
    if (!isStaff) {
      return NextResponse.json(
        { error: "ليس لديك صلاحية لتسجيل الحضور" },
        { status: 403 }
      );
    }

    // 2) Parse body
    let body: ScanBody = {};
    try {
      body = (await request.json()) as ScanBody;
    } catch {
      return NextResponse.json(
        { error: "جسم الطلب غير صالح (JSON متوقّع)" },
        { status: 400 }
      );
    }

    const ticketCode = (body.ticketCode ?? "").trim().toUpperCase();
    if (!ticketCode) {
      return NextResponse.json(
        { error: "رقم التذكرة مطلوب" },
        { status: 400 }
      );
    }

    // 3) البحث عن التسجيل (case-insensitive في SQLite عبر equals)
    //    نمط التذاكر EV-YYYY-NNN — نجرّب المطابقة الدقيقة أولاً ثم بحث أعرض
    let registration = await db.eventRegistration.findUnique({
      where: { ticketCode },
      include: {
        user: {
          select: { id: true, fullName: true, avatar: true, phone: true },
        },
        event: {
          select: {
            id: true,
            title: true,
            status: true,
            organizerId: true,
            districtId: true,
          },
        },
      },
    });

    // fallback: إن لم يجد المطابقة الدقيقة، نبحث عن أي تذكرة تطابق (حالة-غير حسّاسة)
    if (!registration) {
      const lower = ticketCode.toLowerCase();
      registration = await db.eventRegistration.findFirst({
        where: {
          qrCode: { equals: lower },
        },
        include: {
          user: {
            select: { id: true, fullName: true, avatar: true, phone: true },
          },
          event: {
            select: {
              id: true,
              title: true,
              status: true,
              organizerId: true,
              districtId: true,
            },
          },
        },
      });
    }

    if (!registration) {
      return NextResponse.json(
        { error: `لا توجد تذكرة بالرقم: ${ticketCode}` },
        { status: 404 }
      );
    }

    // 4) التحقّق من نطاق الحي + صلاحية المنظِّم
    const isOrganizer = registration.event.organizerId === user.id;
    if (!isStaff && !isOrganizer) {
      return NextResponse.json(
        { error: "لا يمكنك تسجيل حضور فعاليات لا تنظّمها" },
        { status: 403 }
      );
    }

    if (registration.event.districtId !== user.districtId) {
      return NextResponse.json(
        { error: "هذه التذكرة من فعالية خارج حيّك" },
        { status: 403 }
      );
    }

    // 5) فحص الحالة
    if (registration.status === "ATTENDED") {
      // سبق تسجيل الحضور — نُرجع 409 + معلومات الحاضر
      return NextResponse.json(
        {
          error: "تم تسجيل الحضور مسبقاً",
          attendee: {
            id: registration.id,
            userId: registration.user.id,
            fullName: registration.user.fullName,
            ticketCode: registration.ticketCode,
            attendedAt: registration.attendedAt
              ? registration.attendedAt instanceof Date
                ? registration.attendedAt.toISOString()
                : String(registration.attendedAt)
              : null,
            registeredAt:
              registration.registeredAt instanceof Date
                ? registration.registeredAt.toISOString()
                : String(registration.registeredAt),
          },
          event: {
            id: registration.event.id,
            title: registration.event.title,
          },
        },
        { status: 409 }
      );
    }

    if (registration.status === "CANCELLED") {
      return NextResponse.json(
        { error: "هذه التذكرة مُلغاة — لا يمكن تسجيل الحضور" },
        { status: 400 }
      );
    }

    // 6) تحديث الحالة إلى ATTENDED
    const now = new Date();
    const updated = await db.eventRegistration.update({
      where: { id: registration.id },
      data: {
        status: "ATTENDED",
        attendedAt: now,
      },
      select: {
        id: true,
        ticketCode: true,
        status: true,
        registeredAt: true,
        attendedAt: true,
      },
    });

    // 7) سجل تدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "event.attendance.marked",
        entity: "Event",
        entityId: registration.event.id,
        metadata: JSON.stringify({
          eventTitle: registration.event.title,
          ticketCode: registration.ticketCode,
          attendeeName: registration.user.fullName,
        }),
        severity: "info",
      },
    });

    // 8) إشعار الحاضر بتسجيل حضوره
    try {
      await db.notification.create({
        data: {
          userId: registration.user.id,
          type: "EVENT",
          title: "تم تسجيل حضورك",
          message: `سجّل ${user.name ?? "المشرف"} حضورك في فعالية «${registration.event.title}». شكراً لمشاركتك!`,
          link: `/community/events/${registration.event.id}`,
        },
      });
    } catch {
      // فشل الإشعار لا يُلغي العملية
    }

    return NextResponse.json(
      {
        success: true,
        registration: updated,
        attendee: {
          id: registration.id,
          userId: registration.user.id,
          fullName: registration.user.fullName,
          ticketCode: registration.ticketCode,
          attendedAt: now.toISOString(),
          registeredAt:
            registration.registeredAt instanceof Date
              ? registration.registeredAt.toISOString()
              : String(registration.registeredAt),
        },
        event: {
          id: registration.event.id,
          title: registration.event.title,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/admin/events/scan]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تسجيل الحضور" },
      { status: 500 }
    );
  }
}
