// ===================================================================
//  DELETE /api/admin/challenges/delete?id=CHALLENGE_ID
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
    return NextResponse.json({ error: "صلاحية مشرف عام مطلوبة" }, { status: 403 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "المعرّف مطلوب" }, { status: 400 });
  }

  const existing = await db.challenge.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }

  await db.challenge.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "challenge.delete",
      entity: "Challenge",
      entityId: id,
      severity: "warning",
      metadata: JSON.stringify({ title: existing.title }),
    },
  });

  return NextResponse.json({ success: true });
}
