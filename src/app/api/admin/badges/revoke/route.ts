// ===================================================================
//  POST /api/admin/badges/revoke
//  سحب شارة من مستخدم (يحذف UserBadge، يُنقص currentRecipients)
//  SUPER_ADMIN فقط
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RevokeBody {
  userId: string;
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

  let body: RevokeBody;
  try {
    body = (await req.json()) as RevokeBody;
  } catch {
    return NextResponse.json({ error: "جسم الطلب غير صالح" }, { status: 400 });
  }

  const { userId, badgeId, reason } = body;
  if (!userId || !badgeId) {
    return NextResponse.json({ error: "معرّف المستخدم والشارة مطلوبان" }, { status: 400 });
  }

  const existing = await db.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId } },
  });
  if (!existing) {
    return NextResponse.json({ error: "الشارة غير ممنوحة لهذا المستخدم" }, { status: 404 });
  }

  const badge = await db.badge.findUnique({ where: { id: badgeId } });

  await db.$transaction([
    db.userBadge.delete({
      where: { userId_badgeId: { userId, badgeId } },
    }),
    db.badge.update({
      where: { id: badgeId },
      data: { currentRecipients: { decrement: 1 } },
    }),
    db.auditLog.create({
      data: {
        actorId: user.id,
        action: "badge.revoke",
        entity: "UserBadge",
        entityId: badgeId,
        severity: "warning",
        metadata: JSON.stringify({
          userId,
          badgeName: badge?.name ?? "",
          reason,
        }),
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: "تم سحب الشارة بنجاح",
  });
}
