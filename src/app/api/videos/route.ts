import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { detectPlatform } from "@/lib/video-platforms";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { sourceUrl, title, description, category } = body;
    if (!sourceUrl || !title) return NextResponse.json({ error: "الرابط والعنوان مطلوبان" }, { status: 400 });

    // تحقق من صحة الرابط
    try { new URL(sourceUrl); } catch { return NextResponse.json({ error: "رابط غير صالح" }, { status: 400 }); }

    const sourcePlatform = detectPlatform(sourceUrl);

    const video = await db.video.create({
      data: {
        userId: user.id,
        title,
        description: description || null,
        sourceUrl,
        sourcePlatform,
        category: category || null,
        isApproved: true,
        isActive: true,
      },
    });

    // 15 نقطة
    await db.user.update({ where: { id: user.id }, data: { points: { increment: 15 } } }).catch(() => {});

    await db.auditLog.create({
      data: { action: "video.create", entity: "Video", entityId: video.id, severity: "info", actorId: user.id },
    }).catch(() => {});

    return NextResponse.json({ success: true, videoId: video.id, platform: sourcePlatform });
  } catch (error) {
    console.error("[videos POST] error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
