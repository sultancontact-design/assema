"use client";
import * as React from "react";
import Link from "next/link";
import {
  Video, Grid3x3, Bookmark, Heart, UserSquare2,
  Play, MessageCircle, Eye, BookOpen, Film,
} from "lucide-react";
import { detectPlatform } from "@/lib/video-embed";

const PLATFORM_COLORS: Record<string, [string, string]> = {
  YOUTUBE: ["#FF0000", "#CC0000"],
  TIKTOK: ["#FE2C55", "#25F4EE"],
  INSTAGRAM: ["#833AB4", "#FD1D1D"],
  FACEBOOK: ["#1877F2", "#0A5BC4"],
  TWITTER: ["#1DA1F2", "#0E71A8"],
  VIMEO: ["#19B7EA", "#17A0CC"],
  DAILYMOTION: ["#0066DC", "#004FB0"],
  TWITCH: ["#9146FF", "#7000FF"],
  STREAMABLE: ["#0F0F0F", "#2D2D2D"],
  SOUNDCLOUD: ["#FF5500", "#CC4400"],
  DIRECT: ["#22C55E", "#16A34A"],
  IFRAME: ["#6B7280", "#4B5563"],
};

const CATEGORY_COLORS: Record<string, [string, string]> = {
  HEALTH: ["#EF4444", "#B91C1C"],
  FINANCE: ["#F59E0B", "#D97706"],
  RELIGIOUS: ["#10B981", "#059669"],
  PARENTING: ["#EC4899", "#DB2777"],
  EDUCATION: ["#3B82F6", "#2563EB"],
  COMMUNITY: ["#8B5CF6", "#7C3AED"],
  MUSIC: ["#F472B6", "#EC4899"],
  COOKING: ["#FB923C", "#F97316"],
  SPORTS: ["#22C55E", "#16A34A"],
  COMEDY: ["#FBBF24", "#F59E0B"],
  FAMILY: ["#06B6D4", "#0891B2"],
  OTHER: ["#64748B", "#475569"],
};

const CATEGORY_IMAGES: Record<string, string> = {
  HEALTH: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=400&fit=crop",
  FINANCE: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=400&fit=crop",
  RELIGIOUS: "https://images.unsplash.com/photo-1519817650390-64a93db51149?w=400&h=400&fit=crop",
  EDUCATION: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=400&fit=crop",
  FAMILY: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=400&fit=crop",
  COMMUNITY: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=400&fit=crop",
  PARENTING: "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=400&h=400&fit=crop",
  default: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=400&fit=crop",
};

type TabKey = "videos" | "posts" | "saved" | "liked" | "tagged";

interface ProfileTabsGridProps {
  videos: any[];
  posts: any[];
}

