// ===================================================================
//  POST /api/admin/economy/adjust
//  تعديل نقاط مستخدم يدوياً (إضافة/خصم)
//  - يُنشئ سجلّ PointsLedger من نوع ADJUST
//  - يُحدّث user.points
//  - يُسجّل AuditLog
//  - SUPER_ADMIN فقط
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface AdjustBody {
  userIds: string[];
  amount: number; // موجب أو سالب
  reason: string;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
  }
  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "هذا الإجراء يتطلب صلاحية مشرف عام" },
      { status: 403 }
    );
  }

  let body: AdjustBody;
  try {
    body = (await req.json()) as AdjustBody;
  } catch {
    return NextResponse.json({ error: "جسم الطلب غير صالح" }, { status: 400 });
  }

  const { userIds, amount, reason } = body;
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "اختر مستخدماً واحداً على الأقل" }, { status: 400 });
  }
  if (!Number.isInteger(amount) || amount === 0) {
    return NextResponse.json({ error: "المبلغ يجب أن يكون عدداً صحيحاً غير صفر" }, { status: 400 });
  }
  if (!reason || reason.trim().length < 3) {
    return NextResponse.json({ error: "السبب مطلوب (3 أحرف على الأقل)" }, { status: 400 });
  }

  const results: Array<{ userId: string; ok: boolean; balanceAfter: number; message?: string }> = [];
  for (const userId of userIds) {
    try {
      const target = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, points: true, fullName: true },
      });
      if (!target) {
        results.push({ userId, ok: false, balanceAfter: 0, message: "المستخدم غير موجود" });
        continue;
      }

      const newBalance = Math.max(0, target.points + amount);
      const actualDelta = newBalance - target.points;

      await db.$transaction([
        db.user.update({
          where: { id: userId },
          data: { points: newBalance },
        }),
        db.pointsLedger.create({
          data: {
            userId,
            amount: actualDelta,
            type: "ADJUST",
            reason: reason.trim(),
            adminId: user.id,
            balanceAfter: newBalance,
            metadata: JSON.stringify({ adminName: user.name ?? "" }),
          },
        }),
        db.auditLog.create({
          data: {
            actorId: user.id,
            action: "economy.points.adjust",
            entity: "User",
            entityId: userId,
            severity: actualDelta < 0 ? "warning" : "info",
            metadata: JSON.stringify({ amount: actualDelta, reason, balanceAfter: newBalance }),
          },
        }),
      ]);

      results.push({ userId, ok: true, balanceAfter: newBalance });
    } catch (err) {
      results.push({
        userId,
        ok: false,
        balanceAfter: 0,
        message: err instanceof Error ? err.message : "خطأ غير معروف",
      });
    }
  }

  const successCount = results.filter((r) => r.ok).length;
  return NextResponse.json({
    success: true,
    message: `تم تعديل نقاط ${successCount} من ${userIds.length} مستخدم`,
    results,
  });
}
