import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import {
  Instagram, Facebook, MessageCircle, Youtube, Globe, MapPin,
  Calendar, Link as LinkIcon, Pencil, Settings,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "الملف الشخصي" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/community/profile");

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true, firstName: true, lastName: true, fullName: true, email: true,
      avatar: true, coverImage: true, bio: true,
      socialInstagram: true, socialTiktok: true, socialFacebook: true,
      socialWhatsapp: true,
      profession: true, skills: true, interests: true,
      points: true, level: true,
      createdAt: true,
      district: { select: { name: true, nameAr: true } },
    },
  });

  if (!dbUser) redirect("/login");

  const [videos, posts] = await Promise.all([
    db.video.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, title: true, sourceUrl: true, sourcePlatform: true, thumbnailUrl: true, likes: true, comments: true, views: true, createdAt: true },
    }),
    db.blogPost.findMany({
      where: { authorId: user.id, status: "published" },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, title: true, slug: true, coverImage: true, content: true, excerpt: true, category: true, views: true },
    }),
  ]);

  const displayName = dbUser.fullName || `${dbUser.firstName} ${dbUser.lastName}`;
  const username = dbUser.email?.split("@")[0] ?? "user";

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Cover Image */}
      <div className="relative h-40 md:h-56 bg-gradient-to-r from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6]">
        {dbUser.coverImage && (
          <img src={dbUser.coverImage} alt="غلاف" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        {/* Edit buttons */}
        <div className="absolute top-4 end-4 flex gap-2">
          <Link href="/community/profile/edit" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-medium hover:bg-black/70 transition-colors">
            <Pencil className="size-3.5" />
            تعديل
          </Link>
        </div>
      </div>

      {/* Profile Content */}
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-background overflow-hidden bg-gradient-to-br from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6] p-1">
              {dbUser.avatar ? (
                <img src={dbUser.avatar} alt={displayName} className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-3xl font-bold text-foreground">
                  {displayName.slice(0, 1)}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">{displayName}</h1>
                <p className="text-sm text-muted-foreground">@{username}</p>
              </div>
              <div className="flex gap-2 sm:ms-auto">
                <Link href="/community/profile/edit" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/70 text-sm font-medium transition-colors">
                  <Pencil className="size-3.5" /> تعديل الملف
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mb-4">
              <div className="text-center"><div className="font-bold text-lg">{videos.length}</div><div className="text-xs text-muted-foreground">فيديو</div></div>
              <div className="text-center"><div className="font-bold text-lg">{posts.length}</div><div className="text-xs text-muted-foreground">مقال</div></div>
              <div className="text-center"><div className="font-bold text-lg">{dbUser.points}</div><div className="text-xs text-muted-foreground">نقطة</div></div>
              <div className="text-center"><div className="font-bold text-lg">{dbUser.level}</div><div className="text-xs text-muted-foreground">مستوى</div></div>
            </div>

            {/* Bio */}
            {dbUser.bio && <p className="text-sm text-foreground mb-3 leading-relaxed">{dbUser.bio}</p>}

            {/* Meta */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
              {dbUser.district && (
                <span className="flex items-center gap-1"><MapPin className="size-3" /> {dbUser.district.nameAr ?? dbUser.district.name}</span>
              )}
              <span className="flex items-center gap-1"><Calendar className="size-3" /> انضم {new Date(dbUser.createdAt).toLocaleDateString("ar-MA")}</span>
              {dbUser.profession && <span className="flex items-center gap-1"><Settings className="size-3" /> {dbUser.profession}</span>}
            </div>

            {/* Social Links */}
            <div className="flex gap-2 flex-wrap">
              {dbUser.socialInstagram && (
                <a href={dbUser.socialInstagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-pink-500/10 hover:bg-pink-500/20 transition-colors">
                  <Instagram className="size-4 text-pink-500" />
                </a>
              )}
              {dbUser.socialFacebook && (
                <a href={dbUser.socialFacebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-blue-500/10 hover:bg-blue-500/20 transition-colors">
                  <Facebook className="size-4 text-blue-500" />
                </a>
              )}
              {dbUser.socialWhatsapp && (
                <a href={`https://wa.me/${dbUser.socialWhatsapp}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-green-500/10 hover:bg-green-500/20 transition-colors">
                  <MessageCircle className="size-4 text-green-500" />
                </a>
              )}
              {dbUser.socialTiktok && (
                <a href={dbUser.socialTiktok} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors">
                  <span className="text-xs font-bold">TT</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tabs + Grid (merged component) */}
        <ProfileTabs videos={videos} posts={posts} />
      </div>
    </div>
  );
}
