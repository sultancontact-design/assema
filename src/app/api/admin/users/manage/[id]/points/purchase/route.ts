// ===================================================================
//  POST /api/admin/users/manage/[id]/points/purchase
//  بيع نقاط لمستخدم (SUPER_ADMIN) — يُنشئ PointsPurchase + AuditLog
//  المستخدم يدفع بالدرهم (CASH/BANK_TRANSFER/CMI) ويستلم نقاطاً
// ===================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VALID_METHODS = ["CASH", "BANK_TRANSFER", "CMI"];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
    }

    const { id } = await params;
    let body: { amount?: unknown; pricePaid?: unknown; method?: unknown; note?: unknown };
    try {
      body = await request.json() as { amount?: unknown; pricePaid?: unknown; method?: unknown; note?: unknown };
    } catch {
      return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
    }

    const amount = typeof body.amount === "number" ? body.amount : parseInt(String(body.amount), 10);
    const pricePaid = typeof body.pricePaid === "number" ? body.pricePaid : parseFloat(String(body.pricePaid));
    const method = typeof body.method === "string" ? body.method.toUpperCase() : "CASH";
    const note = typeof body.note === "string" ? body.note : "";

    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
      return NextResponse.json({ error: "عدد النقاط يجب أن يكون موجباً" }, { status: 400 });
    }
    if (!Number.isFinite(pricePaid) || pricePaid < 0) {
      return NextResponse.json({ error: "السعر يجب أن يكون عدداً غير سالب" }, { status: 400 });
    }
    if (!VALID_METHODS.includes(method)) {
      return NextResponse.json({ error: `طريقة الدفع غير صالحة: ${method}` }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      const freshUser = await tx.user.findUnique({
        where: { id },
        select: { id: true, points: true, fullName: true },
      });
      if (!freshUser) throw new Error("المستخدم غير موجود");

      // 1) إنشاء سجل شراء (PENDING first)
      const purchase = await tx.pointsPurchase.create({
        data: {
          userId: id,
          amount,
          pricePaid,
          method,
          status: "COMPLETED",
          adminId: admin.id,
          completedAt: new Date(),
          metadata: JSON.stringify({ adminName: admin.name, note, previousBalance: freshUser.points }),
        },
        select: { id: true },
      });

      // 2) إضافة النقاط للمستخدم
      const updated = await tx.user.update({
        where: { id },
        data: { points: { increment: amount } },
        select: { points: true },
      });

      const newBalance = updated.points;

      // 3) كتابة في الـledger
      await tx.pointsLedger.create({
        data: {
          userId: id,
          amount,
          type: "PURCHASE",
          reason: `purchase:${method} (order:${purchase.id})`,
          balanceAfter: newBalance,
          adminId: admin.id,
          metadata: JSON.stringify({
            orderId: purchase.id,
            pricePaid,
            method,
            note,
            adminName: admin.name,
          }),
        },
      });

      // 4) AuditLog
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "admin.points.purchase",
          entity: "User",
          entityId: id,
          severity: "info",
          metadata: JSON.stringify({
            amount,
            pricePaid,
            method,
            orderId: purchase.id,
            newBalance,
            userName: freshUser.fullName,
          }),
        },
      }).catch(() => {});

      return {
        orderId: purchase.id,
        newBalance,
        amount,
        pricePaid,
        method,
        userName: freshUser.fullName,
      };
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[admin/points/purchase] error:", error);
    const msg = error instanceof Error ? error.message : "فشل";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
