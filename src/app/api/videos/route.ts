import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { sourceUrl, title, description, category, sourcePlatform } = body;
  if (!sourceUrl || !title) return NextResponse.json({ error: "الرابط والعنوان مطلوبان" }, { status: 400 });

  // كشف المنصة من الرابط (لو لم تُمرَّ)
  let platform = sourcePlatform || "OTHER";
  if (!sourcePlatform) {
    if (/tiktok\.com/i.test(sourceUrl)) platform = "TIKTOK";
    else if (/youtube\.com|youtu\.be/i.test(sourceUrl)) platform = "YOUTUBE";
    else if (/instagram\.com/i.test(sourceUrl)) platform = "INSTAGRAM";
    else if (/facebook\.com|fb\.watch/i.test(sourceUrl)) platform = "FACEBOOK";
    else if (/twitter\.com|x\.com/i.test(sourceUrl)) platform = "TWITTER";
    else if (/vimeo\.com/i.test(sourceUrl)) platform = "VIMEO";
    else if (/twitch\.tv/i.test(sourceUrl)) platform = "TWITCH";
    else if (/dailymotion\.com|dai\.ly/i.test(sourceUrl)) platform = "DAILYMOTION";
    else if (/\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(sourceUrl)) platform = "DIRECT";
  }

  const video = await db.video.create({
    data: {
      userId: user.id,
      title,
      description: description || null,
      sourceUrl,
      sourcePlatform: platform,
      category: category || null,
      isApproved: true, // موافقة تلقائية (السوبر أدمن يراجع لاحقاً)
      isActive: true,
    },
  });

  // منح 15 نقطة
  await db.user.update({
    where: { id: user.id },
    data: { points: { increment: 15 } },
  }).catch(() => {});

  await db.auditLog.create({
    data: { action: "video.create", entity: "Video", entityId: video.id, severity: "info", actorId: user.id },
  }).catch(() => {});

  return NextResponse.json({ success: true, videoId: video.id, platform });
}
