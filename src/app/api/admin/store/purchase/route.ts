// ===================================================================
//  POST /api/admin/store/purchase
//  شراء عنصر بالنيابة عن مستخدم (يخصم النقاط، يُنشئ StoreOrder، يُحدّث المخزون)
//  SUPER_ADMIN فقط
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface PurchaseBody {
  userId: string;
  itemId: string;
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

  let body: PurchaseBody;
  try {
    body = (await req.json()) as PurchaseBody;
  } catch {
    return NextResponse.json({ error: "جسم الطلب غير صالح" }, { status: 400 });
  }

  const { userId, itemId } = body;
  if (!userId || !itemId) {
    return NextResponse.json({ error: "معرّفا المستخدم والعنصر مطلوبان" }, { status: 400 });
  }

  const [target, item] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { id: true, fullName: true, points: true } }),
    db.storeItem.findUnique({ where: { id: itemId } }),
  ]);

  if (!target) {
    return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
  }
  if (!item) {
    return NextResponse.json({ error: "العنصر غير موجود" }, { status: 404 });
  }
  if (!item.isActive) {
    return NextResponse.json({ error: "العنصر غير مُفعّل" }, { status: 400 });
  }
  if (item.stock !== null && item.stock <= 0) {
    return NextResponse.json({ error: "المخزون نفد" }, { status: 400 });
  }
  if (target.points < item.pricePoints) {
    return NextResponse.json({ error: "رصيد النقاط غير كافٍ" }, { status: 400 });
  }

  // معاملة موحّدة: خصم النقاط + سجلّ نقاط + سجلّ طلب + تحديث المخزون + سجلّ تدقيق
  const newBalance = target.points - item.pricePoints;

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { points: newBalance },
    }),
    db.pointsLedger.create({
      data: {
        userId,
        amount: -item.pricePoints,
        type: "PURCHASE",
        reason: `شراء من المتجر: ${item.name}`,
        adminId: user.id,
        balanceAfter: newBalance,
        metadata: JSON.stringify({ itemId, itemName: item.name }),
      },
    }),
    db.storeOrder.create({
      data: {
        userId,
        itemId,
        pricePaid: item.pricePoints,
        status: "completed",
        metadata: JSON.stringify({ adminId: user.id }),
      },
    }),
    ...(item.stock !== null
      ? [
          db.storeItem.update({
            where: { id: itemId },
            data: { stock: { decrement: 1 } },
          }),
        ]
      : []),
    db.auditLog.create({
      data: {
        actorId: user.id,
        action: "store.purchase",
        entity: "StoreOrder",
        entityId: itemId,
        severity: "info",
        metadata: JSON.stringify({
          userId,
          itemId,
          itemName: item.name,
          pricePaid: item.pricePoints,
        }),
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: `تم شراء "${item.name}" بنجاح لـ${target.fullName}`,
    balanceAfter: newBalance,
  });
}
