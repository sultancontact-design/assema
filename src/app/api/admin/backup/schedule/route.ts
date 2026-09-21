// ===================================================================
//  POST /api/admin/backup/schedule — حفظ إعدادات الجدولة
//  - Body: { frequency, retention, enabled }
//  - يُخزّن في جدول Setting
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_FREQUENCIES = ["daily", "weekly", "monthly"];
const VALID_RETENTIONS = ["7", "14", "30"];

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
    }
    if (!hasPermission(user.role, "admin.backup")) {
      return NextResponse.json({ error: "ممنوع" }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as
      | { frequency?: string; retention?: string; enabled?: boolean }
      | null;

    if (!body) {
      return NextResponse.json({ error: "الجسم غير صالح" }, { status: 400 });
    }

    const frequency = body.frequency ?? "weekly";
    if (!VALID_FREQUENCIES.includes(frequency)) {
      return NextResponse.json(
        { error: "قيمة التكرار غير صالحة" },
        { status: 400 }
      );
    }

    const retention = body.retention ?? "14";
    if (!VALID_RETENTIONS.includes(retention)) {
      return NextResponse.json(
        { error: "قيمة مدة الاحتفاظ غير صالحة" },
        { status: 400 }
      );
    }

    const enabled = body.enabled ?? false;

    // upsert الإعدادات في جدول Setting
    await Promise.all([
      db.setting.upsert({
        where: { key: "backup.schedule.frequency" },
        create: {
          key: "backup.schedule.frequency",
          value: frequency,
          type: "string",
          category: "backup",
          isPublic: false,
          description: "تكرار النسخ المجدول",
        },
        update: { value: frequency },
      }),
      db.setting.upsert({
        where: { key: "backup.schedule.retention" },
        create: {
          key: "backup.schedule.retention",
          value: retention,
          type: "string",
          category: "backup",
          isPublic: false,
          description: "مدة الاحتفاظ بالنسخ بالأيام",
        },
        update: { value: retention },
      }),
      db.setting.upsert({
        where: { key: "backup.schedule.enabled" },
        create: {
          key: "backup.schedule.enabled",
          value: enabled ? "true" : "false",
          type: "bool",
          category: "backup",
          isPublic: false,
          description: "تفعيل النسخ المجدول",
        },
        update: { value: enabled ? "true" : "false" },
      }),
    ]);

    // سجلّ التدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "backup.schedule.updated",
        entity: "Setting",
        entityId: null,
        severity: "info",
        metadata: JSON.stringify({ frequency, retention, enabled }),
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      settings: { frequency, retention, enabled },
    });
  } catch (err) {
    console.error("[POST /api/admin/backup/schedule]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حفظ الإعدادات" },
      { status: 500 }
    );
  }
}
