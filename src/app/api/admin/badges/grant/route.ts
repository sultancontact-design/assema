// ===================================================================
//  POST /api/admin/badges/grant
//  منح شارة لمستخدم (يُنشئ UserBadge، ويُزيد Badge.currentRecipients)
//  SUPER_ADMIN فقط
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface GrantBody {
  userIds: string[];
  badgeId: string;
  reason?: string;
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

  let body: GrantBody;
  try {
    body = (await req.json()) as GrantBody;
  } catch {
    return NextResponse.json({ error: "جسم الطلب غير صالح" }, { status: 400 });
  }

  const { userIds, badgeId, reason } = body;
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "اختر مستخدماً واحداً على الأقل" }, { status: 400 });
  }
  if (!badgeId) {
    return NextResponse.json({ error: "الشارة مطلوبة" }, { status: 400 });
  }

  const badge = await db.badge.findUnique({ where: { id: badgeId } });
  if (!badge) {
    return NextResponse.json({ error: "الشارة غير موجودة" }, { status: 404 });
  }

  // فحص الندرة: إن كان لها حدّ، لا تتجاوزه
  if (badge.maxRecipients !== null) {
    const current = await db.userBadge.count({ where: { badgeId } });
    if (current + userIds.length > badge.maxRecipients) {
      return NextResponse.json(
        {
          error: `تجاوز الحد الأقصى للمستفيدين (${badge.maxRecipients}). المتبقّي: ${badge.maxRecipients - current}`,
        },
        { status: 400 }
      );
    }
  }

  const results: Array<{ userId: string; ok: boolean; message?: string }> = [];
  for (const userId of userIds) {
    try {
      // تحقّق من التكرار
      const existing = await db.userBadge.findUnique({
        where: { userId_badgeId: { userId, badgeId } },
      });
      if (existing) {
        results.push({ userId, ok: false, message: "المستخدم يملك هذه الشارة بالفعل" });
        continue;
      }

      await db.$transaction([
        db.userBadge.create({
          data: { userId, badgeId },
        }),
        db.badge.update({
          where: { id: badgeId },
          data: { currentRecipients: { increment: 1 } },
        }),
        db.userActivity.create({
          data: {
            userId,
            type: "BADGE_EARNED",
            description: `منح شارة ${badge.name}${reason ? ` — ${reason}` : ""}`,
            metadata: JSON.stringify({ badgeId, adminId: user.id }),
            isPublic: true,
          },
        }),
        db.auditLog.create({
          data: {
            actorId: user.id,
            action: "badge.grant",
            entity: "UserBadge",
            entityId: badgeId,
            severity: "info",
            metadata: JSON.stringify({ userId, badgeName: badge.name, reason }),
          },
        }),
      ]);

      results.push({ userId, ok: true });
    } catch (err) {
      results.push({
        userId,
        ok: false,
        message: err instanceof Error ? err.message : "خطأ غير معروف",
      });
    }
  }

  const successCount = results.filter((r) => r.ok).length;
  return NextResponse.json({
    success: true,
    message: `تم منح الشارة لـ${successCount} من ${userIds.length} مستخدم`,
    results,
  });
}
