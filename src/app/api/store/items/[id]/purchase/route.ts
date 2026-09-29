// ===================================================================
//  POST /api/store/items/[id]/purchase
//  شراء منتج بالنقاط — معاملة ذرّية (atomic)
//  v58.0:
//  - يجلب user.points من DB (لا يعتمد على session)
//  - يتحقق من الرصيد داخل المعاملة (race-safe)
//  - يكتب PointsLedger بكل الحقول المطلوبة (type + balanceAfter)
//  - يُرجع الرصيد الجديد للتحديث الفوري في الواجهة
// ===================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // احصل على المستخدم + المنتج داخل المعاملة (race-safe)
    const result = await db.$transaction(async (tx) => {
      // 1) احصل على المنتج
      const item = await tx.storeItem.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          pricePoints: true,
          isActive: true,
          stock: true,
        },
      });

      if (!item || !item.isActive) {
        throw new Error("المنتج غير موجود أو غير متوفّر");
      }

      // 2) احصل على رصيد المستخدم الحالي (مباشرة من DB)
      const freshUser = await tx.user.findUnique({
        where: { id: sessionUser.id },
        select: { points: true },
      });
      if (!freshUser) {
        throw new Error("المستخدم غير موجود");
      }

      const currentPoints = freshUser.points;

      // 3) تحقق من الرصيد
      if (currentPoints < item.pricePoints) {
        throw new Error(
          `رصيدك ${currentPoints} نقطة — تحتاج ${item.pricePoints} نقطة`
        );
      }

      // 4) تحقق من المخزون (إن كان محدوداً)
      if (item.stock !== null && item.stock <= 0) {
        throw new Error("نفد المخزون من هذا المنتج");
      }

      // 5) خصم النقاط
      const updatedUser = await tx.user.update({
        where: { id: sessionUser.id },
        data: { points: { decrement: item.pricePoints } },
        select: { points: true },
      });

      const newBalance = updatedUser.points;

      // 6) أنشئ طلب الشراء
      const order = await tx.storeOrder.create({
        data: {
          userId: sessionUser.id,
          itemId: item.id,
          pricePaid: item.pricePoints,
          status: "completed",
        },
        select: { id: true },
      });

      // 7) اكتب في الـledger (كل الحقول المطلوبة)
      await tx.pointsLedger.create({
        data: {
          userId: sessionUser.id,
          amount: -item.pricePoints,
          type: "PURCHASE",
          reason: `purchase:${item.name}`,
          balanceAfter: newBalance,
          metadata: JSON.stringify({
            itemId: item.id,
            orderId: order.id,
          }),
        },
      });

      // 8) decrement stock if limited
      if (item.stock !== null) {
        await tx.storeItem.update({
          where: { id: item.id },
          data: { stock: { decrement: 1 } },
        });
      }

      // 9) اكتب audit log (non-critical)
      try {
        await tx.auditLog.create({
          data: {
            actorId: sessionUser.id,
            action: "store.purchase",
            entity: "StoreItem",
            entityId: item.id,
            severity: "info",
            metadata: JSON.stringify({
              price: item.pricePoints,
              orderId: order.id,
              newBalance,
            }),
          },
        });
      } catch {
        // تجاهل — audit log غير حرج
      }

      return {
        orderId: order.id,
        pricePaid: item.pricePoints,
        remainingPoints: newBalance,
        itemName: item.name,
      };
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[purchase] error:", error);

    const msg =
      error instanceof Error ? error.message : "فشل غير متوقّع في الشراء";

    // ميّز رسائل الخطأ المخصّصة (400) عن الأخطاء الداخلية (500)
    const isUserError = [
      "غير موجود",
      "غير متوفّر",
      "رصيدك",
      "تحتاج",
      "نفد المخزون",
      "المستخدم غير موجود",
    ].some((kw) => msg.includes(kw));

    return NextResponse.json(
      { error: msg },
      { status: isUserError ? 400 : 500 }
    );
  }
}
