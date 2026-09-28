import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
  const { targetType, targetId } = await request.json().catch(() => ({}));
  if (!targetType || !targetId) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

  try {
    await db.bookmark.upsert({
      where: { userId_targetType_targetId: { userId: user.id, targetType, targetId } },
      create: { userId: user.id, targetType, targetId },
      update: { userId: user.id },
    });
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
