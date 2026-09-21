// ===================================================================
//  POST /api/admin/backup/restore — استعادة نسخة احتياطية (placeholder)
//  - يتطلّب صلاحية admin.backup
//  - يستلم multipart/form-data مع حقل "file"
//  - ملاحظة: الاستعادة الفعلية خطرة — نكتفي بتسجيل العملية وإرجاع رسالة
//    للمستخدم أن النشر على VPS مع cron job هو المُخطّط للنسخ الفعلية
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 م.ب

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
    }
    if (!hasPermission(user.role, "admin.backup")) {
      return NextResponse.json({ error: "ممنوع" }, { status: 403 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "يجب إرسال multipart/form-data مع حقل file" },
        { status: 400 }
      );
    }
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "لم يتم إرفاق ملف النسخة" },
        { status: 400 }
      );
    }
    if (file.size === 0) {
      return NextResponse.json(
        { error: "الملف المرفوع فارغ" },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "حجم الملف يتجاوز الحد الأقصى (100 م.ب)" },
        { status: 413 }
      );
    }

    // ملاحظة: الاستعادة الفعلية محفوفة بالمخاطر على بيئة الإنتاج
    // نكتفي بتسجيل العملية للـaudit log وإرجاع رسالة للمستخدم
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "");
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "backup.restore",
        entity: "Database",
        entityId: null,
        severity: "warning",
        metadata: JSON.stringify({
          filename: safeName,
          size: file.size,
          type: file.type,
          note: "طلب استعادة — يحتاج معالجة يدوية على VPS",
        }),
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "تم استلام ملف النسخة وتسجيل العملية. الاستعادة الفعلية تتطلّب معالجة يدوية على VPS لتفادي فقدان البيانات.",
      file: { name: safeName, size: file.size, type: file.type },
    });
  } catch (err) {
    console.error("[POST /api/admin/backup/restore]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة ملف الاستعادة" },
      { status: 500 }
    );
  }
}
