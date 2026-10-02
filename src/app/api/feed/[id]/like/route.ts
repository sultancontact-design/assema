import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const existing = await db.like.findFirst({ where: { userId: user.id, targetType: "FEED_ITEM", targetId: id } });
    if (existing) {
      await db.like.delete({ where: { id: existing.id } });
      await db.feedItem.update({ where: { id }, data: { likes: { decrement: 1 } } });
      return NextResponse.json({ liked: false });
    }
    await db.like.create({ data: { userId: user.id, targetType: "FEED_ITEM", targetId: id } });
    await db.feedItem.update({ where: { id }, data: { likes: { increment: 1 } } });
    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error("[feed like] error:", error);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
