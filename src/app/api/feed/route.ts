import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const cursor = searchParams.get("cursor");
    const filter = searchParams.get("filter") || "ALL";

    const where: Record<string, unknown> = { visibility: { in: ["PUBLIC", "DISTRICT"] } };

    if (filter === "FOLLOWING" && user) {
      const follows = await db.follow.findMany({ where: { followerId: user.id, targetType: "USER" }, select: { followingId: true } });
      where.userId = { in: [...follows.map(f => f.followingId), user.id] };
    }

    if (cursor) where.createdAt = { lt: new Date(cursor) };

    const items = await db.feedItem.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, avatar: true, district: { select: { name: true, nameAr: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = items.length > limit;
    const feedItems = hasMore ? items.slice(0, -1) : items;
    const nextCursor = hasMore ? feedItems[feedItems.length - 1].createdAt.toISOString() : null;

    const serialized = feedItems.map(item => ({
      ...item,
      mediaUrls: JSON.parse(item.mediaUrls || "[]"),
      user: { id: item.user.id, name: item.user.fullName, avatar: item.user.avatar, district: { nameAr: item.user.district?.nameAr ?? item.user.district?.name } },
      createdAt: item.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, items: serialized, nextCursor });
  } catch (error) {
    console.error("[feed GET] error:", error);
    return NextResponse.json({ items: [], nextCursor: null }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { content, mediaUrls, type = "STATUS", visibility = "DISTRICT", targetId } = body;

    if (!content && (!mediaUrls || mediaUrls.length === 0))
      return NextResponse.json({ error: "محتوى فارغ" }, { status: 400 });

    const item = await db.feedItem.create({
      data: { userId: user.id, type, targetId: targetId || null, content: content || null, mediaUrls: JSON.stringify(mediaUrls || []), visibility, districtId: user.districtId },
      include: { user: { select: { id: true, fullName: true, avatar: true } } },
    });

    await db.user.update({ where: { id: user.id }, data: { points: { increment: 5 } } }).catch(() => {});

    return NextResponse.json({ success: true, item: { ...item, mediaUrls: JSON.parse(item.mediaUrls || "[]"), user: { id: item.user.id, name: item.user.fullName, avatar: item.user.avatar }, createdAt: item.createdAt.toISOString() } }, { status: 201 });
  } catch (error) {
    console.error("[feed POST] error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
