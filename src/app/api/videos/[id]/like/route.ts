import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
  const { id } = await params;

  try {
    await db.videoLike.upsert({
      where: { videoId_userId: { videoId: id, userId: user.id } },
      create: { videoId: id, userId: user.id },
      update: { videoId: id, userId: user.id },
    });
    await db.video.update({ where: { id }, data: { likes: { increment: 1 } } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