export function ProfileTabs({ videos = [], posts = [] }: ProfileTabsGridProps) {
  const [tab, setTab] = React.useState<TabKey>("videos");

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "videos", label: "الفيديوهات", icon: Video },
    { key: "posts", label: "المقالات", icon: Grid3x3 },
    { key: "saved", label: "المحفوظات", icon: Bookmark },
    { key: "liked", label: "الإعجابات", icon: Heart },
    { key: "tagged", label: "المُشاركات", icon: UserSquare2 },
  ];

  // Render content based on tab
  const renderContent = () => {
    if (tab === "videos") {
      if (!videos?.length) {
        return <EmptyState icon={Film} label="لا توجد فيديوهات بعد" />;
      }
      return (
        <div className="grid grid-cols-3 gap-1 md:gap-2">
          {videos.map((video: any) => {
            const platform = detectPlatform(video.sourceUrl);
            const [c1, c2] = PLATFORM_COLORS[platform] || PLATFORM_COLORS.IFRAME;
            let thumb: string | null = null;
            if (platform === "YOUTUBE") {
              const m = video.sourceUrl?.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([^&?/]+)/);
              if (m) thumb = `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;
            } else if (platform === "VIMEO") {
              const m = video.sourceUrl?.match(/vimeo\.com\/(\d+)/);
              if (m) thumb = `https://vumbnail.com/${m[1]}.jpg`;
            }
            if (!thumb && video.thumbnailUrl) thumb = video.thumbnailUrl;

            return (
              <Link key={video.id} href={`/videos/${video.id}`} className="relative aspect-square group overflow-hidden rounded-sm">
                {thumb ? (
                  <img src={thumb} alt={video.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy"
                    onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = "none"; t.nextElementSibling?.classList.remove("hidden"); }} />
                ) : null}
                <div className={`absolute inset-0 flex items-center justify-center ${thumb ? "hidden" : ""}`}
                  style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                  <Video className="size-8 text-white/40" />
                </div>
                <div className="absolute top-1.5 end-1.5 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded-full text-[8px] font-bold text-white">{platform}</div>
                <Play className="absolute top-1.5 start-1.5 size-3 text-white drop-shadow-lg" fill="white" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <div className="flex items-center gap-1 text-white text-xs font-bold"><Heart className="size-3.5 fill-current" />{video.likes || 0}</div>
                  <div className="flex items-center gap-1 text-white text-xs font-bold"><MessageCircle className="size-3.5 fill-current" />{video.comments || 0}</div>
                </div>
              </Link>
            );
          })}
        </div>
      );
    }

    if (tab === "posts") {
      if (!posts?.length) {
        return <EmptyState icon={BookOpen} label="لا توجد مقالات بعد" />;
      }
      return (
        <div className="grid grid-cols-3 gap-1 md:gap-2">
          {posts.map((post: any) => {
            const [c1, c2] = CATEGORY_COLORS[post.category || "OTHER"] || CATEGORY_COLORS.OTHER;
            const img = post.coverImage || CATEGORY_IMAGES[post.category || ""] || CATEGORY_IMAGES.default;

            return (
              <Link key={post.id} href={`/blog/${post.slug}`} className="relative aspect-square group overflow-hidden rounded-sm">
                <img src={img} alt={post.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy"
                  onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = "none"; t.nextElementSibling?.classList.remove("hidden"); }} />
                <div className="absolute inset-0 hidden flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                  <BookOpen className="size-8 text-white/40" />
                </div>
                <div className="absolute top-1.5 start-1.5 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded-full text-[8px] font-bold text-white">مقال</div>
                <BookOpen className="absolute top-1.5 end-1.5 size-3 text-white/80" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <div className="flex items-center gap-1 text-white text-xs font-bold"><Heart className="size-3.5 fill-current" />{post.likes || 0}</div>
                  <div className="flex items-center gap-1 text-white text-xs font-bold"><Eye className="size-3.5" />{post.views || 0}</div>
                </div>
              </Link>
            );
          })}
        </div>
      );
    }

    // Tabs without data yet — empty states
    if (tab === "saved") return <EmptyState icon={Bookmark} label="لا توجد محفوظات بعد" />;
    if (tab === "liked") return <EmptyState icon={Heart} label="لا توجد إعجابات بعد" />;
    if (tab === "tagged") return <EmptyState icon={UserSquare2} label="لا توجد مُشاركات بعد" />;
    return null;
  };

  return (
    <>
      <div className="border-b mt-6">
        <div className="flex gap-4 sm:gap-6 justify-center overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 py-3 px-2 border-b-2 transition-colors min-h-11 shrink-0 ${tab === key ? "border-foreground text-foreground font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              aria-current={tab === key ? "page" : undefined}
            >
              <Icon className="size-4" />
              <span className="text-sm hidden sm:inline">{label}</span>
              <span className="sr-only">{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 min-h-48">{renderContent()}</div>
    </>
  );
}

function EmptyState({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="grid place-items-center size-16 rounded-full bg-muted/50 mb-3">
        <Icon className="size-7 text-muted-foreground/60" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">سيظهر المحتوى هنا عند إضافته</p>
    </div>
  );
}
