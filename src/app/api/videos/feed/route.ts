import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") || "30");
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: { isActive: boolean; isApproved: boolean; category?: string } = {
    isActive: true,
    isApproved: true,
  };
  if (category) where.category = category;

  const videos = await db.video.findMany({
    where,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: limit,
    skip: offset,
    include: { user: { select: { fullName: true } } },
  });

  const serialized = videos.map(v => ({
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
    user: { fullName: v.user.fullName },
  }));

  return NextResponse.json({ videos: serialized, count: serialized.length });
}
