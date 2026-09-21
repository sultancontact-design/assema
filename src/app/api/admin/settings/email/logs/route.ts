// ===================================================================
//  GET /api/admin/settings/email/logs — آخر 20 سجلّ بريد
//  - SUPER_ADMIN فقط
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { getLastEmails, getEmailStats } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function GET() {
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

    const [logs, stats] = await Promise.all([
      getLastEmails(20),
      getEmailStats(),
    ]);

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        to: l.to,
        subject: l.subject,
        status: l.status,
        error: l.error,
        messageId: l.messageId,
        sentAt: l.sentAt?.toISOString() ?? null,
        createdAt: l.createdAt.toISOString(),
      })),
      stats,
    });
  } catch (err) {
    console.error("[GET /api/admin/settings/email/logs]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب سجلّ البريد" },
      { status: 500 }
    );
  }
}
