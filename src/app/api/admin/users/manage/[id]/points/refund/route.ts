// ===================================================================
//  POST /api/admin/users/manage/[id]/points/refund
//  استرداد نقاط من مستخدم (SUPER_ADMIN) — يُنشئ PointsPurchase (status=REFUNDED) + AuditLog
//  الأدمن يسترجع النقاط ويعيد المال للمستخدم
// ===================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
    }

    const { id } = await params;
    let body: { amount?: unknown; reason?: unknown; refundAmount?: unknown };
    try {
      body = await request.json() as { amount?: unknown; reason?: unknown; refundAmount?: unknown };
    } catch {
      return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
    }

    const amount = typeof body.amount === "number" ? body.amount : parseInt(String(body.amount), 10);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
      return NextResponse.json({ error: "عدد النقاط يجب أن يكون موجباً" }, { status: 400 });
    }

    const refundAmount = typeof body.refundAmount === "number" ? body.refundAmount : 0;
    const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : "استرداد من الأدمن";

    const result = await db.$transaction(async (tx) => {
      const freshUser = await tx.user.findUnique({
        where: { id },
        select: { id: true, points: true, fullName: true },
      });
      if (!freshUser) throw new Error("المستخدم غير موجود");

      if (freshUser.points < amount) {
        throw new Error(`رصيد المستخدم ${freshUser.points} نقطة — لا يمكن استرداد ${amount}`);
      }

      // 1) إنشاء سجل استرداد (REFUNDED status)
      const refund = await tx.pointsPurchase.create({
        data: {
          userId: id,
          amount: -amount,
          pricePaid: -refundAmount,
          method: "REFUND",
          status: "REFUNDED",
          adminId: admin.id,
          completedAt: new Date(),
          metadata: JSON.stringify({ adminName: admin.name, reason, previousBalance: freshUser.points }),
        },
        select: { id: true },
      });

      // 2) خصم النقاط من المستخدم
      const updated = await tx.user.update({
        where: { id },
        data: { points: { decrement: amount } },
        select: { points: true },
      });

      const newBalance = updated.points;

      // 3) كتابة في الـledger
      await tx.pointsLedger.create({
        data: {
          userId: id,
          amount: -amount,
          type: "REFUND",
          reason: `refund:${reason} (refund:${refund.id})`,
          balanceAfter: newBalance,
          adminId: admin.id,
          metadata: JSON.stringify({
            refundId: refund.id,
            refundAmount,
            reason,
            adminName: admin.name,
          }),
        },
      });

      // 4) AuditLog
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "admin.points.refund",
          entity: "User",
          entityId: id,
          severity: "warn",
          metadata: JSON.stringify({
            amount,
            refundAmount,
            reason,
            refundId: refund.id,
            newBalance,
            userName: freshUser.fullName,
          }),
        },
      }).catch(() => {});

      return {
        refundId: refund.id,
        newBalance,
        refunded: amount,
        refundAmount,
        userName: freshUser.fullName,
      };
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[admin/points/refund] error:", error);
    const msg = error instanceof Error ? error.message : "فشل";
    const status = msg.includes("لا يمكن") || msg.includes("غير موجود") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
