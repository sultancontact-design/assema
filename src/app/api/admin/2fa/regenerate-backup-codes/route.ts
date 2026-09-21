// ===================================================================
//  POST /api/admin/2fa/regenerate-backup-codes
//  جسم الطلب: { token }
//  يتحقّق من رمز TOTP صحيح قبل إعادة التوليد (منع الإساءة). عند النجاح:
//    1. يُولّد 10 رموز نسخ جديدة
//    2. يحفظها مجزّأة بـ bcrypt (يستبدل القديمة كاملة)
//    3. يعيد الرموز بصيغة نصّية (للعرض مرة واحدة فقط)
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

interface RegenBody {
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

    const body: RegenBody = await req.json().catch(() => ({}));
    const token = isString(body.token) ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json(
        { error: "رمز التحقّق مطلوب لإعادة توليد رموز النسخ" },
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
        { error: "المصادقة الثنائية غير مُفعّلة" },
        { status: 409 }
      );
    }

    // التحقّق من رمز TOTP الحالي قبل إعادة التوليد
    const ok = verifyToken(dbUser.twoFactorSecret, token);
    if (!ok) {
      await db.auditLog.create({
        data: {
          actorId: user.id,
          action: "admin.2fa.regenerate_failed",
          entity: "User",
          entityId: user.id,
          severity: "warning",
        },
      });
      return NextResponse.json(
        { error: "الرمز غير صحيح. لا يمكن إعادة التوليد دون تحقّق." },
        { status: 401 }
      );
    }

    // توليد رموز نسخ جديدة
    const newCodes = generateBackupCodes();
    const hashed = await hashBackupCodes(newCodes);

    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorBackupCodes: hashed,
      },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "admin.2fa.backup_codes_regenerated",
        entity: "User",
        entityId: user.id,
        severity: "critical",
        metadata: JSON.stringify({ count: newCodes.length }),
      },
    });

    return NextResponse.json({
      success: true,
      backupCodes: newCodes,
    });
  } catch (err) {
    console.error("[POST /api/admin/2fa/regenerate-backup-codes]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إعادة توليد رموز النسخ الاحتياطي" },
      { status: 500 }
    );
  }
}
