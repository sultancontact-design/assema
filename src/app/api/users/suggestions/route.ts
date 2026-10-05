import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(20, parseInt(searchParams.get("limit") || "10"));

    // 1. من لا يتابعهم المستخدم حالياً
    const following = await db.follow.findMany({
      where: { followerId: user.id },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);
    const excludeIds = [...followingIds, user.id];

    // 2. أشخاص من نفس الحي (أبسط خوارزمية)
    const suggestions = await db.user.findMany({
      where: {
        id: { notIn: excludeIds },
        deletedAt: null,
        status: "ACTIVE",
        districtId: user.districtId,
      },
      orderBy: { points: "desc" },
      take: limit,
      select: {
        id: true, fullName: true, profession: true, points: true,
        district: { select: { nameAr: true, name: true } },
        followersCount: true,
      },
    });

    // 3. إذا لم يكفِ، أكمل بأشخاص من أحياء أخرى
    if (suggestions.length < limit) {
      const more = await db.user.findMany({
        where: {
          id: { notIn: [...excludeIds, ...suggestions.map((s) => s.id)] },
          deletedAt: null,
          status: "ACTIVE",
        },
        orderBy: { followersCount: "desc" },
        take: limit - suggestions.length,
        select: {
          id: true, fullName: true, profession: true, points: true,
          district: { select: { nameAr: true, name: true } },
          followersCount: true,
        },
      });
      suggestions.push(...more);
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("[users/suggestions] error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
