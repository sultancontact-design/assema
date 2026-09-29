import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CommentsSection } from "@/components/social/comments-section";
import { ArticleSocialActions } from "@/components/social/article-social-actions";
import Link from "next/link";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { detectPlatform, getEmbedUrl } from "@/lib/video-embed";
import { formatNumber, formatDateArabic } from "@/lib/constants";
import { FollowButtonInline } from "@/components/social/follow-button-inline";

export const dynamic = "force-dynamic";

interface PageProps { params: Promise<{ id: string }>; }

export default async function VideoDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=/videos/${id}`);

  const video = await db.video.findUnique({
    where: { id },
    include: { user: { select: { id: true, fullName: true, avatar: true, district: { select: { name: true, nameAr: true } } } } },
  });

  if (!video || !video.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white" dir="rtl">
        <div className="text-center">
          <p className="text-xl mb-4">الفيديو غير موجود</p>
          <Link href="/videos" className="text-primary underline">العودة للفيديوهات</Link>
        </div>
      </div>
    );
  }

  const moreVideos = await db.video.findMany({
    where: { userId: video.userId, isActive: true, id: { not: video.id } },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { id: true, title: true, sourceUrl: true, thumbnailUrl: true, views: true, likes: true },
  });

  const embed = getEmbedUrl(video.sourceUrl);
  const platform = detectPlatform(video.sourceUrl);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="w-full max-w-3xl mx-auto px-4 py-6">
        <Link href="/videos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="size-4" />العودة للفيديوهات
        </Link>

        <div className="relative w-full aspect-[9/16] max-h-[70vh] mx-auto rounded-2xl overflow-hidden bg-black">
          {embed?.type === "video" ? (
            <video src={embed.embed} controls autoPlay loop playsInline className="w-full h-full object-contain" />
          ) : embed ? (
            <iframe src={embed.embed} className="w-full h-full border-0" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <a href={video.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">فتح في المصدر</a>
            </div>
          )}
        </div>

        <a href={video.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-primary">
          <ExternalLink className="size-3" />{platform} · فتح في المصدر
        </a>

        <div className="mt-4">
          <h1 className="text-xl font-bold mb-2">{video.title}</h1>
          {video.description && <p className="text-sm text-muted-foreground mb-3">{video.description}</p>}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <span>{formatNumber(video.views)} مشاهدة</span>
            <span>{formatDateArabic(video.createdAt)}</span>
            <span className="px-2 py-0.5 bg-muted rounded-full">{platform}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl border border-border mb-6">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent shrink-0">
            {video.user.avatar ? <img src={video.user.avatar} alt={video.user.fullName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold">{video.user.fullName.slice(0,1)}</div>}
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">{video.user.fullName}</p>
            <p className="text-xs text-muted-foreground">{video.user.district?.nameAr ?? video.user.district?.name ?? "—"}</p>
          </div>
          {user.id !== video.user.id && <FollowButtonInline targetId={video.user.id} />}
        </div>

        <ArticleSocialActions targetType="VIDEO" targetId={video.id} url={`/videos/${video.id}`} title={video.title} />

        <div className="mt-6">
          <h2 className="text-lg font-bold mb-4">التعليقات</h2>
          <CommentsSection targetType="VIDEO" targetId={video.id} currentUserId={user.id} />
        </div>

        {moreVideos.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold mb-4">فيديوهات أخرى لـ {video.user.fullName}</h2>
            <div className="grid grid-cols-3 gap-2">
              {moreVideos.map(v => (
                <Link key={v.id} href={`/videos/${v.id}`} className="relative aspect-[9/16] rounded-lg overflow-hidden bg-black group">
                  {v.thumbnailUrl ? <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">{v.title.slice(0,20)}</div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <p className="text-white text-[10px] font-medium line-clamp-2">{v.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
