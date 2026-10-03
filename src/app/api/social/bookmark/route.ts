import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// v61.0: GET — check if user has bookmarked a target + list user's bookmarks
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get("targetType");
  const targetId = searchParams.get("targetId");

  // If targetType + targetId: check single bookmark status
  if (targetType && targetId) {
    const bookmark = await db.bookmark.findUnique({
      where: {
        userId_targetType_targetId: { userId: user.id, targetType, targetId },
      },
      select: { id: true, createdAt: true },
    });
    return NextResponse.json({ bookmarked: !!bookmark, bookmark });
  }

  // Otherwise: list all user's bookmarks (optionally filtered by targetType)
  const where: Record<string, unknown> = { userId: user.id };
  if (targetType) where.targetType = targetType;

  const bookmarks = await db.bookmark.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      targetType: true,
      targetId: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ bookmarks, count: bookmarks.length });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
  const { targetType, targetId } = await request.json().catch(() => ({}));
  if (!targetType || !targetId) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

  try {
    // Toggle behavior: if already bookmarked, remove it
    const existing = await db.bookmark.findUnique({
      where: { userId_targetType_targetId: { userId: user.id, targetType, targetId } },
      select: { id: true },
    });
    if (existing) {
      await db.bookmark.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, bookmarked: false });
    }

    await db.bookmark.create({ data: { userId: user.id, targetType, targetId } });
    return NextResponse.json({ success: true, bookmarked: true });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
  const { targetType, targetId } = await request.json().catch(() => ({}));

  try {
    await db.bookmark.deleteMany({ where: { userId: user.id, targetType, targetId } });
    return NextResponse.json({ success: true, bookmarked: false });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
