import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const existing = await db.commentLike.findUnique({ where: { commentId_userId: { commentId: id, userId: user.id } } });
    if (existing) {
      await db.commentLike.delete({ where: { commentId_userId: { commentId: id, userId: user.id } } });
      await db.comment.update({ where: { id }, data: { likes: { decrement: 1 } } });
      return NextResponse.json({ liked: false });
    }
    await db.commentLike.create({ data: { commentId: id, userId: user.id } });
    await db.comment.update({ where: { id }, data: { likes: { increment: 1 } } });
    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error("[comment like] error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
