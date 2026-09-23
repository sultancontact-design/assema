// ===================================================================
//  /api/admin/store/items
//  GET    — قائمة كل عناصر المتجر
//  POST   — إنشاء عنصر جديد
//  SUPER_ADMIN فقط
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["FREEZE", "BADGE", "DISCOUNT", "FEATURE", "DIGITAL"];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
  }
  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "هذا القسم يتطلب صلاحية مشرف عام" },
      { status: 403 }
    );
  }

  const items = await db.storeItem.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true } },
      orders: {
        where: { status: "completed" },
        select: { pricePaid: true },
      },
    },
  });

  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      icon: i.icon,
      pricePoints: i.pricePoints,
      type: i.type,
      stock: i.stock,
      isActive: i.isActive,
      metadata: i.metadata,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
      ordersCount: i._count.orders,
      revenue: i.orders.reduce((sum, o) => sum + o.pricePaid, 0),
    })),
  });
}

interface CreateBody {
  name: string;
  description: string;
  icon: string;
  pricePoints: number;
  type: string;
  stock?: number | null;
  isActive?: boolean;
  metadata?: string;
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

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "جسم الطلب غير صالح" }, { status: 400 });
  }

  const { name, description, icon, pricePoints, type, stock, isActive, metadata } = body;
  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "الاسم مطلوب (حرفان على الأقل)" }, { status: 400 });
  }
  if (!Number.isInteger(pricePoints) || pricePoints <= 0) {
    return NextResponse.json({ error: "السعر يجب أن يكون عدداً موجباً" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `النوع غير صالح (المسموح: ${VALID_TYPES.join(", ")})` },
      { status: 400 }
    );
  }

  const item = await db.storeItem.create({
    data: {
      name: name.trim(),
      description: description?.trim() ?? "",
      icon: icon || "🎁",
      pricePoints,
      type,
      stock: stock === null || stock === undefined ? null : Math.max(0, stock),
      isActive: isActive ?? true,
      metadata: metadata ?? null,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "store.item.create",
      entity: "StoreItem",
      entityId: item.id,
      severity: "info",
      metadata: JSON.stringify({ name: item.name, type, pricePoints }),
    },
  });

  return NextResponse.json({ success: true, item });
}
