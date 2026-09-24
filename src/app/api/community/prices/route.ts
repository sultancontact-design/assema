import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = ["VEGETABLE", "FRUIT", "MEAT", "GRAIN", "DAIRY", "OTHER"];

export async function GET() {
  const prices = await db.marketPrice.findMany({
    where: { isActive: true },
    orderBy: { reportedAt: "desc" },
    take: 50,
  });
  return NextResponse.json(prices);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرّح — سجّل الدخول أولاً" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }

  const productName = String(body.productName ?? "").trim();
  const productNameAr = String(body.productNameAr ?? "").trim();
  const category = String(body.category ?? "").trim().toUpperCase();
  const priceRaw = body.price;
  const market = body.market ? String(body.market).trim() : null;
  const unit = body.unit ? String(body.unit).trim() : "درهم/كغ";

  // تحقّق
  if (!productNameAr && !productName) {
    return NextResponse.json(
      { error: "اسم المنتج مطلوب (بالعربية على الأقل)" },
      { status: 400 },
    );
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: `الفئة غير صالحة. المسموح: ${VALID_CATEGORIES.join(", ")}` },
      { status: 400 },
    );
  }
  const price = typeof priceRaw === "string" ? parseFloat(priceRaw) : typeof priceRaw === "number" ? priceRaw : NaN;
  if (!isFinite(price) || price <= 0) {
    return NextResponse.json(
      { error: "السعر يجب أن يكون رقماً موجباً" },
      { status: 400 },
    );
  }
  // حدّ أعلى معقول للسعر (مثلاً 1000 درهم/الوحدة)
  if (price > 10000) {
    return NextResponse.json(
      { error: "السعر خارج الحدود المعقولة" },
      { status: 400 },
    );
  }

  const finalName = productName || productNameAr;

  const mp = await db.marketPrice.create({
    data: {
      productName: finalName,
      productNameAr: productNameAr || finalName,
      category,
      price,
      market,
      unit,
      source: "user",
      reportedBy: user.id,
      districtId: user.districtId ?? null,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({ success: true, id: mp.id }, { status: 201 });
}
