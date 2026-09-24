// ===================================================================
//  DELETE /api/admin/badges/delete?id=BADGE_ID
//  حذف شارة (سيُحذف UserBadge المرتبط بها بسبب onDelete: Cascade)
//  SUPER_ADMIN فقط
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
  }
  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "هذا الإجراء يتطلب صلاحية مشرف عام" }, { status: 403 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "معرّف الشارة مطلوب" }, { status: 400 });
  }

  const existing = await db.badge.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "الشارة غير موجودة" }, { status: 404 });
  }

  await db.badge.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "badge.delete",
      entity: "Badge",
      entityId: id,
      severity: "warning",
      metadata: JSON.stringify({ name: existing.name }),
    },
  });

  return NextResponse.json({ success: true });
}
