// ===================================================================
//  POST /api/admin/2fa/setup
//  يولّد سرّاً base32 جديداً + رابط otpauth:// لرمز QR.
//  لا يحفظ السرّ في قاعدة البيانات — يُعاده للعميل للتأكيد فقط.
//  التفعيل الفعلي يتم في POST /api/admin/2fa/enable بعد قراءة رمز صحيح.
//  الصلاحية: SUPER_ADMIN فقط.
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateSecret } from "@/lib/two-factor";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES: Role[] = ["SUPER_ADMIN"];

export async function POST(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(user.role)) {
      return NextResponse.json(
        {
          error: `هذا الإجراء يتطلب دور: ${ROLE_LABELS.SUPER_ADMIN.label}`,
        },
        { status: 403 }
      );
    }

    // لو 2FA مُفعّل مسبقاً — لا نسمح بإعادة التهيئة قبل التعطيل
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { twoFactorEnabled: true },
    });
    if (dbUser?.twoFactorEnabled) {
      return NextResponse.json(
        {
          error:
            "المصادقة الثنائية مُفعّلة مسبقاً. عطّلها أولاً إن أردت إعادة التهيئة.",
        },
        { status: 409 }
      );
    }

    // توليد سرّ جديد باستخدام بريد المستخدم كـ label
    const { secret, otpauth_url } = generateSecret(user.email);

    // تسجيل محاولة التهيئة (debug)
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "admin.2fa.setup_initiated",
        entity: "User",
        entityId: user.id,
        severity: "info",
      },
    });

    return NextResponse.json({
      success: true,
      secret,
      otpauth_url,
    });
  } catch (err) {
    console.error("[POST /api/admin/2fa/setup]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء توليد السرّ" },
      { status: 500 }
    );
  }
}
