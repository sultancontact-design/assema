import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = ["VEGETABLE", "FRUIT", "MEAT", "GRAIN", "DAIRY"];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح — سجّل الدخول" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }

  const productName = String(body.productName ?? "").trim();
  const productNameAr = String(body.productNameAr ?? "").trim();
  const category = String(body.category ?? "").toUpperCase();
  const priceRaw = body.price;
  const unit = body.unit ? String(body.unit) : "درهم/كغ";
  const marketName = body.marketName ? String(body.marketName) : null;
  const notes = body.notes ? String(body.notes) : null;

  if (!productNameAr && !productName) {
    return NextResponse.json({ error: "اسم المنتج مطلوب" }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "الفئة غير صالحة" }, { status: 400 });
  }
  const price = typeof priceRaw === "string" ? parseFloat(priceRaw) : typeof priceRaw === "number" ? priceRaw : NaN;
  if (!isFinite(price) || price <= 0 || price > 10000) {
    return NextResponse.json({ error: "السعر غير صالح" }, { status: 400 });
  }

  const record = await db.priceReport.create({
    data: {
      userId: user.id,
      productName: productName || productNameAr,
      productNameAr: productNameAr || productName,
      category,
      price,
      unit,
      marketName,
      notes,
      districtId: user.districtId,
      status: "PENDING",
    },
  });

  // AuditLog
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "contribution.priceReport.submitted",
      entity: "PriceReport",
      entityId: record.id,
      severity: "info",
      metadata: JSON.stringify({ productName: record.productName, price, category }),
    },
  }).catch(() => null);

  return NextResponse.json({ success: true, id: record.id }, { status: 201 });
}
