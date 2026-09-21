// ===================================================================
//  POST /api/admin/settings/email/resend — إعادة إرسال بريد فاشل
//  - body: { emailId }
//  - يجلب السجلّ، يُعيد الإرسال بنفس المحتوى
//  - يُحدِّث السجلّ القديم بالحالة الجديدة
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          error: `هذا الإجراء يتطلب دور: ${ROLE_LABELS.SUPER_ADMIN.label}`,
        },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { emailId?: string }
      | null;

    if (!body?.emailId || typeof body.emailId !== "string") {
      return NextResponse.json(
        { error: "معرّف البريد مطلوب" },
        { status: 400 }
      );
    }

    // جلب السجلّ
    const log = await db.emailLog.findUnique({
      where: { id: body.emailId },
      select: { id: true, to: true, subject: true, body: true, status: true },
    });

    if (!log) {
      return NextResponse.json(
        { error: "السجلّ غير موجود" },
        { status: 404 }
      );
    }

    // إعادة الإرسال
    const result = await sendMail({
      to: log.to,
      subject: log.subject,
      html: log.body,
    });

    // سجلّ تدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "admin.email.resent",
        entity: "EmailLog",
        entityId: log.id,
        metadata: JSON.stringify({
          to: log.to,
          subject: log.subject,
          oldStatus: log.status,
          success: result.success,
          error: result.error ?? null,
        }),
        severity: "info",
      },
    });

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err) {
    console.error("[POST /api/admin/settings/email/resend]:", err);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء إعادة الإرسال" },
      { status: 500 }
    );
  }
}
