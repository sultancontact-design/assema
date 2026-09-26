// GET: قائمة المنتجات النشطة (عمومي)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const where: Record<string, unknown> = { isActive: true };
  if (type && type !== "ALL") where.type = type;
  const items = await db.storeItem.findMany({ where, orderBy: [{ type: "asc" }, { pricePoints: "asc" }] });
  return NextResponse.json({ items, count: items.length });
}
