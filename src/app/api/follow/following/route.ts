import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ users: [] }, { status: 401 });

    const follows = await db.follow.findMany({
      where: { followerId: user.id, targetType: "USER" },
      select: {
        followingId: true,
        following: {
          select: { id: true, fullName: true, avatar: true, followersCount: true, level: true,
            district: { select: { name: true, nameAr: true } } },
        },
      },
      take: 50,
    });

    const users = follows.map(f => ({
      id: f.following.id,
      name: f.following.fullName,
      avatar: f.following.avatar,
      followersCount: f.following.followersCount,
      level: f.following.level,
      districtName: f.following.district?.nameAr ?? f.following.district?.name ?? null,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[following] error:", error);
    return NextResponse.json({ users: [] }, { status: 500 });
  }
}
