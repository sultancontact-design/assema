// ===================================================================
//  POST /api/admin/streaks/update
//  إجراءات السلاسل: تصفير فردي/جماعي، منح تجميد
//  SUPER_ADMIN فقط
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Body {
  userId?: string;
  userIds?: string[];
  action: "reset" | "grant_freeze" | "bulk_reset";
  reason?: string;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
  }
  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "هذا الإجراء يتطلب صلاحية مشرف عام" }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "جسم الطلب غير صالح" }, { status: 400 });
  }

  const ids: string[] = [];
  if (Array.isArray(body.userIds)) ids.push(...body.userIds);
  if (body.userId) ids.push(body.userId);
  if (ids.length === 0) {
    return NextResponse.json({ error: "حدّد مستخدماً واحداً على الأقل" }, { status: 400 });
  }

  let updated = 0;
  for (const userId of ids) {
    try {
      const existing = await db.userStreak.findUnique({ where: { userId } });
      if (!existing) continue;

      if (body.action === "reset" || body.action === "bulk_reset") {
        await db.$transaction([
          db.userStreak.update({
            where: { userId },
            data: { currentStreak: 0 },
          }),
          db.auditLog.create({
            data: {
              actorId: user.id,
              action: "streak.reset",
              entity: "UserStreak",
              entityId: userId,
              severity: "warning",
              metadata: JSON.stringify({
                reason: body.reason ?? "تصفير يدوي",
                previousStreak: existing.currentStreak,
              }),
            },
          }),
        ]);
        updated += 1;
      } else if (body.action === "grant_freeze") {
        await db.$transaction([
          db.userStreak.update({
            where: { userId },
            data: { freezes: { increment: 1 } },
          }),
          db.auditLog.create({
            data: {
              actorId: user.id,
              action: "streak.freeze.grant",
              entity: "UserStreak",
              entityId: userId,
              severity: "info",
              metadata: JSON.stringify({
                previousFreezes: existing.freezes,
              }),
            },
          }),
        ]);
        updated += 1;
      }
    } catch {
      // تجاهل هذا المستخدم وتابع
    }
  }

  if (body.action === "grant_freeze") {
    return NextResponse.json({ success: true, message: `تم منح تجميد لـ${updated} مستخدم` });
  }
  return NextResponse.json({
    success: true,
    message: `تم تصفير سلسلة ${updated} مستخدم`,
  });
}
