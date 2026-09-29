import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const district = searchParams.get("district");

    const where: Record<string, unknown> = { deletedAt: null, status: "ACTIVE" };
    if (q) where.OR = [{ fullName: { contains: q } }, { email: { contains: q } }];
    if (district) where.districtId = district;

    const users = await db.user.findMany({
      where,
      select: {
        id: true, fullName: true, avatar: true, points: true, level: true,
        followersCount: true, followingCount: true,
        district: { select: { name: true, nameAr: true } },
      },
      orderBy: { followersCount: "desc" },
      take: 50,
    });

    const serialized = users.map(u => ({
      ...u,
      districtName: u.district?.nameAr ?? u.district?.name ?? null,
      isFollowing: false, // will be checked client-side
    }));

    return NextResponse.json({ users: serialized, currentUserId: user?.id ?? null });
  } catch (error) {
    console.error("[users/list] error:", error);
    return NextResponse.json({ users: [] }, { status: 500 });
  }
}
