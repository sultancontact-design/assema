// ===================================================================
//  GET /api/admin/points/ledger
//  سجل معاملات النقاط (SUPER_ADMIN) — يدعم pagination + فلترة بـuserId
// ===================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      db.pointsLedger.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          userId: true,
          amount: true,
          type: true,
          reason: true,
          balanceAfter: true,
          adminId: true,
          metadata: true,
          createdAt: true,
          user: { select: { id: true, fullName: true, email: true } },
        },
      }),
      db.pointsLedger.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error("[admin/points/ledger] error:", error);
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
