// POST: شراء منتج بالنقاط
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const { id } = await params;
  const item = await db.storeItem.findUnique({ where: { id } });
  if (!item || !item.isActive) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (user.points < item.pricePoints) return NextResponse.json({ error: "رصيد غير كافٍ" }, { status: 400 });

  const result = await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { points: { decrement: item.pricePoints } } });
    const order = await tx.storeOrder.create({ data: { userId: user.id, itemId: item.id, pricePaid: item.pricePoints, status: "completed" } });
    await tx.pointsLedger.create({ data: { userId: user.id, amount: -item.pricePoints, reason: `purchase:${item.name}` } });
    if (item.stock !== null) await tx.storeItem.update({ where: { id: item.id }, data: { stock: { decrement: 1 } } });
    return { order };
  });
  return NextResponse.json({ success: true, orderId: result.order.id, pricePaid: item.pricePoints, remainingPoints: user.points - item.pricePoints });
}
