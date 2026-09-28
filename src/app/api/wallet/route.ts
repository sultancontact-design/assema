import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });

  // get or create wallet
  let wallet = await db.wallet.findUnique({ where: { userId: user.id } });
  if (!wallet) {
    wallet = await db.wallet.create({ data: { userId: user.id } });
  }

  return NextResponse.json({
    balance: wallet.balance,
    points: wallet.points,
    currency: wallet.currency,
    isActive: wallet.isActive,
  });
}
