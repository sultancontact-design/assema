// ===================================================================
//  API: /api/community/events/[id]/register
//  POST — تسجيل المستخدم الحالي في فعالية
//  - يتطلّب مصادقة
//  - يتحقّق: الفعالية موجودة، التسجيل مفتوح، لم يتجاوز maxAttendees،
//    المستخدم غير مسجّل سابقاً (409 إن كان كذلك)
//  - يولّد ticketCode: EV-YYYY-NNN (N = رقم تسلسلي 3 أرقام)
//  - qrCode = ticketCode (يُعرَض كصورة QR على الواجهة)
//  - يُنشئ EventRegistration (status=REGISTERED)
//  - يُنشئ إشعاراً للمنظِّم + سجل تدقيق
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { generateQrCodeDataUrl } from "@/lib/qr-code";
import * as EventTicketEmail from "@/emails/event-ticket";

export const dynamic = "force-dynamic";

// -------------------------------------------------------------------
//  توليد رقم تذكرة تسلسلي: EV-YYYY-NNN
// -------------------------------------------------------------------
async function generateTicketCode(eventId: string): Promise<string> {
  const year = new Date().getFullYear();
  // نعدّ التسجيلات الموجودة لنفس السنة (ticketCode يبدأ بـ `EV-{year}-`)
  const prefix = `EV-${year}-`;
  const count = await db.eventRegistration.count({
    where: {
      ticketCode: { startsWith: prefix },
    },
  });
  const next = count + 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

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
        { error: "يجب تسجيل الدخول للتسجيل في الفعالية" },
        { status: 401 }
      );
    }

    // 2) التحقّق من وجود الفعالية
    const event = await db.event.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        isRegistrationOpen: true,
        maxAttendees: true,
        organizerId: true,
        districtId: true,
        deletedAt: true,
      },
    });

    if (!event || event.deletedAt) {
      return NextResponse.json(
        { error: "الفعالية غير موجودة" },
        { status: 404 }
      );
    }

    // 3) التحقّق من نطاق الحي
    if (event.districtId !== user.districtId) {
      return NextResponse.json(
        { error: "لا يمكنك التسجيل في فعالية خارج حيّك" },
        { status: 403 }
      );
    }

    // 4) التحقّق من حالة الفعالية + فتح التسجيل
    if (!["PUBLISHED", "ONGOING"].includes(event.status)) {
      return NextResponse.json(
        { error: "التسجيل غير متاح لهذه الفعالية" },
        { status: 400 }
      );
    }

    if (!event.isRegistrationOpen) {
      return NextResponse.json(
        { error: "التسجيل مغلق لهذه الفعالية" },
        { status: 400 }
      );
    }

    // 5) منع التسجيل المكرّر (REGISTERED أو ATTENDED)
    //    ونتعامل مع حالة إعادة التسجيل بعد الإلغاء (revive a CANCELLED row)
    const existing = await db.eventRegistration.findFirst({
      where: {
        eventId: id,
        userId: user.id,
      },
      select: { id: true, ticketCode: true, status: true },
    });

    if (existing && (existing.status === "REGISTERED" || existing.status === "ATTENDED")) {
      return NextResponse.json(
        {
          error: "أنت مسجّل في هذه الفعالية بالفعل",
          ticketCode: existing.ticketCode,
        },
        { status: 409 }
      );
    }

    // 6) التحقّق من اتّساع المقاعد
    if (event.maxAttendees && event.maxAttendees > 0) {
      const registeredCount = await db.eventRegistration.count({
        where: {
          eventId: id,
          status: { in: ["REGISTERED", "ATTENDED"] },
        },
      });
      if (registeredCount >= event.maxAttendees) {
        return NextResponse.json(
          { error: "المقاعد ممتلئة" },
          { status: 400 }
        );
      }
    }

    // 7) توليد ticketCode + qrCode (نفس القيمة)
    const ticketCode = await generateTicketCode(id);

    // 8) إنشاء التسجيل — أو إعادة تنشيط تسجيل مُلغى سابق (revive)
    //    السبب: @@unique([eventId, userId]) يمنع إنشاء صفّين لنفس (event,user)
    let registration;
    if (existing && existing.status === "CANCELLED") {
      // إعادة تنشيط الصفّ المُلغى + توليد ticketCode جديد
      registration = await db.eventRegistration.update({
        where: { id: existing.id },
        data: {
          ticketCode,
          qrCode: ticketCode,
          status: "REGISTERED",
          registeredAt: new Date(),
          attendedAt: null,
          notes: null,
        },
        select: {
          id: true,
          ticketCode: true,
          status: true,
          registeredAt: true,
        },
      });
    } else {
      registration = await db.eventRegistration.create({
        data: {
          eventId: id,
          userId: user.id,
          ticketCode,
          qrCode: ticketCode, // نفس القيمة — يُعرَض كصورة QR
          status: "REGISTERED",
        },
        select: {
          id: true,
          ticketCode: true,
          status: true,
          registeredAt: true,
        },
      });
    }

    // 9) إشعار المنظِّم (إن وُجد)
    if (event.organizerId) {
      try {
        await db.notification.create({
          data: {
            userId: event.organizerId,
            type: "EVENT",
            title: "تسجيل جديد في فعاليتك",
            message: `سجّل ${user.name ?? "عضو"} في فعالية «${event.title}».`,
            link: `/community/events/${id}`,
          },
        });
      } catch {
        // فشل الإشعار لا يُلغي التسجيل
      }
    }

    // 10) سجل تدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "event.registration.created",
        entity: "Event",
        entityId: id,
        metadata: JSON.stringify({
          eventTitle: event.title,
          ticketCode,
          status: "REGISTERED",
        }),
        severity: "info",
      },
    });

    // 11) إرسال بريد التذكرة (غير حرج)
    try {
      const [dbUser, eventDetail] = await Promise.all([
        db.user.findUnique({
          where: { id: user.id },
          select: { email: true, fullName: true },
        }),
        db.event.findUnique({
          where: { id },
          select: { startDate: true, location: true },
        }),
      ]);
      if (dbUser?.email && eventDetail) {
        const qrDataUrl = await generateQrCodeDataUrl(ticketCode, {
          width: 200,
          margin: 1,
        });
        const params = {
          userName: dbUser.fullName || user.name || "الفاضل",
          eventTitle: event.title,
          eventDate: new Intl.DateTimeFormat("ar-MA", {
            dateStyle: "full",
            timeStyle: "short",
          }).format(eventDetail.startDate),
          eventLocation: eventDetail.location ?? "—",
          ticketCode,
          qrDataUrl,
        };
        await sendMail({
          to: dbUser.email,
          subject: EventTicketEmail.subject(params),
          html: EventTicketEmail.html(params),
        });
      }
    } catch (mailErr) {
      console.error("[event register] ticket email failed:", mailErr);
    }

    return NextResponse.json(
      {
        success: true,
        registration,
        ticketCode,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/community/events/[id]/register]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء التسجيل في الفعالية" },
      { status: 500 }
    );
  }
}
