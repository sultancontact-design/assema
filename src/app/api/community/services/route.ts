import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const services = await db.service.findMany({ where: { isActive: true }, orderBy: [{ isVerified: "desc" }, { rating: "desc" }], take: 50, include: { _count: { select: { serviceReviews: true } } } });
  return NextResponse.json(services);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const { title, titleAr, description, category, phone, whatsapp, address, price } = await request.json();
  if (!title?.trim() || !description?.trim() || !category) return NextResponse.json({ error: "العنوان والوصف والفئة مطلوبة" }, { status: 400 });
  const svc = await db.service.create({ data: { title: title.trim(), titleAr: titleAr?.trim() || title.trim(), description: description.trim(), category, phone, whatsapp, address, price, providerId: user.id, districtId: user.districtId } });
  return NextResponse.json({ success: true, id: svc.id }, { status: 201 });
}
