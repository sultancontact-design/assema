// ===================================================================
//  POST /api/admin/challenges/update
//  تحديث حالة تحدٍّ (مثلاً إنهاء مبكر)
//  SUPER_ADMIN فقط
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Body {
  id: string;
  status?: string;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
  }
  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "صلاحية مشرف عام مطلوبة" }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "جسم غير صالح" }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "المعرّف مطلوب" }, { status: 400 });
  }
  if (!body.status || !["active", "expired", "completed"].includes(body.status)) {
    return NextResponse.json({ error: "الحالة غير صالحة" }, { status: 400 });
  }

  const existing = await db.challenge.findUnique({ where: { id: body.id } });
  if (!existing) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }

  const updated = await db.challenge.update({
    where: { id: body.id },
    data: { status: body.status },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "challenge.update",
      entity: "Challenge",
      entityId: body.id,
      severity: "info",
      metadata: JSON.stringify({ previous: existing.status, next: body.status }),
    },
  });

  return NextResponse.json({ success: true, challenge: updated });
}
