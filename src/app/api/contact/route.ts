// ===================================================================
//  POST /api/contact — استقبال رسالة من نموذج "اتصل بنا"
//  - Body: { name, email, subject, message }
//  - إن كان المُرسِل عضواً (مستخدماً مسجّلاً): يُحفظ في جدول Complaint (type=OTHER)
//  - إن كان زائراً (غير مسجّل): نُحاول ربطه بحساب عبر البريد؛ إن لم يوجد
//    نُنشئ Notification لكل المشرفين العامّين (SYSTEM type)
//  - سجل تدقيق: contact.message
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          name?: string;
          email?: string;
          subject?: string;
          message?: string;
        }
      | null;

    if (!body) {
      return NextResponse.json(
        { error: "الجسم غير صالح" },
        { status: 400 }
      );
    }

    // التحقّق من الحقول
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const subject = body.subject?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    if (name.length < 3) {
      return NextResponse.json(
        { error: "الاسم الكامل مطلوب (3 أحرف على الأقل)" },
        { status: 400 }
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "بريد إلكتروني صحيح مطلوب" },
        { status: 400 }
      );
    }
    if (subject.length < 3) {
      return NextResponse.json(
        { error: "موضوع الرسالة مطلوب (3 أحرف على الأقل)" },
        { status: 400 }
      );
    }
    if (message.length < 10) {
      return NextResponse.json(
        { error: "نصّ الرسالة مطلوب (10 أحرف على الأقل)" },
        { status: 400 }
      );
    }
    if (message.length > 2000) {
      return NextResponse.json(
        { error: "الرسالة طويلة جداً (2000 حرف كحد أقصى)" },
        { status: 400 }
      );
    }

    const ip =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      null;
    const userAgent = request.headers.get("user-agent") ?? null;

    // 1) محاولة العثور على مستخدم مسجّل بنفس البريد
    const userByEmail = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        fullName: true,
        role: true,
        districtId: true,
      },
    });

    // 2) إن كان مرسِل الطلب العضو الحالي، نُعطيه الأولوية (ربط أقوى)
    const currentUser = await getCurrentUser();
    const effectiveUser =
      currentUser && currentUser.email.toLowerCase() === email
        ? currentUser
        : userByEmail;

    // 3) إن كان مرتبطاً بمستخدم: نُنشئ سجل Complaint (type=OTHER، status=OPEN)
    if (effectiveUser) {
      const complaint = await db.complaint.create({
        data: {
          filedById: effectiveUser.id,
          districtId: effectiveUser.districtId ?? null,
          isAnonymous: false,
          type: "OTHER",
          subject: `[نموذج الاتصال] ${subject}`.slice(0, 250),
          description: message,
          status: "OPEN",
          priority: "normal",
        },
        select: {
          id: true,
          subject: true,
          status: true,
          createdAt: true,
        },
      });

      // إشعار للمشرفين العامّين + أمين الصندوق في الحي
      const recipients = await db.user.findMany({
        where: {
          districtId: effectiveUser.districtId ?? undefined,
          role: {
            in: [
              "SUPER_ADMIN",
              "ETHICS_COMMITTEE",
              "DISTRICT_MOD",
              "TREASURER",
            ] as Role[],
          },
          status: "ACTIVE",
          deletedAt: null,
        },
        select: { id: true },
      });

      if (recipients.length > 0) {
        await db.notification.createMany({
          data: recipients.map((r) => ({
            userId: r.id,
            type: "COMPLAINT",
            title: `رسالة جديدة من ${name}`,
            message: subject,
            link: "/admin/complaints",
            isRead: false,
            metadata: JSON.stringify({ complaintId: complaint.id }),
          })),
        });
      }

      // سجل تدقيق
      await db.auditLog.create({
        data: {
          actorId: effectiveUser.id,
          action: "contact.message",
          entity: "Complaint",
          entityId: complaint.id,
          severity: "info",
          metadata: JSON.stringify({
            fromForm: true,
            email,
            subject,
          }),
          ipAddress: ip,
          userAgent,
        },
      });

      return NextResponse.json(
        {
          success: true,
          complaintId: complaint.id,
          channel: "complaint",
          message:
            "وصلتنا رسالتك — أُنشئت كملف اتصال في لوحة اللجنة وسيراجعها المشرفون.",
        },
        { status: 201 }
      );
    }

    // 4) زائر غير مسجّل: إشعار SYSTEM لكل المشرفين العامّين (SUPER_ADMIN)
    const admins = await db.user.findMany({
      where: {
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        deletedAt: null,
      },
      select: { id: true },
    });

    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type: "SYSTEM",
          title: `رسالة من نموذج الاتصال — ${name}`,
          message: `${subject}\n\n${message}`.slice(0, 1000),
          link: "/contact",
          isRead: false,
          metadata: JSON.stringify({
            fromForm: true,
            visitorEmail: email,
            visitorName: name,
            submittedAt: new Date().toISOString(),
          }),
        })),
      });
    }

    // سجل تدقيق بدون actor (زائر)
    await db.auditLog.create({
      data: {
        actorId: null,
        action: "contact.message.visitor",
        entity: "Notification",
        entityId: null,
        severity: "info",
        metadata: JSON.stringify({
          fromForm: true,
          visitorEmail: email,
          visitorName: name,
          subject,
          messagePreview: message.slice(0, 200),
          adminRecipients: admins.length,
        }),
        ipAddress: ip,
        userAgent,
      },
    });

    return NextResponse.json(
      {
        success: true,
        channel: "notification",
        message:
          "وصلتنا رسالتك — أُرسلت كإشعار للمشرفين العامّين وسيتواصلون معك عبر بريدك.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/contact]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إرسال الرسالة" },
      { status: 500 }
    );
  }
}
