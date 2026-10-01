import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ users: [] }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get("targetId") || user.id;

    const follows = await db.follow.findMany({
      where: { followingId: targetId, targetType: "USER" },
      select: {
        followerId: true,
        follower: {
          select: { id: true, fullName: true, avatar: true, followersCount: true, level: true,
            district: { select: { name: true, nameAr: true } } },
        },
      },
      take: 50,
    });

    const users = follows.map(f => ({
      id: f.follower.id,
      name: f.follower.fullName,
      avatar: f.follower.avatar,
      followersCount: f.follower.followersCount,
      level: f.follower.level,
      districtName: f.follower.district?.nameAr ?? f.follower.district?.name ?? null,
    }));

    return NextResponse.json({ users, currentUserId: user.id });
  } catch (error) {
    console.error("[followers] error:", error);
    return NextResponse.json({ users: [] }, { status: 500 });
  }
}
