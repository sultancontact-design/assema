import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET — عام للقراءة فقط (بدون auth)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const userId = searchParams.get("userId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: { isActive: boolean; isApproved?: boolean; category?: string; userId?: string } = {
      isActive: true,
      isApproved: true,
    };
    if (category) where.category = category;
    if (userId) where.userId = userId;

    const videos = await db.video.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            district: { select: { name: true, nameAr: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const serialized = videos.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      sourceUrl: v.sourceUrl,
      sourcePlatform: v.sourcePlatform,
      thumbnailUrl: v.thumbnailUrl,
      views: v.views,
      likes: v.likes,
      comments: v.comments,
      shares: v.shares,
      category: v.category,
      createdAt: v.createdAt.toISOString(),
      user: {
        id: v.user.id,
        name: v.user.fullName,
        avatar: v.user.avatar,
        district: v.user.district ? { nameAr: v.user.district.nameAr ?? v.user.district.name } : null,
      },
    }));

    return NextResponse.json({ videos: serialized, count: serialized.length });
  } catch (error) {
    console.error("[videos/feed] error:", error);
    return NextResponse.json({ videos: [], error: "Internal error" });
  }
}
