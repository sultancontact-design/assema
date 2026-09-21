// ===================================================================
//  POST /api/admin/2fa/disable
//  جسم الطلب: { token }
//  يتحقّق من رمز TOTP صحيح قبل التعطيل (حماية ضد التعطيل العرضي أو
//  في حال انتهاء جلسة مسرّبة). عند النجاح:
//    - twoFactorEnabled = false
//    - twoFactorSecret = null
//    - twoFactorBackupCodes = null
//  الصلاحية: SUPER_ADMIN فقط.
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/two-factor";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES: Role[] = ["SUPER_ADMIN"];

interface DisableBody {
  token?: unknown;
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

export async function POST(req: NextRequest) {
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

    const body: DisableBody = await req.json().catch(() => ({}));
    const token = isString(body.token) ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json(
        { error: "رمز التحقّق مطلوب لتعطيل 2FA" },
        { status: 400 }
      );
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!dbUser?.twoFactorEnabled || !dbUser.twoFactorSecret) {
      return NextResponse.json(
        { error: "المصادقة الثنائية غير مُفعّلة أصلاً" },
        { status: 409 }
      );
    }

    // التحقّق من رمز TOTP الحالي قبل التعطيل
    const ok = verifyToken(dbUser.twoFactorSecret, token);
    if (!ok) {
      await db.auditLog.create({
        data: {
          actorId: user.id,
          action: "admin.2fa.disable_failed",
          entity: "User",
          entityId: user.id,
          severity: "warning",
        },
      });
      return NextResponse.json(
        { error: "الرمز غير صحيح. لا يمكن التعطيل دون تحقّق." },
        { status: 401 }
      );
    }

    // تعطيل 2FA + محو السرّ ورموز النسخ
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "admin.2fa.disabled",
        entity: "User",
        entityId: user.id,
        severity: "critical",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/admin/2fa/disable]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تعطيل المصادقة الثنائية" },
      { status: 500 }
    );
  }
}
