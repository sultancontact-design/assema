import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const { targetType, targetId } = await request.json().catch(() => ({}));
  if (!targetType || !targetId) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

  try {
    await db.view.create({
      data: {
        userId: user?.id ?? null,
        targetType, targetId,
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
