import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileGrid } from "@/components/profile/profile-grid";
import { FollowButtonInline } from "@/components/social/follow-button-inline";
import { MapPin, Calendar, Award } from "lucide-react";
import { formatDateArabic } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface PageProps { params: Promise<{ userId: string }>; }

export default async function UserProfilePage({ params }: PageProps) {
  const { userId: targetUserId } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect(`/login?callbackUrl=/u/${targetUserId}`);

  const targetUser = await db.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, fullName: true, email: true, avatar: true, bio: true, coverImage: true, points: true, level: true, profession: true, createdAt: true, followersCount: true, followingCount: true, district: { select: { name: true, nameAr: true } } },
  });

  if (!targetUser) notFound();

  const [videos, posts] = await Promise.all([
    db.video.findMany({ where: { userId: targetUserId, isActive: true }, orderBy: { createdAt: "desc" }, take: 12, select: { id: true, title: true, sourceUrl: true, sourcePlatform: true, thumbnailUrl: true, likes: true, comments: true, views: true, createdAt: true } }),
    db.blogPost.findMany({ where: { authorId: targetUserId, status: "published" }, orderBy: { createdAt: "desc" }, take: 12, select: { id: true, title: true, slug: true, coverImage: true, content: true, excerpt: true, category: true, views: true } }),
  ]);

  const isOwnProfile = currentUser.id === targetUserId;
  const displayName = targetUser.fullName;
  const username = targetUser.email?.split("@")[0] ?? "user";

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="relative h-40 md:h-56 bg-gradient-to-r from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6]">
        {targetUser.coverImage && <img src={targetUser.coverImage} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
      </div>
      <div className="w-full max-w-3xl mx-auto px-4 -mt-16 relative z-10 pb-12">
        <div className="bg-card rounded-3xl shadow-xl p-6 border">
          <div className="flex flex-col sm:flex-row gap-6 mb-6">
            <div className="shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-background overflow-hidden bg-gradient-to-br from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6] p-1">
                {targetUser.avatar ? <img src={targetUser.avatar} alt={displayName} className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-3xl font-bold">{displayName.slice(0,1)}</div>}
              </div>
            </div>
            <div className="flex-1 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                <div><h1 className="text-xl sm:text-2xl font-bold">{displayName}</h1><p className="text-sm text-muted-foreground">@{username}</p></div>
                {!isOwnProfile && <div className="sm:ms-auto"><FollowButtonInline targetId={targetUserId} /></div>}
              </div>
              <div className="flex gap-6 mb-4">
                <div className="text-center"><div className="font-bold text-lg">{videos.length}</div><div className="text-xs text-muted-foreground">فيديو</div></div>
                <div className="text-center"><div className="font-bold text-lg">{posts.length}</div><div className="text-xs text-muted-foreground">مقال</div></div>
                <div className="text-center"><div className="font-bold text-lg">{targetUser.followersCount}</div><div className="text-xs text-muted-foreground">متابع</div></div>
                <div className="text-center"><div className="font-bold text-lg">{targetUser.points}</div><div className="text-xs text-muted-foreground">نقطة</div></div>
              </div>
              {targetUser.bio && <p className="text-sm mb-3">{targetUser.bio}</p>}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {targetUser.district && <span className="flex items-center gap-1"><MapPin className="size-3" /> {targetUser.district.nameAr ?? targetUser.district.name}</span>}
                <span className="flex items-center gap-1"><Calendar className="size-3" /> انضم {formatDateArabic(targetUser.createdAt)}</span>
                {targetUser.profession && <span className="flex items-center gap-1"><Award className="size-3" /> {targetUser.profession}</span>}
              </div>
            </div>
          </div>
          {videos.length === 0 && posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">لا يوجد محتوى بعد</p>
          ) : <ProfileGrid videos={videos} posts={posts} />}
        </div>
      </div>
    </div>
  );
}
