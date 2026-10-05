// ===================================================================
//  POST /api/admin/users/manage/[id]/points/remove
//  خصم نقاط من مستخدم (SUPER_ADMIN only) — معاملة ذرّية + AuditLog + PointsLedger
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
    let body: { amount?: unknown; reason?: unknown };
    try {
      body = await request.json() as { amount?: unknown; reason?: unknown };
    } catch {
      return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
    }

    const amount = typeof body.amount === "number" ? body.amount : parseInt(String(body.amount), 10);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
      return NextResponse.json({ error: "المبلغ يجب أن يكون عدداً موجباً" }, { status: 400 });
    }

    const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : "خصم يدوي من الأدمن";

    const result = await db.$transaction(async (tx) => {
      const freshUser = await tx.user.findUnique({
        where: { id },
        select: { id: true, points: true, fullName: true },
      });
      if (!freshUser) throw new Error("المستخدم غير موجود");

      if (freshUser.points < amount) {
        throw new Error(`رصيد المستخدم ${freshUser.points} نقطة — لا يمكن خصم ${amount}`);
      }

      const updated = await tx.user.update({
        where: { id },
        data: { points: { decrement: amount } },
        select: { points: true },
      });

      const newBalance = updated.points;

      await tx.pointsLedger.create({
        data: {
          userId: id,
          amount: -amount,
          type: "ADMIN_REMOVE",
          reason,
          balanceAfter: newBalance,
          adminId: admin.id,
          metadata: JSON.stringify({ adminName: admin.name, previousBalance: freshUser.points }),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "admin.points.remove",
          entity: "User",
          entityId: id,
          severity: "warn",
          metadata: JSON.stringify({ amount, reason, newBalance, userName: freshUser.fullName }),
        },
      }).catch(() => {});

      return { newBalance, removed: amount, userName: freshUser.fullName };
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[admin/points/remove] error:", error);
    const msg = error instanceof Error ? error.message : "فشل";
    const status = msg.includes("لا يمكن") || msg.includes("غير موجود") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
