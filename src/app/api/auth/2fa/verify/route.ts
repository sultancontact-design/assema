// ===================================================================
//  POST /api/auth/2fa/verify
//  جسم الطلب: { userId, token }
//  يتحقّق من رمز TOTP. عند النجاح يصدر تذكرة موقّعة HMAC قصيرة العمر
//  (90 ثانية) تسلّمها صفحة /login/2fa لإنشاء الجلسة عبر مزوّد credentials-2fa.
//  يسجّل في AuditLog: action = "user.2fa.login".
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, issueTwoFactorTicket } from "@/lib/two-factor";

export const dynamic = "force-dynamic";

interface VerifyBody {
  userId?: unknown;
  token?: unknown;
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

export async function POST(req: NextRequest) {
  try {
    const body: VerifyBody = await req.json().catch(() => ({}));
    const userId = isString(body.userId) ? body.userId.trim() : "";
    const token = isString(body.token) ? body.token.trim() : "";

    if (!userId || !token) {
      return NextResponse.json(
        { error: "معرّف المستخدم والرمز مطلوبان" },
        { status: 400 }
      );
    }

    // جلب المستخدم + التحقّق من أن 2FA مُفعّل فعلاً
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        status: true,
        lockedUntil: true,
        failedLoginCount: true,
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
      return NextResponse.json(
        { error: "حسابك غير نشط" },
        { status: 403 }
      );
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: "المصادقة الثنائية غير مُفعّلة على هذا الحساب" },
        { status: 400 }
      );
    }

    // التحقّق من الرمز
    const ok = verifyToken(user.twoFactorSecret, token);
    if (!ok) {
      // تسجيل محاولة فاشلة (دون قفل — القفل يبقى منطقة كلمة المرور)
      await db.auditLog.create({
        data: {
          actorId: user.id,
          action: "user.2fa.login_failed",
          entity: "User",
          entityId: user.id,
          severity: "warning",
          metadata: JSON.stringify({ method: "totp" }),
        },
      });
      return NextResponse.json(
        { error: "الرمز غير صحيح أو منتهي الصلاحية" },
        { status: 401 }
      );
    }

    // إصدار تذكرة موقّعة لإنشاء الجلسة
    const ticket = issueTwoFactorTicket(user.id, "totp");

    // تسجيل نجاح الدخول عبر 2FA
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "user.2fa.login",
        entity: "User",
        entityId: user.id,
        severity: "info",
        metadata: JSON.stringify({ method: "totp" }),
      },
    });

    return NextResponse.json({
      success: true,
      ticket,
      userId: user.id,
    });
  } catch (err) {
    console.error("[POST /api/auth/2fa/verify]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة التحقّق الثنائي" },
      { status: 500 }
    );
  }
}
