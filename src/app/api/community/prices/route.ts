import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const prices = await db.marketPrice.findMany({ where: { isActive: true }, orderBy: { reportedAt: "desc" }, take: 50 });
  return NextResponse.json(prices);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const { productName, productNameAr, category, price, market, unit } = await request.json();
  if (!productName?.trim() || !price || !category) return NextResponse.json({ error: "المنتج والسعر والفئة مطلوبة" }, { status: 400 });
  const mp = await db.marketPrice.create({ data: { productName: productName.trim(), productNameAr: productNameAr?.trim() || productName.trim(), category, price: parseFloat(price), market, unit: unit || "درهم/كغ", source: "user", reportedBy: user.id, districtId: user.districtId, validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
  return NextResponse.json({ success: true, id: mp.id }, { status: 201 });
}
