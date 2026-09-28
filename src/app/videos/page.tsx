import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { VideoFeedClient } from "@/components/video/video-feed-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "فيديوهات الحي" };

export default async function VideosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/videos");

  const videos = await db.video.findMany({
    where: { isActive: true, isApproved: true },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 30,
    include: { user: { select: { fullName: true } } },
  });

  const serialized = videos.map(v => ({
    id: v.id, title: v.title, description: v.description,
    sourceUrl: v.sourceUrl, sourcePlatform: v.sourcePlatform, thumbnailUrl: v.thumbnailUrl,
    views: v.views, likes: v.likes, comments: v.comments, shares: v.shares,
    category: v.category, createdAt: v.createdAt.toISOString(),
    user: { fullName: v.user.fullName },
  }));

  return <VideoFeedClient initialVideos={serialized} />;
}
