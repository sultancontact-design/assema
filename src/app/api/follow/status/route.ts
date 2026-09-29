import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get("targetId");
    if (!targetId) return NextResponse.json({ following: false });

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ following: false });

    const existing = await db.follow.findFirst({
      where: { followerId: user.id, followingId: targetId, targetType: "USER" },
    });
    return NextResponse.json({ following: !!existing });
  } catch {
    return NextResponse.json({ following: false });
  }
}
