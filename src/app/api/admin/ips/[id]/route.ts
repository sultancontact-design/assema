// ===================================================================
//  /api/admin/ips/[id] — تحديث/حذف IP
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "admin.settings")) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    isActive?: boolean;
    note?: string;
  };

  const existing = await db.allowedIP.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }

  const updated = await db.allowedIP.update({
    where: { id },
    data: {
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      ...(body.note !== undefined ? { note: body.note } : {}),
    },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "admin.ip.updated",
      entity: "AllowedIP",
      entityId: id,
      metadata: JSON.stringify({ before: existing, after: updated }),
      severity: "info",
    },
  });

  return NextResponse.json({ success: true, ip: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "admin.settings")) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.allowedIP.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }

  await db.allowedIP.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "admin.ip.deleted",
      entity: "AllowedIP",
      entityId: id,
      metadata: JSON.stringify({ ip: existing.ip }),
      severity: "warning",
    },
  });

  return NextResponse.json({ success: true });
}
