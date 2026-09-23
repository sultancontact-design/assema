// ===================================================================
//  /api/admin/store/items/[id]
//  PATCH  — تحديث عنصر متجر
//  DELETE — حذف عنصر متجر
//  SUPER_ADMIN فقط
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["FREEZE", "BADGE", "DISCOUNT", "FEATURE", "DIGITAL"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "جسم الطلب غير صالح" }, { status: 400 });
  }

  const existing = await db.storeItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "العنصر غير موجود" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim().length >= 2) {
    data.name = body.name.trim();
  }
  if (typeof body.description === "string") data.description = body.description.trim();
  if (typeof body.icon === "string") data.icon = body.icon;
  if (typeof body.pricePoints === "number" && Number.isInteger(body.pricePoints) && body.pricePoints > 0) {
    data.pricePoints = body.pricePoints;
  }
  if (typeof body.type === "string" && VALID_TYPES.includes(body.type)) {
    data.type = body.type;
  }
  if (body.stock === null || body.stock === undefined) {
    // skip — keep current
  } else if (typeof body.stock === "number" && body.stock >= 0) {
    data.stock = body.stock;
  }
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.metadata === "string") data.metadata = body.metadata;

  const updated = await db.storeItem.update({ where: { id }, data });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "store.item.update",
      entity: "StoreItem",
      entityId: id,
      severity: "info",
      metadata: JSON.stringify({ fields: Object.keys(data) }),
    },
  });

  return NextResponse.json({ success: true, item: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const existing = await db.storeItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "العنصر غير موجود" }, { status: 404 });
  }

  await db.storeItem.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "store.item.delete",
      entity: "StoreItem",
      entityId: id,
      severity: "warning",
      metadata: JSON.stringify({ name: existing.name }),
    },
  });

  return NextResponse.json({ success: true });
}
