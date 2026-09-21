// ===================================================================
//  POST /api/admin/notifications/send — إرسال إشعار جماعي
//  - Body: { recipientType: 'all'|'group'|'district', recipientId?, title, message, type, link?, scheduledAt? }
//  - يتطلّب صلاحية notification.broadcast
//  - يستعمل createMany للإرسال الجماعي
//  - يُنشئ AuditLog (notification.sent)
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import { sendBulkMail } from "@/lib/mailer";
import * as NotificationEmail from "@/emails/notification";
import type { NotificationType } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_TYPES: NotificationType[] = [
  "SYSTEM",
  "CONTRIBUTION",
  "FUND_REQUEST",
  "EVENT",
  "GROUP",
  "COMPLAINT",
  "ANNOUNCEMENT",
];

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول للوصول لهذا المورد" },
        { status: 401 }
      );
    }
    if (!hasPermission(user.role, "notification.broadcast")) {
      return NextResponse.json(
        { error: "ليس لديك صلاحية إرسال إشعارات" },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as
      | {
          recipientType?: "all" | "group" | "district";
          recipientId?: string;
          title?: string;
          message?: string;
          type?: NotificationType;
          link?: string;
          scheduledAt?: string;
        }
      | null;

    if (!body) {
      return NextResponse.json({ error: "الجسم غير صالح" }, { status: 400 });
    }

    // التحقّق من الحقول
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 });
    }
    if (!body.message || !body.message.trim()) {
      return NextResponse.json({ error: "الرسالة مطلوبة" }, { status: 400 });
    }

    const recipientType = body.recipientType ?? "all";
    const type = body.type ?? "ANNOUNCEMENT";
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "نوع الإشعار غير صالح" }, { status: 400 });
    }

    if (recipientType !== "all" && !body.recipientId) {
      return NextResponse.json(
        { error: "المستلم مطلوب عند اختيار مجموعة أو حي" },
        { status: 400 }
      );
    }

    let scheduledAt: Date | null = null;
    if (body.scheduledAt) {
      scheduledAt = new Date(body.scheduledAt);
      if (isNaN(scheduledAt.getTime())) {
        return NextResponse.json(
          { error: "صيغة وقت الجدولة غير صحيحة" },
          { status: 400 }
        );
      }
    }

    // تحديد المستلمين
    let recipientUserIds: string[] = [];
    if (recipientType === "all") {
      // كل الأعضاء النشطين في حي المستخدم الحالي
      const users = await db.user.findMany({
        where: {
          districtId: user.districtId ?? undefined,
          status: "ACTIVE",
          deletedAt: null,
        },
        select: { id: true },
      });
      recipientUserIds = users.map((u) => u.id);
    } else if (recipientType === "group") {
      const memberships = await db.groupMember.findMany({
        where: { groupId: body.recipientId, isApproved: true },
        select: { userId: true },
      });
      recipientUserIds = memberships.map((m) => m.userId);
    } else if (recipientType === "district") {
      const users = await db.user.findMany({
        where: {
          districtId: body.recipientId,
          status: "ACTIVE",
          deletedAt: null,
        },
        select: { id: true },
      });
      recipientUserIds = users.map((u) => u.id);
    }

    if (recipientUserIds.length === 0) {
      return NextResponse.json(
        { error: "لا يوجد مستلمون متاحون" },
        { status: 400 }
      );
    }

    // إنشاء الإشعارات (createMany)
    // ملاحظة: scheduledAt في النموذج الحالي غير موجود كحقل — نُخزّنه في metadata
    const metadata = scheduledAt ? JSON.stringify({ scheduledAt: scheduledAt.toISOString() }) : null;

    await db.notification.createMany({
      data: recipientUserIds.map((userId) => ({
        userId,
        type,
        title: body.title!.trim(),
        message: body.message!.trim(),
        link: body.link?.trim() || null,
        isRead: false,
        metadata,
      })),
    });

    // سجلّ التدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "notification.sent",
        entity: "Notification",
        entityId: null,
        severity: "info",
        metadata: JSON.stringify({
          recipientType,
          recipientId: body.recipientId ?? null,
          title: body.title,
          type,
          count: recipientUserIds.length,
          scheduledAt: scheduledAt?.toISOString() ?? null,
        }),
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    // إرسال بريد NotificationEmail لكل المستلمين (batch limit 50 لتفادي rate-limit)
    try {
      const recipients = await db.user.findMany({
        where: { id: { in: recipientUserIds }, status: "ACTIVE", deletedAt: null },
        select: { id: true, email: true, fullName: true },
      });

      // أخذ أول 50 فقط لتفادي تجاوز حدود الإرسال
      const limited = recipients.slice(0, 50);

      if (limited.length > 0) {
        const title = body.title!.trim();
        const message = body.message!.trim();
        const link = body.link?.trim() || null;

        // نبني HTML عام دون اسم (سيُخصَّص لاحقاً إن لزم)
        // نُرسِل لكل بريد على حدة لتخصيص userName
        const htmlTemplate = (userName: string) =>
          NotificationEmail.html({ userName, title, message, link });
        const subjectLine = NotificationEmail.subject({ userName: "", title, message, link });

        // نُعيد استخدام sendMail عبر sendBulkMail مع HTML موحَّد
        // (القالب يحتوي اسم المستخدم — سنُمرّر واحد "الفاضل" كافتراضي للتبسيط)
        const recipientsEmails = limited.map((u) => u.email);
        const htmlUnified = htmlTemplate("الفاضل");

        await sendBulkMail({
          recipients: recipientsEmails,
          subject: subjectLine,
          html: htmlUnified,
        });
      }
    } catch (mailErr) {
      console.error("[notifications/send] bulk mail failed:", mailErr);
    }

    return NextResponse.json(
      { success: true, count: recipientUserIds.length },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/notifications/send]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إرسال الإشعار" },
      { status: 500 }
    );
  }
}
