import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const { id } = await params;
  const disc = await db.discussion.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, fullName: true } },
      replies: { include: { author: { select: { id: true, fullName: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!disc) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  await db.discussion.update({ where: { id }, data: { views: { increment: 1 } } });
  return NextResponse.json(disc);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const { id } = await params;
  const { content } = await request.json();
  if (!content?.trim()) return NextResponse.json({ error: "المحتوى مطلوب" }, { status: 400 });
  const reply = await db.discussionReply.create({
    data: { discussionId: id, authorId: user.id, content: content.trim() },
  });
  return NextResponse.json({ success: true, id: reply.id }, { status: 201 });
}
