import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
  const { targetId, targetType } = await request.json().catch(() => ({}));
  if (!targetId || !targetType) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  if (targetType === "USER" && targetId === user.id) return NextResponse.json({ error: "لا يمكن متابعة نفسك" }, { status: 400 });

  try {
    await db.follow.upsert({
      where: { followerId_followingId_targetType: { followerId: user.id, followingId: targetId, targetType } },
      create: { followerId: user.id, followingId: targetId, targetType },
      update: { followerId: user.id },
    });
    return NextResponse.json({ success: true, following: true });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
  const { targetId, targetType } = await request.json().catch(() => ({}));
  if (!targetId || !targetType) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

  try {
    await db.follow.deleteMany({ where: { followerId: user.id, followingId: targetId, targetType } });
    return NextResponse.json({ success: true, following: false });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
