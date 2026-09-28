import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
  const { targetType, targetId, type } = await request.json().catch(() => ({}));
  if (!targetType || !targetId || !type) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

  try {
    await db.reaction.upsert({
      where: { userId_targetType_targetId_type: { userId: user.id, targetType, targetId, type } },
      create: { userId: user.id, targetType, targetId, type },
      update: { type },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
