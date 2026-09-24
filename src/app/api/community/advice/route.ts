import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const advice = await db.advice.findMany({ where: { isPublic: true }, orderBy: { createdAt: "desc" }, take: 30 });
  return NextResponse.json(advice);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const { title, content, category } = await request.json();
  if (!title?.trim() || !content?.trim()) return NextResponse.json({ error: "العنوان والمحتوى مطلوبان" }, { status: 400 });
  const adv = await db.advice.create({ data: { title: title.trim(), content: content.trim(), category: category || "FAMILY", authorId: user.id, isPublic: true } });
  return NextResponse.json({ success: true, id: adv.id }, { status: 201 });
}
