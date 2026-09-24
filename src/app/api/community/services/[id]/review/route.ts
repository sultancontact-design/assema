import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const { id } = await params;
  const { rating, comment } = await request.json();
  if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: "التقييم بين 1 و 5" }, { status: 400 });
  try {
    await db.serviceReview.create({ data: { serviceId: id, userId: user.id, rating, comment: comment?.trim() || null } });
    const reviews = await db.serviceReview.findMany({ where: { serviceId: id } });
    const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await db.service.update({ where: { id }, data: { rating: avgRating, reviews: reviews.length } });
    return NextResponse.json({ success: true, rating: avgRating, count: reviews.length }, { status: 201 });
  } catch { return NextResponse.json({ error: "سبق وقيّمت هذه الخدمة" }, { status: 409 }); }
}
