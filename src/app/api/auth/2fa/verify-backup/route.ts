// ===================================================================
//  POST /api/auth/2fa/verify-backup
//  جسم الطلب: { userId, code }
//  يتحقّق من رمز النسخ الاحتياطي. عند النجاح:
//    1. يستهلك الرمز (يحذفه من المصفوفة المُجزّأة).
//    2. يُولّد 10 رموز نسخ جديدة ويحفظها مجزّأة.
//    3. يصدر تذكرة موقّعة HMAC لإتمام الدخول عبر credentials-2fa.
//    4. يعيد الرموز الجديدة بصيغة نصّية لعرضها للمستخدم (مرة واحدة فقط).
//  يسجّل في AuditLog: action = "user.2fa.backup_used".
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  verifyBackupCode,
  generateBackupCodes,
  hashBackupCodes,
  issueTwoFactorTicket,
} from "@/lib/two-factor";

export const dynamic = "force-dynamic";

interface BackupBody {
  userId?: unknown;
  code?: unknown;
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

export async function POST(req: NextRequest) {
  try {
    const body: BackupBody = await req.json().catch(() => ({}));
    const userId = isString(body.userId) ? body.userId.trim() : "";
    const code = isString(body.code) ? body.code.trim().toUpperCase() : "";

    if (!userId || !code) {
      return NextResponse.json(
        { error: "معرّف المستخدم ورمز النسخ الاحتياطي مطلوبان" },
        { status: 400 }
      );
    }

    if (code.length < 6 || code.length > 12) {
      return NextResponse.json(
        { error: "طول الرمز غير صحيح" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
        status: true,
        lockedUntil: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "لا يوجد حساب بهذا المعرّف" },
        { status: 404 }
      );
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json(
        { error: "تم قفل الحساب مؤقتاً. حاول لاحقاً" },
        { status: 423 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json({ error: "حسابك غير نشط" }, { status: 403 });
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "المصادقة الثنائية غير مُفعّلة على هذا الحساب" },
        { status: 400 }
      );
    }

    if (!user.twoFactorBackupCodes) {
      return NextResponse.json(
        { error: "لا توجد رموز نسخ احتياطي مُولّدة. استخدم رمز التطبيق." },
        { status: 400 }
      );
    }

    // التحقّق من الرمز وحذفه من المصفوفة
    const { valid, remaining } = await verifyBackupCode(
      user.twoFactorBackupCodes,
      code
    );

    if (!valid) {
      await db.auditLog.create({
        data: {
          actorId: user.id,
          action: "user.2fa.backup_failed",
          entity: "User",
          entityId: user.id,
          severity: "warning",
          metadata: JSON.stringify({ method: "backup" }),
        },
      });
      return NextResponse.json(
        { error: "رمز النسخ الاحتياطي غير صحيح أو مستهلَك" },
        { status: 401 }
      );
    }

    // توليد 10 رموز جديدة وحفظها مجزّأة
    const newCodes = generateBackupCodes();
    const newHashed = await hashBackupCodes(newCodes);

    // تحديث الحساب: حفظ المصفوفة المحدّثة (بدون الرمز المستهلَك) + الرموز الجديدة
    // ملاحظة: نستبدل المصفوفة كاملة بالرموز الجديدة (المواصفات: regenerate on use).
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorBackupCodes: newHashed,
      },
    });

    // إصدار تذكرة موقّعة لإنشاء الجلسة
    const ticket = issueTwoFactorTicket(user.id, "backup");

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "user.2fa.backup_used",
        entity: "User",
        entityId: user.id,
        severity: "warning",
        metadata: JSON.stringify({
          method: "backup",
          remainingCodesAfter: 10,
          regenerated: true,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      ticket,
      userId: user.id,
      newBackupCodes: newCodes,
    });
  } catch (err) {
    console.error("[POST /api/auth/2fa/verify-backup]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة رمز النسخ الاحتياطي" },
      { status: 500 }
    );
  }
}
