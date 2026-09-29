import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { followingId } = body;
    if (!followingId || followingId === user.id)
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });

    // Use the existing Follow model with targetType="USER"
    const existing = await db.follow.findFirst({
      where: { followerId: user.id, followingId, targetType: "USER" },
    });

    if (existing) {
      await db.follow.delete({ where: { id: existing.id } });
      await db.user.update({ where: { id: followingId }, data: { followersCount: { decrement: 1 } } }).catch(() => {});
      await db.user.update({ where: { id: user.id }, data: { followingCount: { decrement: 1 } } }).catch(() => {});
      return NextResponse.json({ following: false });
    }

    await db.follow.create({ data: { followerId: user.id, followingId, targetType: "USER" } });
    await db.user.update({ where: { id: followingId }, data: { followersCount: { increment: 1 } } }).catch(() => {});
    await db.user.update({ where: { id: user.id }, data: { followingCount: { increment: 1 } } }).catch(() => {});
    return NextResponse.json({ following: true });
  } catch (error) {
    console.error("[follow] error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
