import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const conversations = await db.directMessage.findMany({
    where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
    include: { sender: { select: { id: true, fullName: true } }, receiver: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(conversations);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const { receiverId, content } = await request.json();
  if (!receiverId || !content?.trim()) return NextResponse.json({ error: "المرسل إليه والمحتوى مطلوبان" }, { status: 400 });
  const msg = await db.directMessage.create({
    data: { senderId: user.id, receiverId, content: content.trim() },
  });
  return NextResponse.json({ success: true, id: msg.id }, { status: 201 });
}
