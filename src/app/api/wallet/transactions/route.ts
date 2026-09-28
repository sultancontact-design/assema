import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });

  let wallet = await db.wallet.findUnique({ where: { userId: user.id } });
  if (!wallet) {
    wallet = await db.wallet.create({ data: { userId: user.id } });
  }

  const txns = await db.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, type: true, amount: true, currency: true, status: true, description: true, createdAt: true },
  });

  return NextResponse.json({
    transactions: txns.map(t => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}
