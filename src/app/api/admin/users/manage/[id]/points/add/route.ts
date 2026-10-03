// ===================================================================
//  POST /api/admin/users/manage/[id]/points/add
//  إضافة نقاط لمستخدم (SUPER_ADMIN only) — معاملة ذرّية + AuditLog + PointsLedger
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

    const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : "إضافة يدوية من الأدمن";

    const result = await db.$transaction(async (tx) => {
      const freshUser = await tx.user.findUnique({
        where: { id },
        select: { id: true, points: true, fullName: true },
      });
      if (!freshUser) throw new Error("المستخدم غير موجود");

      const updated = await tx.user.update({
        where: { id },
        data: { points: { increment: amount } },
        select: { points: true },
      });

      const newBalance = updated.points;

      await tx.pointsLedger.create({
        data: {
          userId: id,
          amount: amount,
          type: "ADMIN_ADD",
          reason,
          balanceAfter: newBalance,
          adminId: admin.id,
          metadata: JSON.stringify({ adminName: admin.name, previousBalance: freshUser.points }),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "admin.points.add",
          entity: "User",
          entityId: id,
          severity: "info",
          metadata: JSON.stringify({ amount, reason, newBalance, userName: freshUser.fullName }),
        },
      }).catch(() => {});

      return { newBalance, added: amount, userName: freshUser.fullName };
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[admin/points/add] error:", error);
    const msg = error instanceof Error ? error.message : "فشل";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
