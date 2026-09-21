// ===================================================================
//  POST /api/admin/2fa/enable
//  جسم الطلب: { secret, token }
//  يتحقّق من الرمز مقابل السرّ المُرسل. عند النجاح:
//    1. يحفظ السرّ + يضبط twoFactorEnabled = true
//    2. يولّد 10 رموز نسخ احتياطي ويحفظها مجزّأة بـ bcrypt
//    3. يعيد الرموز بصيئة نصّية (للعرض مرة واحدة فقط)
//  الصلاحية: SUPER_ADMIN فقط.
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  verifyToken,
  generateBackupCodes,
  hashBackupCodes,
} from "@/lib/two-factor";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES: Role[] = ["SUPER_ADMIN"];

interface EnableBody {
  secret?: unknown;
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

    const body: EnableBody = await req.json().catch(() => ({}));
    const secret = isString(body.secret) ? body.secret.trim() : "";
    const token = isString(body.token) ? body.token.trim() : "";

    if (!secret || !token) {
      return NextResponse.json(
        { error: "السرّ والرمز مطلوبان" },
        { status: 400 }
      );
    }

    // التحقّق من أن 2FA غير مُفعّل مسبقاً
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { twoFactorEnabled: true },
    });
    if (dbUser?.twoFactorEnabled) {
      return NextResponse.json(
        { error: "المصادقة الثنائية مُفعّلة مسبقاً" },
        { status: 409 }
      );
    }

    // التحقّق من الرمز مقابل السرّ المُرسل
    const ok = verifyToken(secret, token);
    if (!ok) {
      await db.auditLog.create({
        data: {
          actorId: user.id,
          action: "admin.2fa.enable_failed",
          entity: "User",
          entityId: user.id,
          severity: "warning",
        },
      });
      return NextResponse.json(
        { error: "الرمز غير صحيح. تأكّد من إضافة السرّ في تطبيق المصادقة." },
        { status: 401 }
      );
    }

    // توليد رموز النسخ الاحتياطي + تجزئتها
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await hashBackupCodes(backupCodes);

    // حفظ السرّ + تفعيل 2FA + حفظ رموز النسخ
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: true,
        twoFactorBackupCodes: hashedBackupCodes,
      },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "admin.2fa.enabled",
        entity: "User",
        entityId: user.id,
        severity: "critical",
        metadata: JSON.stringify({ backupCodesCount: backupCodes.length }),
      },
    });

    return NextResponse.json({
      success: true,
      backupCodes,
    });
  } catch (err) {
    console.error("[POST /api/admin/2fa/enable]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تفعيل المصادقة الثنائية" },
      { status: 500 }
    );
  }
}
