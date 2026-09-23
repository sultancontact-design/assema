import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const discussions = await db.discussion.findMany({
    include: { author: { select: { id: true, fullName: true } }, _count: { select: { replies: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json(discussions);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const { title, content, category } = await request.json();
  if (!title?.trim() || !content?.trim()) return NextResponse.json({ error: "العنوان والمحتوى مطلوبان" }, { status: 400 });
  const disc = await db.discussion.create({
    data: { title: title.trim(), content: content.trim(), authorId: user.id, category: category || "general" },
  });
  return NextResponse.json({ success: true, id: disc.id }, { status: 201 });
}
