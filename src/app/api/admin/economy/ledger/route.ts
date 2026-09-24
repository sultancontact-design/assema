// ===================================================================
//  GET /api/admin/economy/ledger
//  قائمة سجلّات النقاط مع فلاتر (type, userId, dateRange)
//  SUPER_ADMIN فقط
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || undefined;
  const userId = url.searchParams.get("userId") || undefined;
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const search = url.searchParams.get("search") || undefined;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 200), 500);
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));

  const where: Record<string, unknown> = {};
  if (type && type !== "ALL") where.type = type;
  if (userId) where.userId = userId;
  if (search) {
    where.OR = [
      { reason: { contains: search, mode: "insensitive" } },
      { user: { fullName: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (from || to) {
    const gte = from ? new Date(from) : undefined;
    const lte = to ? new Date(`${to}T23:59:59.999Z`) : undefined;
    where.createdAt = {};
    if (gte) (where.createdAt as { gte?: Date }).gte = gte;
    if (lte) (where.createdAt as { lte?: Date }).lte = lte;
  }

  const [rows, total] = await Promise.all([
    db.pointsLedger.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    db.pointsLedger.count({ where }),
  ]);

  return NextResponse.json({
    rows: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userFullName: r.user?.fullName ?? "—",
      userEmail: r.user?.email ?? "—",
      userRole: r.user?.role ?? "MEMBER",
      amount: r.amount,
      type: r.type,
      reason: r.reason,
      balanceAfter: r.balanceAfter,
      adminId: r.adminId,
      metadata: r.metadata,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
    offset,
    limit,
  });
}
